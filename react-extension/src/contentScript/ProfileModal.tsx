import React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography, Slide, DialogTitle, DialogContentText, DialogContent, DialogActions, Button } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Progress from '@mui/material/LinearProgress';
import AchievementsList from './AchievementsList';
//import RadarChartComponent from './RadarChartComponent';
import { Radar } from 'react-chartjs-2';
import Chart, { ChartTypeRegistry, RadialLinearScale } from 'chart.js/auto';
import { makeStyles } from '@mui/styles';
Chart.register(RadialLinearScale);




import '../assets/fonts.css';



import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';


import GradientBarChart from './GradientBarChart';

const appBarStyles = {
  position: 'relative',
  backgroundImage: 'url(https://i.pinimg.com/originals/c1/09/f8/c109f881992bf2ecc2faad720a31be3f.gif)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};



//const API_base = "https://myserver.gitreviewgame.com/";
//const API_base = "http://localhost:3002";
const API_base = process.env.NODEJS_SERVER;

const SKIN_STYLES = {
  borderRadius: '10%',
  position: 'relative' as 'relative',
  overflow: 'hidden',
  boxShadow: '4px 4px 12px 4px rgba(0,0,0,0.45)',  // You can adjust this
};

const useStyles = makeStyles((theme) => ({
  centeredCell: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProfileButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #F7FAFD 50%, #E5E9EC 100%)', // Gentle white to light blue gradient
    border: 'none',
    borderRadius: '20px',
    color: '#333',  // Using a slightly darker text color to contrast with the white background
    cursor: 'pointer',
    fontSize: '14px',
    margin: '0 5px',
    padding: '6px 14px',
    transition: 'transform 0.3s, background-color 0.3s',
    '&:hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 2px 4px 1px rgba(0, 0, 0, 0.1)'  // A more subtle shadow for a cleaner look
    }
  },
  
  
  
  
}));


const SKINS = {
  zebra: {
    cost: 100,
    img: 'https://gitreviewgame.com/static/media/zebra.3784a6ddb1733b307aef.jpg', // adjust this
    description : "Collect 100 coins to unlock zebra"
  },
  warning: {
    cost: 200,
    img: 'https://gitreviewgame.com/static/media/Lava.6e864dc9b314b6c81cf8.gif', // adjust this
    description : "Collect 200 coins to unlock lava"
  },
  info: {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/curved14.12c9ea54425c4f1bc1d7.jpg', // adjust this
    description : "Free to use skin"
  },
  error: {
    cost: 300,
    img: 'https://gitreviewgame.com/static/media/red.6f5539e551cd0707608a.gif',
    description : "Collect 300 coins to unlock errors"
  },
  primary: {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/curved0.d146ec6e9401aa9d52c5.jpg',
    description : "Free to use skin",
  },
  success: {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/green.efd85e053810fd170d67.jpg',
    description : "Free to use skin",
  },
  space : {
    cost: 700,
    img: 'https://gitreviewgame.com/static/media/space.b127a7e6385e8bfc037c.gif',
    description : "Collect 700 coins to unlock space",
  },
  matrix : {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/matrix.d2180e2ada2c543ba7a6.gif',
    description : "Break the code to unlock matrix , participate in 100+ issues and / or pull requests to unlock matrix",
  },
  crazy : {
    cost: 1099,
    img: 'https://gitreviewgame.com/static/media/crazy.b0811556f59fb8e1dba3.gif',
    description : "Collect 1099 coins to unlock crazy",
  },
  chaching : {
    cost: 22000,
    img: 'https://gitreviewgame.com/static/media/chaching.4430a8b28bfe839cb06e.gif',
    description : "Collect 22000 coins to unlock chaching",
  },
  steel : {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/steel.5e52206d9d3e93d4f4ab.gif',
    description : "Reach level 10 to unlock Man of Steel",
  },
  lazer : {
    cost: 0,
    img: 'https://gitreviewgame.com/static/media/lazer.91a592eee9dab37da926.gif',
    description : "Climb your way up and reach level 14 to unlock Lazer",
  },


  //... other skins
};

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

