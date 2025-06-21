import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';

const Match = () => {
  const { currentUser } = useAuth();
  const { 
    currentMatch, 
    matchPartner, 
    pinMatch, 
    unpinMatch, 
    matchLoading, 
    matchError 
  } = useMatch();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({
    content: '',
    categories: []
  });
  
  const navigate = useNavigate();
  
  // Redirect if no match
  useEffect(() => {
    if (!matchLoading && !currentMatch) {
      navigate('/dashboard');
    }
  }, [currentMatch, matchLoading, navigate]);
  
  // Handle pin match button click
  const handlePinMatch = async () => {
    if (!currentMatch) return;
    
    try {
      setLoading(true);
      setError('');
      await pinMatch(currentMatch._id);
      navigate(`/conversation/${currentMatch._id}`);
    } catch (err) {
      setError('Failed to pin match. Please try again.');
      console.error('Pin match error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle unpin match button click
  const handleUnpinMatch = () => {
    setShowFeedbackModal(true);
  };
  
  // Handle feedback form submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentMatch) return;
    
    try {
      setLoading(true);
      setError('');
      await unpinMatch(currentMatch._id, feedback);
      setShowFeedbackModal(false);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to unpin match. Please try again.');
      console.error('Unpin match error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle feedback category toggle
  const handleCategoryToggle = (category) => {
    setFeedback(prev => {
      if (prev.categories.includes(category)) {
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== category)
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, category]
        };
      }
    });
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  if (matchLoading) {
    return (
      <Container>
        <LoadingMessage>Loading your match...</LoadingMessage>
      </Container>
    );
  }
  
  if (!currentMatch || !matchPartner) {
    return (
      <Container>
        <ErrorMessage>No match found. Return to dashboard to get a new match.</ErrorMessage>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </Container>
    );
  }
  
  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <Title>Today's Match</Title>
      </Header>
      
      <MatchCard>
        {error && <ErrorAlert>{error}</ErrorAlert>}
        
        <MatchProfile>
          <ProfilePicture>
            {matchPartner.profilePicture ? (
              <img src={matchPartner.profilePicture} alt={matchPartner.name} />
            ) : (
              <ProfilePlaceholder>{matchPartner.name.charAt(0)}</ProfilePlaceholder>
            )}
          </ProfilePicture>
          
          <MatchName>{matchPartner.name}</MatchName>
          
          <MatchBio>
            {matchPartner.bio || 'No bio available'}
          </MatchBio>
        </MatchProfile>
        
        <CompatibilitySection>
          <h3>Compatibility Score</h3>
          <ScoreCircle>
            <ScoreNumber>{currentMatch.compatibilityScore}%</ScoreNumber>
          </ScoreCircle>
          
          {currentMatch.compatibilityFactors && (
            <FactorsList>
              <FactorItem>
                <FactorName>Personality Traits</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.personalityTraits} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.personalityTraits}%
                </FactorScore>
              </FactorItem>
              
              <FactorItem>
                <FactorName>Emotional Intelligence</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.emotionalIntelligence} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.emotionalIntelligence}%
                </FactorScore>
              </FactorItem>
              
              <FactorItem>
                <FactorName>Relationship Values</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.relationshipValues} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.relationshipValues}%
                </FactorScore>
              </FactorItem>
              
              <FactorItem>
                <FactorName>Life Goals</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.lifeGoals} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.lifeGoals}%
                </FactorScore>
              </FactorItem>
              
              <FactorItem>
                <FactorName>Communication Style</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.communicationStyle} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.communicationStyle}%
                </FactorScore>
              </FactorItem>
              
              <FactorItem>
                <FactorName>Shared Interests</FactorName>
                <FactorBar>
                  <FactorFill 
                    width={currentMatch.compatibilityFactors.interests} 
                  />
                </FactorBar>
                <FactorScore>
                  {currentMatch.compatibilityFactors.interests}%
                </FactorScore>
              </FactorItem>
            </FactorsList>
          )}
        </CompatibilitySection>
        
        <DecisionSection>
          <DecisionText>
            Would you like to connect with {matchPartner.name}?
          </DecisionText>
          
          <ButtonGroup>
            <PrimaryButton 
              onClick={handlePinMatch} 
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Start Conversation'}
            </PrimaryButton>
            
            <SecondaryButton 
              onClick={handleUnpinMatch} 
              disabled={loading}
            >
              Not Interested
            </SecondaryButton>
          </ButtonGroup>
          
          <DecisionNote>
            If you choose "Not Interested", you'll enter a 24-hour reflection period 
            before receiving a new match.
          </DecisionNote>
        </DecisionSection>
      </MatchCard>
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <ModalOverlay>
          <Modal>
            <ModalHeader>
              <h3>Why are you not interested?</h3>
              <CloseButton onClick={() => setShowFeedbackModal(false)}>×</CloseButton>
            </ModalHeader>
            
            <form onSubmit={handleFeedbackSubmit}>
              <FeedbackCategories>
                <CategoryButton 
                  type="button"
                  selected={feedback.categories.includes('no-attraction')}
                  onClick={() => handleCategoryToggle('no-attraction')}
                >
                  No Attraction
                </CategoryButton>
                <CategoryButton 
                  type="button"
                  selected={feedback.categories.includes('different-values')}
                  onClick={() => handleCategoryToggle('different-values')}
                >
                  Different Values
                </CategoryButton>
                <CategoryButton 
                  type="button"
                  selected={feedback.categories.includes('different-goals')}
                  onClick={() => handleCategoryToggle('different-goals')}
                >
                  Different Goals
                </CategoryButton>
                <CategoryButton 
                  type="button"
                  selected={feedback.categories.includes('distance')}
                  onClick={() => handleCategoryToggle('distance')}
                >
                  Distance
                </CategoryButton>
              </FeedbackCategories>
              
              <FeedbackInput
                placeholder="Additional feedback (optional)"
                value={feedback.content}
                onChange={(e) => setFeedback({ ...feedback, content: e.target.value })}
              />
              
              <ModalButtons>
                <SecondaryButton 
                  type="button" 
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={loading}>
                  {loading ? 'Processing...' : 'Submit & Unpin'}
                </PrimaryButton>
              </ModalButtons>
            </form>
          </Modal>
        </ModalOverlay>
      )}
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 2rem;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
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
  max-width: 800px;
  margin: 0 auto;
  overflow: hidden;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #666;
  padding: 3rem;
