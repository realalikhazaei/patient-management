const Visit = require('../models/visitModel');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const requiredField = require('../utils/requiredField');

const getAllVisits = factory.getAll(Visit);

const getVisit = factory.getOne(Visit);

const createVisit = factory.createOne(Visit);

const updateVisit = factory.updateOne(Visit);

const deleteVisit = factory.deleteOne(Visit);

const addPatientID = (req, res, next) => {
  //Add patient ID on url params
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
  if (maxVisit?.id !== req.params?._id)
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

const getPrescription = async (req, res, next) => {
  //Get prescription by visit ID
  const { prescriptions } = await Visit.findById(req.params._id);

  res.status(200).json({
    status: 'success',
    results: prescriptions.length,
    data: prescriptions,
  });
};

const addPrescription = async (req, res, next) => {
  const { prescriptions } = req.body;

  //Check for required fields in prescriptions
  const errors = [];
  prescriptions.forEach(el => {
    const error = requiredField({ drug: el?.drug, count: el?.count });
    error && errors.push(error);
    return;
  });
  if (Object.keys(errors[0]).length !== 0) return next(new AppError(Object.values(errors[0])[0], 400));

  //Add the prescription object to a visit
  const visit = await Visit.findByIdAndUpdate(req.params._id, { prescriptions }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Prescription has been added successfully.',
    data: visit,
  });
};

const deletePrescription = async (req, res, next) => {
  //Delete prescriptions from a visit
  const visit = await Visit.findByIdAndUpdate(req.params._id, { prescriptions: undefined });

  res.status(200).json({
    status: 'success',
    message: 'Prescription has been deleted successfully.',
  });
};

const addDoctorID = (req, res, next) => {
  //Get doctor ID either from secretary or doctor itself and add on the request params
  req.params.doctor = req.user.doctor || req.user._id;
  next();
};

const getDoctorVisit = async (req, res, next) => {
  //Get a visit by ID and doctor ID and populate patient data
  const visit = await Visit.findOne({ _id: req.params._id, doctor: req.user._id }).populate({
    path: 'patient',
    select: 'name idCard birthday photo',
  });

  res.status(200).json({
    status: 'success',
    data: visit,
  });
};

const getTodayVisits = async (req, res, next) => {
  //Create date strings for start and end of the day
  const today = new Date();
  const sameDay = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
  const nextDay = new Date(sameDay.getTime() + 24 * 60 * 60 * 1000);

  //Get visits of today by doctor ID
  const visits = await Visit.find({ doctor: req.params.doctor, dateTime: { $gt: sameDay, $lt: nextDay } }).populate({
    path: 'patient',
    select: 'name idCard',
  });

  res.status(200).json({
    status: 'success',
    results: visits.length,
    data: visits,
  });
};

const closeAVisit = async (req, res, next) => {
  const { _id, doctor } = req.params;

  //Get visit and set closed to true
  const visit = await Visit.findOneAndUpdate({ _id, doctor }, { closed: true }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'The visit has been closed successfully',
  });
};

module.exports = {
  getAllVisits,
  getVisit,
  createVisit,
  updateVisit,
  deleteVisit,
  addPatientID,
  checkVisitTime,
  bookMyVisit,
  updateMyVisit,
  deleteMyVisit,
  getPrescription,
  addPrescription,
  deletePrescription,
  addDoctorID,
  getDoctorVisit,
  getTodayVisits,
  closeAVisit,
};
