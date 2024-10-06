require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
var bodyParser = require('body-parser');
const { lookup } = require('geoip-lite');

const { Octokit } = require("@octokit/core");
//const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.ATLAS_URI;

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.log(err));



//mongoose.connect('mongodb://127.0.0.1:27017/testdb1',{

//useNewUrlParser: true,
//useUnifiedTopology: true,
//}).then(() => console.log('Connected to MongoDB'))
//.catch(err => console.log(err));


const User = require('./models/Users');
const IssueProcessing = require('./models/Issues');
const PullRequestProcessing = require('./models/PullRequests');
const GameQueue = require('./models/GameQueue');
const GameSession = require('./models/GameSession');
const CommentProcessing = require('./models/Comments');
const Token = require('./models/Tokens');



//const cloudfrontUrl = `http://d2xidx15r8filx.cloudfront.net/profile?access_token=${accessToken}`;
//const route53Url = `https://gitreviewgame.com/profile?access_token=${accessToken}`;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

app.get('/login', (req, res) => {
  res.redirect(
    "https://github.com/login/oauth/authorize?client_id=" +clientId + "&scope=read:user,public_repo"
  );
});

//`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user%20repo`

//get access token

app.get('/callback', async (req, res) => {


  const params = "?client_id=" + clientId + "&client_secret=" + clientSecret + "&code=" + req.query.code;

  try {
    // Fetch access token
    const response = await fetch("https://github.com/login/oauth/access_token" + params, {
      method: "POST",
      headers: {
        "Accept": "application/json"
      }
    });

    const jsonData = await response.json();
    //console.log(jsonData);

    const accessToken = jsonData.access_token;

    //console.log(req.query.code);

  
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const location = lookup(ip); 
  //console.log(location.country); // country code of the user

    // Create new Octokit instance with access token
    const octokit = new Octokit({
      auth: accessToken
    });

    // Fetch GitHub profile
    const { data: githubProfile } = await octokit.request('GET /user');

    // Find user in your database
    let user = await User.findOne({ name: githubProfile.login });

    // If user does not exist and location exists, create a new user
    if (!user) {
      


      user = new User({
        name: githubProfile.login,
        avatar_url: githubProfile.avatar_url,
        totalPoints: 2, // default value
        activities: [], // default value
        issues: [], // default value
        pullRequests: [], // default value
        comments: [], // default value
        friends: [], // default value
        friendsRequests: [], // default value
        currentSkin: 'primary',
        firstLogin: false,
        streak: 1,
        //country: location.country,
        coins: 200,
        skinsBought: ['info' , 'error' , 'primary' , 'success' , 'dark' , 'light'],
        achievements: [{
          id: 1,
          owned: false,
          name: "Lucky 7" ,
          description: "Score 7 points or more from a single comment",
        }
        ,
        {
          id: 2,
          owned: false,
          name: "AllTime top 10" ,
          description: "Reach top 10 players in the leaderboard",
        }
        ,
        {
          id: 3,
          owned: false,
          name: "AllTime top 3" ,
          description: "Reach top 3 players in the leaderboard",
        }
        ,
        {
          id: 4,
          owned: false,
          name: "High in the sky" ,
          description: "Close an issue or Pull Request with Label -High- bounty",
        }
      ],
        //country: ip,
        country: 'CA', // CA is temporarely set to avoid issues with the country code, replace with ip

        //githubAccessToken: accessToken, // set the access token
      });

      await user.save();

    }
    

    
    else {
      // If user exists, update the access token
      user.avatar_url = githubProfile.avatar_url;

      await user.save();
    }
    
    
      // Check if token entry for the user already exists
      let userToken = await Token.findOne({ name: githubProfile.login });

      if (userToken) {
        // If exists, update the token
        userToken.token = accessToken;
      } else {
        // Else, create a new entry
        userToken = new Token({
          name: githubProfile.login,
          token: accessToken
        });
      }

      await userToken.save();  // Save or update the token in the tokens collection

      
    

 
      res.redirect(`https://gitreviewgame.com/profile?access_token=${accessToken}`);
  
  } catch (error) {
    console.error('Error:', error);
  }
});


app.get('/users', async (req, res) => {
  try {
      const users = await User.find();
      res.json(users);
  } catch (err) {
      res.status(500).json({ message: 'Error fetching users' });
  }
});


async function fetchLanguageData(username, githubAccessToken) {
  const headers = {
      'Authorization': `token ${githubAccessToken}`
  };

  const response = await fetch(`https://api.github.com/users/${username}/repos`, { headers });
  console.log("Response status:", response.status, "Response status text:", response.statusText)

  if (!response.ok) {
      throw new Error('Failed to fetch repos');
  }

  const repos = await response.json();
  console.log("Repos data:", repos);
  
  let totalLanguages = {};

  for (let repo of repos) {
      console.log("Processing repo:", repo.name);

      const langResponse = await fetch(repo.languages_url, { headers });
    
      if (!langResponse.ok) {
          console.error(`Failed to fetch languages for repo ${repo.languages_url}. Response: ${await langResponse.text()}`);
          continue; // skip to the next repo
      }

      const languages = await langResponse.json();

      for (let lang in languages) {
          totalLanguages[lang] = (totalLanguages[lang] || 0) + languages[lang];
      }
  }

  const totalBytes = Object.values(totalLanguages).reduce((acc, cur) => acc + cur, 0);
  const languagePercentages = {};

  for (let lang in totalLanguages) {
      languagePercentages[lang] = (totalLanguages[lang] / totalBytes) * 100;
  }

  console.log("Language percentages:", languagePercentages);
  return languagePercentages;
}


app.get('/api/github/languages/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const githubAccessToken = req.headers.authorization;

    const data = await fetchLanguageData(username, githubAccessToken);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch language data.' });
  }
});


app.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    } catch (err) {
        res.status(404).json({ message: 'User not found' });
    }
});


app.get('/friends/:id', async (req, res) => {
  try {
      const name = req.params.id;
      const user = await User.findOne({name : name });
      res.json(user.friends);
      //console.log(user.friends);
  } catch (err) {
      res.status(404).json({ message: 'User not found' });
  }
});

app.get('/user/name/:id', async (req, res) => {
  try {
    const name = req.params.id;
    const user = await User.findOne({name : name });
    res.json(user);
  } catch (err) {
      res.status(404).json({ message: 'User not found' });
  }
});

