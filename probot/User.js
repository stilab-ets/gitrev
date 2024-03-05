const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: String,
    points: Number,
    gptScore: Number,
    timeMultiplier: Number,
    difficultyScore : Number,
    linesInspected : Number,
    date:{
        type: Date,
        default: Date.now,
        immutable: true,
    } ,
});


const issueSchema = new mongoose.Schema({
    issueId: Number, // GitHub's issue ID
    title: String,
    body: String,
    pointsMade: Number,
    difficulty: String, // this will be populated by the model later

});

const pullRequestSchema = new mongoose.Schema({
    pullRequestId: Number, // GitHub's pull Request ID
    title: String,
    body: String,
    pointsMade: Number,
    difficulty: String, // this will be populated by the model later

});

const friendsSchema = new mongoose.Schema({
    name: String,
    avatar_url: String,
    totalPoints: Number,
});


const commentSchema = new mongoose.Schema({
    commentId: Number,
    body: String,
    score: String,
    relatedIssuePRId: Number,
    comment_day : Date,
  });


  const achievementsSchema = new mongoose.Schema({
    id: Number,
    owned : Boolean,
    name: String,
    description: String,
  });


const userSchema = new mongoose.Schema({
    name : String,
    avatar_url: String,
    totalPoints: Number,
    coins: Number,
    country : String,
    currentSkin : String,
    streak : Number,
    firstLogin : Boolean,
    skinsBought: [String],
    activities: [activitySchema],
    issues: [issueSchema],
    pullRequests : [pullRequestSchema],
    comments: [commentSchema],
    friends: [friendsSchema],
    friendsRequests: [friendsSchema], 
    achievements: [achievementsSchema],


});

module.exports = mongoose.model("User", userSchema);