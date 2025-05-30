const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const isEmail = require('validator/lib/isEmail');

const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      minlength: [8, 'Password cannot be less than 8 characters'],
      select: false,
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
    otp: { type: String, select: false },
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
    name: {
      type: String,
      validate: {
        validator: function (val) {
          return val.split(' ').length >= 2;
        },
        message: 'Please provide your full name',
      },
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    phone: {
      type: String,
      minlength: [10, 'A phone number cannot be less than 10 characters'],
      unique: [true, 'This phone number already exists.'],
      sparse: true,
    },
    newPhone: {
      type: String,
      minlength: [10, 'A phone number cannot be less than 10 characters'],
      unique: [true, 'This phone number already exists.'],
      sparse: true,
    },
    email: {
      type: String,
      maxlength: [100, 'An email address cannot be more than 100 characters'],
      unique: [true, 'This email address already exists.'],
      sparse: true,
      validate: {
        validator: isEmail,
        message: 'Please provide a valid email address',
      },
    },
    idCard: {
      type: String,
      unique: [true, 'This ID card already exists'],
      sparse: true,
      validate: {
        validator: function (val) {
          return val.length === 10;
        },
        message: 'The ID card number is not correct',
      },
    },
    birthday: {
      type: Date,
      validate: {
        validator: function (val) {
          return val < Date.now() && val.getYear() < 120;
        },
        message: 'Please enter a valid range for birthday',
      },
    },
    doctorOptions: {
      specification: {
        type: String,
        enum: {
          values: [
            'general',
            'allergy and immunology',
            'anesthesiology',
            'cardiology',
            'colon and rectal surgery',
            'dermatology',
            'emergency medicine',
            'family medicine',
            'gastroenterology',
            'general surgery',
            'hematology/oncology',
            'internal medicine',
            'medical genetics and genomics',
            'neurosurgery',
            'nuclear medicine',
            'obstetrics and gynecology',
            'ophthalmology',
            'orthopaedic surgery',
            'otolaryngology - head and neck surgery',
            'pathology',
            'pediatrics',
            'physical medicine and rehabilitation',
            'plastic surgery',
            'preventive medicine',
            'psychiatry',
            'radiology',
            'thoracic and cardiac surgery',
            'urology',
          ],
          message: 'Please provide a valid specification',
        },
        validate: {
          validator: function (val) {
            return this.role === 'doctor' && !val ? false : true;
          },
          message: 'Please provide a specification',
        },
      },
      mcNumber: {
        type: String,
        validate: {
          validator: function (val) {
            return this.role === 'doctor' && !val ? false : true;
          },
          message: 'Please provide your medical council ID',
        },
      },
      ratingsAverage: {
        type: Number,
        default: 1,
        max: [5, 'Maximum amount for ratings average is 5'],
        set: function (val) {
          return Math.round(val * 10) / 10;
        },
      },
      ratingsQuantity: {
        type: Number,
        default: 0,
      },
      visitWeekdays: {
        type: [Number],
        validate: {
          validator: function (val) {
            return val <= 6 && val >= 0 && val % 1 === 0;
          },
        },
        message: 'Please provide an integer between 0 to 6',
      },
      visitRange: {
        type: [String],
        default: ['8:00', '12:00'],
      },
      visitExceptions: [Date],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

//Virtual reference
userSchema.virtual('auth', {
  ref: 'Auth',
  localField: '_id',
  foreignField: 'userId',
});

//Encrypt password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, +process.env.BCRYPT_COST);
  this.passwordConfirm = undefined;
  next();
});

//Set password change time
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//Filter out deactivated accounts
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Create OTP
userSchema.methods.createOTP = async function (phone) {
  const otp = String(Math.round(Math.random() * 899999 + 100000));
  this.otp = await bcrypt.hash(otp, +process.env.BCRYPT_COST);
  this.otpExpires = new Date(Date.now() + process.env.OTP_EXPIRES_MIN * 60 * 1000);
  console.log(`${otp} one-time password for ${phone} phone number.`);
};

//Verify OTP
userSchema.methods.verifyOTP = async function (otp) {
  if (!this.otp) return false;
  const correct = await bcrypt.compare(otp, this.otp);
  return correct;
};

//Verify password
userSchema.methods.verifyPassword = async function (password) {
  const correct = await bcrypt.compare(password, this.password);
  return correct;
};

//Check password change time
userSchema.methods.passwordChangedAfter = function (issueTime) {
  return this.passwordChangedAt?.getTime() > issueTime * 1000;
};

userSchema.methods.createEmailToken = function (type = 'passwordReset') {
  const token = crypto.randomBytes(32).toString('hex');
  this[`${type}Token`] = crypto.createHash('sha256').update(token).digest('hex');
  this[`${type}Expires`] = new Date(
    Date.now() + process.env[`${type === 'passwordReset' ? 'PASS_RESET' : 'EMAIL_VERIFY'}_EXPIRES_MIN`] * 60 * 1000,
  );
  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
