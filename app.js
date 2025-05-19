const express = require('express');
const morgan = require('morgan');
const drugRouter = require('./routes/drugRoutes');

const app = express();

//Body-parser with body payload limit
app.use(express.json({ limit: '10kb' }));

//Logger middleware
app.use(morgan('dev'));

//Routers
app.use('/api/v1/drugs', drugRouter);

module.exports = app;
