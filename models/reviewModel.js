const mongoose = require('mongoose');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is a required field.'],
      validate: {
        validator: function (val) {
          return val <= 5 && val >= 1 && val % 1 === 0;
        },
        message: 'Rating can only be an integer between 1 to 5.',
      },
    },
    comment: {
      type: String,
      required: [true, 'Comment is a required field.'],
      maxlength: [300, 'A comment cannot be more than 300 characters.'],
      minlength: [10, 'A comment cannot be less than 10 characters.'],
      trim: true,
    },
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is a required field.'],
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Doctor ID is a required field.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  },
);

//Compound unique index for doctor and patient
reviewSchema.index({ doctor: 1, patient: 1 }, { unique: true });

//Calculate ratings average and quantity for a doctor
reviewSchema.statics.calcRatingsAverage = async function (doctor) {
  const [stats] = await this.aggregate([
    {
      $match: {
        doctor,
      },
    },
    {
      $group: {
        _id: null,
        avgRatings: { $avg: '$rating' },
        nRatings: { $sum: 1 },
      },
    },
    {
      $project: {
        avgRatings: 1,
        nRatings: 1,
      },
    },
  ]);

  await User.findByIdAndUpdate(doctor, {
    $set: {
      'doctorOptions.ratingsAverage': stats?.avgRatings || 1,
      'doctorOptions.ratingsQuantity': stats?.nRatings || 0,
    },
  });
};

//Call ratings calculation after each save and update
reviewSchema.post(['save', /^findOndAnd/], async function (doc) {
  await doc.constructor.calcRatingsAverage(doc.doctor);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
