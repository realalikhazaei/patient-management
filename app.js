const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const pug = require('pug');
const drugRouter = require('./routes/drugRoutes');
const userRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');
const visitRouter = require('./routes/visitRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const hpp = require('./utils/hpp');
const sanitize = require('./utils/sanitize');
const xss = require('./utils/xss');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

//Logger middleware
app.use(morgan('dev'));

//Body-parser with body payload limit
app.use(express.json({ limit: '10kb' }));

//Compress response objects
app.use(compression());

//Filter-out unwanted data
app.use((req, res, next) => {
  const filterOut = [
    'passwordChangedAt',
    'passwordResetToken',
    'passwordResetExpires',
    'otpExpires',
    'active',
    'ratingsAverage',
    'ratingsQuantity',
  ];
  filterOut.forEach(el => delete req.body?.[el]);
  next();
});

//Special HTTP headers with Helmet
app.use(helmet());

//Avoid parameter pollution
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach(key => {
    req[key] = hpp(req[key]);
  });
  next();
});

//Sanitize data input
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach(el => {
    req[el] = sanitize(req[el]);
  });
  next();
});

//Filter-out HTML tags
app.use((req, res, next) => {
  ['body', 'params', 'headers'].forEach(el => {
    req[el] = xss(req[el]);
  });
  next();
});

//Routers
app.use('/api/v1/drugs', drugRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/visits', visitRouter);
app.use('/api/v1/reviews', reviewRouter);

//Error handling
app.use(/.*/, (req, res, next) => {
  return next(new AppError(`Could not found this route ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
