const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
    pilot: { 
      name: String,
      avatar_url: String,
      totalPoints: Number,
    },
    copilot: {
      name: String,
      avatar_url: String,
      totalPoints: Number,
    },
    chat: [{
      username: String,
      message: String,
      timestamp: Date
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  module.exports = mongoose.model('GameSession', gameSessionSchema)