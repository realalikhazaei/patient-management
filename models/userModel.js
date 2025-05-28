const mongoose = require('mongoose');

const isEmail = require('validator/lib/isEmail');

const userSchema = new mongoose.Schema(
  {
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

//Remove doctorOptions for non-doctor roles
userSchema.pre('save', function (next) {
  if (this.role !== 'doctor') this.doctorOptions = undefined;
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
