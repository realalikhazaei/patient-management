const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const isEmail = require('validator/lib/isEmail');

const userSchema = new mongoose.Schema(
  {
    password: {
      type: String,
      minlength: [8, 'رمز عبور نمی تواند کمتر از 8 کاراکتر باشد'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'رمز عبور های شما مطابقت ندارند',
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
        message: '‫نقش کاربر می‌تواند patient، secretary، doctor یا admin باشد',
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
        message: 'لطفا نام کامل خود را وارد کنید',
      },
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    phone: {
      type: String,
      minlength: [10, 'شماره تلفن نمی تواند کمتر از 10 کاراکتر باشد'],
      maxlength: [10, 'شماره تلفن نمی تواند بیشتر از 10 کاراکتر باشد'],
      unique: [true, 'این شماره تلفن قبلا استفاده شده است'],
      sparse: true,
    },
    newPhone: {
      type: String,
      minlength: [10, 'شماره تلفن نمی تواند کمتر از 10 کاراکتر باشد'],
      maxlength: [10, 'شماره تلفن نمی تواند بیشتر از 10 کاراکتر باشد'],
      unique: [true, 'این شماره تلفن قبلا استفاده شده است'],
      sparse: true,
    },
    email: {
      type: String,
      maxlength: [100, 'آدرس ایمیل نمی تواند بیشتر از 100 کاراکتر باشد'],
      unique: [true, 'این آدرس ایمیل قبلا استفاده شده است'],
      sparse: true,
      validate: {
        validator: isEmail,
        message: 'لطفا یک ایمیل معتبر وارد کنید',
      },
    },
    idCard: {
      type: String,
      unique: [true, 'این شماره ملی قبلا استفاده شده است'],
      sparse: true,
      validate: {
        validator: function (val) {
          return val.length === 10;
        },
        message: 'شماره ملی صحیح نیست',
      },
    },
    birthday: {
      type: Date,
      validate: {
        validator: function (val) {
          return val < Date.now() && val.getYear() < 120;
        },
        message: 'لطفا بازه معتبری برای تاریخ تولد وارد کنید',
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
          message: 'لطفا یک تخصص معتبر وارد کنید',
        },
      },
      mcNumber: {
        type: String,
        unique: [true, 'این کد نظام پزشکی قبلا استفاده شده است'],
        sparse: true,
      },
      ratingsAverage: {
        type: Number,
        default: 1,
        max: [5, 'حداکثر مقدار برای میانگین امتیاز 5 است'],
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
            return val?.every(el => el <= 6 && el >= 0 && el % 1 === 0);
          },
        },
        message: 'لطفا یک عدد صحیح بین 0 تا 6 وارد کنید',
      },
      visitRange: {
        type: [String],
        default: ['8:00', '12:00'],
      },
      visitExceptions: [Date],
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

//Virtual reference for visits
userSchema.virtual('visits', {
  ref: 'Visit',
  localField: '_id',
  foreignField: 'doctor',
});

//Virtual reference for reviews
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'doctor',
});

//Remove doctorOptions for non-doctor roles
userSchema.pre('save', function (next) {
  if (this.role !== 'doctor') this.doctorOptions = null;
  next();
});

//Remove doctor ID field for non-secretary roles
userSchema.pre('save', function (next) {
  if (this.role !== 'secretary') this.doctor = undefined;
  next();
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

userSchema.methods.checkValidVisitTime = function (date) {
  const { visitWeekdays: week, visitRange: range, visitExceptions: except } = this.doctorOptions;
  const dateMin = date.getHours() * 60 + date.getMinutes();
  const startMin = Number(range[0].split(':')[0]) * 60 + Number(range[0].split(':')[1]);
  const endMin = Number(range[1].split(':')[0]) * 60 + Number(range[1].split(':')[1]);
  const weekday = date.getDay() === 6 ? 0 : date.getDay() + 1;
  const matchWeekday = week?.includes(weekday);
  const matchTimeRange = dateMin >= startMin && dateMin <= endMin && dateMin % 15 === 0;
  const matchExceptions = except?.every(el => date.toLocaleDateString() !== el.toLocaleDateString());
  return matchWeekday && matchTimeRange && matchExceptions;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
