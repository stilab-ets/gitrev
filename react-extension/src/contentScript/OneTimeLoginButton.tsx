import React from 'react';
import GitHubIcon from "@mui/icons-material/GitHub";

const API_base = process.env.NODEJS_SERVER;
//const API_base = "https://myserver.gitreviewgame.com"
//const API_base2 = "http://localhost:3002"

function OneTimeLoginButton() {

    const buttonStyle: React.CSSProperties = {
        background: 'linear-gradient(45deg, #cb0c9f, #ad0a87)',
        border: 'none',
        borderRadius: '30px',
        padding: '6px 20px', // Adjusted padding here
        color: 'white',
        fontWeight: 600,
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 3px 5px rgba(0, 0, 0, 0.2)'
    };

    const buttonHoverStyle: React.CSSProperties = {
        ...buttonStyle,
        transform: 'translateY(-3px)',
        boxShadow: '0 5px 7px rgba(0, 0, 0, 0.3)'
    };

    const buttonFocusStyle: React.CSSProperties = {
        ...buttonStyle,
        boxShadow: '0 5px 7px rgba(0, 0, 0, 0.5)'
    };

    const [isHovered, setIsHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    return (
        <button 
            style={isFocused ? buttonFocusStyle : (isHovered ? buttonHoverStyle : buttonStyle)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={() => window.open(API_base+"/login", '_blank')}
        >
            <GitHubIcon style={{ fontSize: '1.2rem' }} />
            One time login
        </button>
    );
}

export default OneTimeLoginButton;
