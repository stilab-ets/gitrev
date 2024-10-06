import React, { useEffect, useState } from 'react';
import { Dialog, AppBar, Toolbar, IconButton, Typography, Slide, Button, Grid, Box, Avatar } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import styled from 'styled-components';


const SKIN_STYLES = {
  borderRadius: '10%',
  position: 'relative' as 'relative',
  overflow: 'hidden',
  boxShadow: '4px 4px 12px 4px rgba(0,0,0,0.45)',  // You can adjust this
};

//const API_base = "https://myserver.gitreviewgame.com";
//const API_base = "http://localhost:3002";
const API_base = process.env.NODEJS_SERVER;

const appBarStyles = {
  position: 'relative',
  backgroundImage: 'url(https://i.pinimg.com/originals/c1/09/f8/c109f881992bf2ecc2faad720a31be3f.gif)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
};

const SkinContainer = styled.div`
  display: flex;
  flex-direction: row; 
  align-items: center; // Center items vertically
  justify-content: center; // Center items horizontally
  margin: 1rem;
  height: 170px; // Adjust based on your requirements.
`;

const SkinImage = styled.div<{ img: string }>`
  width: 200px;
  height: 150px;
  border-radius: 12px;
  background-image: url(${props => props.img});
  background-size: cover;
  background-position: center;
  margin-right: 1rem;  
  box-shadow: 4px 4px 12px 4px rgba(0,0,0,0.45);
`;

const SkinDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 300px; // Fixed width
  word-wrap: break-word; // breaking long words
  height: 150px;  // Match the height of the SkinImage
  justify-content: center;  // Vertically center the content
`;




const Transition = React.forwardRef<unknown, TransitionProps & { children?: React.ReactElement<any, any> }>(
  (props, ref) => <Slide direction="up" ref={ref} {...props}>{props.children}</Slide>
);

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

function calculateLevel(points) {
  return Math.floor(Math.log2(points) + 1);
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


interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // You can replace this with your specific User type if you have it defined elsewhere
}

function ShopModal({ isOpen, onClose, user }: ShopModalProps) {

const [userPointsData, setUserPointsData] = useState<any | null>(null);
const [selectedSkin, setSelectedSkin] = useState<string>(user.currentSkin || '');
const [currentUser, setCurrentUser] = useState<string | null>(null);



// This effect runs when the component mounts to fetch the username from local storage
useEffect(() => {
  chrome.storage.local.get('githubUsername', function(data) {
      const fetchedUsername = data.githubUsername;
      setCurrentUser(fetchedUsername); // Set the username to state
  });
}, []); // Empty dependency array means this effect will run once when the component mounts





useEffect(() => {
  async function fetchData() {
    try {
        await getUserPointsData(currentUser);  // <--- Use the prop here
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }
  fetchData();
}, [currentUser]);

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



  const purchaseSkin = async (skin) => {
    const cost = SKINS[skin].cost;

    // Assuming you'll have the user's name in the passed user prop
    const userName = user.name;

    try {
      const response = await fetch(`${API_base}/purchaseSkin?skin=${skin}&cost=${cost}&userName=${userName}`);
      const data = await response.json();

      if (data.success) {
        // Handle state updates
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('There was an error purchasing the skin!', error);
    }
  };




  const updateUserSkin = async (skin , username) => {
    const response = await fetch(`${API_base}/user/updateSkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userName: username,
        skin: skin
      })

    });
  //console.log("skin name is " + skin);
    const data = await response.json();
  
    if (data.success) {
      console.log('Skin updated successfully in the database');
    } else {
      console.error('Error updating skin:', data.message);
    }
  };



  const selectSkin = (skin: string) => {
    //console.log(`Selected skin: ${skin}`);
    setSelectedSkin(skin);  // Update the selected skin

    // Call the API to update the user's skin in the database
    updateUserSkin(skin , currentUser);  
    
  };


    // Assuming a function to get the URL of the current skin
    const getCurrentSkinUrl = () => {
      // Replace this logic with how you determine the current skin for the user
      return SKINS[selectedSkin]?.img || '';
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Shop
          </Typography>
        </Toolbar>
      </AppBar>
          
      <Grid container>
        {/* Profile Info (Left Section - 30%) */}
        <Grid item md={3} xs={3} style={{ 
                position: 'fixed', 
                width: '30%', 
                height: '100%', 
                top: 0, 
                left: 0, 
                background: 'white'
            }}>
                <Box 
                    display="flex" 
                    flexDirection="column" 
                    alignItems="center" 
                    justifyContent="center" 
                    height="100%"
                >
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
                    <Typography variant="h5" mt={2}>
                        {userPointsData?.name}
                    </Typography>
                    <Typography mt={1}>
                        {getBadge(calculateLevel(userPointsData?.totalPoints))}, Level {calculateLevel(userPointsData?.totalPoints)}
                    </Typography>
                </Box>
            </Grid>



        {/* Shop Items (Right Section - 70%) */}
        <Grid item md={9} xs={9} style={{ marginLeft: '30%' }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            {Object.keys(SKINS).map(skinKey => {
              const skin = SKINS[skinKey];
              const isOwned = user.skinsBought.includes(skinKey);
              return (
                <SkinContainer key={skinKey}>
                  <SkinImage img={skin.img} />
                  <SkinDescriptionContainer>
                    <Typography style ={{ fontFamily :'Font1'}} variant="body1">{skinKey}</Typography>
                    <Typography style ={{ fontFamily :'Font2'}} variant="body2">{skin.description}</Typography>
                    <Button 
                      onClick={(event) => {
                          event.stopPropagation();
                          isOwned ? selectSkin(skinKey) : purchaseSkin(skinKey);
                          console.log("skin key is " + skinKey);
                      }}
                      style ={{ fontFamily :'Font2'}}
                    >
                      {isOwned ? 'Use Skin' : `Buy: ${skin.cost} coins`}
                    </Button>
                  </SkinDescriptionContainer>
                </SkinContainer>
              );
            })}
          </Box>
        </Grid>

      </Grid>
    </Dialog>
  );
}

export default ShopModal;