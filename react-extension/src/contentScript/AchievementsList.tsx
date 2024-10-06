import React from 'react';
import styled from 'styled-components';
import AchievementCard from './AchievementCard';
import  Typography from '@mui/material/Typography';
import { Box } from '@mui/material';

const AchievementsContainer = styled.div`
  margin-top: 3rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
  align-content: start;

  > * {  // Targets every direct child, i.e., every AchievementCard
    flex: 1 1 calc(50% - 1rem);  // Flex basis accounts for the gap
    max-width: calc(50% - 1rem);  // Max width accounts for the gap
  }
`;

const Title = styled(Typography)`
    color: #333333; // changed to darkgrey
    font-size: 1.5rem;
    margin-bottom: 0.5rem;

`;

const lucky7Url  = 'https://gitreviewgame.com/static/media/jackpot-slot.33f34ec5bc06a429c858.gif'
const top10Url = 'https://gitreviewgame.com/static/media/topten.72273c899710177fff72.png'
const top3Url = 'https://gitreviewgame.com/static/media/podium.7dbcc8ecb17d41642651.png'
const highInTheSky = 'data:image/jpeg;base64,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'

const defaultAchievementImage = 'https://gitreviewgame.com/static/media/lock.d4cbc43758163b88dc61.png';

interface Achievement {
  id: string;
  name: string;
  description: string;
  image?: string;  // The image is optional as we're using a default one if not provided
}

interface AchievementsListProps {
  userAchievements: Achievement[];
}

const getAchievementImage = (achievement) => {
 
    //console.log("achievement is " , achievement);
    if(achievement.owned) {
      switch(achievement.id) {
        case 1:
          return lucky7Url;
        case 2:
          return top10Url;
        case 3:
          return top3Url;
        case 4:
          return highInTheSky; // default image
    }}
    else {
      return defaultAchievementImage; // default image
    }
  
  }

const AchievementsList: React.FC<AchievementsListProps> = ({ userAchievements }) => {
  if (!userAchievements) {
    return <div>Loading...</div>;
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} >
    <Title variant="h5" style={{fontFamily: 'Font2'}} >Achievements</Title>
    <AchievementsContainer>
     
      {userAchievements.map((achievement, index) => (
        <AchievementCard
          key={index}
          image={getAchievementImage(achievement)}
          label={`#${achievement.id}`}
          title={achievement.name}
          description={achievement.description}
        />
      ))}
    </AchievementsContainer>
    </Box>
  );
};

export default AchievementsList;
