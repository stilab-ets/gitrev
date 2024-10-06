import React, { useState, useEffect } from 'react';
import {
  Dialog, AppBar, Toolbar, IconButton, Typography,  Icon ,Card, Slide, Tabs, Tab, Box, TextField, Table, TableBody, TableRow, TableCell, Avatar, Button
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import CloseIcon from '@mui/icons-material/Close';
import { makeStyles } from '@mui/styles';
import ProfileModal from './ProfileModal';
// ... other imports if required


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


//const API_base = "https://myserver.gitreviewgame.com";
const API_base = process.env.NODEJS_SERVER;

const sendRequest = async (sender, receiver) => {
    try {
        const response = await fetch(`${API_base}/friendrequest/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sendername: sender,
                receivername: receiver,
            })
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('There was an error!', error);
    }
};




const Transition = React.forwardRef<unknown, TransitionProps & { children?: React.ReactElement<any, any> }>(
  (props, ref) => <Slide direction="up" ref={ref} {...props}>{props.children}</Slide>
);


const getBadgeURL = (level) => {
  return `https://raw.githubusercontent.com/jaykay9999/badges/main/lvl${level}.png`;
}


function calculateLevel(points) {
  return Math.floor(Math.log2(points) + 1);
}


interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const useFetchLeaderboards = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);


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

function FriendsModal({ isOpen, onClose }: FriendsModalProps) {
    const classes = useStyles();
  const [tabValue, setTabValue] = useState(0);
  const [friends, setFriends] = useState([]);
  const { users, loading } = useFetchLeaderboards();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [requests, setRequests] = useState([]);
  const [profileModalUser, setProfileModalUser] = useState<string | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [coinAmount, setCoinAmount] = useState('');

  const handleSendCoinsClick = (friendName) => {
    setSelectedFriend(friendName);
    // Optionally, you can also reset coinAmount here
    setCoinAmount('');
};

const handleSendCoins = async () => {
    if (!coinAmount || isNaN(parseInt(coinAmount , 10)) || parseInt(coinAmount , 10) <= 0) {
        alert("Please enter a valid coin amount.");
        return;
    }

    try {
        const response = await fetch(`${API_base}/sendCoins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                senderName: currentUser, // Assuming you have the current user's name
                receiverName: selectedFriend,
                amount: parseInt(coinAmount, 10)
            })
        });
        
        const data = await response.json();

        if (response.ok) {
            alert(`Successfully sent ${coinAmount} coins to ${selectedFriend}`);
            // Update any state or UI if necessary
        } else {
            alert(data.error || 'Failed to send coins');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while sending coins');
    }

    // Reset the states
    setSelectedFriend(null);
    setCoinAmount('');
};

  // This effect runs when the component mounts to fetch the username from local storage
useEffect(() => {
    chrome.storage.local.get('githubUsername', function(data) {
        const fetchedUsername = data.githubUsername;
        //console.log("local storage fetched name " , fetchedUsername);
        setCurrentUser(fetchedUsername); // Set the username to state
    });
  }, []); // Empty dependency array means this effect will run once when the component mounts


  const openProfileModal = (username: string) => {
    setProfileModalUser(username);
    setProfileModalOpen(true);
    // logic to open the profile modal
  }
  
  const handleSendRequest = (recipient) => {
    sendRequest(currentUser, recipient);
    setSentRequests(prev => [...prev, recipient]);
};


      // Helper function to remove a request from state
      const removeRequestFromState = (name: string) => {
        const updatedRequests = requests.filter(request => request.name !== name);
        setRequests(updatedRequests);
    };

    const declineRequest = async (sender: string, receiver: string) => {
      try {
          const response = await fetch(`${API_base}/friendrequest/decline`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  sendername: sender,
                  recievername: receiver,
              })
          });
  
          // Check if the content type is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await response.json();
  
              if (response.ok) {
                  removeRequestFromState(receiver);  // Remove the request from state
              } else {
                  console.error(data.message);
              }
          } else {
              // Handle non-JSON responses here
              if (response.ok) {
                  removeRequestFromState(receiver);  // Remove the request from state
              } else {
                  console.error("Error:", await response.text());
              }
          }
      } catch (error) {
          console.error('There was an error!', error);
      }
  };
  
    const acceptRequest = async (sender: string, receiver: string) => {
      try {
          const response = await fetch(`${API_base}/friendrequest/accept`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  sendername: sender,
                  recievername: receiver,
              })
          });
  
          // Check if the content type is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              const data = await response.json();
  
              if (response.ok) {
                  removeRequestFromState(receiver);
              } else {
                  console.error(data.message);
              }
          } else {
              // Handle non-JSON responses here
              if (response.ok) {
                  removeRequestFromState(receiver);
              } else {
                  console.error("Error:", await response.text());
              }
          }
      } catch (error) {
          console.error('There was an error!', error);
      }
  };
  

  const fetchUser = async (username) => {
    try {
        const response = await fetch(`${API_base}/user/name/${username}`);
        const data = await response.json();
        setFriends(data.friends);
        setRequests(data.friendsRequests);
    } catch (error) {
        console.error('There was an error!', error);
    }
}


  useEffect(() => {
    async function fetchUserData() {
    try {
        await fetchUser(currentUser);
    }
    catch (error) {
        console.error('There was an error!', error);
    }}
    fetchUserData();

}, [currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

    return (
      <Dialog 
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"  
      fullWidth      
      sx={{
        '& .MuiDialog-paper': {
          width: 400, 
          height: 600 
        }
      }}
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
            Friends
          </Typography>
        </Toolbar>
      </AppBar>

      <Tabs value={tabValue} onChange={handleTabChange} centered variant="fullWidth">
        <Tab label="Friends" />
        <Tab label="Requests & Search" />
      </Tabs>
    {/* For Friends Tab */}
    {tabValue === 0 && (
    <Box p={3}>
        {friends.length === 0 ? (
            <div style={{textAlign: 'center'}}>
                <Typography variant="h6">You currently have no friends added.</Typography>
                <Typography variant="subtitle1">Click on the "Requests & Search" tab to find and add new players!</Typography>
            </div>
        ) : (
          // Inside the map function for rendering friends
          friends.map(friend => (
            <div key={friend.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={friend.avatar_url} />
                    {friend.name}
                    <img src={getRankURL(calculateLevel(friend.totalPoints))} alt={`Level ${calculateLevel(friend.totalPoints)}`} width="50" height="52" />
                    <span>{calculateLevel(friend.totalPoints)}</span>
                </div>

                {selectedFriend === friend.name ? (
                    <>
                        <input
                            type="number"
                            value={coinAmount}
                            onChange={(e) => setCoinAmount(e.target.value)}
                            placeholder="Enter coin amount"
                        />
                        <button onClick={handleSendCoins}>Send</button>
                    </>
                ) : (
                    <button 
                        className={classes.viewProfileButton} 
                        color="primary" 
                        onClick={() => handleSendCoinsClick(friend.name)}
                    >
                        Send Coins
                    </button>
                )}
            </div>
          ))
                
        )}
    </Box>
)}

    {/* For Friend Requests & Search Tab */}
    {tabValue === 1 && (
      <Box p={3}>
        <Typography variant="h6">Received Friend Requests</Typography>
        
        {requests.length ? (
            requests.map((request) => (
                <Box key={request._id}>
                    <Card>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            flexDirection={{ xs: "column", sm: "row" }}
                            mb={2}
                            mt={2}
                            mr={2}
                            ml={2}
                        >
                            <Typography variant="button" fontWeight="medium" textTransform="capitalize">
                                {request.name}
                            </Typography>

                            <Box
                                display="flex"
                                alignItems="center"
                                mt={{ xs: 2, sm: 0 }}
                                ml={{ xs: -1.5, sm: 0 }}
                            >
                                <Box mr={1}>
                                    <Button 
                                        onClick={() => declineRequest( currentUser, request.name)} // current user declines request from person who sent the request
                                        variant="text" 
                                        color="error"
                                    >
                                        <Icon></Icon>&nbsp;Decline
                                    </Button>
                                </Box>
                                <Button 
                                    onClick={() => acceptRequest( currentUser, request.name)}  // current user accepts request from person who sent the request
                                    variant="text" 
                                    color="success"
                                >
                                    <Icon></Icon>&nbsp;Accept
                                </Button>
                            </Box>
                        </Box>
                    </Card>
                </Box>
            ))
        ) : (
            <Typography variant="subtitle1">No Friend requests yet.</Typography>
        )}


        <Typography variant="h6" mt={3}>Send Friend Request</Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          margin="normal"
        />
        {!loading && (
  <Table>
  <TableBody>
      {users.filter(user => user.name.includes(searchKeyword)).map(user => (
          <TableRow key={user.name}>
              <TableCell>
                  <Avatar src={user.avatar_url} />
                  {user.name}
              </TableCell>
              <TableCell>
                  <img src={getRankURL(calculateLevel(user.totalPoints))} alt={`Level ${user.level}`} width="50" height="52" />
                  <span>{calculateLevel(user.totalPoints)}</span>
              </TableCell>
              <TableCell>
                    {sentRequests.includes(user.name) ? (
                        <span>Request Sent</span>
                    ) : (
                        <Button 
                            color="primary"
                            variant="outlined"
                            onClick={() => handleSendRequest(user.name)}
                        >
                            Send Request
                        </Button>
                    )}
                </TableCell>
          </TableRow>
      ))}
  </TableBody>
</Table>
        )}
      </Box>
    )}
        </Dialog>
    );
}

export default FriendsModal;
