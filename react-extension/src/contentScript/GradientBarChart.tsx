import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import  Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import '../assets/fonts.css';

const ChartWrapper = styled.div`
  background: white;
  border-radius: 20px;
  width: 32rem;
  overflow: hidden;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.12);
  margin-bottom: 1rem;
`;

const ChartContainer = styled.div`
  background: linear-gradient(310deg, rgb(20, 23, 39), rgb(58, 65, 111));
  border-radius: 20px 20px 0 0;
  width: 90%;  // This reduces the width to 90% of its parent, you can adjust as needed
  height: 50%;
  margin: 0 auto;  // This centers the chart container
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.12);
`;



const Title = styled(Typography)`
    color: #333333; // changed to darkgrey
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
`;

const Subtitle = styled(Typography)`
    color: #2a2a2a; // changed to darkgrey
    font-size: 1rem;
    margin-bottom: 1rem;
`;



const ChartContent = styled.div`
  height: 300px;
`;



const StatsContainer = styled.div`
  background: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50%;
  flex-wrap: wrap;  // Wrap items if there's not enough space
  margin-bottom: 1rem;  // Add some margin at the bottom
  margin-top: 1rem;  // Add some margin at the top

`;


const StatItem = styled.div`
  display: flex;
  flex-direction: column;  // This will stack the content vertically
  align-items: center;
  font-size: 0.8rem;
  flex: 1;  
  justify-content: center; 
  max-width: 20%;  
  text-align: center; 
  padding: 0.5rem;  // Add some padding
`;



const IconWrapper = styled.div`
  margin-right: 0.5rem;
  width: 24px;
  height: 24px;
`;


const GradientContainer = styled.div`
    width: 40px;  
    height: 40px;  
    background: linear-gradient(45deg, var(--gradient-start, #FE6B8B) 30%, var(--gradient-end, #FF8E53) 90%);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 5px;  // Provide margin only at the bottom
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.25); // Image's shadow
`;


const GradientContainer1 = styled(GradientContainer)`
  background: linear-gradient(45deg, #6a0572, #ab68ca);
`;

const GradientContainer2 = styled(GradientContainer)`
  background: linear-gradient(45deg, #0062cc, #57a7ff);
`;

const GradientContainer3 = styled(GradientContainer)`
  background: linear-gradient(45deg, #0f4c5c, #79d2e6);
`;

const GradientContainer4 = styled(GradientContainer)`
  background: linear-gradient(45deg, #b42b2d, #ff6b6d);
`;

const GradientContainer5 = styled(GradientContainer)`
  background: linear-gradient(45deg, #128c7e, #70ef7f);
`;




const IconImage = styled.img`
    width: 25px;  
    height: 25px;
    filter: invert(1) brightness(2);
`;


const IconImageRectangular = styled.img`
    width: 32px;  
    height: 16px;
    filter: invert(1) brightness(2);
`;

const StatText = styled.div`
    height: 40px;  // Adjust based on your requirements.
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: 'Font2';
    margin-top: 5px;  // Provide margin only at the top
`;





type CustomTooltipProps = {
    active?: boolean;
    payload?: any[];  // Ideally, you'd want to define a more detailed type here than just 'any'
    label?: string;
  };

  
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: 'white', padding: '5px', borderRadius: '5px' }}>
          <p className="label">{`${label}`}</p>
          <p className="desc">{`${payload[0].value} Points`}</p>
        </div>
      );
    }
  
    return null;
  };
  
  

