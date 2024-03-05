const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  commentId: Number,
  body: String,
  score: String,
  category: String,
  relatedIssuePRId: Number,
  comment_day : Date,
  totalReaction : Number,
  positiveReactions : Number,
  negativeReactions : Number,
});

module.exports = mongoose.model('Comment', commentSchema);
