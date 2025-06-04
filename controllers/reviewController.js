const factory = require('./handlerFactory');
const Review = require('../models/reviewModel');
const Visit = require('../models/visitModel');
const AppError = require('../utils/appError');

const getAllReviews = factory.getAll(Review);

const getReview = factory.getOne(Review);

const createReview = factory.createOne(Review);

const updateReview = factory.updateOne(Review);

const deleteReview = factory.deleteOne(Review);

const addPatientID = (req, res, next) => {
  req.params.patient = req.user._id;
  next();
};

const updateMyReview = (req, res, next) => {
  delete req.body.doctor;
  next();
};

const addMyReview = async (req, res, next) => {
  const visit = await Visit.findOne({ doctor: req.body.doctor, patient: req.user._id, closed: true });
  if (!visit) return next(new AppError('You do not have any closed visits with this doctor.', 403));

  const review = await Review.create({ ...req.body, patient: req.user._id });

  res.status(201).json({
    status: 'success',
    message: 'Your review has been submitted successfully.',
    data: review,
  });
};

module.exports = {
  getAllReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  addPatientID,
  updateMyReview,
  addMyReview,
};
