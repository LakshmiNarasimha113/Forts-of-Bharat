// backend/models/Fort.js
const mongoose = require('mongoose');

const FortSchema = new mongoose.Schema({
  name: String,
  history: String,
  slug: {
    type: String,
    required: true,
    unique: true
  },
  image: String
 
  
});

module.exports = mongoose.model('Fort', FortSchema);
