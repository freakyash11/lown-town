import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { getCurrentUserToken } from '../services/firebaseAuth';
import { matchService } from '../services/api';

const Match = () => {
  const { currentUser, logout } = useAuth();
  const { currentMatch, matchPartner, pinMatch, unpinMatch, matchLoading, matchError } = useMatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [localMatch, setLocalMatch] = useState(null);
  const [localPartner, setLocalPartner] = useState(null);
  const navigate = useNavigate();
  
  // Redirect if no match
  useEffect(() => {
    if (!matchLoading && !currentMatch && !localMatch) {
      navigate('/dashboard');
    }
  }, [currentMatch, localMatch, matchLoading, navigate]);
  
  // Load match data
  useEffect(() => {
    const loadMatchData = async () => {
      try {
        setLoading(true);
        
        // Get fresh token
        const token = await getCurrentUserToken(true);
        
        // Get current match
        const data = await matchService.getCurrentMatch();
        
        if (data && data.match && data.matchPartner) {
          setLocalMatch(data.match);
          setLocalPartner(data.matchPartner);
        } else {
          // Try to get a daily match if no current match
          try {
            const dailyData = await matchService.getDailyMatch();
            if (dailyData && dailyData.match && dailyData.matchPartner) {
              setLocalMatch(dailyData.match);
              setLocalPartner(dailyData.matchPartner);
            } else if (dailyData && dailyData.message) {
              setError(dailyData.message);
            }
          } catch (err) {
            console.error('Error getting daily match:', err);
            if (err.response?.status === 401) {
              // Token expired, redirect to login
              alert('Your session has expired. Please log in again.');
              logout();
              navigate('/login');
            } else {
              setError(err.response?.data?.message || 'Failed to get match');
            }
          }
        }
      } catch (err) {
        console.error('Error loading match data:', err);
        
        if (err.response?.status === 401) {
          // Token expired, redirect to login
          alert('Your session has expired. Please log in again.');
          logout();
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load match data');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadMatchData();
  }, [navigate, logout]);
  
  // Handle pin match
  const handlePinMatch = async () => {
    if (!localMatch) return;
    
    try {
      setLoading(true);
      setError('');
      await pinMatch(localMatch._id);
      // Success message or redirect
    } catch (err) {
      setError('Failed to pin match');
      console.error('Pin match error:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle unpin match
  const handleUnpinMatch = async () => {
    if (!localMatch) return;
    
    try {
      setLoading(true);
      setError('');
      await unpinMatch(localMatch._id, { feedback: feedbackText });
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to unpin match');
      console.error('Unpin match error:', err);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setShowFeedback(false);
    }
  };
  
  // Handle feedback change
  const handleFeedbackChange = (e) => {
    setFeedbackText(e.target.value);
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // Handle start conversation button click
  const handleStartConversation = () => {
    if (localMatch) {
      navigate(`/conversation/${localMatch._id}`);
    }
  };
  
  if (matchLoading) {
    return (
      <Container>
        <LoadingMessage>Loading match...</LoadingMessage>
      </Container>
    );
  }
  
  if (matchError) {
    return (
      <Container>
        <ErrorMessage>{matchError}</ErrorMessage>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </Container>
    );
  }
  
  if (!localMatch || !localPartner) {
    return (
      <Container>
        <ErrorMessage>No active match found</ErrorMessage>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <Title>Your Match</Title>
      </Header>
      
      <MatchCard>
        <MatchName>{localPartner.name}</MatchName>
        
        <MatchBio>{localPartner.bio || 'No bio available'}</MatchBio>
        
        {localPartner.interests && localPartner.interests.length > 0 && (
          <InterestsSection>
            <SectionTitle>Interests</SectionTitle>
            <InterestTags>
              {localPartner.interests.map((interest, index) => (
                <InterestTag key={index}>{interest}</InterestTag>
              ))}
            </InterestTags>
          </InterestsSection>
        )}
        
        <ButtonGroup>
          {localMatch.pinnedBy && localMatch.pinnedBy.includes(currentUser?._id) ? (
            <>
              <Button onClick={handleStartConversation} disabled={loading}>
                Start Conversation
              </Button>
              <SecondaryButton 
                onClick={() => setShowFeedback(true)} 
                disabled={loading}
              >
                Unmatch
              </SecondaryButton>
            </>
          ) : (
            <>
              <Button onClick={handlePinMatch} disabled={loading}>
                {loading ? 'Processing...' : 'Accept Match'}
              </Button>
              <SecondaryButton 
                onClick={() => setShowFeedback(true)} 
                disabled={loading}
              >
                Decline Match
              </SecondaryButton>
            </>
          )}
        </ButtonGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </MatchCard>
      
      {showFeedback && (
        <FeedbackModal>
          <FeedbackContent>
            <h3>Provide Feedback</h3>
            <p>Please tell us why you're declining this match:</p>
            
            <Textarea 
              value={feedbackText}
              onChange={handleFeedbackChange}
              placeholder="Your feedback helps us improve future matches..."
              rows="4"
            />
            
            <ModalButtonGroup>
              <SecondaryButton onClick={() => setShowFeedback(false)}>
                Cancel
              </SecondaryButton>
              <Button onClick={handleUnpinMatch} disabled={loading}>
                {loading ? 'Processing...' : 'Submit & Unmatch'}
              </Button>
            </ModalButtonGroup>
          </FeedbackContent>
        </FeedbackModal>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 2rem 0;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  max-width: 700px;
  margin: 0 auto 2rem;
  padding: 0 1.5rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  margin-right: 1rem;
  
  &:hover {
    color: #6c63ff;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #3a3a3a;
  margin: 0;
`;

const MatchCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
`;

const MatchName = styled.h2`
  font-size: 2rem;
  color: #3a3a3a;
  margin-top: 0;
  margin-bottom: 1rem;
`;

const MatchBio = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const InterestsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: #3a3a3a;
  margin-bottom: 0.75rem;
`;

const InterestTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const InterestTag = styled.span`
  background-color: #f0eeff;
  color: #6c63ff;
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Button = styled.button`
  flex: 1;
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
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

const SecondaryButton = styled.button`
  flex: 1;
  background-color: white;
  color: #6c63ff;
  border: 1px solid #6c63ff;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:disabled {
    color: #a8a8a8;
    border-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 1.5rem 0;
  text-align: center;
  max-width: 700px;
  margin: 1rem auto;
`;

const FeedbackModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const FeedbackContent = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  
  h3 {
    margin-top: 0;
    color: #3a3a3a;
  }
  
  p {
    color: #666;
    margin-bottom: 1.5rem;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  margin-bottom: 1.5rem;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

const ModalButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

export default Match; 