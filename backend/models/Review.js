const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  fortSlug: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
