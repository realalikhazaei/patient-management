const Visit = require('../models/visitModel');
const User = require('../models/userModel');
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
  const { doctor, dateTime: visitTime } = req.body;
  const date = new Date(visitTime);

  const sameDay = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
  const nextDay = new Date(sameDay.getTime() + 24 * 60 * 60 * 1000);

  const maxVisit = await Visit.findOne({ doctor, patient: req.user._id, dateTime: { $gt: sameDay, $lt: nextDay } });
  if (maxVisit) return next(new AppError('You cannot book more than one appointments per day.', 403));

  const doctorAcc = await User.findById(doctor);
  if (!doctorAcc?.checkValidVisitTime(date)) return next(new AppError('The visit time is not available.', 400));

  const visit = await Visit.create({ doctor, patient: req.user._id, dateTime: date });

  res.status(201).json({
    status: 'success',
    message: 'You have successfully booked an appointment',
    data: visit,
  });
};

const updateMyVisit = (req, res, next) => {
  req.params.closed = false;
  ['patient', 'closed', 'prescriptions'].forEach(el => delete req.body[el]);
  next();
};

const deleteMyVisit = (req, res, next) => {
  req.params.closed = false;
  next();
};

module.exports = {
  getAllVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  addUserID,
  bookVisit,
  updateMyVisit,
  deleteMyVisit,
};
