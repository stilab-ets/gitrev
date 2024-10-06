import ReactDOM from "react-dom";
import React, { useState , useEffect} from "react";
import {createRoot} from "react-dom/client";
import ContentScript from "./contentScript";
import RowsContent from './rowContent';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import FriendsModal from './FriendsModal'; 
import FloatingButtonWithModal from "./FloatingButtonWithModal";
import OneTimeLoginButton from "./OneTimeLoginButton";

import "../assets/fonts.css"


//import FloatingLoginButton from './FloatingLoginButton';


/*
let isLoggedIn = false;

function showLoginButton() {
    const loginButtonContainer = document.createElement("div");
    document.body.appendChild(loginButtonContainer);
    
    ReactDOM.render(<FloatingLoginButton onClick={startLoginProcess} />, loginButtonContainer);
}

function startLoginProcess() {
    // Trigger the authentication process
    chrome.runtime.sendMessage({ action: 'authenticate' }, (response) => {
        if (response.error) {
            console.error(response.error);
            return;
        }
        
        const code = response.code;

        fetch('YOUR_SERVER_URL/callback?code=' + code)
        .then(res => res.json())
        .then(data => {
            const accessToken = data.access_token;
            chrome.storage.local.set({ githubToken: accessToken }, () => {
                // After storing the token, consider the user as logged in
                isLoggedIn = true;
                injectYourContent();
                injectContent();
                
                // Remove the login button
                const loginButtonContainer = document.querySelector('div > FloatingLoginButton');
                if (loginButtonContainer) {
                    loginButtonContainer.remove();
                }
            });
        })
        .catch(err => console.error(err));
    });
}


// Initially check if user is logged in
chrome.storage.local.get('githubToken', function(data) {
    const token = data.githubToken;
    if (token) {
        isLoggedIn = true;
        injectYourContent();
        injectContent();
    } else {
        showLoginButton();
    }
});



*/
//const API_base = "https://myserver.gitreviewgame.com/";
const API_base = process.env.NODEJS_SERVER;





