import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import Card from '../components/Card';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { dailyMatch, currentMatch, loading, error, fetchDailyMatch, fetchCurrentMatch } = useMatch();
  const [apiUrl, setApiUrl] = useState('');
  
  useEffect(() => {
    // Fetch matches when component mounts
    fetchDailyMatch();
    fetchCurrentMatch();
    
    // Set API URL for debugging
    setApiUrl(process.env.REACT_APP_API_URL || 'https://lown-town-dwky.vercel.app/api');
  }, [fetchDailyMatch, fetchCurrentMatch]);

  // Show loading state
  if (loading) {
    return (
      <Container>
        <LoadingSpinner />
      </Container>
    );
  }

  return (
    <Container>
      {/* Debug info */}
      <DebugInfo>
        <h3>Debug Information</h3>
        <p>API URL: {apiUrl}</p>
        <p>User authenticated: {currentUser ? 'Yes' : 'No'}</p>
        {currentUser && (
          <>
            <p>User ID: {currentUser._id}</p>
            <p>User email: {currentUser.email}</p>
          </>
        )}
      </DebugInfo>
      
      <Title>Dashboard</Title>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      <Section>
        <SectionTitle>Today's Match</SectionTitle>
        {dailyMatch ? (
          <Card
            name={dailyMatch.name}
            bio={dailyMatch.bio}
            interests={dailyMatch.interests}
            matchScore={dailyMatch.compatibilityScore}
            actionLabel="View Profile"
            actionLink={`/match/${dailyMatch._id}`}
          />
        ) : (
          <NoMatchCard>
            <h3>No Match Today</h3>
            <p>Check back tomorrow for your new match!</p>
          </NoMatchCard>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Current Conversation</SectionTitle>
        {currentMatch ? (
          <Card
            name={currentMatch.name}
            bio={currentMatch.bio}
            interests={currentMatch.interests}
            matchScore={currentMatch.compatibilityScore}
            actionLabel="Continue Conversation"
            actionLink={`/conversation/${currentMatch._id}`}
          />
        ) : (
          <NoMatchCard>
            <h3>No Active Conversation</h3>
            <p>Pin today's match to start a conversation!</p>
          </NoMatchCard>
        )}
      </Section>
      
      <Section>
        <SectionTitle>Your Profile</SectionTitle>
        <ProfileCard>
          <h3>{currentUser?.name || 'Your Name'}</h3>
          <p>{currentUser?.bio || 'Your bio will appear here.'}</p>
          <Button as={Link} to="/profile">Edit Profile</Button>
        </ProfileCard>
      </Section>
      
      <Section>
        <SectionTitle>Match History</SectionTitle>
        <Button as={Link} to="/history" variant="secondary">View Past Matches</Button>
      </Section>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  color: #555;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const NoMatchCard = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h3 {
    margin-top: 0;
    color: #666;
  }
  
  p {
    color: #888;
  }
`;

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  h3 {
    margin-top: 0;
    color: #333;
  }
  
  p {
    color: #666;
    margin-bottom: 1.5rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
`;

const DebugInfo = styled.div`
  background-color: #f0f8ff;
  border: 1px solid #add8e6;
  padding: 1rem;
  margin-bottom: 2rem;
  border-radius: 4px;
  
  h3 {
    margin-top: 0;
    color: #333;
  }
  
  p {
    margin: 0.5rem 0;
    font-family: monospace;
  }
`;

export default Dashboard; 