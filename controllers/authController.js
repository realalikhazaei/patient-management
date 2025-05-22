const crypto = require('crypto');

const editPhoneNumber = (req, res, next) => {
  if (req.body.phone) req.body.phone.replace(/^(?:\+98|98|0)/, '');
  next();
};

const getOTP = async (req, res, next) => {};

const signupPhone = async (req, res, next) => {};

const signupEmail = async (req, res, next) => {};

const loginPhone = async (req, res, next) => {};

const loginEmail = async (req, res, next) => {};

module.exports = { editPhoneNumber, getOTP, signupPhone, signupEmail, loginPhone, loginEmail };
