import React, { useState, useEffect } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography, Slide, Table, TableBody, TableCell, TableHead, TableRow, Avatar, Button, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ProfileModal from './ProfileModal';
import { Tab } from '@material-ui/core';
import { makeStyles } from '@mui/styles';


const appBarStyles = {
  position: 'relative',
  backgroundImage: 'url(https://i.pinimg.com/originals/c1/09/f8/c109f881992bf2ecc2faad720a31be3f.gif)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
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
  }
  
  
  
}));


const SKIN_STYLES = {
  borderRadius: '10%',
  position: 'relative' as 'relative',
  overflow: 'hidden',
  boxShadow: '4px 4px 12px 4px rgba(0,0,0,0.45)',  // You can adjust this
};


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



const getFlagURL = (countryCode) => {
  return `https://flagicons.lipis.dev/flags/4x3/${countryCode}.svg`;
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

function calculateLevel(points) {
  return Math.floor(Math.log2(points) + 1);
}



// Hook to fetch leaderboards data
const useFetchLeaderboards = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  //const API_base = process.env.REACT_APP_AWS_SERVER;
  //const API_base = "https://myserver.gitreviewgame.com/";
  const API_base = process.env.NODEJS_SERVER;

  useEffect(() => {
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_base}/users`);
            const data = await response.json();
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('There was an error!', error);
            setLoading(false);
        }
    }

    fetchUsers();
  }, []);

  return { users, loading };
};

// LeaderboardModal component
type SlideProps = {
  children?: React.ReactElement;
  direction?: 'left' | 'right' | 'up' | 'down';
};

const Transition = React.forwardRef<unknown, SlideProps>((props, ref) => (
  <Slide direction="up" ref={ref} {...props}>
    {props.children}
  </Slide>
));

function LeaderboardModal({ isOpen, onClose }) {
  const classes = useStyles();
  const [profileModalUser, setProfileModalUser] = useState<string | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const { users, loading } = useFetchLeaderboards();
  const [selectedCountry, setSelectedCountry] = useState('all');


  const countries = Array.from(new Set(users.map(user => user.country)));


  const openProfileModal = (username: string) => {
    setProfileModalUser(username);
    setProfileModalOpen(true);
    // logic to open the profile modal
  }
  


    // Assuming a function to get the URL of the current skin
    const getCurrentSkinUrl = (user) => {
      //console.log("Current skin url");
      //console.log(SKINS[user?.currentSkin]?.img || '');
      // Replace this logic with how you determine the current skin for the user
      return SKINS[user?.currentSkin]?.img || '';

    };
  


  


  const podiumStyles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '20px 0'
    },
    user: {
      flex: 1,
      textAlign: 'center' as const,  // <-- add 'as const' to specify a string literal type
      alignItems: 'center',
      display: 'flex',
      flexDirection: 'column' as const, // <-- add 'as const' to specify a string literal type
    },
    firstPlace: {
      fontSize: '2em',
      imgSize: '120px'
    },
    secondPlace: {
      fontSize: '1.5em',
      imgSize: '95px'
    },
    thirdPlace: {
      fontSize: '1.2em',
      imgSize: '80px'
    },
    avatarContainer: {
      position: 'relative' as 'relative',
      display: 'inline-block',
      borderRadius: '10%',
      overflow: 'hidden',
      boxSizing: 'border-box' as 'border-box', // Add this line
      
    },    
    avatar: {
      borderRadius: '10%',
      width: 'calc(100% - 12px)', // reduce size by 2 * 3px (3px for each side)
      height: 'calc(100% - 12px)',
      margin: '6px', // This ensures the "border" is visible
      boxSizing: 'border-box' as 'border-box'
    },
    flag: {
      borderRadius: '10%',  // Same value as the container to ensure consistency
      width: '40px',
      height: '30px',
      display: 'block',
      margin: '0 auto',  // Center the flag
      marginBottom: '10px' // Space between flag and avatar. Adjust as necessary.
    },
    goldBorder: {
      position: 'relative' as 'relative',
      background: 'linear-gradient(to bottom, #FFD700, #DAA520)',
      borderRadius: '10%',
      overflow: 'hidden',  // This ensures that inner content respects the border radius
      boxShadow: '5px 5px 15px 5px rgba(0,0,0,0.3)', // Adjusted values
    },
    silverBorder: {
      position: 'relative' as 'relative',
      background: 'linear-gradient(to bottom, #C0C0C0, #A9A9A9)',
      borderRadius: '10%',
      overflow: 'hidden',
      boxShadow: '4px 4px 12px 4px rgba(0,0,0,0.45)',  // Moderately strong shadow
    },
    bronzeBorder: {
      position: 'relative' as 'relative',
      background: 'linear-gradient(to bottom, #CD7F32, #8C7853)',
      borderRadius: '10%',
      overflow: 'hidden',
      boxShadow: '3px 3px 10px 3px rgba(0,0,0,0.4)',   // Milder shadow
    },
    levelBadge: {
      marginTop: '10px',
      width: '70px',  // adjust based on desired size
      height: '70px',
      display: 'block',
      margin: '0 auto' , // to center it
    },
  };


  const dropdownStyles = {
    width: '200px', // Adjust width as needed
    padding: '8px 12px',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    fontSize: '16px',
    color: '#333',
    cursor: 'pointer',
    outline: 'none'
  };

  if (loading) return <div>Loading...</div>;

  const filteredUsers = selectedCountry === 'all' 
  ? users 
  : users.filter(user => user.country === selectedCountry);

const sortedUsers = filteredUsers.sort((a, b) => b.totalPoints - a.totalPoints);
const topThree = sortedUsers.slice(0, 3);
const restOfUsers = sortedUsers.slice(3);

// Dropdown change handler
const handleCountryChange = (event) => {
  setSelectedCountry(event.target.value);
};
  return (
    <Dialog fullScreen open={isOpen} onClose={onClose} TransitionComponent={Transition}>
          
          <AppBar sx={appBarStyles}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Leaderboards
          </Typography>
        </Toolbar>
      </AppBar>

    {/* Styled Dropdown for Country Filter */}
    <select value={selectedCountry} onChange={handleCountryChange} style={dropdownStyles}>
      <option value="all">All Countries</option>
      {countries.map((country, index) => (
        <option key={index} value={country}>
          {country}
        </option>
      ))}
    </select>

      {/* Top Three Users */}
      <div style={podiumStyles.container}>


      {/* 2nd Place User */}
      <div style={{...podiumStyles.user, ...podiumStyles.secondPlace}}>
          <img src={getFlagURL(topThree[1]?.country.toLowerCase())} alt={topThree[1]?.country} style={podiumStyles.flag} />
          <div style={{...podiumStyles.silverBorder, width: podiumStyles.secondPlace.imgSize, height: podiumStyles.secondPlace.imgSize}}>
            <img src={topThree[1]?.avatar_url} alt={topThree[1]?.name} style={podiumStyles.avatar} />
          </div>
          <img 
              src={getRankURL(calculateLevel(topThree[1]?.totalPoints))} 
              alt={`Level ${calculateLevel(topThree[1]?.totalPoints)}`} 
              style={podiumStyles.levelBadge}
            />
          <Typography style ={{ fontFamily :'Font2'}} variant="h6">{`Level ${calculateLevel(topThree[1]?.totalPoints)}`}</Typography>
          <Typography style ={{ fontFamily :'Font1'}} variant="h5">{`#2 ${topThree[1]?.name}`}</Typography>
          <Typography style ={{ fontFamily :'Font2'}} variant="subtitle1">{`${topThree[1]?.totalPoints} points`}</Typography>
          {/*<button className={classes.viewProfileButton} style ={{ fontFamily :'Font2'}} color="primary" onClick={() => openProfileModal(topThree[1]?.name)}>View Profile</button> */}


      </div>

      {/* 1st Place User */}
      <div style={{...podiumStyles.user, ...podiumStyles.firstPlace}}>
          <img src={getFlagURL(topThree[0]?.country.toLowerCase())} alt={topThree[0]?.country} style={podiumStyles.flag} />
          <div style={{...podiumStyles.goldBorder, width: podiumStyles.firstPlace.imgSize, height: podiumStyles.firstPlace.imgSize}}>
            <img src={topThree[0]?.avatar_url} alt={topThree[0]?.name} style={podiumStyles.avatar}/>
          </div>
          <img 
              src={getRankURL(calculateLevel(topThree[0]?.totalPoints))} 
              alt={`Level ${calculateLevel(topThree[0]?.totalPoints)}`} 
              style={podiumStyles.levelBadge}
            />
          <Typography style ={{ fontFamily :'Font2'}} variant="h6">{`Level ${calculateLevel(topThree[0]?.totalPoints)}`}</Typography>
          <Typography style ={{ fontFamily :'Font1'}} variant="h5">{`#1 ${topThree[0]?.name}`}</Typography>
          <Typography style ={{ fontFamily :'Font2'}} variant="subtitle1">{`${topThree[0]?.totalPoints} points`}</Typography>
         {/* <button className={classes.viewProfileButton} style ={{ fontFamily :'Font2'}} color="primary" onClick={() => openProfileModal(topThree[0]?.name)}>View Profile</button> */}

      </div>




      {/* 3rd Place User */}
      <div style={{...podiumStyles.user, ...podiumStyles.thirdPlace}}>
          <img src={getFlagURL(topThree[2]?.country.toLowerCase())} alt={topThree[2]?.country} style={podiumStyles.flag} />
          <div style={{...podiumStyles.bronzeBorder, width: podiumStyles.thirdPlace.imgSize, height: podiumStyles.thirdPlace.imgSize}}>
            <img src={topThree[2]?.avatar_url} alt={topThree[2]?.name} style={podiumStyles.avatar} />
          </div>
          <img 
              src={getRankURL(calculateLevel(topThree[2]?.totalPoints))} 
              alt={`Level ${calculateLevel(topThree[2]?.totalPoints)}`} 
              style={podiumStyles.levelBadge}
            />
          <Typography style ={{ fontFamily :'Font2'}} variant="h6">{`Level ${calculateLevel(topThree[2]?.totalPoints)}`}</Typography>
          <Typography style ={{ fontFamily :'Font1'}} variant="h5">{`#3 ${topThree[2]?.name}`}</Typography>
          <Typography style ={{ fontFamily :'Font2'}} variant="subtitle1">{`${topThree[2]?.totalPoints} points`}</Typography>
          {/*<button className={classes.viewProfileButton} style ={{ fontFamily :'Font2'}} color="primary" onClick={() => openProfileModal(topThree[2]?.name)}>View Profile</button>*/}
          
      </div>

    </div>

      {/* Rest of Users in a Table */}
      <Table>
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell>Country</TableCell>
        <TableCell>Level</TableCell>

        <TableCell >Points</TableCell>
        <TableCell ></TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {restOfUsers.map((user, index) => {
        const rank = index + 4;
        const activity = user.activities?.[0]?.type || "No activities";

        return (
          <TableRow key={index}>

          {/* Name Column */}
          <TableCell>
            <div style={{ display: 'flex', alignItems: 'center' }}>

            <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        sx={SKIN_STYLES} 
                        style={{ 
                        backgroundImage: `url(${getCurrentSkinUrl(user)})`, 
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        marginRight: '10px'
                      }}
                    >
              <Avatar src={user.avatar_url} alt={user.name} sx ={{margin: '6px'}}/>
              </Box>

              <div style={{ marginLeft: '8px'  }}>
                <div style ={{ fontFamily :'Font1'}}>
                 <span>#{rank} {user.name}</span>
                </div>
                
                <div style ={{ fontFamily :'Font2'}}>{activity}</div>
              </div>
            </div>
          </TableCell>


            {/* Country Column */}
            <TableCell>
              <img src={getFlagURL(user.country.toLowerCase())} alt={user.country} width="20" height="20"/>
            </TableCell>

            {/* Level Column */}
            <TableCell>
              <img src={getRankURL(calculateLevel(user.totalPoints))} alt={`Level ${user.level}`} width="30" height="30"/>
              <div style ={{ fontFamily :'Font1'}}>
                <span>{calculateLevel(user.totalPoints)}</span> {/* assuming user.level contains the level number */}
              </div>
            </TableCell>


            {/* Points Column */}
            <TableCell style ={{ fontFamily :'Font1'}} >
              {user.totalPoints}
            </TableCell>

                        {/* Profile Column */}
                        <TableCell  className={classes.centeredCell}>
          {/*  <button className={classes.viewProfileButton} style ={{ fontFamily :'Font2'}} color="primary" onClick={() => openProfileModal(user.name)}>View Profile</button> */}

            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
</Table>
{/*<ProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)}  username={profileModalUser}/>*/}
    </Dialog>
    
  );
}

export default LeaderboardModal;