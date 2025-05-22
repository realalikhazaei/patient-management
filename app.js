const express = require('express');
const morgan = require('morgan');
const drugRouter = require('./routes/drugRoutes');
const userRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

//Body-parser with body payload limit
app.use(express.json({ limit: '10kb' }));

//Logger middleware
app.use(morgan('dev'));

//Routers
app.use('/api/v1/drugs', drugRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);

//Error handling
app.use(/.*/, (req, res, next) => {
  return next(new AppError(`Could not found this route ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
