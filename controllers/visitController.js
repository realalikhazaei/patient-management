const Visit = require('../models/visitModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const getAllVisits = factory.getAll(Visit);

const getVisit = factory.getOne(Visit);

const createVisit = factory.createOne(Visit);

const updateVisit = factory.updateOne(Visit);

const deleteVisit = factory.deleteOne(Visit);

const addUserID = (req, res, next) => {
  //Add patient ID automatically
  req.params.patient = req.user._id;
  next();
};

const checkVisitTime = async (req, res, next) => {
  //Required fields check
  const { doctor, dateTime: visitTime } = req.body;
  if (!doctor || !visitTime) return next(new AppError('Please provide both doctor ID and visit time data.', 400));

  //Create date string with the provided date
  const date = new Date(visitTime);

  //Create date strings of day start and day end time
  const sameDay = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
  const nextDay = new Date(sameDay.getTime() + 24 * 60 * 60 * 1000);

  //Find a visit with the same patient and doctor within the same day
  const maxVisit = await Visit.findOne({ doctor, patient: req.user._id, dateTime: { $gt: sameDay, $lt: nextDay } });

  //Return in case of having the same visit IDs (for updating visit)
  if (maxVisit.id !== req.params?._id)
    return next(new AppError('You cannot book more than one appointments per day.', 403));

  //Find doctor document with ID
  const doctorAcc = await User.findById(doctor);

  //Check provided date with doctor available times
  if (!doctorAcc?.checkValidVisitTime(date)) return next(new AppError('The visit time is not available.', 400));

  //Add doctor and date fields on request object
  req.doctor = doctor;
  req.dateTime = date;

  next();
};

const bookMyVisit = async (req, res, next) => {
  const { doctor, dateTime, user } = req;

  //Request user info
  const { name, birthday, idCard } = user;
  if (!name || !birthday || !idCard) return next(new AppError('Please complete your personal information first.', 400));

  //Create a document with provided data
  const visit = await Visit.create({ doctor, patient: user._id, dateTime });

  res.status(201).json({
    status: 'success',
    message: 'You have successfully booked an appointment.',
    data: visit,
  });
};

const updateMyVisit = (req, res, next) => {
  //Update only non-closed visits
  req.params.closed = false;

  //Remove important fields from request body
  ['patient', 'closed', 'prescriptions'].forEach(el => delete req.body[el]);

  next();
};

const deleteMyVisit = (req, res, next) => {
  //Delete only non-closed fields
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
  checkVisitTime,
  bookMyVisit,
  updateMyVisit,
  deleteMyVisit,
};
