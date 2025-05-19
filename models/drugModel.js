const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Drug name is a required field'],
    lowercase: true,
  },
  image: {
    type: String,
    default: 'default.jpg',
  },
  category: {
    type: String,
    required: [true, 'Drug category is a required field'],
    lowercase: true,
  },
});

const Drug = mongoose.model('Drug', drugSchema);

module.exports = Drug;
