const factory = require('./handlerFactory');
const User = require('../models/userModel');

const getAllUsers = factory.getAll(User);

const getUser = factory.getOne(User);

const createUser = factory.createOne(User);

const updateUser = factory.updateOne(User);

const deleteUser = factory.deleteOne(User);

const updateMe = async (req, res, next) => {
  const { name, photo, email, birthday } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, photo, email, birthday },
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

module.exports = { getAllUsers, getUser, createUser, updateUser, deleteUser, updateMe, deleteMe };