function getBadge(level) {
  const badges = [
      "Pixel Pioneer",
      "Byte Brawler",
      "Cyber Surfer",
      "Code Cavalier",
      "Techno Templar",
      "Data Dervish",
      "Syntax Samurai",
      "Logic Lancer",
      "Silicon Seer",
      "Binary Baron",
      "Matrix Marauder",
      "Digit Druid",
      "Quantum Quetzal",
      "Stream Scepter",
      "Array Astronaut",
      "Photon Phantom",
      "Pulse Paladin",
      "Frame Freebooter",
      "Technetium Templar",
      "Bit Buccaneer",
      "Node Nomad",
      "Digit Desperado",
      "Echo Enchanter",
      "Sequence Sultan",
      "Giga Gladiator",
      "Spectrum Sovereign",
      "Latency Lich",
      "Tera Templar",
      "Peta Paladin",
      "Exa Emperor"
  ];
  if(level < 1 || level > 30) {
      throw new Error("Level must be between 1 and 30.");
  }
  return badges[level - 1];
}


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

// This will return the progress percentage as before
function calculateProgressPercentage(points) {
const nextLevel = calculateLevel(points) + 1;

const pointsToNextLevel = Math.pow(2, nextLevel) - 1 - points;
const totalPointsNeeded = Math.pow(2, nextLevel) - 1;
const progressPercentage = (points / totalPointsNeeded) * 100;
return progressPercentage;
}



async function fetchLanguageData(username: string, githubAccessToken: string): Promise<Record<string, number>> {
  const headers = {
    'Authorization': `token ${githubAccessToken}`
  };
  
  const response = await fetch(`https://api.github.com/users/${username}/repos`, { headers });
  
  // Check if the response is valid
  if (!response.ok) {
    throw new Error('Failed to fetch repos');
  }

  const repos: Array<{ languages_url: string }> = await response.json();

  let totalLanguages: Record<string, number> = {};

  //console.log("Repos");

  for (let repo of repos) {
    const langResponse = await fetch(repo.languages_url, { headers });
    
    if (!langResponse.ok) {
      throw new Error(`Failed to fetch languages for repo ${repo.languages_url}`);
    }

    //console.log(repo.languages_url);
    const languages: Record<string, number> = await langResponse.json();

    for (let [lang, bytes] of Object.entries(languages)) {
      totalLanguages[lang] = (totalLanguages[lang] || 0) + bytes;
    }
  }

  const totalBytes = Object.values(totalLanguages).reduce((acc, cur) => acc + cur, 0);

  const languagePercentages: Record<string, number> = {};
  for (let [lang, bytes] of Object.entries(totalLanguages)) {
    languagePercentages[lang] = (bytes / totalBytes) * 100;
  }

  //console.log("Language percentages");
  //console.log(languagePercentages);
  return languagePercentages;

}


const mapCategoryToFullName = (abbreviation: string): string => {
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


const processComments = (comments: any[]): Record<string, number> => {
  const categoryCounts: Record<string, number> = {};

  comments.forEach(comment => {
      const categoryName = mapCategoryToFullName(comment.category || "");

      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
  });

  return categoryCounts;
};



const Transition = React.forwardRef<unknown, TransitionProps & { children?: React.ReactElement<any, any> }>(
    (props, ref) => <Slide direction="up" ref={ref} {...props}>{props.children}</Slide>
);


interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;  // <--- New prop
}


function ReadMeModal({}: { onClose: () => void }) {
  return (
    <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
        backgroundColor: 'white',
        borderRadius: '10px',
        boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        width: '500px',
        height: '650px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #0F121B 0%, #151828 50%, #151828 100%)'
    }}>
        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '24px', fontFamily: 'Font1', textAlign: 'center', marginBottom: '20px' }}>
            Are you Sure ?
        </div>
        
        <div style={{ width: '100%', flex: 1 }}>
   
                    </div>
                    </div>

                    

  );
}

