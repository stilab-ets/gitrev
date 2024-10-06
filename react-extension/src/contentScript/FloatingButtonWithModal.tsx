import React, { useState } from 'react';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import FriendsModal from './FriendsModal';

import { makeStyles } from '@mui/styles';
import { Tooltip } from '@mui/material';

import GroupAddIcon from '@mui/icons-material/GroupAdd';

//const API_base = "https://myserver.gitreviewgame.com/";
const API_base = process.env.NODEJS_SERVER;

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    '&:hover': {
      transform: 'scale(1.2)', // Increased the scaling for a more pronounced effect
      boxShadow: '0 4px 8px 2px rgba(255, 105, 135, .4)', // Enhanced shadow for depth effect
    },
    animation: '$pulsate 1.5s infinite',
  },
  '@keyframes pulsate': {
    '0%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(1.05)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
}));

function FloatingButtonWithModal() {
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const classes = useStyles();

  const handleFriendsModalOpen = () => {
    setFriendsModalOpen(true);
  };

  const handleFriendsModalClose = () => {
    setFriendsModalOpen(false);
  };

  const login = () => {
    window.location.assign(API_base+"/login");
  }

  return (
    <>
      <Tooltip title="Add friends" placement="left">
      <Fab 
          className={classes.fab} 
          color="primary" 
          onClick={handleFriendsModalOpen}
          style={{ position: 'fixed', bottom: '16px', right: '16px' }}
      >
          <GroupAddIcon />
      </Fab>

      </Tooltip>
      <FriendsModal isOpen={friendsModalOpen} onClose={handleFriendsModalClose} />
    </>
  );
}

export default FloatingButtonWithModal;
