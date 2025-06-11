const sharp = require('sharp');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const multerUpload = require('../utils/multer');

const getAllUsers = factory.getAll(User);

const getUser = factory.getOne(User);

const createUser = factory.createOne(User);

const updateUser = factory.updateOne(User);

const deleteUser = factory.deleteOne(User);

const uploadPhoto = multerUpload.single('photo');

const processPhoto = async (req, res, next) => {
  if (!req.file) return next();

  req.body.photo = `user-${req.user._id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`${__dirname}/../photos/users/${req.body.photo}`);

  next();
};

const updateMe = async (req, res, next) => {
  const { name, photo, birthday, idCard, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, photo, birthday, idCard, email, emailVerified: email ? false : true },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    status: 'success',
    message: 'Your account has been updated successfully',
  });
};

const deleteMe = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  res.cookie('jwt', 'deleted', { expires: new Date(Date.now() + 10000) });

  res.status(200).json({
    status: 'success',
    message: 'Your account has been deleted successfully',
  });
};

const updateDoctor = async (req, res, next) => {
  const values = {};
  for (const [key, value] of Object.entries(req.body)) {
    values[`doctorOptions.${[key]}`] = value;
  }
  const doctor = await User.findByIdAndUpdate(req.user._id, { $set: values }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Your working preferences has been updated successfully.',
    data: doctor,
  });
};

const getDoctors = (req, res, next) => {
  ['patient', 'secretary', 'admin'].forEach(el => {
    delete req.query?.[el];
    delete req.params?.[el];
  });
  req.params.role = 'doctor';
  req.params.fields = '-idCard,-email,-createdAt,-updatedAt,-active';
  next();
};

const getDoctor = async (req, res, next) => {
  const doctor = await User.findOne({ _id: req.params._id, role: 'doctor' })
    .select('-idCard -email -createdAt -updatedAt -active')
    .populate({
      path: 'visits',
      select: 'dateTime closed',
    })
    .populate({
      path: 'reviews',
      select: 'rating comment',
    });

  res.status(200).json({
    status: 'success',
    data: doctor,
  });
};

const addSecretary = async (req, res, next) => {
  const { user: _id, doctor } = req.body;

  if (!_id) return next(new AppError('Please provide the user ID.', 400));
  if (!doctor) return next(new AppError('Please provide the doctor ID.', 400));

  const user = await User.findByIdAndUpdate(_id, { doctor, role: 'secretary' }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'The user has been marked as a secretary successfully.',
    data: user,
  });
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadPhoto,
  processPhoto,
  updateMe,
  deleteMe,
  updateDoctor,
  getDoctors,
  getDoctor,
  addSecretary,
};
