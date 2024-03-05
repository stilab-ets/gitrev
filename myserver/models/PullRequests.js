const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema({
    pullRequestId: Number, // GitHub's pull request ID
    title: String,
    body: String,
    pointsMade: Number,
    difficulty: String, // this will be populated by the model later
    additions: Number,
    deletions: Number,
    changedFiles: Number,
    code: String, 
});


module.exports = mongoose.model("PullRequest", pullRequestSchema);