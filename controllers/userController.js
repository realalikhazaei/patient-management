const factory = require('./handlerFactory');
const User = require('../models/userModel');

const getAllUsers = factory.getAll(User);

const getUser = factory.getOne(User);

const createUser = factory.createOne(User);

const updateUser = factory.updateOne(User);

const deleteUser = factory.deleteOne(User);

const updateMe = async (req, res, next) => {
  const { name, photo, birthday, email } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, photo, birthday, email, emailVerified: email ? false : true },
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
  const data = {};
  for (const [key, value] of Object.entries(req.body)) {
    data[`doctorOptions.${[key]}`] = value;
  }
  const doctorOption = await User.findByIdAndUpdate(req.user._id, { $set: data }, { new: true, runValidators: true });

  res.status(200).json({
    status: 'success',
    message: 'Your working preferences has been updated successfully.',
    data: doctorOption,
  });
};

module.exports = { getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe, deleteMe, updateDoctor };
