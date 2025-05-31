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
    required: [true, 'Please provide the appointment date and time.'],
    validate: {
      validator: function (val) {
        return val > Date.now() && val < Date.now() + process.env.VISIT_RANGE * 24 * 60 * 60 * 1000;
      },
      message: 'You can only book an appointment within the next 30 days.',
    },
  },
  prescriptions: {
    drug: {
      type: String,
    },
    count: {
      type: Number,
    },
    usage: {
      type: String,
      maxlength: [200, 'Drug usage cannot be more than 200 characters.'],
    },
  },
});

//Compound unique index for doctor and visit time
visitSchema.index({ doctor: 1, dateTime: 1 }, { unique: true });

const Visit = mongoose.model('Visit', visitSchema);

module.exports = Visit;