const GradientBarChart = ({ user }) => {
    const [chartData, setChartData] = useState([]);
    const [percentageChange, setPercentageChange] = useState<number | null>(null);



  
    useEffect(() => {
      if (!user || !user.comments) return;
  
      const aggregatedData = aggregateScores(user.comments);
      const labels = Object.keys(aggregatedData);
      const data = Object.values(aggregatedData).map((value, index) => ({
        name: labels[index],
        uv: value,
      }));
  
      setChartData(data);
    }, [user]);

    useEffect(() => {
        if (chartData.length >= 2) {
            const oldVal = chartData[chartData.length - 2].uv;
            const newVal = chartData[chartData.length - 1].uv;
            const change = ((newVal - oldVal) / oldVal) * 100;
            setPercentageChange(change);
        }
    }, [chartData]);

  const aggregateScores = (comments) => {
    if (!comments.length) return [];

    comments.sort((a, b) => +new Date(a.comment_day) - +new Date(b.comment_day));


    const startDate = new Date(comments[0].comment_day);
    const endDate = new Date(comments[comments.length - 1].comment_day);
    let intervalType;
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());

    if (diffMonths <= 12) intervalType = 'monthly';
    else if (diffMonths <= 24) intervalType = 'quarterly';
    else intervalType = 'yearly';

    const buckets = {};

    for (let comment of comments) {
      let bucketLabel;
      const commentDate = new Date(comment.comment_day);

      switch (intervalType) {
        case 'monthly':
          bucketLabel = `${commentDate.getFullYear()}-${String(commentDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'quarterly':
          const quarter = Math.ceil((commentDate.getMonth() + 1) / 3);
          bucketLabel = `${commentDate.getFullYear()}-Q${quarter}`;
          break;
        case 'yearly':
          bucketLabel = `${commentDate.getFullYear()}`;
          break;
      }

      if (!buckets[bucketLabel]) buckets[bucketLabel] = 0;
      buckets[bucketLabel] += Number(comment.score);
    }

    return buckets;
  };

  return (
    <ChartWrapper>

        <Box px={3} py={1}>
            <Title variant="h5" style={{fontFamily: 'Font2'}} >Points from Comments Over Time</Title>
            {percentageChange !== null && (
                <Subtitle variant="body1">
                    ({percentageChange >= 0 ? "+" : ""}{percentageChange.toFixed(0)}%)
                    {percentageChange >= 0 ? " increase" : " decrease"} than last period
                </Subtitle>
            )}
        </Box>
        <ChartContainer>
        <ChartContent>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={50}>
                    <XAxis
                        dataKey="name"
                        stroke="white"
                        tick={false} //fill: 'white' }}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="white"
                        tick={{ fill: 'white' }}
                        axisLine={false}
                        padding={{ top: 30 }}
                    />
                    <Tooltip content={<CustomTooltip />} />

                    <Bar
                        dataKey="uv"
                        fill="white"
                        cursor="pointer"
                        minPointSize={5}
                        barSize={10}
                        radius={[10, 10, 10, 10]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </ChartContent>
        </ChartContainer>

        <StatsContainer>
                <StatItem>
                <GradientContainer1>
                       <IconImage src="https://cdn-icons-png.flaticon.com/512/10270/10270175.png" alt="Contribution Icon"/>
                   </GradientContainer1>
                   <StatText>
                    Total Contributions:
                    </StatText>
                    <div style={{height: '10px' , fontFamily: 'Font1'}}>
                    {user.comments.length + user.issues.length + user.pullRequests.length}
                    </div>
                </StatItem>

                <StatItem>
                    <GradientContainer2>
                      <IconImage src="https://cdn-icons-png.flaticon.com/512/3193/3193015.png" alt="Comments Icon"/>
                    </GradientContainer2>
                    <StatText>
                    Total Comments:
                    </StatText>
                    <div style={{height: '10px' , fontFamily: 'Font1'}}>
                    {user.comments.length}
                    </div>
                </StatItem>

{/*
                <StatItem>
                    <GradientContainer3>
                        <IconImageRectangular src="https://static-00.iconduck.com/assets.00/git-commit-icon-512x257-oksy3ees.png" alt="Commits Icon"/>
                    </GradientContainer3>
                    <StatText>
                    Total Commits:
                    </StatText>
                    <div style={{height: '10px' , fontFamily: 'Font1'}}>
                    789
                    </div>
                </StatItem>
*/}
                <StatItem>
                <GradientContainer4>
                        <IconImage src="https://cdn.icon-icons.com/icons2/1524/PNG/512/issueclosed_106527.png" alt="Issues Icon"/>
                        </GradientContainer4>
                        <StatText>
                    Total Issues Participations:
                    </StatText>
                    <div style={{height: '10px' , fontFamily: 'Font1'}}>
                    {user.issues.length}
                    </div>
                </StatItem>
                <StatItem>
                   <GradientContainer5>
                        <IconImage src="https://static-00.iconduck.com/assets.00/git-pull-request-icon-512x512-5y2osvjs.png" alt="PRs Icon"/>
                    </GradientContainer5>
                    <StatText>
                    Total Pull Requests:
                    </StatText>
                    <div style={{height: '10px' , fontFamily: 'Font1'}}>
                    {user.pullRequests.length}
                    </div>
                </StatItem>
            </StatsContainer>
        </ChartWrapper>
);
}

export default GradientBarChart;

