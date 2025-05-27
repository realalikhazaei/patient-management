const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

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

const editPhoneNumber = (req, res, next) => {
  if (req.body.phone) req.body.phone = req.body.phone.replace(/^(?:\+98|98|0)/, '');
  if (req.body.newPhone) req.body.newPhone = req.body.newPhone.replace(/^(?:\+98|98|0)/, '');
  next();
};

const protectRoute = async (req, res, next) => {
  let token;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer')) token = authHeader.split(' ')[1];
  if (req.cookies?.jwt) token = req.cookies.jwt;
  if (!token) return next(new AppError('Please login first to access this route', 401));

  const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(payload.id);
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
    if (!roles.includes(req.body.role)) return next(new AppError('You are not allowed to access this route.', 403));
    return next();
  };
};

const getOTP = async (req, res, next) => {
  const { phone, newPhone } = req.body;

  if (newPhone) {
    const duplicateNumber = await User.findOne({ phone: newPhone });
    if (duplicateNumber) return next(new AppError('This phone number has been used. Please try another one.'));
  }

  let user = await User.findOne({ phone });
  if (user?.newPhone) {
    user.newPhone = undefined;
  }
  if (user && newPhone) {
    user.newPhone = newPhone;
  }
  if (!user) user = await User.create({ phone });

  await user.createOTP(newPhone || phone);
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'A one-time password has been sent to your phone number.',
  });
};

const signupPhone = async (req, res, next) => {
  if (!req.body.phone) return next(new AppError('Please provide your phone number', 400));

  const user = await User.create(req.body);

  res.status(201).json({
    status: 'success',
    message: 'Your account has been created. Please login to get access.',
  });
};

const loginPhone = async (req, res, next) => {
  const user = await User.findOne({ phone: req.body.phone });
  if (!user) return next(new AppError('There is no account with this phone number. Please sign up first.', 404));

  const expiredOTP = user.otpExpires < Date.now();
  if (expiredOTP) return next(new AppError('Your one-time password has expired. Please try again.', 401));

  const correctOTP = await user.verifyOTP(req.body.otp);
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await signSendToken(user._id, req, res, 'You have been logged in successfully.');
};

const signupEmail = async (req, res, next) => {
  if (!req.body.email) return next(new AppError('Please provide your email address', 400));
  if (!req.body.password) return next(new AppError('Please provide a password', 400));
  if (!req.body.passwordConfirm) return next(new AppError('Please confirm your password', 400));

  const user = await User.create(req.body);

  await signSendToken(user._id, req, res, 'Your account has been created successfully.', 201);
};

const loginEmail = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(new AppError('Please provide your email address', 400));
  if (!password) return next(new AppError('Please provide your password', 400));

  const user = await User.findOne({ email });
  const correct = await user?.verifyPassword(password);
  if (!user || !correct) return next(new AppError('There is no account with this email and password.', 404));

  await signSendToken(user._id, req, res, 'You have been logged in successfully.');
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError('There is no user with this email address', 404));

  const token = await user.createPasswordResetToken();
  const url = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${token}`;
  const text = `Here is your password reset token:\n${url}\n\nPlease ignore this message if you haven't asked for one.`;

  try {
    await new Email(user, text).sendResetPassword();
    await user.save();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(500).json({
      status: 'error',
      message: 'There has been a problem sending email. Please try again later.',
    });
  }

  return res.status(200).json({
    status: 'success',
    message: 'A password reset link has been sent to your email.',
  });
};

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gte: Date.now() } });
  if (!user) return next(new AppError('Your password reset link is either wrong or expired. Please try again.', 401));

  const { password, passwordConfirm } = req.body;
  if (!password) return next(new AppError('Please provide a password', 400));
  if (!passwordConfirm) return next(new AppError('Please confirm your password', 400));
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been reset successfully.');
};

const updatePhone = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const expiredOTP = user.otpExpires < Date.now();
  if (expiredOTP) return next(new AppError('Your one-time password has expired. Please try again.', 401));

  const correctOTP = await user.verifyOTP(req.body.otp);
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

  if (user.newPhone) user.phone = user.newPhone;
  user.newPhone = undefined;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  await signSendToken(user._id, req, res, 'Your phone number has been updated successfully');
};

const updatePassword = async (req, res, next) => {
  const user = await User.findById(req.user?._id);

  const { currentPassword, newPassword, newPasswordConfirm } = req.body;
  if (!currentPassword) return next(new AppError('Please provide your current password', 400));
  if (!newPassword) return next(new AppError('Please provide a password', 400));
  if (!newPasswordConfirm) return next(new AppError('Please confirm your password', 400));

  const correct = await user.verifyPassword(currentPassword);
  if (!correct) return next(new AppError('Your current password is wrong.', 401));

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been changed successfully');
};

const setPassword = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (user.password) return next(new AppError('You cannot use this route to change your password.', 400));

  const { password, passwordConfirm } = req.body;
  if (!password) return next(new AppError('Please provide a password', 400));
  if (!passwordConfirm) return next(new AppError('Please confirm your password', 400));
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  await signSendToken(user._id, req, res, 'Your password has been set successfully');
};

module.exports = {
  editPhoneNumber,
  protectRoute,
  restrictTo,
  getOTP,
  signupPhone,
  loginPhone,
  signupEmail,
  loginEmail,
  forgotPassword,
  resetPassword,
  updatePhone,
  updatePassword,
  setPassword,
};
