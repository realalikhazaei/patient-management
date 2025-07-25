const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.getAll = Model => async (req, res, next) => {
  const query = { ...req.query, ...req.params };
  const dbQuery =
    Model.modelName === 'Visit' ? Model.find().populate({ path: 'patient', select: 'name phone' }) : Model.find();

  const features = new APIFeatures(dbQuery, query).filter().sort().projection().pagination();
  const documents = await features.queryObj;

  res.status(200).json({
    status: 'success',
    results: documents.length,
    data: documents,
  });
};

exports.getOne = Model => async (req, res, next) => {
  const document = await Model.findOne(req.params);
  if (!document) return next(new AppError('There is no document with provided information', 404));

  res.status(200).json({
    status: 'success',
    data: document,
  });
};

exports.createOne = Model => async (req, res, next) => {
  const document = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: document,
  });
};

exports.updateOne = Model => async (req, res, next) => {
  const document = await Model.findOneAndUpdate(req.params, req.body, { new: true, runValidators: true });
  if (!document) return next(new AppError('There is no document with this ID', 404));

  res.status(200).json({
    status: 'success',
    data: document,
  });
};

exports.deleteOne = Model => async (req, res, next) => {
  const document = await Model.findOneAndDelete(req.params);
  if (!document) return next(new AppError('There is no document with this ID', 404));

  res.status(204).json({
    status: 'success',
    data: null,
  });
};
