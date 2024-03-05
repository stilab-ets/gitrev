// crete labels for each person based on best remarkable practice (sql expert / fast worker...)
const mongoose = require('mongoose');
const User = require('./User.js');
const fetch = require('node-fetch');


//mongoose.connect('mongodb://127.0.0.1:27017/testdb1');
MONGO_URI = process.env.ATLAS_URI;


const API_base = process.env.SERVER_API_BASE_URL || "http://localhost:3002";

const Fast_API_base = process.env.FAST_API_BASE_URL || "http://localhost:8000";
//const Fast_API_base = "http://3.81.48.50";


// You should connect to your MongoDB Atlas instance:
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.log(err));






function calculateTimeMultiplier(lastActivityDate) {
  const currentDate = new Date();
  
  // Calculate difference in hours
  const hoursDifference = (currentDate - lastActivityDate) / (1000 * 60 * 60);

  if (hoursDifference < 4) {
    // Decrease 0.5 for every hour
    return parseInt(5 - (0.5 * hoursDifference));
  } else {
    // Calculate difference in days
    const daysDifference = Math.floor(hoursDifference / 24);

    if (daysDifference <= 4) {
      // Decrease 0.5 for every day, starting from 3
      return 3 - (0.5 * daysDifference);
    } else if (daysDifference > 4 && daysDifference <= 8) {
      // Increase 0.5 for every day after reaching 1
      return 1 + (0.5 * (daysDifference - 4));
    } else {
      // Max out at 5 after 8 days
      return 5;
    }
  }
}




//function to check is user unlocked an achievement
const checkAcheivement = async (senderName) => {
  try {
    const user = await User.findOne({ name: senderName });
    if (!user) {
      console.log('User not found');
      return;
    }

    // Fetch all users and sort by totalPoints in descending order
    const sortedUsers = await User.find({}).sort({ totalPoints: -1 });
    const userRank = sortedUsers.findIndex(u => u.name === senderName) + 1; // +1 to make it 1-based ranking

    // Top 10 players achievement
    if (userRank <= 10) {
      const top10Achievement = user.achievements.find(a => a.id === 2);
      if (top10Achievement && !top10Achievement.owned) {
        top10Achievement.owned = true;
      }
    }

    // Top 3 players achievement
    if (userRank <= 3) {
      const top3Achievement = user.achievements.find(a => a.id === 3);
      if (top3Achievement && !top3Achievement.owned) {
        top3Achievement.owned = true;
      }
    }

    // Added 7 points from a single comment achievement
    const has7PointComment = user.comments.some(comment => comment.score === 7);
    if (has7PointComment) {
        const commentAchievement = user.achievements.find(a => a.id === 1);
        if (commentAchievement && !commentAchievement.owned) {
            commentAchievement.owned = true;
        }
    }

    // Participate in a High Bounty Issue/PR achievement
    const participatedInHighBountyIssue = user.issues.some(issue => issue.pointsMade > 0 && issue.difficulty >= 8);
    const participatedInHighBountyPR = user.pullRequests.some(pr => pr.pointsMade > 0 && pr.difficulty >= 8);

    if (participatedInHighBountyIssue || participatedInHighBountyPR) {
        const highBountyAchievement = user.achievements.find(a => a.id === 4);
        if (highBountyAchievement && !highBountyAchievement.owned) {
            highBountyAchievement.owned = true;
        }
    }

    await user.save();
  } catch (err) {
    console.error(err);
  }
}




