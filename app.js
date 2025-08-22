const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
// const cookieSession = require('cookie-session');
const swaggerUI = require('swagger-ui-express');
const swaggerDoc = require('./docs/swaggerDoc');
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

//Cookie parser
app.use(cookieParser());

// app.use(
//   cookieSession({
//     name: 'session',
//     maxAge: process.env.COOKIE_EXPIRES * 24 * 60 * 60 * 1000,
//     keys: [process.env.SESSION_KEY1, process.env.SESSION_KEY2],
//     httpOnly: true,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'lax',
//   }),
// );

//Body-parser with body payload limit
app.use(express.json({ limit: '10kb' }));

//Serve static files
app.use(express.static('public'));

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

//Enable CORS
app.use(
  cors({
    credentials: true,
    origin: ['http://127.0.0.1:5173', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'OPTIONS', 'PATCH', 'DELETE'],
  }),
);

//API Docs
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

//Routers
app.use('/api/v1/drugs', drugRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/visits', visitRouter);
app.use('/api/v1/reviews', reviewRouter);
app.options(/.*/, cors());

//Error handling
app.use(/.*/, (req, res, next) => {
  return next(new AppError(`Could not found this route ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
