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
  const token = await promisify(jwt.sign)(id, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

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
  if (req.body.phone) req.body.phone.replace(/^(?:\+98|98|0)/, '');
  next();
};

const getOTP = async (req, res, next) => {
  const user = await User.findOne({ phone: req.body.phone });
  if (!user) return next(new AppError('There is no account with thin phone number. Please sign up first.', 404));

  await user.createOTP();
  user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'An one-time password has been sent to your phone.',
  });
};

const signupPhone = async (req, res, next) => {
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

  const correctOTP = user.verifyOTP();
  if (!correctOTP) return next(new AppError('Your one-time password is wrong. Please try again.', 401));

  await signSendToken(user._id, req, res, 'You have been logged in successfully.');
};

const signupEmail = async (req, res, next) => {
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

module.exports = { editPhoneNumber, getOTP, signupPhone, loginPhone, signupEmail, loginEmail };
