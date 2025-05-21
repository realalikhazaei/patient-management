const mongoose = require('mongoose');
const isEmail = require('validator/lib/isEmail');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      validate: {
        validator: function (val) {
          return val.split(' ').length > 2;
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
      unique: [true, 'This phone number already exists'],
      minlength: [10, 'A phone number cannot be less than 10 characters'],
      set: function (val) {
        return val.replace(/^(?:\+98|98|0)/, '');
      },
      validate: {
        validator: function (val) {
          return val || this.email;
        },
        message: 'Please provide your phone number',
      },
    },
    email: {
      type: String,
      unique: [true, 'This email already exists'],
      maxlength: [100, 'An email address cannot be more than 100 characters'],
      validate: [
        {
          validator: isEmail,
          message: 'Please provide a valid email address',
        },
        {
          validator: function (val) {
            return val || this.phone;
          },
          message: 'Please provide your email address',
        },
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password cannot be less than 8 characters'],
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function (val) {
          return val === this.password;
        },
      },
      message: 'Your passwords do not match',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    idCard: {
      type: String,
      required: [true, 'Please provide your ID card number'],
      validate: {
        validator: function (val) {
          return val.length === 10;
        },
        message: 'The ID card number is not correct',
      },
    },
    birthday: {
      type: Date,
      required: [true, 'Please provide your birthday'],
      validate: {
        validator: function (val) {
          return val < Date.now() && val.getYear() < 120;
        },
        message: 'Please enter a valid range for birthday',
      },
    },
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
    doctorOptions: {
      specification: {
        type: String,
        required: [true, 'Please provide a specification'],
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
      },
      mcNumber: {
        type: String,
        required: [true, 'Please provide your medical council ID'],
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
        required: [true, 'Please provide a visit time range'],
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

const User = mongoose.model('User', userSchema);

module.exports = User;
