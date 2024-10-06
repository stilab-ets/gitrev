// RowsContent.tsx
import React from 'react';
import { useEffect, useState } from 'react';


//const API_base = "https://myserver.gitreviewgame.com/";
const API_base = process.env.NODEJS_SERVER;

type RowsContentProps = {
  dataId: string;
};

type Difficulty = number | "processing" | "unknown";



function difficultyLevel(difficulty: Difficulty): string {


    if (typeof difficulty === "number") {
      if (difficulty >= 1 && difficulty <= 3) {
        return "low";
      } else if (difficulty >= 4 && difficulty <= 6) {
        return "Medium";
      } else if (difficulty >= 7 && difficulty <= 8) {
        return "High";
      } else if (difficulty > 8 && difficulty <= 10) {
        return "Very High";
      }
    } else if (difficulty === "processing") {
      return "processing";
    }
    if (difficulty === "unknown") {
      return "Unknown";
  }
  
  return "Unknown";  // This handles both the "unknown" and any other unhandled case
}
  
  function difficultyColor(difficulty: Difficulty): string {
    if (typeof difficulty === "number") {
      if (difficulty >= 1 && difficulty <= 3) {
        return "#4CAF50"; // Corresponds to "success"
      } else if (difficulty >= 4 && difficulty <= 6) {
        return "#FFC107"; // Corresponds to "warning"
      } else if (difficulty >= 7 && difficulty <= 8) {
        return "#F44336"; // Corresponds to "error"
      } else if (difficulty > 8 && difficulty <= 10) {
        return "#2196F3"; // Corresponds to "primary"
      }
    }
    
    if (difficulty === "unknown") {
      return "#B0BEC5";  // Some default/generic color for unknown
  }
  
  return "#F1F1F1"; 
}


function difficultyTextColor(difficulty: Difficulty): string {
  if (typeof difficulty === "number") {
    if(difficulty == 0){
      return "#000";
    }
      return "#fff";  // White text for all colors
  }
  else{
    return "#000";
  }
}



const RowsContent: React.FC<RowsContentProps> = ({ dataId}) => {


      const [difficulty, setDifficulty] = useState<Difficulty>("processing");
      const [currentUser, setCurrentUser] = useState<string | null>(null);


      // This effect runs when the component mounts to fetch the username from local storage
useEffect(() => {
  chrome.storage.local.get('githubUsername', function(data) {
      const fetchedUsername = data.githubUsername;
      setCurrentUser('jaykay99992'); // Set the username to state
  });
}, []); // Empty dependency array means this effect will run once when the component mounts

    
useEffect(() => {
  const fetchData = async () => {


      try {
          const response = await fetch(`${API_base}/user/name/${currentUser}`);
          const data = await response.json();

          // Check both arrays for the dataId
          const itemData = data.issues.find(item => item.issueId === parseInt(dataId)) || data.pullRequests.find(item => item.pullRequestId === parseInt(dataId));

          //console.log('item data found : ' , itemData);
          let itemDifficulty: Difficulty = "unknown";

          if (itemData) {
            if (typeof itemData.difficulty === "string") {
              // Try to parse the string difficulty to a number
              const parsedDifficulty = parseInt(itemData.difficulty, 10);
              
              if (!isNaN(parsedDifficulty)) {
                itemDifficulty = parsedDifficulty;
              }
          } else if (typeof itemData.difficulty === "number") {
            itemDifficulty = itemData.difficulty;
          }
      }

          setDifficulty(itemDifficulty);
      } catch (error) {
          console.error('There was an error!', error);
          setDifficulty("unknown");
      }
  };

  fetchData();
}, [dataId, currentUser]);



    const level = difficultyLevel(difficulty);
    const color = difficultyColor(difficulty);
    const textColor = difficultyTextColor(difficulty);
  
    const badgeStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '0.2em 0.5em',
        fontSize: '12px',
        fontWeight: 600,
        lineHeight: '1',
        color: textColor,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        verticalAlign: 'baseline',
        borderRadius: '5px',
        marginLeft: '10px',
        backgroundColor: color

      };
      
  
    return (
      <div style={badgeStyle}>
        {`Bounty: ${level}`}
      </div>
    );
  }
  
  export default RowsContent;
