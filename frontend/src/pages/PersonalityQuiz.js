import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { quizQuestions, calculateTraits } from '../data/personalityQuiz';

const PersonalityQuiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();
  
  const handleAnswer = (option) => {
    // Add the selected option to answers
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    
    // Update progress
    const newProgress = ((currentQuestion + 1) / quizQuestions.length) * 100;
    setProgress(newProgress);
    
    // Move to next question or finish quiz
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz(newAnswers);
    }
  };
  
  const finishQuiz = async (finalAnswers) => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate personality traits based on answers
      const traitData = calculateTraits(finalAnswers);
      console.log("Calculated trait data:", traitData);
      
      // Add interests based on answers
      const interests = generateInterests(finalAnswers);
      console.log("Generated interests:", interests);
      
      // Complete onboarding with calculated traits
      const userData = {
        ...traitData,
        interests
      };
      console.log("Sending user data to server:", userData);
      
      const response = await completeOnboarding(userData);
      console.log("Server response:", response);
      
      // Navigate to dashboard (home page)
      console.log("Redirecting to dashboard");
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to save your personality profile. Please try again.');
      console.error('Personality quiz error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate interests based on quiz answers
  const generateInterests = (finalAnswers) => {
    const interestCategories = {
      openness: ['art', 'philosophy', 'travel', 'culture', 'music'],
      extraversion: ['parties', 'socializing', 'dancing', 'team sports', 'public speaking'],
      conscientiousness: ['organization', 'planning', 'fitness', 'productivity', 'learning'],
      adventure: ['hiking', 'extreme sports', 'travel', 'photography', 'exploration'],
      personalGrowth: ['books', 'podcasts', 'meditation', 'self-improvement', 'workshops']
    };
    
    // Count trait occurrences in answers
    const traitCounts = {};
    finalAnswers.forEach(answer => {
      if (!traitCounts[answer.trait]) {
        traitCounts[answer.trait] = 0;
      }
      traitCounts[answer.trait] += 1;
    });
    
    // Find top traits
    const topTraits = Object.entries(traitCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    // Generate interests based on top traits
    const interests = [];
    topTraits.forEach(trait => {
      if (interestCategories[trait]) {
        // Add 2 random interests from each top trait category
        const categoryInterests = interestCategories[trait];
        const randomInterests = categoryInterests
          .sort(() => 0.5 - Math.random())
          .slice(0, 2);
        
        interests.push(...randomInterests);
      }
    });
    
    // Add some default interests if we don't have enough
    if (interests.length < 4) {
      const defaultInterests = ['movies', 'music', 'food', 'travel', 'reading'];
      const additionalInterests = defaultInterests
        .filter(interest => !interests.includes(interest))
        .slice(0, 4 - interests.length);
      
      interests.push(...additionalInterests);
    }
    
    return interests;
  };
  
  // Current question data
  const question = quizQuestions[currentQuestion];
  
  return (
    <Container>
      <QuizCard>
        <Logo>Lone Town</Logo>
        <Title>Personality Quiz</Title>
        <Subtitle>Help us understand your personality to find better matches</Subtitle>
        
        <ProgressContainer>
          <ProgressBar progress={progress} />
          <ProgressText>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </ProgressText>
        </ProgressContainer>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <QuestionText>{question.question}</QuestionText>
        
        <OptionsContainer>
          {question.options.map((option, index) => (
            <OptionButton 
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={loading}
            >
              {option.text}
            </OptionButton>
          ))}
        </OptionsContainer>
        
        <HelpText>
          Choose the option that best describes you. There are no right or wrong answers!
        </HelpText>
      </QuizCard>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  padding: 2rem;
`;

const QuizCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 600px;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  color: #6c63ff;
  margin: 0 0 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #3a3a3a;
  margin: 0 0 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 2rem;
`;

const ProgressBar = styled.div`
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background-color: #6c63ff;
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: #666;
  text-align: right;
`;

const QuestionText = styled.h3`
  font-size: 1.2rem;
  color: #3a3a3a;
  margin-bottom: 1.5rem;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const OptionButton = styled.button`
  background-color: #f0edff;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  color: #3a3a3a;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &:hover {
    background-color: #e3e0ff;
    border-color: #6c63ff;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const HelpText = styled.p`
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

export default PersonalityQuiz; 