`;

const ErrorMessage = styled.div`
  text-align: center;
  font-size: 1.2rem;
  color: #e53935;
  padding: 3rem;
  margin-bottom: 1rem;
`;

const ErrorAlert = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  text-align: center;
`;

const MatchProfile = styled.div`
  padding: 2rem;
  text-align: center;
  border-bottom: 1px solid #eee;
`;

const ProfilePicture = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfilePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #6c63ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  font-weight: bold;
`;

const MatchName = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: #3a3a3a;
`;

const MatchBio = styled.p`
  color: #666;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
`;

const CompatibilitySection = styled.div`
  padding: 2rem;
  border-bottom: 1px solid #eee;
  
  h3 {
    text-align: center;
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #3a3a3a;
  }
`;

const ScoreCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  border: 6px solid #6c63ff;
`;

const ScoreNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #3a3a3a;
`;

const FactorsList = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const FactorItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const FactorName = styled.div`
  width: 180px;
  font-size: 0.9rem;
  color: #666;
`;

const FactorBar = styled.div`
  flex: 1;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 1rem;
`;

const FactorFill = styled.div`
  height: 100%;
  background-color: #6c63ff;
  width: ${props => props.width}%;
`;

const FactorScore = styled.div`
  width: 40px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #3a3a3a;
`;

const DecisionSection = styled.div`
  padding: 2rem;
  text-align: center;
`;

const DecisionText = styled.p`
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #3a3a3a;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

const PrimaryButton = styled(Button)`
  background-color: #6c63ff;
  color: white;
  
  &:hover {
    background-color: #5a52d5;
  }
  
  &:disabled {
    background-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: white;
  color: #6c63ff;
  border: 1px solid #6c63ff;
  
  &:hover {
    background-color: #f5f5f5;
  }
  
  &:disabled {
    color: #a8a8a8;
    border-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

const DecisionNote = styled.p`
  font-size: 0.9rem;
  color: #777;
`;

const ModalOverlay = styled.div`
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

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    color: #3a3a3a;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #777;
  cursor: pointer;
  
  &:hover {
    color: #3a3a3a;
  }
`;

const FeedbackCategories = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.5rem;
`;

const CategoryButton = styled.button`
  background-color: ${props => props.selected ? '#6c63ff' : 'white'};
  color: ${props => props.selected ? 'white' : '#666'};
  border: 1px solid ${props => props.selected ? '#6c63ff' : '#ddd'};
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #6c63ff;
    color: ${props => props.selected ? 'white' : '#6c63ff'};
  }
`;

const FeedbackInput = styled.textarea`
  width: calc(100% - 3rem);
  margin: 0 1.5rem;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #eee;
  margin-top: 1.5rem;
`;

export default Match; 