app.get('/user/negative/:id', async (req, res) => {
  try {
    const name = req.params.id;
    const user = await User.findOne({ name: name });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filtering activities to find comments with negative points
    const negativePointComments = user.activities.filter(activity => 
      (activity.type === "created pull request review comment" || activity.type === "made a comment") && activity.points < 0
    );

    // Counting the number of such comments
    const negativePointCommentsCount = negativePointComments.length;

    // Adding this count to the response
    const responseData = {
      ...user.toObject(), // Assuming Mongoose Document, converting to plain object
      negativePointCommentsCount
    };

    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred' });
  }
});


app.post('/sendCoins', async (req, res) => {
  const { senderName, receiverName, amount } = req.body;

  if (!senderName || !receiverName || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
      const sender = await User.findOne({ name: senderName });
      const receiver = await User.findOne({ name: receiverName });

      if (!sender || !receiver) {
          return res.status(404).json({ error: 'User not found' });
      }

      if (sender.coins < amount) {
          return res.status(400).json({ error: 'Insufficient coins' });
      }

      // Deduct coins from sender and add to receiver
      sender.coins -= amount;
      receiver.coins += amount;

      await sender.save();
      await receiver.save();

      res.json({ message: 'Coins transferred successfully' });
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred during the transaction' });
  }
});


app.post('/friendrequest/new', async (req , res) => {

  try{
    //get friend request sender name
    const sender = req.body.sendername;
    //console.log(sender);
    // find the user object of the sender from the mongodb
    const senderObject = await User.findOne({ name: sender });
   

    //get friend request reciever name
    const reciever = req.body.receivername;
    console.log(reciever);
    // find the user object of the reciever from the mongodb
    const recieverObject = await User.findOne({ name: reciever });


    // create a new object with the sender name and avatar url and total points to post to the reciever's friend requests
    const senderpost = {name: sender , avatar_url: senderObject.avatar_url , totalPoints: senderObject.totalPoints };

    if (recieverObject) {
      await User.updateOne({ name: reciever }, { $push: { friendsRequests: senderpost } });
      console.log('User friend requests updated');
      res.json({ message: 'User friend requests updated' }); // after the update
    } else {
      console.log('User not found');
      
    }
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'An error occurred' }); // send a 500 error
  }

});


app.post('/friendrequest/decline', async (req , res) => {

  try{
    //get friend request sender name, current user
    const sender = req.body.sendername;

    //get friend request reciever name, user who sent the friend request
    const reciever = req.body.recievername;

    // remove the sender's friend request from the reciever's friend requests
    const update = { $pull: { friendsRequests: { name: reciever } } };

    const updatedReciever = await User.updateOne({ name: sender }, update);
    if (updatedReciever.nModified) {
      console.log('Friend request declined successfully');
      res.status(200).send('Friend request declined successfully');
    } else {
      console.log('Friend request decline failed');
      res.status(400).send('Friend request decline failed');
    }

  } catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});



app.post('/friendrequest/accept', async (req , res) => {
  try{
    // get friend request sender name, current user
    const sender = req.body.sendername;

    // get friend request receiver name, user who sent the friend request
    const reciever = req.body.recievername;

    // find the user object of the sender from the mongodb
    const recieverObject = await User.findOne({ name: reciever });
    const senderObject = await User.findOne({ name: sender });
    // create a new object with the receiver name and avatar url and total points to post to the sender's friends
    const recieverpost = {name: reciever , avatar_url: recieverObject.avatar_url , totalPoints: recieverObject.totalPoints };
    const senderpost = {name: sender , avatar_url: senderObject.avatar_url , totalPoints: senderObject.totalPoints };

    // Remove the sender's friend request from the receiver's friend requests
    const pullUpdate = { $pull: { friendsRequests: { name: reciever } } };
    const pullResult = await User.updateOne({ name: sender }, pullUpdate);
    
    if (pullResult) {
      console.log('Friend request removed successfully');
      // Add the receiver to the sender's friends
      const pushUpdate = { $push: { friends: recieverpost } };
      const pushResult = await User.updateOne({ name: sender }, pushUpdate);
      const pushUpdatetwo = { $push: { friends: senderpost } };
      const pushResulttwo = await User.updateOne({ name: reciever }, pushUpdatetwo);

      if(pushResult){
        console.log('Friend added successfully');
        res.status(200).send('Friend request accepted successfully');
      } else {
        console.log('Adding friend failed');
        res.status(400).send('Adding friend failed');
      }
    } else {
      console.log('Friend request removal failed');
      res.status(400).send('Friend request removal failed');
    }
  } catch(err){
    console.error(err);
    res.status(500).send('Server error');
  }
});




app.post('/gamequeue/new', async (req, res) => {

  // get user data from database based on username
  try {
    const name = req.body.name;
    const user = await User.findOne({name : name });

    // Check if user is already in the queue
    const existingQueue = await GameQueue.findOne({ name: user.name });
    
    // If the user already exists in the queue, delete all instances
    if (existingQueue) {
      await GameQueue.deleteMany({ name: user.name });
    }

    
    // Now create a new queue entry for the user
    const gamequeue = new GameQueue({
      name: user.name,
      avatar_url: user.avatar_url,
      totalPoints: user.totalPoints,
      role: req.body.role
    }); 

    await gamequeue.save();

    res.json(gamequeue);

    // Matchmaking check starts after a new game queue entry has been saved
    setInterval(async () => {
      const pilotQueue = await GameQueue.find({ role: 'pilot' }).sort({ createdAt: 1 }).limit(1);
      const coPilotQueue = await GameQueue.find({ role: 'copilot' }).sort({ createdAt: 1 }).limit(1);

      if(pilotQueue.length > 0 && coPilotQueue.length > 0) {
        // There is a match, create the match and delete these entries from the queue
            // Create a new game session
        const gameSession = new GameSession({
          pilot: pilotQueue[0],
          copilot: coPilotQueue[0],
          chat: []
        });

    await gameSession.save();

    // Delete matched users from the queue
    await GameQueue.deleteOne({ _id: pilotQueue[0]._id });
    await GameQueue.deleteOne({ _id: coPilotQueue[0]._id });
      }
    }, 5000); // Check the queue every 5 seconds

  } catch (err) {
    res.status(404).json({ message: 'User not found' });
  }
});



