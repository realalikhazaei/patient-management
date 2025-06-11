const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  doctor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  closed: {
    type: Boolean,
    default: false,
  },
  dateTime: {
    type: Date,
    required: [true, 'لطفا تاریخ و زمان ملاقات را وارد کنید'],
    validate: {
      validator: function (val) {
        return val > Date.now() && val < Date.now() + process.env.VISIT_RANGE * 24 * 60 * 60 * 1000;
      },
      message: 'شما فقط می‌توانید برای 30 روز آینده وقت ملاقات رزرو کنید.',
    },
  },
  prescriptions: [
    {
      drug: String,
      count: Number,
      usage: {
        type: String,
        maxlength: [200, 'نحوه مصرف دارو نمی‌تواند بیشتر از 200 کاراکتر باشد'],
      },
    },
  ],
});

//Compound unique index for doctor and visit time
visitSchema.index({ doctor: 1, dateTime: 1 }, { unique: true });

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
