import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useMatch } from '../context/MatchContext';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const MatchHistory = () => {
  const { getMatchHistory, getMatchFeedback, matchHistory, historyLoading } = useMatch();
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const navigate = useNavigate();
  
  // Load match history on mount
  useEffect(() => {
    getMatchHistory();
  }, [getMatchHistory]);
  
  // Load feedback when a match is selected
  useEffect(() => {
    const loadFeedback = async () => {
      if (selectedMatch) {
        try {
          setFeedbackLoading(true);
          const data = await getMatchFeedback(selectedMatch._id);
          setFeedback(data);
        } catch (err) {
          console.error('Error loading feedback:', err);
        } finally {
          setFeedbackLoading(false);
        }
      }
    };
    
    loadFeedback();
  }, [selectedMatch, getMatchFeedback]);
  
  const handleSelectMatch = (match) => {
    setSelectedMatch(match);
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <Title>Match History</Title>
      </Header>
      
      <Content>
        {historyLoading ? (
          <LoadingSpinner />
        ) : (
          <HistoryGrid>
            <MatchesList>
              <SectionTitle>Past Matches</SectionTitle>
              
              {matchHistory.length === 0 ? (
                <EmptyState>
                  <p>You haven't had any matches yet.</p>
                  <p>Check back after you've connected with someone!</p>
                </EmptyState>
              ) : (
                matchHistory.map((match) => (
                  <MatchItem 
                    key={match._id}
                    isSelected={selectedMatch && selectedMatch._id === match._id}
                    onClick={() => handleSelectMatch(match)}
                  >
                    <MatchItemHeader>
                      <MatchName>
                        {match.partnerName || 'Unknown User'}
                      </MatchName>
                      <MatchDate>
                        {formatDate(match.createdAt)}
                      </MatchDate>
                    </MatchItemHeader>
                    
                    <MatchStatus status={match.status}>
                      {match.status === 'ended' ? 'Ended' : 
                       match.status === 'pinned' ? 'Pinned' : 'Active'}
                    </MatchStatus>
                    
                    <CompatibilityScore>
                      {match.compatibilityScore}% compatible
                    </CompatibilityScore>
                  </MatchItem>
                ))
              )}
            </MatchesList>
            
            <MatchDetails>
              <SectionTitle>Match Details</SectionTitle>
              
              {!selectedMatch ? (
                <EmptyState>
                  <p>Select a match to view details</p>
                </EmptyState>
              ) : (
                <DetailsCard>
                  <DetailsHeader>
                    <DetailName>
                      {selectedMatch.partnerName || 'Unknown User'}
                    </DetailName>
                    <DetailDate>
                      Matched on {formatDate(selectedMatch.createdAt)}
                    </DetailDate>
                  </DetailsHeader>
                  
                  <DetailSection>
                    <DetailTitle>Compatibility</DetailTitle>
                    <ScoreCircle>
                      <ScoreNumber>{selectedMatch.compatibilityScore}%</ScoreNumber>
                    </ScoreCircle>
                    
                    {selectedMatch.compatibilityFactors && (
                      <FactorsList>
                        {Object.entries(selectedMatch.compatibilityFactors).map(([key, value]) => (
                          <FactorItem key={key}>
                            <FactorName>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </FactorName>
                            <FactorBar>
                              <FactorFill width={value} />
                            </FactorBar>
                            <FactorScore>{value}%</FactorScore>
                          </FactorItem>
                        ))}
                      </FactorsList>
                    )}
                  </DetailSection>
                  
                  <DetailSection>
                    <DetailTitle>Match Outcome</DetailTitle>
                    
                    <OutcomeStatus status={selectedMatch.status}>
                      {selectedMatch.status === 'ended' ? 'This match ended' : 
                       selectedMatch.status === 'pinned' ? 'This match is still active' : 
                       'This match is active but not pinned'}
                    </OutcomeStatus>
                    
                    {selectedMatch.status === 'ended' && (
                      <div>
                        <DetailSubtitle>Feedback</DetailSubtitle>
                        
                        {feedbackLoading ? (
                          <LoadingSpinner size="20px" />
                        ) : feedback ? (
                          <FeedbackContent>
                            {feedback.categories && feedback.categories.length > 0 && (
                              <FeedbackCategories>
                                {feedback.categories.map(category => (
                                  <FeedbackCategory key={category}>
                                    {category.replace(/-/g, ' ')}
                                  </FeedbackCategory>
                                ))}
                              </FeedbackCategories>
                            )}
                            
                            {feedback.content && (
                              <FeedbackText>"{feedback.content}"</FeedbackText>
                            )}
                            
                            {!feedback.categories?.length && !feedback.content && (
                              <NoFeedback>No specific feedback was provided</NoFeedback>
                            )}
                          </FeedbackContent>
                        ) : (
                          <NoFeedback>No feedback available</NoFeedback>
                        )}
                      </div>
                    )}
                  </DetailSection>
                  
                  <DetailSection>
                    <DetailTitle>Messages Exchanged</DetailTitle>
                    <MessageCount>
                      {selectedMatch.messageCount || 0} messages
                    </MessageCount>
                    
                    {selectedMatch.videoCallUnlocked && (
                      <VideoCallStatus>
                        Video calling was unlocked
                      </VideoCallStatus>
                    )}
                  </DetailSection>
                </DetailsCard>
              )}
            </MatchDetails>
          </HistoryGrid>
        )}
      </Content>
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
  align-items: center;
  padding: 1.5rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  color: #3a3a3a;
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const HistoryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MatchesList = styled(Card)`
  padding: 1.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem 0;
  color: #666;
  
  p {
    margin: 0.5rem 0;
  }
`;

const MatchItem = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.isSelected ? '#f0edff' : '#f9f9f9'};
  border-left: 4px solid ${props => props.isSelected ? '#6c63ff' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#f0edff' : '#f5f5f5'};
  }
`;

const MatchItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const MatchName = styled.div`
  font-weight: 500;
  color: #3a3a3a;
`;

const MatchDate = styled.div`
  font-size: 0.8rem;
  color: #777;
`;

const MatchStatus = styled.div`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  
  background-color: ${props => {
    switch (props.status) {
      case 'ended':
        return '#ffebee';
      case 'pinned':
        return '#e8f5e9';
      default:
        return '#e3f2fd';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case 'ended':
        return '#c62828';
      case 'pinned':
        return '#2e7d32';
      default:
        return '#1565c0';
    }
  }};
`;

const CompatibilityScore = styled.div`
  font-size: 0.9rem;
  color: #6c63ff;
  font-weight: 500;
`;

const MatchDetails = styled(Card)`
  padding: 1.5rem;
`;

const DetailsCard = styled.div``;

const DetailsHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const DetailName = styled.h3`
  font-size: 1.4rem;
  margin: 0 0 0.5rem 0;
  color: #3a3a3a;
`;

const DetailDate = styled.div`
  color: #777;
`;

const DetailSection = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
  
  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const DetailTitle = styled.h4`
  font-size: 1.1rem;
  color: #3a3a3a;
  margin: 0 0 1rem 0;
`;

const DetailSubtitle = styled.h5`
  font-size: 1rem;
  color: #3a3a3a;
  margin: 1rem 0 0.5rem 0;
`;

const ScoreCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  border: 4px solid #6c63ff;
`;

const ScoreNumber = styled.div`
  font-size: 1.4rem;
  font-weight: bold;
  color: #3a3a3a;
`;

const FactorsList = styled.div`
  margin-top: 1.5rem;
`;

const FactorItem = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
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

const OutcomeStatus = styled.div`
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  
  background-color: ${props => {
    switch (props.status) {
      case 'ended':
        return '#ffebee';
      case 'pinned':
        return '#e8f5e9';
      default:
        return '#e3f2fd';
    }
  }};
  
  color: ${props => {
    switch (props.status) {
      case 'ended':
        return '#c62828';
      case 'pinned':
        return '#2e7d32';
      default:
        return '#1565c0';
    }
  }};
`;

const FeedbackContent = styled.div`
  margin-top: 0.5rem;
`;

const FeedbackCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FeedbackCategory = styled.div`
  background-color: #f0edff;
  color: #6c63ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  text-transform: capitalize;
`;

const FeedbackText = styled.div`
  font-style: italic;
  color: #666;
  padding: 0.5rem 0;
`;

const NoFeedback = styled.div`
  color: #777;
  font-style: italic;
`;

const MessageCount = styled.div`
  font-size: 1.1rem;
  color: #3a3a3a;
`;

const VideoCallStatus = styled.div`
  margin-top: 0.5rem;
  color: #6c63ff;
  font-weight: 500;
`;

export default MatchHistory; 