// Endpoint to change the firstLogin attribute for a user
app.post('/user/updateFirstLogin/:userName', (req, res) => {
  const userName = req.params.userName;

  console.log('Received request to update firstLogin:', { userName });

  if (!userName) {
      return res.status(400).send({ success: false, message: 'Missing username parameter' });
  }

  User.findOneAndUpdate(
      { name: userName },
      { firstLogin: true },
      { new: true }, // This option will return the updated document
  )
  .then(updatedUser => {
      console.log('Updated user firstLogin:', updatedUser);
      res.json({ success: true, user: updatedUser })
  })
  .catch(err => res.status(500).send({ success: false, message: err.message }));
});




// Endpoint to change the current skin of the user
app.post('/user/updateSkin', (req, res) => {
  const { userName, skin } = req.body;

  console.log('Received request:', { userName, skin });

  if (!userName || !skin) {
    return res.status(400).send({ success: false, message: 'Missing parameters' });
  }

  User.findOneAndUpdate(
    { name: userName },
    { currentSkin: skin },
    { new: true }, // This option will return the updated document
  )
  .then(updatedUser => {
    console.log('Updated user:', updatedUser);
    res.json({ success: true, user: updatedUser })
  })
  .catch(err => res.status(500).send({ success: false, message: err.message }));
});



// function to check if user unlocked an acheivement and update the user's acheivements , 
//called whenever an totalPoints Update occurs in either the probot app or the FastAPI app

app.post('/user/checkAchievement', async (req, res) => {
  const { senderName } = req.body;

  if (!senderName) {
    return res.status(400).send({ success: false, message: 'senderName parameter is missing' });
  }

  try {
    const user = await User.findOne({ name: senderName });
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // ... (The rest of your checkAchievement function logic here.)

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
     const has7PointComment = user.comments.some(comment => comment.score == 7);
     if (has7PointComment) {
      console.log("has7PointComment");
         const commentAchievement = user.achievements.find(a => a.id === 1);
         if (commentAchievement && !commentAchievement.owned) {
             commentAchievement.owned = true;
         }
     }
 
     // Participate in a High Bounty Issue/PR achievement
     const participatedInHighBountyIssue = user.issues.some(issue => issue.pointsMade > 0 && issue.difficulty >= 7);
     const participatedInHighBountyPR = user.pullRequests.some(pr => pr.pointsMade > 0 && pr.difficulty >= 7);
 
     if (participatedInHighBountyIssue || participatedInHighBountyPR) {
         const highBountyAchievement = user.achievements.find(a => a.id === 4);
         if (highBountyAchievement && !highBountyAchievement.owned) {
             highBountyAchievement.owned = true;
         }
     }
 

    await user.save();
    res.json({ success: true, message: 'Achievement check complete', user });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: err.message });
  }
});


app.get('/user/streak/:id', async (req, res) => {
  try {
      const name = req.params.id;
      User.findOne({name : name }).then(user => {
        res.json(user.streak);
      });
  } catch (err) {
      res.status(404).json({ message: 'User not found' });
  }
});

app.post('/user/new', (req, res) => {
  const user = new User({
     name: req.body.name,
     avatar_url: req.body.avatar_url,
     totalPoints: req.body.totalPoints,
     activities: req.body.activities
  }); 

  user.save()
     .then(savedUser => res.json(savedUser))
     .catch(err => res.status(500).send(err));
});

app.delete('/todo/delete/:id', async (req, res) => {
    const result = await Todo.findByIdAndDelete(req.params.id);

    res.json(result);
});

app.put('/todo/complete/:id', async (req, res) => {

    const todo = await Todo.findById(req.params.id);

    todo.complete = !todo.complete;

    todo.save();

    res.json(todo);
});




function calculateLevel(points) {
  return Math.floor(Math.log2(points) + 1);
}

// This will return the text to display, like "434 / 1023 XP"
function getProgressText(points) {
  const nextLevel = calculateLevel(points) + 1;
  const totalPointsNeeded = Math.pow(2, nextLevel) - 1;
  const pointsToNextLevel = totalPointsNeeded - points;
  return `${points} / ${totalPointsNeeded} XP`;
}

const getBadgeURL = (level) => {
  return `https://raw.githubusercontent.com/jaykay9999/badges/main/lvl${level}.png`;
}

const getRankURL = (level) => {
  let division = '';
  let rankIndex = (level - 2) % 3;  // Adjusted to correctly map the rank within the division

  let divisionIndex = Math.floor((level - 2) / 3);
  switch (divisionIndex) {
    case 0:
      division = 'bronze';
      break;
    case 1:
      division = 'silver';
      break;
    case 2:
      division = 'gold';
      break;
    case 3:
      division = 'platinum';
      break;
    case 4:
      division = 'diamond';
      break;
    // Add more cases if there are more divisions
    default:
      division = 'unknown'; // Handle levels outside the defined range
  }

  return `https://raw.githubusercontent.com/jaykay9999/ranks/main/${division}${rankIndex + 1}.png`;
}



function getProgressText(progressPercentage) {
  const points = (progressPercentage / 100) * Math.pow(2, calculateLevel(progressPercentage) + 1) - 1;
  const nextLevel = calculateLevel(points) + 1;
  const totalPointsNeeded = Math.pow(2, nextLevel) - 1;
  const pointsToNextLevel = totalPointsNeeded - points;
  return `${Math.round(points)} / ${Math.round(totalPointsNeeded)} XP`;
}



