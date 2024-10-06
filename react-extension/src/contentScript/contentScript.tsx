import React, { useState, useEffect, useRef } from "react";
import LinearProgress from '@mui/material/LinearProgress';

import { makeStyles } from '@mui/styles';
import Tooltip from '@material-ui/core/Tooltip';


import ShopModal from './ShopModal';
import LeaderboardModal from './LeaderboardModal';


import ProfileModal from './ProfileModal';



import ShopIcon from '@material-ui/icons/Shop';
import ListAltIcon from '@material-ui/icons/ListAlt'
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import AccountCircleIcon from '@material-ui/icons/AccountCircle'; // for the profile
import StoreIcon from '@material-ui/icons/Store'; // for Shop

import "../assets/fonts.css"
import { get } from "cheerio/lib/api/traversing";

import styled, { keyframes } from 'styled-components';




const fadeRise = keyframes`
  0% {
    opacity: 0;
    transform: translateY(5px);
  }
  50% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-5px);
  }
`;


const AnimatedText = styled.span`
  animation: ${fadeRise} 2s ease-out forwards;
  font-size: 0.8em;  // This makes the font size smaller
`;

//const API_base = "https://myserver.gitreviewgame.com/";
const API_base = process.env.NODEJS_SERVER;

const useStyles = makeStyles((theme) => ({
  button: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F121B 0%, #151828 50%, #151828 100%)',
      border: 'none',
      borderRadius: '20px', // rounded corners
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px', // making font size a bit smaller
      margin: '0 5px',
      padding: '6px 14px',
      transition: 'transform 0.3s, background-color 0.3s',
      '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: '0 2px 4px 1px rgba(0, 0, 0, 0.3)' // subtle shadow on hover
      }
  }
}));




function calculateLevel(points: number): number {
  return Math.floor(Math.log2(points) + 1);
}

function getProgressText(points: number): string {
const nextLevel = calculateLevel(points) + 1;
const totalPointsNeeded = Math.pow(2, nextLevel) - 1;
const pointsToNextLevel = totalPointsNeeded - points;

return `${points} / ${totalPointsNeeded} XP`;
}

function calculateProgressPercentage(points: number): number {
const nextLevel = calculateLevel(points) + 1;
const pointsToNextLevel = Math.pow(2, nextLevel) - 1 - points;
const totalPointsNeeded = Math.pow(2, nextLevel) - 1;
const progressPercentage = (pointsToNextLevel / totalPointsNeeded) * 100;
return progressPercentage;
}


const AnimatedXP = styled.div`
    animation: ${fadeRise} 2s ease-out forwards;
`;


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


const getRankText = (level) => {
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

  return `${division} ${rankIndex + 1}`;
}




interface ContentScriptProps {
  username: string;
}

