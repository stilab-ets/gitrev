const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true  // Assuming each user will have only one token
  },
  token: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Token', TokenSchema);