app.get('/dynamic-svg', (req, res) => {
  const { progress, max } = req.query;  // Get the progress and max values from the query parameters
  const progressPercentage = (progress / max) * 100;

  const svg = `
    <svg width="200" height="20" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="progressGradient" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop stop-color="#17c1e8" offset="0"/>
                <stop stop-color="#3acaeb" offset="1"/>
            </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height="20" rx="10" ry="10" fill="#e0e0e0" />
        <rect x="0" y="0" width="${progressPercentage * 2}" height="20" rx="10" ry="10" fill="url(#progressGradient)" />
        <text x="100" y="15" font-family="Arial" font-size="12px" fill="black" text-anchor="middle" text-shadow="1px 1px 1px #000">${progress} / ${max} XP</text>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});



const processComments = (comments) => {
  const categoryCounts = {};

  comments.forEach(comment => {
      const categoryName = mapCategoryToFullName(comment.category || "");

      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
  });

  return categoryCounts;
};



const mapCategoryToFullName = (abbreviation) => {
  const categories = {
    "G-": "General negative",
    "G+": "General positive",
    "G0": "General neutral",
    "GA": "General advice",
    "S-": "Specific negative",
    "S+": "Specific positive",
    "S0": "Specific neutral",
    "SA": "Specific advice",
    "PV": "Personal voice",
    "OT": "Off-topic"
  };

  for (const key in categories) {
    if (abbreviation.includes(key)) {
      return categories[key];
    }
  }

  return abbreviation; // Default to the provided abbreviation if no match is found.
};


app.get('/radar-chart', (req, res) => {

  const padding = 50; // Extra space for the title and labels
  const svgWidth = 350 + padding * 2;
  const svgHeight = 350 + padding * 2;

  const chartRadius = 150;
  const chartCenter = { x: svgWidth / 2, y: svgHeight / 2 - padding }; // Adjust the center for padding

  // Helper functions adjusted for the static chart size
  const svgX = (degrees, scale = 1) => chartCenter.x + Math.sin(degrees * Math.PI / 180) * chartRadius * scale;
  const svgY = (degrees, scale = 1) => chartCenter.y - Math.cos(degrees * Math.PI / 180) * chartRadius * scale;




  let circles = '';
  for (let i = 1; i <= 3; i++) {
      circles += `<circle cx="${chartCenter.x}" cy="${chartCenter.y}" r="${chartRadius * (i / 4)}" fill="none" stroke="#aaa" stroke-dasharray="2,2" />`;
  }
  

  const svgLabelPosition = (degrees, scale = 1.2) => {
    return {
        x: chartCenter.x + Math.sin(degrees * Math.PI / 180) * chartRadius * scale,
        y: chartCenter.y - Math.cos(degrees * Math.PI / 180) * chartRadius * scale
    };
  };
  






  // Get data from query params
  const commentCategories = {
    "General negative": Number(req.query.GN) || 0,
    "General positive": Number(req.query.GP) || 0,
    "General neutral": Number(req.query.G0) || 0,
    "General advice": Number(req.query.GA) || 0,
    "Specific negative": Number(req.query.SN) || 0,
    "Specific positive": Number(req.query.SP) || 0,
    "Specific neutral": Number(req.query.S0) || 0,
    "Specific advice": Number(req.query.SA) || 0,
    "Personal voice": Number(req.query.PV) || 0,
    "Off-topic": Number(req.query.OT) || 0,
    // ... add all other categories similarly
  };

  const maxCount = Math.max(...Object.values(commentCategories));

  // Convert data points to SVG polygon points:
  const totalCategories = Object.keys(commentCategories).length;
  const angleIncrement = 360 / totalCategories;
  const polygonPoints = Object.values(commentCategories).map((value, index) => {
    const scaleValue = value / maxCount; // Normalize the value between 0 and 1
    return `${svgX(index * angleIncrement, scaleValue)},${svgY(index * angleIncrement, scaleValue)}`;
  }).join(' ');

  let axes = '';
  let labelsSVG = '';

  const labelColor = "#3acaeb";  // Blue color for labels

  Object.keys(commentCategories).forEach((category, index) => {
    const degree = index * angleIncrement;
    const position = svgLabelPosition(degree, 1.25);  // Adjust the scale to push labels out a bit more
    labelsSVG += `<text x="${position.x}" y="${position.y}" fill="${labelColor}" font-size="12" text-anchor="middle" dominant-baseline="middle">${category}</text>`;
  });


Object.keys(commentCategories).forEach((_, index) => {
  const degree = index * angleIncrement;
  axes += `<line x1="${chartCenter.x}" y1="${chartCenter.y}" x2="${svgX(degree)}" y2="${svgY(degree)}" stroke="#aaa" />`;
});
  
// Create SVG:
const svg = `
<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
    ${axes}
    ${circles}
    <polygon points="${polygonPoints}" fill="#17c1e8" fill-opacity="0.6" stroke="#3acaeb" stroke-width="2" />
    ${labelsSVG}      
</svg>
`;




  
  


  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});








app.post('/updateReadme/:id', async (req, res) => {
  try {

    const username = req.params.id;
    console.log("username");

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  // Fetch the GitHub access token for the given username from the tokens collection
  const userTokenEntry = await Token.findOne({ name: username });
  const userProfile = await User.findOne({ name: username });

  if (!userTokenEntry) {
    return res.status(404).json({ error: "User not found or token not set." });
  }

  const accessToken = userTokenEntry.token;

  // Initialize Octokit with the provided access token
  const octokit = new Octokit({ auth: `token ${accessToken}` });


    

    const level = calculateLevel(userProfile.totalPoints);
    const badgeURL = getRankURL(level);
    const progressText = getProgressText(userProfile.totalPoints);

    const nextLevel = calculateLevel(userProfile.totalPoints) + 1;
    const totalPointsNeeded = Math.pow(2, nextLevel) - 1;

    const commentCategories = processComments(userProfile.comments);  // Assuming you have userProfile.comments
    const radarChartURL = `https://myserver.gitreviewgame.com/radar-chart?GN=${commentCategories["General negative"]}&GP=${commentCategories["General positive"]}&G0=${commentCategories["General neutral"]}&GA=${commentCategories["General advice"]}&SN=${commentCategories["Specific negative"]}&SP=${commentCategories["Specific positive"]}&S0=${commentCategories["Specific neutral"]}&SA=${commentCategories["Specific advice"]}&PV=${commentCategories["Personal voice"]}&OT=${commentCategories["Off-topic"]}&timestamp=${new Date().getTime()}`;
    // Define README content
    const readmeContent = `
<h1 align="center">${userProfile.name}'s Profile</h1>
    
<h2 align="center">
  <strong>Level: ${level}</strong>
</h2>
    
<p align="center">
  <img src="${badgeURL}" alt="Badge">
</p>
    
<p align="center">
  <img src="https://myserver.gitreviewgame.com/dynamic-svg?progress=${userProfile.totalPoints}&max=${totalPointsNeeded}&timestamp=${new Date().getTime()}" alt="Progress Bar">
</p>

<h3 align="center">Comments By Category</h3>

<p align="center">
  <img src="${radarChartURL}" alt="Radar Chart">
</p>
    
<!-- You can add more sections and data as you fetch them from the user's data -->
`;

    
    

    const repoName = username;
    console.log("repoName");
    console.log(repoName);

    // Check if the repository exists
    try {
      console.log("owner" , userProfile.login);
      await octokit.request('GET /repos/{owner}/{repo}', {
        owner: username,
        repo: repoName,
      });
    } catch (error) {
      if (error.status === 404) {
        // Create the repository if it doesn't exist
        await octokit.request('POST /user/repos', {
          name: repoName,
          description: 'My GitHub Profile Repository',
          private: false, // Change this as needed
        });
      } else {
        throw error;
      }
    }


    // Check if README.md exists in the user's repository
    let sha; // Store the SHA of the existing README file if it exists

    // ...

try {
  const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: username,
    repo: repoName,
    path: 'README.md',
  });
  sha = data.sha; // Get the SHA of the existing file
} catch (error) {
  if (error.status === 404) {
    sha = null; // Set SHA to null if README does not exist
  } else {
    throw error;
  }
}

