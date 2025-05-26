const factory = require('./handlerFactory');
const User = require('../models/userModel');

const getAllUsers = factory.getAll(User);

const getUser = factory.getOne(User);

const createUser = factory.createOne(User);

const updateUser = factory.updateOne(User);

const deleteUser = factory.deleteOne(User);

const updateMe = async (req, res, next) => {};

module.exports = { getAllUsers, getUser, createUser, updateUser, deleteUser };
