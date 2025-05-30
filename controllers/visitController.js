const Visit = require('../models/visitModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const getAllVisits = factory.getAll(Visit);

const getVisit = factory.getOne(Visit);

const createVisit = factory.createOne(Visit);

const updateVisit = factory.updateOne(Visit);

const deleteVisit = factory.getOne(Visit);

const addUserID = (req, res, next) => {
  req.params.patient = req.user._id;
  next();
};

const bookVisit = async (req, res, next) => {
  const { doctor, dateTime } = req.body;

  const date = new Date(`${dateTime.getFullYear()}-${dateTime.getMonth()}-${dateTime.getDate()}`);

  const maxVisit = await Visit.findOne({ patient: req.user._id, dateTime: { $gt: date } });
  if (maxVisit) return next(new AppError('You cannot book more than one appointments per day.', 403));

  const visit = await Visit.create({ doctor, patient: req.user._id, dateTime });

  res.status(201).json({
    status: 'success',
    message: 'You have successfully booked an appointment',
    data: visit,
  });
};

const updateMyVisit = (req, res, next) => {
  (req.params.closed = false), ['patient', 'closed', 'prescriptions'].forEach(el => delete req.body[el]);
  next();
};

module.exports = { getAllVisits, getVisit, createVisit, updateVisit, deleteVisit, addUserID, bookVisit, updateMyVisit };