const params = {
  owner: username,
  repo: repoName,
  path: 'README.md',
  message: sha ? 'Update README.md' : 'Create README.md',
  content: Buffer.from(readmeContent).toString('base64'),
};

if (sha) {
  params.sha = sha; // Include the SHA only if updating an existing file
}

await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', params);

// ...


res.json({ message: 'README updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while updating the README' });
  }
});



app.get('/purchaseSkin', async (req, res) => {
  const { skin, cost, userName } = req.query;

  try {
    const user = await User.findOne({ name: userName }); // Using Mongoose's method to find the user by name

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!"
      });
    }

    if (user.coins >= cost) {
      // Deduct coins from the user's account and add the skin to their list
      user.coins -= cost;
      user.skinsBought.push(skin);

      // Save the updated user data
      await user.save();

      res.json({
        success: true,
        message: "Skin purchased successfully!"
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Insufficient coins!"
      });
    }
  } catch (error) {
    console.error('Error purchasing skin:', error);
    res.status(500).json({
      success: false,
      message: "Server error!"
    });
  }
});



// automatically run this function every 1 hour in classifier.js

app.get('/updateStreaks', async (req, res) => {
  try {
    const users = await User.find({});  // Fetch all users

    // Iterate through each user and check their activity
    for (const user of users) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];  // Converts Date to "YYYY-MM-DD"
    
      console.log(user.name);
      const activeToday = user.comments.some(comment => {
        let commentDateString;
        
        try {
          const commentDate = new Date(comment.comment_day);
          commentDateString = commentDate.toISOString().split('T')[0];  // Converts Date to "YYYY-MM-DD"
        } catch (error) {
          console.error('Invalid date format for comment:', comment);
          return false; // If date is invalid, skip this comment and move to the next one
        }
        
        //console.log("comment date, : " , commentDateString);
        //console.log("today, : " , todayString);
        
        return commentDateString === todayString;
      });

      if (activeToday) {
        user.streak += 1;
      } else {
        // Check inactivity for past 3 days
        let inactiveDays = 0;
        for (let i = 1; i <= 3; i++) {
          const pastDate = new Date(today);
          pastDate.setDate(today.getDate() - i); // Set to i days ago

          const wasActive = user.comments.some(comment => {
            const commentDate = new Date(comment.comment_day);
            return commentDate.getTime() === pastDate.getTime();
          });

          if (!wasActive) {
            inactiveDays += 1;
          } else {
            break;  // Exit loop once an active day is found
          }
        }

        if (inactiveDays === 3) {
          user.streak = 0;
        }
      }
      user.streak = 1 ;
      await user.save();  // Save changes to the user
    }

    res.send('Streaks updated successfully!');
  } catch (error) {
    console.error('Error updating streaks:', error);
    res.status(500).send('Failed to update streaks.');
  }
});




// api to get the user issues data using the access token


  app.get('/getUserIssuesData', async (req, res) => {
    const authorizationHeader = req.get("Authorization");
    //console.log("server");
    //console.log("authorizationHeader");
    //console.log(authorizationHeader);
  
    try {
      // Get user information
      const userResponse = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          "Authorization": authorizationHeader
        }
      });
  
      const userData = await userResponse.json();
      //console.log("userData");
      //console.log(userData);
      const username = userData.login; // Extract the username from user data
  
      // Get user issues data
      const issuesResponse = await fetch(`https://api.github.com/search/issues?q=author:${username}+is:issue`, {
        method: "GET",
        headers: {
          "Authorization": authorizationHeader
        }
      });
  
      const issuesData = await issuesResponse.json();
  
  
      // Extract the issues from the response.
      const issues = issuesData.items;
  
      // For each issue, check if it exists in the database.
      for (let issue of issues) {
        const existingIssueProcessing = await IssueProcessing.findOne({"issueId": issue.id});
        const existingIssueUser = await User.findOne({ name: username, 'issues.issueId': issue.id });
  
  
        if (existingIssueUser) {
          const shokmok = existingIssueUser.issues;
          const issueInUser = shokmok.find(i => i.issueId === issue.id);
  
          // If issueInUser is not undefined, it exists in the user's issues, 
          // and you can get its difficulty.
          if (issueInUser) {
            const difficulty = issueInUser.difficulty;
  
          // If the issue doesn't exist in IssueProcessing, add it.
          if (!existingIssueProcessing && difficulty == "processing") {
            const newIssue = new IssueProcessing({
              issueId: issue.id,
              title: issue.title,
              body: issue.body,
              pointsMade: 0,
              difficulty: "processing" // set initial difficulty as "processing"
              // Populate other fields as needed.
            });
  
            await newIssue.save();
          }
  
          //console.log(`Difficulty of issue ${issue.id} is ${difficulty}`);
          } else {
            //console.log(`Issue ${issue.id} not found in user's issues`);
          }
        }
  
       
  
  
        //issue does not exist in the users table
        if (!existingIssueUser) {
          const newIssue = new IssueProcessing({
            issueId: issue.id,
            title: issue.title,
            body: issue.body,
            pointsMade: 0,
            difficulty: "processing" // set initial difficulty as "processing"
            // Populate other fields as needed.
          });
  
          // Assume you have the user's username, use it to find the user.
          // Note that you might want to use the user's id if available.
          const user = await User.findOne( {name : username} );
          if(user){
            user.issues.push(newIssue);
            await user.save();
            await newIssue.save();
         } else {
            console.log(`User ${username} not found in database`);
         }
          
         
        }
      }
  
      res.json(issuesData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user issues data', error });
    }
  });
  
