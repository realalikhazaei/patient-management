const AppError = require('../utils/appError');

const devErr = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const prodErr = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  res.status(500).json({
    status: 'error',
    message: 'Something went wrong',
  });
};

const invalidIdErrDB = err => new AppError(`The ID is not correct ${err.value}`, 400);

const validationErrDB = err => {
  const message = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  return new AppError(message, 400);
};

const uniqueErrDB = err => new AppError(err.message, 400);

const compoundIndexErrDB = err => {
  const message = [];
  for (const [key, value] of Object.entries(err.keyValue)) if (value) message.push(`This ${key} already exists`);
  return new AppError(message.join('. '), 400);
};

const globalErrorHandler = (err, req, res, next) => {
  err.status ||= 'error';
  err.statusCode ||= 500;
  if (process.env.NODE_ENV === 'development') devErr(err, res);

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (err.name === 'CastError') error = invalidIdErrDB(err);
    if (err.name === 'ValidationError') error = validationErrDB(err);
    if (err.stack.startsWith('MongooseError')) error = uniqueErrDB(err);
    if (err.code === 11000) error = compoundIndexErrDB(err);

    prodErr(error, res);
  }
};

module.exports = globalErrorHandler;
