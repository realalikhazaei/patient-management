const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const requiredField = require('../utils/requiredField');

/**
 *
 * @param {string} id
 * @param {object} req
 * @param {object} res
 * @param {string} message
 * @param {number} statusCode
 * @default statusCode=200
 */
const signSendToken = async (id, req, res, message, statusCode = 200) => {
  const token = await promisify(jwt.sign)({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.protocol === 'https',
  });

  res.status(statusCode).json({
    status: 'success',
    message,
    token: process.env.NODE_ENV === 'development' ? token : undefined,
  });
};

const trimPhoneNumber = (req, res, next) => {
  if (req.body?.phone) req.body.phone = req.body.phone.replace(/^(?:\+98|98|0)/, '');
  if (req.body?.newPhone) req.body.newPhone = req.body.newPhone.replace(/^(?:\+98|98|0)/, '');
  next();
};

const protectRoute = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer') || req.cookies?.jwt) {
    token = req.headers.authorization?.split(' ')[1] || req.cookies?.jwt;
  }
  if (!token) return next(new AppError('Please login first to access this route', 401));

  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(payload.id).select('+password');
  if (!user) return next(new AppError('Your account has been deactivated. Please contact support.', 404));

  if (user.password) {
    const passwordChanged = user.passwordChangedAfter(payload.iat);
    if (passwordChanged) return next(new AppError('Your password has been changed. Please login again.', 401));
  }

  req.user = user;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError('You are not allowed to access this route.', 403));
    return next();
  };
};

const getOTP = async (req, res, next) => {
  const { phone, newPhone } = req.body;

  let user;

  //Get logged-in/logged-out user
  if (req.headers.authorization?.startsWith('Bearer') || req.cookies?.jwt) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.jwt;
    const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    user = await User.findById(payload.id);
  } else user = await User.findOne({ phone });

  //Checks uniqueness of newPhone
  if (newPhone && user?.phone === newPhone)
    return next(new AppError('This phone number is already in use. Please try another one.'));

  //Secure newPhone field
  if (user?.newPhone) user.newPhone = undefined;

  //Update/Add phone number
  if (user && newPhone) user.newPhone = newPhone;

  //Sign-up user with phone number
  if (!user) {
    user = await User.create({ phone });
  }

  await user.createOTP(newPhone || phone);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'A one-time password has been sent to your phone number.',
  });
};

const signupEmail = async (req, res, next) => {
  const { email, password, passwordConfirm } = req.body;
  const errors = requiredField({ email, password, passwordConfirm });
  if (Object.keys(errors).length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  const user = await User.create({ email, password, passwordConfirm });

  await signSendToken(user._id, req, res, 'Your account has been created successfully.', 201);
};

const signupDoctor = async (req, res, next) => {
  const { name, email, idCard, password, passwordConfirm, specification, mcNumber } = req.body;

  const errors = requiredField({ name, email, idCard, password, passwordConfirm, specification, mcNumber });
  if (Object.keys(errors).length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  const doctor = await User.create({
    name,
    email,
    idCard,
    password,
    passwordConfirm,
    role: 'doctor',
    doctorOptions: { specification, mcNumber },
  });

  await signSendToken(doctor._id, req, res, 'Your account has been created successfully.', 201);
};

const loginEmail = async (req, res, next) => {
  const { email, password } = req.body;
  const errors = requiredField({ password, email });
  if (Object.keys(errors)?.length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  const user = await User.findOne({ email }).select('+password');
  if (!user.password) return next(new AppError('You have not specified a password for your account.', 400));

  const correct = await user?.verifyPassword(password);
  if (!user || !correct) return next(new AppError('There is no account with this email and password.', 404));

  await signSendToken(user._id, req, res, 'You have been logged in successfully.');
};

const loginPhone = async (req, res, next) => {
  const { phone, otp } = req.body;

  const user = await User.findOne({ phone }).select('+otp');
  if (!user) return next(new AppError('There is no account with this phone number. Please sign up first.', 404));

  const expiredOTP = user.otpExpires < Date.now();
  if (expiredOTP) return next(new AppError('Your one-time password has expired. Please try again.', 401));

  const correctOTP = await user.verifyOTP(otp);
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await signSendToken(user._id, req, res, 'You have been logged in successfully.');
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('There is no user with this email address', 404));

  const token = await user.createEmailToken('passwordReset');
  const url = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${token}`;
  const text = `Here is your password reset token:\n${url}\n\nPlease ignore this message if you haven't asked for one.`;

  try {
    await new Email(user).sendResetPassword(text);
    await user.save();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(500).json({
      status: 'error',
      message: 'There has been a problem sending the email. Please try again later.',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'A password reset link has been sent to your email.',
  });
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  if (!token) return next(new AppError('There is no password reset token. Please try again.', 400));
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() } });
  if (!user) return next(new AppError('Your password reset link is either wrong or expired. Please try again.', 401));

  const { password, passwordConfirm } = req.body;
  const errors = requiredField({ password, passwordConfirm });
  if (Object.keys(errors).length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  if (password !== passwordConfirm) return next(new AppError('Your passwords do not match.', 400));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been reset successfully.');
};

const updatePhone = async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+otp');

  const expiredOTP = user.otpExpires < Date.now();
  if (expiredOTP) return next(new AppError('Your one-time password has expired. Please try again.', 401));

  const correctOTP = await user.verifyOTP(req.body.otp);
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

  if (user.newPhone) user.phone = user.newPhone;
  user.newPhone = undefined;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  await signSendToken(user._id, req, res, 'Your phone number has been updated successfully');
};

const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  const { currentPassword, newPassword: password, newPasswordConfirm: passwordConfirm } = req.body;

  const errors = requiredField({ currentPassword, password, passwordConfirm });
  if (Object.keys(errors).length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  const correct = await user.verifyPassword(currentPassword);
  if (!correct) return next(new AppError('Your current password is wrong.', 401));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been changed successfully');
};

const setPassword = async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');

  if (user.password) return next(new AppError('You cannot use this route to change your password.', 400));

  const { password, passwordConfirm } = req.body;
  const errors = requiredField({ password, passwordConfirm });
  if (Object.keys(errors).length !== 0) return next(new AppError(Object.values(errors)[0], 400));

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been set successfully');
};

const getVerifyEmailToken = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (user.emailVerified) return next(new AppError('Your email has verified already.', 400));

  const token = user.createEmailToken('emailVerify');
  const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${token}`;
  const text = `Here is your email verification link:\n${url}\n\n`;

  try {
    await new Email(user).sendVerifyEmail(text);
    await user.save();
  } catch (err) {
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    return res.status(500).json({
      status: 'error',
      message: 'There has been a problem sending the email. Please try again later.',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'A email verification link has been sent to your email.',
  });
};

const verifyEmailToken = async (req, res, next) => {
  const { token } = req.params;
  if (!token) return next(new AppError('There is no email verification token. Please try again.', 400));
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findById(req.user._id);
  if (user.emailVerified) return next(new AppError('Your email is already verified.', 400));
  if (user.emailVerifyToken !== hashedToken || user.emailVerifyExpires < Date.now())
    return next(new AppError('Your email verification link is either wrong or expired. Please try again.', 401));

  user.emailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Your email address has been verified successfully.',
  });
};

module.exports = {
  trimPhoneNumber,
  protectRoute,
  restrictTo,
  getOTP,
  signupEmail,
  signupDoctor,
  loginEmail,
  loginPhone,
  forgotPassword,
  resetPassword,
  updatePhone,
  updatePassword,
  setPassword,
  getVerifyEmailToken,
  verifyEmailToken,
};