// get the user issues difficulty data from the database
  
app.get('/getIssueDifficulties', async (req, res) => {

  const authorizationHeader = req.get("Authorization");


  try {
    // Get user information
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const userData = await userResponse.json();
    //console.log("userData");
    //console.log(userData);
    const username = userData.login; // Extract the username from user data
    
    const user = await User.findOne({ name: username });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const difficulties = user.issues.map(issue => ({ issueId: issue.issueId, difficulty: issue.difficulty }));
    res.json(difficulties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching issue difficulties', error });
  }
});




app.get('/getIssuePoints', async (req, res) => {

  const authorizationHeader = req.get("Authorization");

  try {
    // Get user information
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const userData = await userResponse.json();
    const username = userData.login; // Extract the username from user data
    
    const user = await User.findOne({ name: username });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const points = user.issues.map(issue => ({ issueId: issue.issueId, pointsMade: issue.pointsMade }));
    res.json(points);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching issue points', error });
  }
});
   


  // get the user issues difficulty data from the database

  app.get('/getPullRequestDifficulties', async (req, res) => {

    const authorizationHeader = req.get("Authorization");
  
  
    try {
      // Get user information
      const userResponse = await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
          "Authorization": authorizationHeader
        }
      });
  
      const userData = await userResponse.json();
      //console.log("userData");
      //console.log(userData);
      const username = userData.login; // Extract the username from user data
      
      const user = await User.findOne({ name: username });
  
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
  
      const difficulties = user.pullRequests.map(pullRequest => ({ pullRequestId: pullRequest.pullRequestId, difficulty: pullRequest.difficulty }));
      res.json(difficulties);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching pull request difficulties', error });
    }
  });


// get the user issues difficulty data from the database
/*
app.get('/getIssueDifficulties/:username', async (req, res) => {
try {
  const username = req.params.username;
  const user = await User.findOne({ name: username });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const difficulties = user.issues.map(issue => ({ issueId: issue.issueId, difficulty: issue.difficulty }));
  res.json(difficulties);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error fetching issue difficulties', error });
}
});





// get the user pull requests difficulties data from the database

app.get('/getPullRequestDifficulties/:username', async (req, res) => {
try {
  const username = req.params.username;
  const user = await User.findOne({ name: username });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const difficulties = user.pullRequests.map(pullRequest => ({ pullRequestId: pullRequest.pullRequestId, difficulty: pullRequest.difficulty }));
  res.json(difficulties);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: 'Error fetching pull request difficulties', error });
}
});


*/


// api to get the user name using the access token




// api to get user name
app.get('/getUserName', async (req, res) => {
  const authorizationHeader = req.get("Authorization");
  //console.log("server");
  //console.log("authorizationHeader");
  //console.log(authorizationHeader);

 
  
  try {
    // Get user information
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const userData = await userResponse.json();
/*
  const octokit = new Octokit({
    auth: authorizationHeader.split(' ')[1], // assuming Authorization header is 'Bearer YOUR_TOKEN'
  });

  try {
    // Get user information
    const userResponse = await octokit.request('GET /user', {
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    const userData = userResponse.data;
*/
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user issues data', error });
  }
});







