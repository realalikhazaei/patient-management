const express = require('express');
const {
  editPhoneNumber,
  getOTP,
  signupPhone,
  loginPhone,
  signupEmail,
  loginEmail,
} = require('../controllers/authController');

const router = express.Router();

router.use(editPhoneNumber);

router.post('/otp', getOTP);
router.post('/sign-up/phone', signupPhone);
router.post('/sign-up/email', signupEmail);
router.post('/login/phone', loginPhone);
router.post('/login/email', loginEmail);

module.exports = router;
