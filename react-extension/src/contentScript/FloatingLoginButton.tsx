// FloatingLoginButton.tsx
import React from 'react';
import Fab from '@mui/material/Fab';
import LoginIcon from '@mui/icons-material/Login'; // or any other appropriate icon

function FloatingLoginButton({ onClick }) {
    return (
        <Fab color="primary" onClick={onClick} style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
            <LoginIcon />
        </Fab>
    );
}

export default FloatingLoginButton;