app.get('/getUserPullRequestsData', async (req, res) => {
  const authorizationHeader = req.get("Authorization");


  try {
    // Get user information
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const userData = await userResponse.json();
    const username = userData.login; // Extract the username from user data

    // Get user pull requests data
    const pullRequestsResponse = await fetch(`https://api.github.com/search/issues?q=author:${username}+is:pr`, {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const pullRequestsData = await pullRequestsResponse.json();

    // Extract the pull requests from the response.
    const pullRequests = pullRequestsData.items;

    // For each pull request, check if it exists in the database.
    for (let pullRequest of pullRequests) {
      const existingPullRequestProcessing = await PullRequestProcessing.findOne({"pullRequestId": pullRequest.id});
      const existingPullRequestUser = await User.findOne({ name: username, 'pullRequests.pullRequestId': pullRequest.id });

        // Fetch more detailed data about the PR:
        const prDetailsResponse = await fetch(pullRequest.pull_request.url, {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });

      const prDetails = await prDetailsResponse.json();


          // Fetch the list of files from the PR
          const prFilesResponse = await fetch(prDetails._links.self.href + "/files", {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });
      const prFiles = await prFilesResponse.json();

      let combinedCodeContents = "";  // Initialize an empty string to store combined file contents


      // Fetch the content of each file (for simplicity, we're fetching all, but you might want to limit this)
      for (let file of prFiles) {
        const fileContentResponse = await fetch(file.raw_url, {
            method: "GET",
            headers: {
                "Authorization": authorizationHeader
            }
        });
        const fileContent = await fileContentResponse.text(); // get the raw content as text
        combinedCodeContents += "\n\n" + fileContent; // append each file's content to the combined string
    }

      
      // Check if existingPullRequestUser is not null to avoid null reference error.
      if (existingPullRequestUser) {
        const shokmok = existingPullRequestUser.pullRequests;
        const pullRequestInUser = shokmok.find(pr => pr.pullRequestId === pullRequest.id);

        // If pullRequestInUser is not undefined, it exists in the user's pull requests, 
        // and you can get its difficulty.
        if (pullRequestInUser) {
          const difficulty = pullRequestInUser.difficulty;

        // If the pull request doesn't exist, add it to the user's pull requests array in MongoDB.
       if (!existingPullRequestProcessing && difficulty == "processing") {
        const newPullRequest = new PullRequestProcessing({
          pullRequestId: pullRequest.id,
          title: pullRequest.title,
          body: pullRequest.body,
          pointsMade: 0,
          difficulty: "processing", // set initial difficulty as "processing"
          additions: prDetails.additions,
          deletions: prDetails.deletions,
          changedFiles: prDetails.changed_files,
          code: combinedCodeContents  // add this line
        });

        await newPullRequest.save();
      }
          //console.log(`Difficulty of pull request ${pullRequest.id} is ${difficulty}`);
        } else {
          console.log(`Pull request ${pullRequest.id} not found in user's pull requests`);
        }
      }

     
      
      // if the pull request does not exist in the user table, add it to both the user table and processing table
      if (!existingPullRequestUser) {
        const newPullRequest = new PullRequestProcessing({
          pullRequestId: pullRequest.id,
          title: pullRequest.title,
          body: pullRequest.body,
          pointsMade: 0,
          difficulty: "processing", // set initial difficulty as "processing"
          additions: prDetails.additions,
          deletions: prDetails.deletions,
          changedFiles: prDetails.changed_files,
          code: combinedCodeContents  // add this line
          // Populate other fields as needed.
        });

        const user = await User.findOne( {name : username} );
        if(user){
          user.pullRequests.push(newPullRequest);
          await user.save();
          await newPullRequest.save();
       } else {
          console.log(`User ${username} not found in database`);
       }


      }


      

    }

    res.json(pullRequestsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user pull requests data', error });
  }
});












app.get('/getUserPullRequestsDataNoToken/:userName', async (req, res) => {

  const username = req.params.userName; // Extract the username from user data

  if (!username) {
    return res.status(400).json({ error: "Username is required." });
  }

  // Fetch the GitHub access token for the given username from the tokens collection
  const userTokenEntry = await Token.findOne({ name: username });
  //const userProfile = await User.findOne({ name: username });

  if (!userTokenEntry) {
    return res.status(404).json({ error: "User not found or token not set." });
  }

  const accessToken = userTokenEntry.token;
  const authorizationHeader = `token ${accessToken}`
  try {


    // Get user pull requests data
    const pullRequestsResponse = await fetch(`https://api.github.com/search/issues?q=author:${username}+is:pr`, {
      method: "GET",
      headers: {
        "Authorization": authorizationHeader
      }
    });

    const pullRequestsData = await pullRequestsResponse.json();

    // Extract the pull requests from the response.
    const pullRequests = pullRequestsData.items;

    // For each pull request, check if it exists in the database.
    for (let pullRequest of pullRequests) {
      const existingPullRequestProcessing = await PullRequestProcessing.findOne({"pullRequestId": pullRequest.id});
      const existingPullRequestUser = await User.findOne({ name: username, 'pullRequests.pullRequestId': pullRequest.id });

        // Fetch more detailed data about the PR:
        const prDetailsResponse = await fetch(pullRequest.pull_request.url, {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });

      const prDetails = await prDetailsResponse.json();


          // Fetch the list of files from the PR
          const prFilesResponse = await fetch(prDetails._links.self.href + "/files", {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });
      const prFiles = await prFilesResponse.json();

      let combinedCodeContents = "";  // Initialize an empty string to store combined file contents


      // Fetch the content of each file (for simplicity, we're fetching all, but you might want to limit this)
      for (let file of prFiles) {
        const fileContentResponse = await fetch(file.raw_url, {
            method: "GET",
            headers: {
                "Authorization": authorizationHeader
            }
        });
        const fileContent = await fileContentResponse.text(); // get the raw content as text
        combinedCodeContents += "\n\n" + fileContent; // append each file's content to the combined string
    }

      
      // Check if existingPullRequestUser is not null to avoid null reference error.
      if (existingPullRequestUser) {
        const shokmok = existingPullRequestUser.pullRequests;
        const pullRequestInUser = shokmok.find(pr => pr.pullRequestId === pullRequest.id);

        // If pullRequestInUser is not undefined, it exists in the user's pull requests, 
        // and you can get its difficulty.
        if (pullRequestInUser) {
          const difficulty = pullRequestInUser.difficulty;

        // If the pull request doesn't exist, add it to the user's pull requests array in MongoDB.
       if (!existingPullRequestProcessing && difficulty == "processing") {
        const newPullRequest = new PullRequestProcessing({
          pullRequestId: pullRequest.id,
          title: pullRequest.title,
          body: pullRequest.body,
          pointsMade: 0,
          difficulty: "processing", // set initial difficulty as "processing"
          additions: prDetails.additions,
          deletions: prDetails.deletions,
          changedFiles: prDetails.changed_files,
          code: combinedCodeContents  // add this line
        });

        await newPullRequest.save();
      }
          //console.log(`Difficulty of pull request ${pullRequest.id} is ${difficulty}`);
        } else {
          console.log(`Pull request ${pullRequest.id} not found in user's pull requests`);
        }
      }

     
      
      // if the pull request does not exist in the user table, add it to both the user table and processing table
      if (!existingPullRequestUser) {
        const newPullRequest = new PullRequestProcessing({
          pullRequestId: pullRequest.id,
          title: pullRequest.title,
          body: pullRequest.body,
          pointsMade: 0,
          difficulty: "processing", // set initial difficulty as "processing"
          additions: prDetails.additions,
          deletions: prDetails.deletions,
          changedFiles: prDetails.changed_files,
          code: combinedCodeContents  // add this line
          // Populate other fields as needed.
        });

        const user = await User.findOne( {name : username} );
        if(user){
          user.pullRequests.push(newPullRequest);
          await user.save();
          await newPullRequest.save();
       } else {
          console.log(`User ${username} not found in database`);
       }


      }


      

    }

    res.json(pullRequestsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user pull requests data', error });
  }
});





// api to get the user comments data using the access token


app.get('/getUserCommentsData', async (req, res) => {
  const authorizationHeader = req.get("Authorization");

  try {
      // Get user information
      const userResponse = await fetch("https://api.github.com/user", {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });

      const userData = await userResponse.json();
      const username = userData.login; // Extract the username from user data

      // Get user comments data
      const commentsResponse = await fetch(`https://api.github.com/search/issues?q=commenter:${username}`, {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });

      const issuesAndPRs = await commentsResponse.json();

      let userComments = [];

      for (let item of issuesAndPRs.items) {
          // Fetch comments for each issue/PR
          
          const individualCommentsResponse = await fetch(item.comments_url, {
              method: "GET",
              headers: {
                  "Authorization": authorizationHeader
              }
          });
          const relatedIssuePRId = item.id; // This should be the issue or PR's ID
          const individualComments = await individualCommentsResponse.json();

          // Filter to get only the user's comments
          const filteredComments = individualComments.filter(comment => comment.user.login === username);
          for (let comment of filteredComments) {
            //console.log(relatedIssuePRId);
            comment.relatedIssuePRId = relatedIssuePRId;  // Assigning the issue or PR's ID to the comment
            const commentDate = new Date(comment.created_at);
            const commentDay = `${commentDate.getFullYear()}-${String(commentDate.getMonth() + 1).padStart(2, '0')}-${String(commentDate.getDate()).padStart(2, '0')}`;
            console.log(commentDay);
            comment.comment_day = commentDay;

          
            // Fetch reactions for the comment
            const reactionsResponse = await fetch(`${comment.url}/reactions`, {
              method: "GET",
              headers: {
                  "Authorization": authorizationHeader,
                  "Accept": "application/vnd.github.squirrel-girl-preview"
              }
            });
            const reactions = await reactionsResponse.json();
            comment.totalReactions = reactions.length;
            console.log("total reactions : " , comment.totalReactions);

            // Count specific reactions (e.g., '+1' and '-1')
            comment.positiveReactions = reactions.filter(reaction => reaction.content === '+1').length;
            comment.negativeReactions = reactions.filter(reaction => reaction.content === '-1').length;
            }

            userComments = userComments.concat(filteredComments);
            }

      // Check if comments exist in the database and add them if they don't
      for (let comment of userComments) {
        const existingCommentProcessing = await CommentProcessing.findOne({ "body": comment.body });
        const existingUserComment = await User.findOne({ "name": username, "comments.body": comment.body });

        // If the comment doesn't exist in User collections, add it to user.comments.
        if (!existingUserComment) {
          console.log(`Comment ${comment.id} not found in user's comments`);
          console.log("comment object : " , comment);
            // Add the comment to user.comments with a default score of "processing"
              // Find the user
              
              const user = await User.findOne({ name: username });
              const newComment = new CommentProcessing({
                commentId: comment.id,
                body: comment.body,
                score: "processing",
                category: "processing",
                relatedIssuePRId: comment.relatedIssuePRId,
                comment_day: comment.comment_day,
                totalReactions: comment.totalReactions,
                positiveReactions: comment.positiveReactions,
                negativeReactions: comment.negativeReactions

            });


              if (user) {
                console.log(`User ${username} found in database`);
                  user.comments.push(newComment);
                  await user.save();
              }

            // If the comment does not exists in CommentProcessing and not in User, add it to commentsProcessing
            if (!existingCommentProcessing) {


            await newComment.save();
          }

        }



      }


      res.json(userComments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user comments data', error });
  }
});


app.get('/getuserReactionPoints/:username', async (req, res) => {
  const username = req.params.username;

  if (!username) {
      return res.status(400).json({ message: 'Username is required' });
  }

  try {
      // Find the user in the database
      const user = await User.findOne({ name: username });
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Access the comments attribute of the user
      const userComments = user.comments;

      // Calculate total number of positive reactions and update total points and activities
      let totalPositiveReactions = 0;
      for (let comment of userComments) {
          totalPositiveReactions += comment.positiveReactions;
      }

      // Update user's totalPoints and add activities for positive reactions
      user.totalPoints += totalPositiveReactions * 5;
      for (let i = 0; i < totalPositiveReactions; i++) {
          const newActivity = {
              type: 'positive_reaction',
              points: 5,
              date: new Date()
          };
          user.activities.push(newActivity);
      }

      await user.save();

      res.json(userComments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user comments data', error });
  }
});



app.get('/getUserCommentsReactions/:username', async (req, res) => {
  const username = req.params.username;

  if (!username) {
      return res.status(400).json({ message: 'Username is required' });
  }

  try {
      // Fetch the user's token from the database
      const userTokenRecord = await Token.findOne({ name: username });
      if (!userTokenRecord) {
          return res.status(404).json({ message: 'User token not found' });
      }

      console.log(userTokenRecord.token);
      
      const authorizationHeader = userTokenRecord.token;

      // Reuse the logic to get user's comments
      const commentsResponse = await fetch(`https://api.github.com/search/issues?q=commenter:${username}`, {
          method: "GET",
          headers: {
              "Authorization": authorizationHeader
          }
      });

      console.log("comments response : " , commentsResponse);

      const issuesAndPRs = await commentsResponse.json();
      let userComments = [];

      for (let item of issuesAndPRs.items) {
          const individualCommentsResponse = await fetch(item.comments_url, {
              method: "GET",
              headers: {
                  "Authorization": authorizationHeader
              }
          });
          console.log("individualCommentsResponse : " , individualCommentsResponse);
          const individualComments = await individualCommentsResponse.json();
          console.log("individualComments : " , individualComments);
          const filteredComments = individualComments.filter(comment => comment.user.login === username);
          userComments = userComments.concat(filteredComments);
      }

      // Fetch reactions for the user's comments
      for (let comment of userComments) {
          const reactionsResponse = await fetch(`${comment.url}/reactions`, {
              method: "GET",
              headers: {
                  "Authorization": authorizationHeader,
                  "Accept": "application/vnd.github.squirrel-girl-preview" // required for reactions
              }
          });
          const reactions = await reactionsResponse.json();
          comment.reactions = reactions;
      }

      res.json(userComments);

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching user comments reactions', error });
  }
});







//const port = process.env.PORT || 3002;
//app.listen(port, () => console.log(`Server started on port ${port}`));



app.use((req, res, next) => {
  if (req.secure) {
    // Request was via https, so no special handling
    next();
  } else {
    // Request was via http, so redirect to https
    res.redirect('https://' + req.headers.host + req.url);
  }
});

const httpPort =  process.env.PORT || 3002;
app.listen(httpPort, () => console.log(`HTTP Server started on port ${httpPort}`));





const githubBaseURL = 'https://api.github.com';

app.get('/github/:username/issues', async (req, res) => {
    try {
      const { username } = req.params;
      const { access_token } = req.query;
      const response = await axios.get(`${githubBaseURL}/search/issues?q=author:${username}+is:issue`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      res.json(response.data.items);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user issues', error });
    }
  });


  app.get('/github/:username/pullrequests', async (req, res) => {
    try {
      const { username } = req.params;
      const { access_token } = req.query;
      const response = await axios.get(`${githubBaseURL}/search/issues?q=author:${username}+is:pr`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      res.json(response.data.items);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user pull requests', error });
    }
  });


  