function ContentScript(props: ContentScriptProps) {
    const classes = useStyles();
    const [points, setPoints] = useState<number | null>(null);
    const [coins, setCoins] = useState<number | null>(null); // <-- Storing coins
    const [streak, setStreak] = useState<number | null>(null); // <-- Storing streak

    const [isShopModalOpen, setShopModalOpen] = useState(false);
    const [isLeaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [user, setUser] = useState<any | null>(null);
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    //related to animation
    const [prevPoints, setPrevPoints] = useState<number | null>(null);
    const [pointsDifference, setPointsDifference] = useState<number | null>(null);

    const pointsRef = useRef<number | null>(null);

    console.log("API_base: " + API_base);


    const getUserIssuesData = async () => {
    
      const response = await fetch(API_base + "/getUserIssuesDataNoToken", {
          method: "GET",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: currentUser
          })
      });
    
      const data = await response.json();
      return data;  // Add this line
    };



    async function getUserPullRequestsData(username: string) {


      try {
      const response = await fetch(API_base + `/getUserPullRequestsDataNoToken/${username}`);

      const data = await response.json();
      return data;  // Add this line
    }catch (error) {
      console.error('Error fetching user data:', error);

    }
  };





    // Fetch user data function
    async function fetchUserData(username: string) {
        try {
            const response = await fetch(`${API_base}/user/name/${username}`);
            const data = await response.json();
            return data; 
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    }

    const fetchData = () => {
      if (currentUser) {
          fetchUserData(currentUser).then(data => {
              //console.log("points: " + pointsRef.current);
  
              // Check difference in points and set it
              if (pointsRef.current !== null) {
                  setPointsDifference(data.totalPoints - pointsRef.current);
              }
  
              setUser(data);
              setPrevPoints(pointsRef.current);
              setPoints(data.totalPoints);
              setCoins(data.coins);
              setStreak(data.streak);
          });
      }
  };

  useEffect(() => {
    pointsRef.current = points;  // Update the ref when points changes
}, [points]);

useEffect(() => {
    // Fetching from chrome storage
    chrome.storage.local.get('githubUsername', function(data) {
        setCurrentUser(data.githubUsername);
    });

    fetchData();

    // Interval-based fetch
    const intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

    return () => {
        clearInterval(intervalId); // Clean up on component unmount
    };
}, [currentUser]);
  
  

    if (points === null) {
      return <div>Loading...</div>;
  }

  // Use the getProgressText function for displaying the text
  const progressText = getProgressText(points);

  // Use the calculateProgressPercentage function for the progress bar's value
  const progressPercentage = calculateProgressPercentage(points);





  if (!user) {
    return <div>Loading...</div>;
    }

  return (
    
    <div style={{ display: "flex", alignItems: "center" }}>




    {/* New Buttons for Modals */}
    <Tooltip title="Shop">
        <button className={classes.button} onClick={() => setShopModalOpen(true)}>
            <StoreIcon />
        </button>
    </Tooltip>
    <Tooltip title="Leaderboards">
        <button className={classes.button} onClick={() => setLeaderboardModalOpen(true)}>
            <LeaderboardIcon />
        </button>
    </Tooltip>
    <Tooltip title="Profile">
        <button className={classes.button} onClick={() => setProfileModalOpen(true)}>
            <AccountCircleIcon />
        </button>
    </Tooltip>


    <ShopModal isOpen={isShopModalOpen} onClose={() => setShopModalOpen(false)} user={user} />

    <LeaderboardModal isOpen={isLeaderboardModalOpen} onClose={() => setLeaderboardModalOpen(false)} />
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} username={currentUser}/>



    

    {/* Rest of your ContentScript return code */}

      
      {/* Coins Section */}
      <div style={{ display: "flex", alignItems: "center", marginRight: "10px" }}>

      <Tooltip title="Daily streak, Each day of acitivity goes up by +1, resets to 0 if inactive for a business day">
      <img
        src="https://media.tenor.com/q_KPruJ5GtYAAAAi/fire.gif"
        alt="Streak"
        style={{
            width: "25px",
            height: "25px",
            filter: streak <= 0 ? "grayscale(100%)" : "none",
            marginBottom: "2px",
        }}
      />
      </Tooltip>

      <div style={{ marginLeft: "10px", fontFamily: 'Font2' , marginRight: '5px' }}>
          {streak === null ? 'Loading...' : `x${streak} `}
      </div>
 




        <img
          src= "https://i.pinimg.com/originals/f7/33/1c/f7331c0a705d4439a3f2f7be3e514d76.gif"
          alt="Coin"
          style={{ width: "25px", height: "25px" }}
        />
        <div style={{ marginLeft: "10px" , fontFamily: 'Font2' }}>
          {coins === null ? 'Loading...' : `${coins} `}
        </div>
      </div>
 
      
      {/* Vertical Line Separator */}
      <div style={{ height: "100%", width: "1px", background: "#aaa", marginRight: "10px" }}></div>

      <Tooltip title= {getRankText(calculateLevel(points))}>
      <img
        src= {getRankURL(calculateLevel(points))}
        alt="Streak"
        style={{
            width: "40px",
            height: "40px",
        }}
      />
      </Tooltip>
  
      {/* XP Section */}
      <div style={{ width: "100px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "5px", fontFamily: 'Font2' }}>
          {pointsDifference > 0 && (
            <AnimatedText>
                +{pointsDifference}XP
            </AnimatedText>
          )}
          <span>{progressText}</span>
        </div>
        <LinearProgress variant="determinate" value={100 - progressPercentage} />
      </div>

      




      
    </div>
  );
  
}

export default ContentScript;