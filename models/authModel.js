const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const authSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  password: {
    type: String,
    minlength: [8, 'Password cannot be less than 8 characters'],
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Your passwords do not match',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  otp: String,
  otpExpires: Date,
  emailVerified: Boolean,
  emailVerifyToken: String,
  emailVerifyExpires: Date,
  role: {
    type: String,
    default: 'patient',
    enum: {
      values: ['patient', 'secretary', 'doctor', 'admin'],
      message: 'User role can be either patient, secretary, doctor or admin',
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
});

//Encrypt password
authSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, +process.env.BCRYPT_COST);
  this.passwordConfirm = undefined;
  next();
});

//Set password change time
authSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//Create OTP
authSchema.methods.createOTP = async function (phone) {
  const otp = String(Math.round(Math.random() * 899999 + 100000));
  this.otp = await bcrypt.hash(otp, +process.env.BCRYPT_COST);
  this.otpExpires = new Date(Date.now() + process.env.OTP_EXPIRES_MIN * 60 * 1000);
  console.log(`${otp} one-time password for ${phone} phone number.`);
};
//Verify OTP
authSchema.methods.verifyOTP = async function (otp) {
  let correct = false;
  if (this.otp) correct = await bcrypt.compare(otp, this.otp);
  return correct;
};

//Verify password
authSchema.methods.verifyPassword = async function (password) {
  const correct = await bcrypt.compare(password, this.password);
  return correct;
};
//Check password change time
authSchema.methods.passwordChangedAfter = function (issueTime) {
  return this.passwordChangedAt?.getTime() > issueTime * 1000;
};

authSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + process.env.PASS_RESET_EXPIRES_MIN * 60 * 1000);
  return token;
};

const Auth = mongoose.model('Auth', authSchema);

module.exports = Auth;
