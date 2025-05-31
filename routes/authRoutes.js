const express = require('express');
const {
  trimPhoneNumber,
  protectRoute,
  getOTP,
  signupEmail,
  loginEmail,
  loginPhone,
  forgotPassword,
  resetPassword,
  updatePhone,
  updatePassword,
  setPassword,
  getVerifyEmailToken,
  verifyEmailToken,
} = require('../controllers/authController');

const router = express.Router();

router.use(trimPhoneNumber);

router.post('/otp', getOTP);

router.post('/sign-up/email', signupEmail);
router.post('/login/email', loginEmail);
router.post('/login/phone', loginPhone);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

router.use(protectRoute);

router.patch('/update-phone', updatePhone);
router.patch('/update-password', updatePassword);
router.patch('/set-password', setPassword);

router.get('/verify-email', getVerifyEmailToken);
router.post('/verify-email/:token', verifyEmailToken);

module.exports = router;
