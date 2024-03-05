const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    issueId: Number, // GitHub's issue ID
    title: String,
    body: String,
    pointsMade: Number,
    difficulty: String, // this will be populated by the model later

});

module.exports = mongoose.model("Issue", issueSchema);