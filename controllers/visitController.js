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
  req.params.patient = req.user._id;
  next();
};

const checkVisitTime = async (req, res, next) => {
  const { doctor, dateTime: visitTime } = req.body;
  if (!doctor || !visitTime) return next(new AppError('Please provide both doctor ID and visit time data.', 400));

  const date = new Date(visitTime);
  const sameDay = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
  const nextDay = new Date(sameDay.getTime() + 24 * 60 * 60 * 1000);

  const maxVisit = await Visit.findOne({ doctor, patient: req.user._id, dateTime: { $gt: sameDay, $lt: nextDay } });
  if (maxVisit?.id !== req.params?._id)
    return next(new AppError('You cannot book more than one appointments per day.', 403));

  const doctorAcc = await User.findById(doctor);
  if (!doctorAcc?.checkValidVisitTime(date)) return next(new AppError('The visit time is not available.', 400));

  req.doctor = doctor;
  req.dateTime = date;

  next();
};

const bookMyVisit = async (req, res, next) => {
  const { doctor, dateTime, user } = req;

  //Request user info
  const { name, birthday, idCard } = user;
  if (!name || !birthday || !idCard) return next(new AppError('Please complete your personal information first.', 400));

  const visit = await Visit.create({ doctor, patient: user._id, dateTime });

  res.status(201).json({
    status: 'success',
    message: 'You have successfully booked an appointment.',
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

const getPrescription = async (req, res, next) => {
  const { prescriptions } = await Visit.findById(req.params._id);

  res.status(200).json({
    status: 'success',
    results: prescriptions.length,
    data: prescriptions,
  });
};

const addPrescription = async (req, res, next) => {
  const { prescriptions } = req.body;

  const errors = [];
  prescriptions.forEach(el => {
    const error = requiredField({ drug: el?.drug, count: el?.count });
    error && errors.push(error);
    return;
  });
  if (Object.keys(errors[0]).length !== 0) return next(new AppError(Object.values(errors[0])[0], 400));

  const visit = await Visit.findByIdAndUpdate(req.params._id, { prescriptions }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Prescription has been added successfully.',
    data: visit,
  });
};

const deletePrescription = async (req, res, next) => {
  const visit = await Visit.findByIdAndUpdate(req.params._id, { prescriptions: undefined });

  res.status(200).json({
    status: 'success',
    message: 'Prescription has been deleted successfully.',
  });
};

const addDoctorID = (req, res, next) => {
  req.params.doctor = req.user.doctor || req.user._id;
  next();
};

const getDoctorVisit = async (req, res, next) => {
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
  const today = new Date();
  const sameDay = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);
  const nextDay = new Date(sameDay.getTime() + 24 * 60 * 60 * 1000);

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
