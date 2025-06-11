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
    message: 'مشکلی پیش آمده است',
  });
};

const invalidIdErrDB = err => new AppError(`${err.value} شناسه وارد شده معتبر نیست`, 400);

const validationErrDB = err => {
  const message = Object.values(err.errors)
    .map(el => el.message)
    .join('. ');
  return new AppError(message, 400);
};

const uniqueErrDB = err => new AppError(err.message, 400);

const compoundIndexErrDB = err => {
  const errorKind = err.message?.split(': ')[2];
  let message;
  if (errorKind.startsWith('doctor_1_patient_1')) message = 'شما قبلا نظر خود را برای این دکتر ثبت کردید';
  if (errorKind.startsWith('doctor_1_dateTime_1')) message = 'این زمان ملاقات قبلا رزرو شده است';
  return new AppError(message, 400);
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
