import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { userService } from '../services/api';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const { currentMatch, matchPartner, getDailyMatch, matchLoading, matchError } = useMatch();
  const [userState, setUserState] = useState(null);
  const [stateLoading, setStateLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const navigate = useNavigate();
  
  // Load user state on mount
  useEffect(() => {
    const loadUserState = async () => {
      try {
        setStateLoading(true);
        const { data } = await userService.getUserState();
        setUserState(data.userState);
        
        // Calculate time remaining if user is frozen
        if (data.userState === 'frozen' && data.stateTimestamps?.frozenUntil) {
          const frozenUntil = new Date(data.stateTimestamps.frozenUntil);
          const now = new Date();
          const diffHours = Math.ceil((frozenUntil - now) / (1000 * 60 * 60));
          setTimeRemaining(diffHours);
        }
      } catch (err) {
        console.error('Error loading user state:', err);
      } finally {
        setStateLoading(false);
      }
    };
    
    loadUserState();
  }, []);
  
  // Handle get daily match button click
  const handleGetMatch = async () => {
    try {
      console.log('Getting daily match...');
      setStateLoading(true);
      const data = await getDailyMatch();
      console.log('Daily match response:', data);
      
      if (data && data.match) {
        navigate('/match');
      } else if (data && data.message) {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error getting daily match:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else if (err.response?.status === 500) {
        // Server error
        alert('Server error occurred. Please try again later.');
      } else {
        // For other errors
        alert(`Failed to get match: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setStateLoading(false);
    }
  };
  
  // Handle view current match button click
  const handleViewMatch = () => {
    navigate('/match');
  };
  
  // Handle view conversation button click
  const handleViewConversation = () => {
    if (currentMatch) {
      navigate(`/conversation/${currentMatch._id}`);
    }
  };
  
  // Handle view profile button click
  const handleViewProfile = () => {
    navigate('/profile');
  };
  
  // Handle view history button click
  const handleViewHistory = () => {
    navigate('/history');
  };
  
  // Handle logout button click
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Determine what to show based on user state
  const renderStateContent = () => {
    if (stateLoading) {
      return <StateMessage>Loading your status...</StateMessage>;
    }
    
    if (userState === 'frozen') {
      return (
        <StateMessage>
          You're in a reflection period. You'll be able to receive a new match in {timeRemaining} hours.
        </StateMessage>
      );
    }
    
    if (currentMatch) {
      return (
        <MatchCard>
          <h3>Your Current Match</h3>
          {matchPartner && (
            <>
              <MatchName>{matchPartner.name}</MatchName>
              <MatchBio>{matchPartner.bio || 'No bio available'}</MatchBio>
              <ButtonGroup>
                <Button onClick={handleViewMatch}>View Match</Button>
                <Button onClick={handleViewConversation}>Open Conversation</Button>
              </ButtonGroup>
            </>
          )}
        </MatchCard>
      );
    }
    
    return (
      <NoMatchCard>
        <h3>No Active Match</h3>
        <p>Ready to discover your mindful match for today?</p>
        <Button onClick={handleGetMatch} disabled={userState !== 'available'}>
          {userState === 'available' ? 'Get Today\'s Match' : 'Not Available Yet'}
        </Button>
      </NoMatchCard>
    );
  };
  
  return (
    <Container>
      <Header>
        <Logo>Lone Town</Logo>
        <Nav>
          <NavButton onClick={handleViewProfile}>Profile</NavButton>
          <NavButton onClick={handleViewHistory}>Match History</NavButton>
          <NavButton onClick={handleLogout}>Logout</NavButton>
        </Nav>
      </Header>
      
      <Main>
        <WelcomeSection>
          <h2>Welcome, {currentUser?.name}</h2>
          <p>
            Lone Town helps you find meaningful connections through mindful dating.
            Each day brings the opportunity for one carefully chosen match.
          </p>
        </WelcomeSection>
        
        {renderStateContent()}
        
        <InfoSection>
          <h3>How Lone Town Works</h3>
          <InfoGrid>
            <InfoCard>
              <h4>One Match Daily</h4>
              <p>We provide just one carefully chosen match per day based on deep compatibility.</p>
            </InfoCard>
            <InfoCard>
              <h4>Exclusive Connection</h4>
              <p>Once matched, you're exclusively connected - no parallel dating.</p>
            </InfoCard>
            <InfoCard>
              <h4>Intentional Decisions</h4>
              <p>Each match is "pinned" by default, forcing thoughtful engagement.</p>
            </InfoCard>
            <InfoCard>
              <h4>Milestone Unlocks</h4>
              <p>After 100 messages in 48 hours, video calling becomes available.</p>
            </InfoCard>
          </InfoGrid>
        </InfoSection>
      </Main>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  color: #6c63ff;
  margin: 0;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: #3a3a3a;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #6c63ff;
  }
`;

const Main = styled.main`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

const WelcomeSection = styled.section`
  margin-bottom: 2rem;
  
  h2 {
    color: #3a3a3a;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    line-height: 1.5;
  }
`;

const StateMessage = styled.div`
  background-color: #e8f4fd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1.1rem;
  color: #0277bd;
`;

const MatchCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  
  h3 {
    color: #3a3a3a;
    margin-top: 0;
    margin-bottom: 1rem;
  }
`;

const NoMatchCard = styled(MatchCard)`
  text-align: center;
  
  p {
    margin-bottom: 1.5rem;
  }
`;

const MatchName = styled.h4`
  font-size: 1.4rem;
  margin-bottom: 0.5rem;
`;

const MatchBio = styled.p`
  color: #666;
  margin-bottom: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button`
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #5a52d5;
  }
  
  &:disabled {
    background-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

const InfoSection = styled.section`
  h3 {
    color: #3a3a3a;
    margin-bottom: 1.5rem;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
`;

const InfoCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  
  h4 {
    color: #6c63ff;
    margin-top: 0;
    margin-bottom: 0.75rem;
  }
  
  p {
    color: #666;
    margin: 0;
    line-height: 1.5;
  }
`;

export default Dashboard; 