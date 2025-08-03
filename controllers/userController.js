const sharp = require('sharp');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
const Visit = require('../models/visitModel');
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
  const { name, birthday, idCard, email } = req.body;
  const { photo } = req.body.photo === 'undefined' ? req.user : req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, photo, birthday, idCard, email, emailVerified: email ? false : true },
    { new: true, runValidators: true },
  );

  res.status(200).json({
    status: 'success',
    message: 'حساب شما با موفقیت به‌روزرسانی شد',
  });
};

const deleteMe = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  res.cookie('jwt', 'deleted', { expires: new Date(Date.now() + 10000) });

  res.status(200).json({
    status: 'success',
    message: 'حساب شما با موفقیت حذف شد',
  });
};

const getMe = async (req, res) => {
  const user = req.user._doc;
  const allowedFields = ['_id', 'name', 'photo', 'email', 'idCard', 'role', 'birthday'];

  Object.keys(user).forEach(key => !allowedFields.includes(key) && delete user[key]);

  res.status(200).json({
    status: 'success',
    data: user,
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
    message: 'تنظیمات کاری شما با موفقیت به‌روزرسانی شد.',
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
  const today = new Date();
  const sameDay = new Date(`${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`);

  const doctor = await User.findOne({ _id: req.params._id, role: 'doctor' })
    .select('-idCard -email -createdAt -updatedAt -active')
    .populate({
      path: 'reviews',
      select: 'rating comment',
    });
  const visits = await Visit.find({ doctor: req.params._id, dateTime: { $gt: sameDay } }).select('dateTime closed');

  res.status(200).json({
    status: 'success',
    data: { ...doctor._doc, reviews: doctor.reviews, visits },
  });
};

const addSecretary = async (req, res, next) => {
  const { user: _id, doctor } = req.body;

  if (!_id) return next(new AppError('لطفا شناسه کاربر را وارد کنید', 400));
  if (!doctor) return next(new AppError('لطفا شناسه دکتر را وارد کنید', 400));

  const user = await User.findByIdAndUpdate(_id, { doctor, role: 'secretary' }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'کاربر با موفقیت به عنوان منشی ثبت شد',
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
  getMe,
  updateDoctor,
  getDoctors,
  getDoctor,
  addSecretary,
};
