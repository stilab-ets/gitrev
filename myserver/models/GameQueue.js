const mongoose = require('mongoose');

const gameQueueSchema = new mongoose.Schema({
  name: String,
  avatar_url: String,
  totalPoints: Number,
  role: String,
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("GameQueue", gameQueueSchema);