function MyExtensionApp({ username }: { username: string }) {
    const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);
    const [userData, setUserData] = useState<any>(null);



    

    useEffect(() => {
        fetchUserData(username).then(data => {
            if (data) {
                setUserData(data);
                if (data.firstLogin === false) {
                    setShowFirstLoginModal(true);
                }
            }
        });
    }, [username]);

    // Close the modal and update user's firstLogin to true
    const handleCloseModal = async () => {
        setShowFirstLoginModal(false);
        // Calling your API here to update firstLogin attribute for the user to true
        try {
            const response = await fetch(`${API_base}/user/updateFirstLogin/${username}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstLogin: true }) // or whatever your API expects
            });
            const data = await response.json();
            if (data.success) {
                console.log('Updated firstLogin attribute successfully');
            } else {
                console.error('Failed to update firstLogin attribute');
            }
        } catch (error) {
            console.error('Error updating firstLogin attribute:', error);
        }
    };
    

    return (
        <>
            {showFirstLoginModal && <FirstLoginModal onClose={handleCloseModal} />}
            {userData ? <ContentScript username={username} /> : <OneTimeLoginButton />}
        </>
    );
}


function FirstLoginModal({ onClose }: { onClose: () => void }) {
    const [currentPage, setCurrentPage] = useState(1);
    
    const handleNextPage = () => {
        if (currentPage < 4) {
            setCurrentPage(prevPage => prevPage + 1);
        } else {
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
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
                Welcome to GitRev Game!
            </div>
            
            <div style={{ width: '100%', flex: 1 }}>
                {currentPage === 1 && 
                    <>
                       <img src="https://gitreviewgame.com/static/media/top-menu.8be17c47184eaec1d079.png" alt="Page 1" style={{ width: '100%', borderRadius: '5px', marginBottom: '10px' }} />
                        <div style={{ color: 'white', fontWeight: 'bold', marginTop: '10px', fontFamily: 'Font2' }}>
                            <div style={{ marginBottom: '16px' }}>From Left to Right, these are :</div>
                            <div style={{ marginBottom: '12px' }}>- The Shop Menu</div>
                            <div style={{ marginBottom: '12px' }}>- The leaderBoards Page</div>
                            <div style={{ marginBottom: '12px' }}>- Your Profile Page</div>
                            <div style={{ marginBottom: '12px' }}>- Your Daily streak</div>
                            <div style={{ marginBottom: '12px' }}>- Your Total Coins</div>
                            <div style={{ marginBottom: '12px' }}>- Your User Experience and next level Experience</div>
                            <div style={{
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'flex-end',
                                width: '100%', 
                                height: '100%',  // Ensures the container takes up the full height of its parent
                                position: 'relative'  // Makes sure that the div is a positioning context for its children
                            }}>
                                <div style={{ marginRight: '10px' }}>- Your Friends & Friend Requests</div>
                                <img src="data:image/png;base64,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"  alt="friends-button" style={{ width: '30%', borderRadius: '5px' }} />
                            </div>
      
                        </div>
                    </>
                }
                {currentPage === 2 && 
                    <>
                        <img src="https://gitreviewgame.com/static/media/extension-profile.7f330bff0acb9254aa9e.png" alt="Page 1" style={{ width: '100%', borderRadius: '5px' }} />
                        <div style={{ color: 'white', fontWeight: 'bold', marginTop: '10px', fontFamily: 'Font2' }}>
                            
                            
                            <div style={{ marginBottom: '16px' }}>In your profile page you get to see : </div>
                            <div style={{ marginBottom: '12px' }}>- Your current Level</div>
                            <div style={{ marginBottom: '12px' }}>- Performance from comments usefulness by time</div>
                            <div style={{ marginBottom: '12px' }}>- Your achievements</div>
                            
                            </div>
                    </>
                }
                {currentPage === 3 && 
                    <>
                        <img src="https://gitreviewgame.com/static/media/extension-leaderboards.993d69cfcd3771467b1d.png" alt="Page 1" style={{ width: '100%', borderRadius: '5px' }} />
                        <div style={{ color: 'white', fontWeight: 'bold', marginTop: '10px', fontFamily: 'Font2' }}>
                            
                            <div style={{ marginBottom: '16px' }}>In your Leaderboards page you get to see : </div>
                            <div style={{ marginBottom: '12px' }}>- ALLtime Top 3 Players of GitRev </div>
                            <div style={{ marginBottom: '12px' }}>- Rest of players ranked table</div>
                            <div style={{ marginBottom: '12px' }}>- You can view other players profiles in the leaderboards page</div>
                            
                        </div>
                    </>
                }
                {currentPage === 4 && 
                    <>
                        <img src="https://gitreviewgame.com/static/media/extension-shop.7625e9c21b46cb7daad2.png" alt="Page 1" style={{ width: '100%', borderRadius: '5px' }} />
                        <div style={{ color: 'white', fontWeight: 'bold', marginTop: '10px', fontFamily: 'Font2' }}>
                            
                            <div style={{ marginBottom: '16px' }}>In your Shop page you get to : </div>
                            <div style={{ marginBottom: '12px' }}>- Buy skins using earned Coins </div>
                            <div style={{ marginBottom: '12px' }}>- Unlock skins based on tasks</div>
                            <div style={{ marginBottom: '12px' }}>- Change your current Skin to one of the owned skins</div>
                            
                        </div>
                    </>
                }
                {/* Repeat for other pages... */}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <button 
                    onClick={currentPage < 4 ? handleNextPage : onClose} 
                    style={{
                        background: 'linear-gradient(135deg, #0F121B 0%, #151828 50%, #151828 100%)',
                        border: '2px solid white',
                        borderRadius: '5px',
                        color: 'white',
                        padding: '8px 16px',
                        fontSize: '16px',
                        transition: 'background 0.3s',
                        fontFamily: 'Font2',
                        cursor: 'pointer'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#0F121B'; // Dark blueish color
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #0F121B 0%, #151828 50%, #151828 100%)';
                        e.currentTarget.style.color = 'white';
                    }}
                >
                    {currentPage < 4 ? 'Next' : 'Finish'}
                </button>
            </div>
        </div>
    );
}




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


function getGitHubUsernameFromMeta() {
    const metaTag = document.querySelector('meta[name="user-login"]');
    return metaTag ? metaTag.getAttribute('content') : null;
}


const username = getGitHubUsernameFromMeta();
if (username) {
    chrome.storage.local.set({ githubUsername: username });
}






function injectYourContent() {
    //if (!isLoggedIn) return;
    // Check if your content is already injected
    if (document.querySelector("#myExtensionContainer")) {
        return; // It's already there, don't inject again
    }
    
    init(); // Call your init function if the content isn't already present

    
    // Check if the floating button already exists
// After your init function, you can add the floating button:
if (!document.querySelector("#floatingFriendButton")) {
    const floatingBtn = document.createElement("div");
    floatingBtn.id = "floatingFriendButton";
    document.body.appendChild(floatingBtn);
    
    ReactDOM.render(<FloatingButtonWithModal />, floatingBtn);
}

}

function injectContent() {
    const issueRows = document.querySelectorAll('.js-issue-row');
    
    issueRows.forEach((issueRow) => {
        const dataId = issueRow.getAttribute('data-id');
        //console.log("chosen data id : ",dataId);
        
        // Check if the content has already been injected to avoid duplicates
        if (!issueRow.querySelector('.custom-injected-content')) {
            const contentDiv = document.createElement('div');
            contentDiv.className = 'custom-injected-content';
            
            issueRow.appendChild(contentDiv);
            
            const root = createRoot(contentDiv);

            root.render(<RowsContent dataId={dataId} />);
        }
    });
}





// Use MutationObserver to check for changes in the list of issues
const observer = new MutationObserver((mutationsList) => {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            injectContent();
        }
    }
    injectYourContent(); // Ensure your initial content is also injected when changes occur
});




let observerRetryCount = 0;
const maxObserverRetry = 10;  // or any suitable number

function setupObserver() {
    if (observerRetryCount >= maxObserverRetry) {
        console.error("Max retries reached for setting up MutationObserver");
        return;
    }

    document.addEventListener('DOMContentLoaded', function() {
        const targetNode = document.querySelector('.sr-only');
    
        if (targetNode) {
            observer.observe(targetNode, { childList: true, subtree: true });
        } else {
            console.error("Target node not found for MutationObserver");
        }
    });
}



function init() {
   
    const appContainer = document.createElement("div");
    appContainer.id = "myExtensionContainer";

    if (!appContainer) {
        console.error("Could not create app container");
        return;
    }

    const parentElement = document.querySelector('.AppHeader-globalBar-end');
    if (!parentElement) {
        console.error("Parent element not found");
        // Use a delay to re-attempt the initialization
        setTimeout(init, 1000);
        return;
    }
    const appHeaderUser = parentElement.querySelector('.AppHeader-user');
    if (!appHeaderUser) {
        console.error("App header user element not found");
        return;
    }

    parentElement.insertBefore(appContainer, appHeaderUser);
    
    // Fetch user data to determine if they're in the database
    fetchUserData(username).then(userData => {
        const root = createRoot(appContainer);
        root.render(<MyExtensionApp username={username} />);
    });
}



setupObserver();
    injectYourContent();
    injectContent();

document.addEventListener('pjax:end', function() {
    injectYourContent();
    injectContent();
});