//function to update points , integer value
const updatePoints = async (senderName, totalPointsIncrement) => {
  try {
    // Fetch the user streak
    const response = await fetch(`${API_base}/user/streak/${senderName}`);
    const userStreak = await response.json();

    console.log("User streak data in update points", userStreak);

    if (typeof totalPointsIncrement === 'number' && typeof userStreak === 'number') {
      let finalPoints = userStreak * totalPointsIncrement;

      await User.updateOne({ name: senderName }, { $inc: { totalPoints: finalPoints, coins: finalPoints * 2 } });
      console.log('User points updated');
    } else {
      console.error('Invalid values:', userStreak, totalPointsIncrement);
    }

    // Now check for achievements
    try {
      const achievementResponse = await fetch(`${API_base}/user/checkAchievement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderName: senderName
        })
      });
      const achievementData = await achievementResponse.json();

      if (achievementData.success) {
        console.log('Achievement check successful');
      } else {
        console.error('Error checking achievement:', achievementData.message);
      }
    } catch (err) {
      console.error('Error making request to check achievement:', err.message);
    }
  } catch (err) {
    console.error(err);
  }
};



const updateActivities = async (senderName, activity) => {
  try {
      // Fetch the user streak
      const response = await fetch(`${API_base}/user/streak/${senderName}`);
      const data = await response.json();

      console.log("User streak data in update activities", data);

      if (typeof data === 'number' && typeof activity.points === 'number') {
          let multiplied_activity = Object.assign({}, activity); // Clone activity object to avoid direct modification
          multiplied_activity.points = data * activity.points;

          await User.updateOne({ name: senderName }, { $push: { activities: multiplied_activity } });
          console.log('User activities updated');
      } else {
          console.error('Invalid values:', data , activity.points);
      }
  } catch (err) {
      console.error(err);
  }
};


// Function to update issues
const updateIssues = async (username, issueData) => {
  try {
    const user = await User.findOne({ name: username });

    console.log(user);

    if (user) {
      const newIssue = {
        issueId: issueData.id,
        title: issueData.title,
        body: issueData.body,
        difficulty: "processing" // set initial difficulty as "processing"
        // Populate other fields as needed
      };
      console.log(newIssue);

      console.log(username);
      await User.updateOne({ name: username }, { $push: { issues: newIssue } });
      //await user.save();
      console.log('User issues updated');
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.error(err);
  }
};



/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");


// listen for app installation event
app.on("installation.created", async (context) => {

  console.log("installation created");
  const sender = context.payload.sender.login;
  const avatar = context.payload.sender.avatar_url;
  const user = new User({
    name: sender,
    avatar_url: avatar,
    totalPoints: 0,
    activities: [],
    issues: [],
    pullRequests: [],
    comments: [],
    friends: [],
    friendsRequests: [],
    achievements: [],
  });

  

});


/*
  // Listen for 'issues.opened' event
app.on("issues.opened", async (context) => {
  const sender = context.payload.sender.login;
  const issueData = context.payload.issue;

  // Update the user's issues in the database
  updateIssues(sender, issueData);
});
*/

  //  +2 points
  app.on("issues.labeled", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 2);
    updateActivities(sender, { type: "labeled comment", points: 2 });

    return ;
    
  });


  //  +2 points
  app.on("pull_request.labeled", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 2);
    updateActivities(sender, { type: "labeled pull request", points: 2 });

    return ;

  });

  app.on("pull_request.assigned", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 5);
    updateActivities(sender, { type: "assigned pull request", points: 5 });

    return ;

  });


  app.on("issues.assigned", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 5);
    updateActivities(sender, { type: "assigned issue", points: 5 });

    return ;

  });


  app.on("issues.closed", async (context) => {
    const sender = context.payload.sender.login;
    const issueBody = context.payload.issue.body;

    console.log("Issue body:", issueBody);
  
    try {
      // 1. Calculate the timeMultiplier using the issue's creation date
      const timeMultiplier = calculateTimeMultiplier(new Date(context.payload.issue.created_at));
      console.log("Time multiplier:", timeMultiplier);
  
      // 2. Use /rateDifficulty endpoint to rate issue body's difficulty
      const response = await fetch(`${Fast_API_base}/rateDifficulty?input_text=${encodeURIComponent(issueBody)}`);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const difficultyScore = parseInt(data.score);

      console.log("Difficulty score:", difficultyScore);
  
      // Calculate the final points considering the difficulty score, base points of 15, streak multiplier, and time multiplier.
      // Note: The streak multiplier is not mentioned in your question here. If you have it in `updatePoints`, it will be applied.
      // If not, you need to fetch and apply it similarly as we did in previous functions.
      const finalPoints = 15 * difficultyScore * timeMultiplier;
  
      updatePoints(sender, finalPoints);
      updateActivities(sender, { type: "closed issue", difficultyScore: difficultyScore, timeMultiplier: timeMultiplier, points: finalPoints });
    } catch (error) {
      console.error("Error:", error);
    }
  });
  
      //console.log(context.payload.issue)
    //const issueComment = context.issue({
      //body: "Thanks for labeling this issue! you have earned 2 points",
    //});
   //context.octokit.issues.createComment(issueComment);
  



   
  // +2 points
  app.on("issue_comment.edited", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 2);
    updateActivities(sender, { type: "edited comment", points: 2 });


    
  });
  



  // -1 points
  app.on("issue_comment.deleted", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, -1);
    updateActivities(sender, { type: "deleted comment", points: -1 });




    
  });





app.on("issue_comment.created", async (context) => {
  const sender = context.payload.sender.login;
  const commentText = context.payload.comment.body;

  try {
      // Fetch the list of comments on the issue
      const { data: comments } = await context.octokit.issues.listComments({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          issue_number: context.payload.issue.number,
          per_page: 100 // adjust this as necessary
      });

      let lastActivityDate;

      if (comments.length <= 1) { 
          lastActivityDate = new Date(context.payload.issue.created_at);
      } else {
          // Remove the most recent comment (the one just made) from the list
          comments.pop();
          // Find the most recent comment's date
          lastActivityDate = new Date(comments[comments.length - 1].created_at);
      }

     // const currentDate = new Date();

      // Calculate difference in days
      //const daysDifference = Math.floor((currentDate - lastActivityDate) / (1000 * 60 * 60 * 24));

      // Time-waiting multiplier
      const timeMultiplier = calculateTimeMultiplier(lastActivityDate);
      console.log("Time multiplier:", timeMultiplier);

      const response = await fetch(`${Fast_API_base}/ratecomment?comment=${encodeURIComponent(commentText)}`);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      const gptScore = parseInt(data.score);

      // Apply the time-waiting multiplier to the GPT score
      const finalScore = gptScore > 0 ? gptScore * timeMultiplier : gptScore;

      updatePoints(sender, finalScore);
      updateActivities(sender, {type: "made a comment", gptScore : gptScore , timeMultiplier : timeMultiplier , points: finalScore });
      
  } catch (error) {
      console.error("Error:", error);
  }
});


  // +2 points
  app.on("pull_request.synchronize", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 2);
    updateActivities(sender, { type: "synchronized pull request", points: 2 });

  });
      /*
    //console.log(context.payload.issue)
    const issueComment = context.issue({
      body: "Thanks for synchronizing this pull request! you have earned 2 points ",
    });
    return context.octokit.issues.createComment(issueComment);
    */





  // if its reopened and then closed and merged (+50 points)
  // +15 points
  app.on("pull_request.closed", async (context) => {
    console.log("pull_request.closed");
    const sender = context.payload.sender.login;
    const prBody = context.payload.pull_request.body;
  
    try {
      // 1. Fetch the difficulty score for the pull request body
      const diffResponse = await fetch(`${Fast_API_base}/rateDifficulty?input_text=${encodeURIComponent(prBody)}`);
      if (!diffResponse.ok) {
        throw new Error(`HTTP error! Status: ${diffResponse.status}`);
      }
      const diffData = await diffResponse.json();
      const difficultyScore = parseInt(diffData.score);
  
      // 2. Calculate the timeMultiplier
      const timeMultiplier = calculateTimeMultiplier(new Date(context.payload.pull_request.created_at));
      console.log("Time multiplier:", timeMultiplier);
  
      // 3. Calculate the number of lines inspected
      const diff_url = context.payload.pull_request.diff_url;
      const diff = await fetch(diff_url);
      const diff_text = await diff.text();
      const lines = diff_text.split("\n");
      const lines_inspected = lines.filter(line => line.startsWith("+") || line.startsWith("-")).length;
  
      // Calculate the final points considering all the factors.
      const basePoints = 15;
      const finalPoints = basePoints * difficultyScore * timeMultiplier; // If you wish to include `lines_inspected` in this calculation, you can multiply it here as well.
  
      updatePoints(sender, finalPoints);
      updateActivities(sender, { type: "closed pull request", difficultyScore: difficultyScore, timeMultiplier: timeMultiplier, linesInspected: lines_inspected , points: finalPoints });
  
    } catch (error) {
      console.error("Error:", error);
    }
  });
  





  app.on("pull_request.reopened", async (context) => {
      
      const sender = context.payload.sender.login;
      updatePoints(sender, 15);
      updateActivities(sender, { type: "reopened pull request", points: 15 });
      
    }
  );






  // +5 points
  app.on("pull_request.opened", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 5);
    updateActivities(sender, { type: "opened pull request", points: 5 });
   
    return ;
  });

  // +20 points
  app.on("pull_request_review.submitted", async (context) => {
console.log("pull_request_review.submitted");

    async function getLinesOfCode() {
      const diff_url = context.payload.pull_request.diff_url;
      const diff = await fetch(diff_url);
      const diff_text = await diff.text();
      const lines = diff_text.split("\n");
      const lines_inspected = lines.filter(line => line.startsWith("+") || line.startsWith("-"));
      return lines_inspected.length;
    }

    const sender = context.payload.sender.login;
  
    try {
      // 1. Fetch the difficulty score for the pull request body
      const prBody = context.payload.pull_request.body;
      const diffResponse = await fetch(`${Fast_API_base}/rateDifficulty?input_text=${encodeURIComponent(prBody)}`);
      if (!diffResponse.ok) {
        throw new Error(`HTTP error! Status: ${diffResponse.status}`);
      }
      const diffData = await diffResponse.json();
      const difficultyScore = parseInt(diffData.score);
  
      // 2. Calculate the timeMultiplier
      const comments = await context.octokit.pulls.listReviewComments({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        pull_number: context.payload.pull_request.number,
        per_page: 100
      });
      let lastActivityDate;
  
      if (comments.data.length <= 0) {
        lastActivityDate = new Date(context.payload.pull_request.created_at);
      } else {
        // Get the most recent comment's date
        lastActivityDate = new Date(comments.data[comments.data.length - 1].created_at);
      }
  
      const timeMultiplier = calculateTimeMultiplier(lastActivityDate);
      console.log("Time multiplier:", timeMultiplier);
  
      // 3. Calculate the number of lines inspected
      const lines_inspected = await getLinesOfCode();
  
      // Calculate the final points considering all the factors.
      const basePoints = 20;
      const finalPointsRaw = basePoints * difficultyScore * timeMultiplier //* (lines_inspected/100);
      const finalPoints = Math.round(finalPointsRaw);
      
  
      updatePoints(sender, finalPoints);
      updateActivities(sender, { type: "submitted pull request review", difficultyScore: difficultyScore, timeMultiplier: timeMultiplier, linesInspected: lines_inspected, points: finalPoints });
  
    } catch (error) {
      console.error("Error:", error);
    }
  });
  
  async function getLinesInspected(context) {
    const diff_url = context.payload.pull_request.diff_url;
    const commentPath = context.payload.comment.path;

    // Fetching the diff
    const diff = await fetch(diff_url);
    const diff_text = await diff.text();

    // Split the diff by new files
    const files = diff_text.split('diff --git');

    // Find the file in question
    const fileDiff = files.find(file => file.includes(`a/${commentPath}`) || file.includes(`b/${commentPath}`));

    if (!fileDiff) return 0;  // If for some reason the file isn't found in the diff

    // Count the lines of changes
    const lines = fileDiff.split("\n");
    const linesOfChange = lines.filter(line => line.startsWith("+") || line.startsWith("-"));

    return linesOfChange.length;
}





  app.on("pull_request_review_comment.created", async (context) => {
    const sender = context.payload.sender.login;
    const commentText = context.payload.comment.body;

    try {
        // 1. Calculate the timeMultiplier
        const timeMultiplier = calculateTimeMultiplier(new Date(context.payload.comment.created_at));
        console.log("Time multiplier:", timeMultiplier);

        // 2. Use /ratecomment endpoint to rate comment usefulness
        const commentResponse = await fetch(`${Fast_API_base}/ratecomment?comment=${encodeURIComponent(commentText)}`);
        if (!commentResponse.ok) {
            throw new Error(`HTTP error! Status: ${commentResponse.status}`);
        }
        const commentData = await commentResponse.json();
        const gptScore = parseInt(commentData.score);

        // 3. Use /rateDifficulty endpoint to rate pull request difficulty
        const diffResponse = await fetch(`${Fast_API_base}/rateDifficulty?input_text=${encodeURIComponent(context.payload.pull_request.body)}`);
        if (!diffResponse.ok) {
            throw new Error(`HTTP error! Status: ${diffResponse.status}`);
        }
        const diffData = await diffResponse.json();
        const difficultyScore = parseInt(diffData.score);

        // 4. Calculate the number of lines inspected
        const linesInspected = await getLinesInspected(context);

        // Calculate the final score
        // If gptScore is positive, apply the formula, else just assign the negative score to finalScore
        const finalScore = gptScore > 0 ? gptScore * (difficultyScore ) * timeMultiplier : gptScore;


        updatePoints(sender, finalScore);
        updateActivities(sender, { type: "created pull request review comment", gptScore: gptScore , timeMultiplier : timeMultiplier , difficultyScore: difficultyScore , linesInspected : linesInspected , points: finalScore });

    } catch (error) {
        console.error("Error:", error);
    }
});



  // +2 points
  app.on("pull_request_review_comment.edited", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, 2);
    updateActivities(sender, { type: "edited pull request review comment", points: 2 });

    return ;
    
  });
  
  // -1 points
  app.on("pull_request_review_comment.deleted", async (context) => {

    const sender = context.payload.sender.login;
    updatePoints(sender, -1);
    updateActivities(sender, { type: "deleted review comment", points: -1 });

  
    return ;
  });




  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
