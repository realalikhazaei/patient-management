/* eslint-disable */
require('dotenv').config({ path: 'config.env' });
const mongoose = require('mongoose');
const app = require('./app');

process.on('unhandledRejection', err => {
  console.log('-----------------------UNHANDLED REJECTION-----------------------');
  console.log(err);
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.log('-----------------------UNCAUGHT EXCEPTION-----------------------');
  console.log(err);
  process.exit(1);
});

const DB = process.env.DATABASE_CONNECT.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  .connect(DB)
  .then(() => console.log('Connection to the database has been established'))
  .catch(() => console.log('There has been a problem connecting to the database'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, process.env.HOST, () => {
  console.log(`Starting the server on port ${PORT}...`);
});