function ProfileModal({ isOpen, onClose, username }: ProfileModalProps) {
  const classes = useStyles();
  const [userPointsData, setUserPointsData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [maxCategoryCount, setMaxCategoryCount] = useState(0); // New state variable
  const [isWarningModalOpen, setWarningModalOpen] = useState(false);
  const [usernameState, setUsernameState] = useState(username);



  const [languageData, setLanguageData] = useState({
    labels: [],
    datasets: [{
      data: [],
      label: 'Language Usage',
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 1,
      hoverBackgroundColor: 'rgba(75,192,192,0.4)',
      hoverBorderColor: 'rgba(75,192,192,1)',
    }]
  });

  console.log("user data in profile page : " , username);


  /*
  const chartOptions = {
    scales: {
      r: {
        angleLines: { display: false },
        suggestedMin: 0,
        suggestedMax: 100
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as 'top',
      }
    }
  };
*/

const chartOptions = {
  scales: {
    r: {
      angleLines: { display: false },
      suggestedMin: 0,
      suggestedMax: maxCategoryCount
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as 'top',
    }
  }
};

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const openWarningModal = () => {
    setWarningModalOpen(true);
    console.log(userPointsData)
  };
  
  const closeWarningModal = () => {
    setWarningModalOpen(false);
  };
  


  const updateReadme = async () => {
    try {
      console.log("user object");
      const response = await fetch(`${API_base}/updateReadme/${userPointsData?.name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
  
      const result = await response.json();
      // Handle the response as necessary, e.g., showing a success message
    } catch (error) {
      console.error("Error updating README:", error);
    }
  };





  
/*
  useEffect(() => {
    
      console.log("started fetching language data");
      fetch(`${API_base}/api/github/languages/${username}`, {
          headers: {
              'Authorization': 'Github token' //userPointsData.githubAccessToken
          }
      })
      .then(response => response.json())
      .then(data => {

        
        const commentCategories = processComments(userPointsData.comments || []);
        const allLabels = [...Object.keys(data), ...Object.keys(commentCategories)];
        const allData = [...Object.values(data), ...Object.values(commentCategories)];
        
        setLanguageData(prevData => ({
            ...prevData,
            labels: allLabels,
            datasets: [{
                ...prevData.datasets[0],
                data: allData
            }]
        }));
      })
      .catch(error => {
        // Handle any errors from the API call
        console.error("Failed to fetch language data:", error);
      });
  
  
  }, [username , userPointsData]);
*/

  useEffect(() => {
    async function fetchData() {
      try {
          await getUserPointsData(username);  // <--- Use the prop here
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, [username]);


  useEffect(() => {
    if (!userPointsData || !userPointsData.comments) {
        return;  // Ensure userPointsData and its comments are available
    }

    const commentCategories = processComments(userPointsData.comments);
    
    const maxCount = Math.max(...Object.values(commentCategories));
    setMaxCategoryCount(maxCount); // Update the maxCategoryCount state
    
    setLanguageData({
        labels: Object.keys(commentCategories),
        datasets: [{
            data: Object.values(commentCategories),
            label: 'Comment Categories',
            backgroundColor: 'rgba(75,192,192,0.2)',
            borderColor: 'rgba(75,192,192,1)',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(75,192,192,0.4)',
            hoverBorderColor: 'rgba(75,192,192,1)'
        }]
    });
    
}, [userPointsData]);  // Note that we're using userPointsData as the dependency for this effect


  useEffect(() => {
    if (userPointsData && userPointsData.comments) {
      //updateUserChart(userPointsData.comments);
    }
  }, [userPointsData]);




  const getUserPointsData = async (username) => {
    try {
      const response = await fetch(`${API_base}/user/name/${username}`);
      const data = await response.json();
      setUserPointsData(data);
      //console.log("User points data");
      //console.log(data);
    } catch (error) {
      console.error("Error fetching user points:", error);
    }
  };


      // Assuming a function to get the URL of the current skin
      const getCurrentSkinUrl = () => {
        //console.log("Current skin url");
        //console.log(SKINS[userPointsData?.currentSkin]?.img || '');
        // Replace this logic with how you determine the current skin for the user
        return SKINS[userPointsData?.currentSkin]?.img || '';

      };



  return (
    <Dialog 
      fullScreen
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
    >
        <AppBar sx={appBarStyles}>
            <Toolbar>
                <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                    Profile
                </Typography>
            </Toolbar>
        </AppBar>

        <Grid container style={{ height: '100%' }}>
            {/* Profile Info (Left Section - 30%) */}
            <Grid item md={3} xs={3} container alignItems="center" justifyContent="center" style={{ position: 'fixed', height: '100%', top: 0, left: 0, background: 'white' }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        sx={SKIN_STYLES} 
                        style={{ backgroundImage: `url(${getCurrentSkinUrl()})` }}
                    >
                        <Avatar 
                            src={userPointsData?.avatar_url} 
                            alt="profile-image" 
                            variant="rounded" 
                            sx={{ width: '150px', height: '150px', borderRadius: '10%', margin: '12px' }} 
                        />
                    </Box>
                    <Typography variant="h5" mt={2} style={{ fontFamily: 'Font1' }}>
                        {userPointsData?.name}
                    </Typography>

                    <Typography mt={1} style={{ fontFamily: 'Font2' }}>
                        {getBadge(calculateLevel(userPointsData?.totalPoints))}, Level {calculateLevel(userPointsData?.totalPoints)}
                    </Typography>
                    


                  {/* update github readme button*/}
                    <button 
                  className={classes.viewProfileButton} 
                  style={{ fontFamily: 'Font2' , marginTop: '20px' }} 
                  color="primary" 
                  onClick={openWarningModal}
                >
                  Update GitHub Profile Readme
                </button>

                <Dialog
                  open={isWarningModalOpen}
                  onClose={closeWarningModal}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogTitle id="alert-dialog-title">{"Overwrite Warning"}</DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      Warning, this will overwrite your current readme page if you have one on your profile page.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={closeWarningModal} color="primary">
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        closeWarningModal();
                        updateReadme();
                      }} 
                      color="primary" 
                      autoFocus
                    >
                      Confirm
                    </Button>
                  </DialogActions>
                </Dialog>




                </Box>

                

            </Grid>


          {/* Level and Badge Info (Right Section - 70%) */}
          <Grid item md={8} xs={8} container alignItems="center" justifyContent="center" style={{ marginLeft: '30%' }}>
          <Box position="relative" height="100%">

            
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  centered
                  style={{ marginTop: '16px', marginBottom: '16px' }}
                >
                  <Tab label="Profile Dashboard" />
                  <Tab label="Points Log" />
                </Tabs>

          {tabValue === 0 && (
            <Box display="flex" flexDirection="column" alignItems="center">
              {/* Existing code for Profile Dashboard goes here */}
              <Box display="flex" flexDirection="column" alignItems="center">
                            <Typography variant="button" style={{ fontSize: '2rem' , fontFamily: 'Font1' }}>
                              {getRankText(calculateLevel(userPointsData?.totalPoints))}
                            </Typography>
                            <Avatar
                                src={getRankURL(calculateLevel(userPointsData?.totalPoints))}
                                alt="level-badge"
                                variant="rounded"
                                sx={{ width: '250px', height: '250px', margin: '0 auto' }}
                            />
                            <Typography style={{ marginBottom: '4px', fontFamily: 'Font1' }}>
                                {getProgressText(userPointsData?.totalPoints)}
                            </Typography>
                            <Box width="10rem">
                                <Progress value={calculateProgressPercentage(userPointsData?.totalPoints)} variant="determinate" />
                            </Box>
                            {/* Here's the RadarChart integration*/}
                            <Box mt={4} width="100%">
                            <Radar data={languageData} options={chartOptions} />
                            </Box>
                            {/* Here's the GradientBarChart integration */}
                            <Box mt={4} width="100%">
                            <GradientBarChart user={userPointsData} />
                            </Box>
                        </Box>
                        <Box mt={7} width="100%">
                        <AchievementsList userAchievements={userPointsData?.achievements} />
                        </Box>
            </Box>
          )}

          {tabValue === 1 && (
            <Box display="flex" flexDirection="column" alignItems="center">
              <Table>
                <TableHead>
                  <TableRow>
                  <TableCell>Date</TableCell>
                    <TableCell>Activity</TableCell>

                  {/*   <TableCell>Details</TableCell>*/}
                    <TableCell align="right">Points</TableCell>
                  </TableRow>
                </TableHead>


                <TableBody>
                  {userPointsData?.activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(activity.date).toLocaleDateString()}</TableCell>
                      <TableCell>{activity.type}</TableCell>
                      {/* 
                      
                                            <TableCell>
                        {comment.body.split(' ').slice(0, 5).join(' ')}
                  
                        <Tooltip title={comment.body}>
                          <IconButton size="small" style={{ marginLeft: '10px' }}>
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      */}

                      <TableCell align="right">{activity.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>

              </Table>
            </Box>
          )}
          </Box>
          </Grid>
            

        </Grid>
    </Dialog>
);
  }

export default ProfileModal;
