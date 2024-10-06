import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: transparent;
  padding: 1rem;
`;

const ImageWrapper = styled.div`
  width: 108px; // 4px more than Image for the border
  height: 108px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent; // Border for the gradient
  
  // Gradient border for the image
  background: linear-gradient(58deg, #cb0c9f, #ad0a87);
  padding: 3px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.25); // Image's shadow
`;

const LockWrapper = styled.div`
  width: 104px; // 4px more than Image for the border
  height: 104px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent; // Border for the gradient
  
  // Gradient border for the image
  background: linear-gradient(135deg, #0F121B 0%, #151828 50%, #151828 100%);
  padding: 3px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.25); // Image's shadow
`;

const Image = styled.img`
  width: 98px; // Reducing 2px for a better fit inside the gradient border
  height: 98px;
  border-radius: 50%;
  object-fit: cover;
`;

const Label = styled.span`
  font-weight: bold;
  margin-top: 1rem;
  text-align: center;
`;

const Title = styled.h5`
  text-align: center;
  margin-top: 1rem;
`;

const Description = styled.p`
  text-align: center;
  margin-top: 0.5rem;
`;

interface AchievementCardProps {
  image: string;
  label: string;
  title: string;
  description: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ image, label, title, description }) => {
  return (
    <Card>
      {image === 'https://gitreviewgame.com/static/media/lock.d4cbc43758163b88dc61.png' && (
        <LockWrapper>
        <Image src = {image} alt = {title} />
      </LockWrapper>
      )}
      {image !== 'https://gitreviewgame.com/static/media/lock.d4cbc43758163b88dc61.png' && (
              <ImageWrapper>
              <Image src={image} alt={title} />
            </ImageWrapper>
     ) }

      <Label>{label}  {title}</Label>
      <Description>{description}</Description>
    </Card>
  );
};

export default AchievementCard;
