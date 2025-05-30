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
    },
  },
  prescriptions: {
    drug: {
      type: String,
      required: [true, 'Please provide a drug name.'],
    },
    count: {
      type: Number,
      required: [true, 'Please provide the drug count.'],
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
