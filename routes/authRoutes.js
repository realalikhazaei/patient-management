const express = require('express');
const {
  editPhoneNumber,
  protectRoute,
  getOTP,
  signupPhone,
  loginPhone,
  signupEmail,
  loginEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  setPassword,
} = require('../controllers/authController');

const router = express.Router();

router.use(editPhoneNumber);

router.post('/otp', getOTP);

router.post('/sign-up/phone', signupPhone);
router.post('/sign-up/email', signupEmail);
router.post('/login/phone', loginPhone);
router.post('/login/email', loginEmail);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.use(protectRoute);

router.patch('/update-password', updatePassword);
router.patch('/set-password', setPassword);

module.exports = router;
