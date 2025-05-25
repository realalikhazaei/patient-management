const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

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

  const passwordChanged = user.passwordChangedAfter(payload.iat);
  if (passwordChanged) return next(new AppError('Your password has been changed. Please login again.', 401));

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
  const user = await User.findOne({ phone: req.body.phone });
  if (!user) return next(new AppError('There is no account with this phone number. Please sign up first.', 404));

  await user.createOTP();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'A one-time password has been sent to your phone.',
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
  if (!user) return next(new AppError('There is no account with thin phone number. Please sign up first.', 404));

  const expiredOTP = user.otpExpires < new Date();
  if (expiredOTP) return next(new AppError('Your one-time password has expired. Please try again.', 401));

  const correctOTP = await user.verifyOTP(req.body.otp);
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

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
};

const resetPassword = async (req, res, next) => {};

const updatePassword = async (req, res, next) => {};

const setPassword = async (req, res, next) => {};

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
  updatePassword,
  setPassword,
};
