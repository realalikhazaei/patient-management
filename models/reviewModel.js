const mongoose = require('mongoose');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'امتیاز یک فیلد ضروری است'],
      validate: {
        validator: function (val) {
          return val <= 5 && val >= 1 && val % 1 === 0;
        },
        message: 'امتیاز باید عددی صحیح بین 1 تا 5 باشد.',
      },
    },
    comment: {
      type: String,
      required: [true, 'متن دیدگاه یک فیلد ضروری است'],
      maxlength: [300, 'یک دیدگاه نمی تواند بیشتر از 300 کاراکتر باشد.'],
      minlength: [10, 'یک دیدگاه نمی تواند کمتر از 10 کاراکتر باشد.'],
      trim: true,
    },
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'شناسه بیمار یک فیلد ضروری است'],
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'شناسه دکتر یک فیلد ضروری است'],
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
