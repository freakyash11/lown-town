import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: '',
    personalityTraits: {
      openness: 5,
      conscientiousness: 5,
      extraversion: 5,
      agreeableness: 5,
      neuroticism: 5
    },
    emotionalIntelligence: {
      selfAwareness: 5,
      empathy: 5,
      socialSkills: 5,
      emotionalRegulation: 5
    },
    relationshipValues: {
      commitment: 5,
      loyalty: 5,
      honesty: 5,
      communication: 5,
      independence: 5,
      affection: 5
    },
    lifeGoals: {
      career: 5,
      family: 5,
      personalGrowth: 5,
      adventure: 5,
      stability: 5
    },
    communicationStyle: {
      directness: 5,
      conflictResolution: 5,
      expressiveness: 5,
      listening: 5
    },
    interests: []
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { currentUser, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  
  // Check if user needs onboarding
  useEffect(() => {
    if (currentUser) {
      // If the user doesn't need onboarding, redirect to dashboard
      if (currentUser.needsOnboarding === false) {
        navigate('/dashboard');
      }
      
      // Pre-fill form data if available from user profile
      if (currentUser.bio) {
        setFormData(prevData => ({
          ...prevData,
          bio: currentUser.bio || prevData.bio,
          personalityTraits: currentUser.personalityTraits || prevData.personalityTraits,
          emotionalIntelligence: currentUser.emotionalIntelligence || prevData.emotionalIntelligence,
          relationshipValues: currentUser.relationshipValues || prevData.relationshipValues,
          lifeGoals: currentUser.lifeGoals || prevData.lifeGoals,
          communicationStyle: currentUser.communicationStyle || prevData.communicationStyle,
          interests: currentUser.interests || prevData.interests
        }));
      }
    }
  }, [currentUser, navigate]);
  
  // Interest options
  const interestOptions = [
    'Reading', 'Writing', 'Music', 'Movies', 'TV Shows', 'Sports', 'Fitness',
    'Cooking', 'Baking', 'Art', 'Photography', 'Travel', 'Hiking', 'Camping',
    'Gaming', 'Technology', 'Science', 'History', 'Politics', 'Philosophy',
    'Spirituality', 'Meditation', 'Yoga', 'Dancing', 'Singing', 'Instruments',
    'Gardening', 'DIY', 'Fashion', 'Design', 'Architecture', 'Animals', 'Pets',
    'Volunteering', 'Social Causes', 'Education', 'Languages', 'Coding'
  ];
  
  // Handle slider change
  const handleSliderChange = (category, trait, value) => {
    setFormData({
      ...formData,
      [category]: {
        ...formData[category],
        [trait]: parseInt(value)
      }
    });
  };
  
  // Handle interest toggle
  const handleInterestToggle = (interest) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };
  
  // Handle bio change
  const handleBioChange = (e) => {
    setFormData({
      ...formData,
      bio: e.target.value
    });
  };
  
  // Handle next step
  const handleNextStep = () => {
    if (step === 6 && formData.interests.length < 3) {
      setError('Please select at least 3 interests');
      return;
    }
    
    setError('');
    setStep(step + 1);
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    setStep(step - 1);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.interests.length < 3) {
      return setError('Please select at least 3 interests');
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('Onboarding: Submitting data to server...');
      console.log('Onboarding: API URL being used:', process.env.REACT_APP_API_URL || 'https://lown-town-dwky.vercel.app/api');
      await completeOnboarding(formData);
      console.log('Onboarding: Successfully completed onboarding');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete onboarding');
      console.error('Onboarding error:', err);
      console.error('Onboarding error details:', err.response?.data || 'No response data');
      
      // If it's a network error, provide more details
      if (err.message === 'Network Error') {
        console.error('Network error details:', {
          message: err.message,
          stack: err.stack,
          config: err.config
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Render slider with label
  const renderSlider = (category, trait, label, description) => (
    <SliderGroup key={`${category}-${trait}`}>
      <SliderLabel>
        <div>{label}</div>
        <SliderValue>{formData[category][trait]}</SliderValue>
      </SliderLabel>
      <SliderDescription>{description}</SliderDescription>
      <Slider
        type="range"
        min="1"
        max="10"
        value={formData[category][trait]}
        onChange={(e) => handleSliderChange(category, trait, e.target.value)}
      />
      <SliderLabels>
        <span>Low</span>
        <span>High</span>
      </SliderLabels>
    </SliderGroup>
  );
  
  // Render current step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <StepTitle>Tell us about yourself</StepTitle>
            <StepDescription>
              Write a short bio that describes who you are and what you're looking for.
            </StepDescription>
            
            <TextareaGroup>
              <Textarea
                placeholder="Write your bio here..."
                value={formData.bio}
                onChange={handleBioChange}
                rows="6"
              />
            </TextareaGroup>
          </>
        );
        
      case 2:
        return (
          <>
            <StepTitle>Personality Traits</StepTitle>
            <StepDescription>
              Rate yourself on these personality dimensions to help us find compatible matches.
            </StepDescription>
            
            {renderSlider('personalityTraits', 'openness', 'Openness', 'Curiosity and willingness to try new experiences')}
            {renderSlider('personalityTraits', 'conscientiousness', 'Conscientiousness', 'Organization and dependability')}
            {renderSlider('personalityTraits', 'extraversion', 'Extraversion', 'Sociability and energy from social interactions')}
            {renderSlider('personalityTraits', 'agreeableness', 'Agreeableness', 'Compassion and cooperation with others')}
            {renderSlider('personalityTraits', 'neuroticism', 'Emotional Stability', 'Ability to handle stress and anxiety')}
          </>
        );
        
      case 3:
        return (
          <>
            <StepTitle>Emotional Intelligence</StepTitle>
            <StepDescription>
              Rate your emotional intelligence in these areas.
            </StepDescription>
            
            {renderSlider('emotionalIntelligence', 'selfAwareness', 'Self-Awareness', 'Understanding your own emotions')}
            {renderSlider('emotionalIntelligence', 'empathy', 'Empathy', 'Understanding others\' emotions')}
            {renderSlider('emotionalIntelligence', 'socialSkills', 'Social Skills', 'Ability to navigate social situations')}
            {renderSlider('emotionalIntelligence', 'emotionalRegulation', 'Emotional Regulation', 'Managing your emotional responses')}
          </>
        );
        
      case 4:
        return (
          <>
            <StepTitle>Relationship Values</StepTitle>
            <StepDescription>
              Rate how important these values are to you in a relationship.
            </StepDescription>
            
            {renderSlider('relationshipValues', 'commitment', 'Commitment', 'Dedication to the relationship')}
            {renderSlider('relationshipValues', 'loyalty', 'Loyalty', 'Faithfulness to your partner')}
            {renderSlider('relationshipValues', 'honesty', 'Honesty', 'Truthfulness and transparency')}
            {renderSlider('relationshipValues', 'communication', 'Communication', 'Open and clear exchange of thoughts and feelings')}
            {renderSlider('relationshipValues', 'independence', 'Independence', 'Having personal space and autonomy')}
            {renderSlider('relationshipValues', 'affection', 'Affection', 'Physical and emotional expressions of love')}
          </>
        );
        
      case 5:
        return (
          <>
            <StepTitle>Life Goals & Communication</StepTitle>
            <StepDescription>
              Rate how important these goals are to you and your communication style.
            </StepDescription>
            
            <SectionTitle>Life Goals</SectionTitle>
            {renderSlider('lifeGoals', 'career', 'Career', 'Professional ambitions and success')}
            {renderSlider('lifeGoals', 'family', 'Family', 'Building and maintaining family relationships')}
            {renderSlider('lifeGoals', 'personalGrowth', 'Personal Growth', 'Self-improvement and development')}
            {renderSlider('lifeGoals', 'adventure', 'Adventure', 'Seeking new experiences and excitement')}
            {renderSlider('lifeGoals', 'stability', 'Stability', 'Security and predictability in life')}
            
            <SectionTitle>Communication Style</SectionTitle>
            {renderSlider('communicationStyle', 'directness', 'Directness', 'Being straightforward vs. diplomatic')}
            {renderSlider('communicationStyle', 'conflictResolution', 'Conflict Resolution', 'Ability to resolve disagreements')}
            {renderSlider('communicationStyle', 'expressiveness', 'Expressiveness', 'Openly sharing feelings and thoughts')}
            {renderSlider('communicationStyle', 'listening', 'Listening', 'Attentiveness to others\' perspectives')}
          </>
        );
        
      case 6:
        return (
          <>
            <StepTitle>Interests</StepTitle>
            <StepDescription>
              Select at least 3 interests that you enjoy or are passionate about.
            </StepDescription>
            
            <InterestsGrid>
              {interestOptions.map(interest => (
                <InterestButton
                  key={interest}
                  selected={formData.interests.includes(interest)}
                  onClick={() => handleInterestToggle(interest)}
                  type="button"
                >
                  {interest}
                </InterestButton>
              ))}
            </InterestsGrid>
            
            <SelectedCount>
              Selected: {formData.interests.length}/3 (minimum)
            </SelectedCount>
          </>
        );
        
      case 7:
        return (
          <>
            <StepTitle>Ready to Find Your Match!</StepTitle>
            <StepDescription>
              You've completed the onboarding process. We'll use this information to find your most compatible match.
            </StepDescription>
            
            <FinalStep>
              <p>
                Remember, Lone Town provides just one carefully chosen match per day based on deep compatibility.
                Each match matters, so be intentional about your choices.
              </p>
              <p>
                Are you ready to start your mindful dating journey?
              </p>
            </FinalStep>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Container>
      <OnboardingCard>
        <ProgressBar>
          {Array.from({ length: 7 }, (_, i) => (
            <ProgressStep key={i} active={i + 1 === step} completed={i + 1 < step} />
          ))}
        </ProgressBar>
        
        <FormContent>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          {renderStep()}
          
          <ButtonGroup>
            {step > 1 && (
              <SecondaryButton 
                type="button" 
                onClick={handlePrevStep}
                disabled={loading}
              >
                Back
              </SecondaryButton>
            )}
            
            {step < 7 ? (
              <PrimaryButton 
                type="button" 
                onClick={handleNextStep}
                disabled={loading}
              >
                Next
              </PrimaryButton>
            ) : (
              <PrimaryButton 
                type="button" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Complete & Find Matches'}
              </PrimaryButton>
            )}
          </ButtonGroup>
        </FormContent>
      </OnboardingCard>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
`;

const OnboardingCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 700px;
  overflow: hidden;
`;

const ProgressBar = styled.div`
  display: flex;
  padding: 1.5rem;
  background-color: #f9f9f9;
`;

const ProgressStep = styled.div`
  flex: 1;
  height: 4px;
  background-color: ${props => props.completed ? '#6c63ff' : props.active ? '#a395ff' : '#e0e0e0'};
  margin: 0 2px;
`;

const FormContent = styled.div`
  padding: 2rem;
`;

const StepTitle = styled.h2`
  color: #3a3a3a;
  margin-top: 0;
  margin-bottom: 0.5rem;
`;

const StepDescription = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: #3a3a3a;
  margin-top: 2rem;
  margin-bottom: 1rem;
`;

const TextareaGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

const SliderGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #3a3a3a;
`;

const SliderValue = styled.span`
  background-color: #6c63ff;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
`;

const SliderDescription = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
`;

const Slider = styled.input`
  width: 100%;
  margin: 0.5rem 0;
  -webkit-appearance: none;
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    background: #e0e0e0;
    border-radius: 2px;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #6c63ff;
    margin-top: -6px;
    cursor: pointer;
  }
  
  &:focus {
    outline: none;
  }
`;

const SliderLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
`;

const InterestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const InterestButton = styled.button`
  background-color: ${props => props.selected ? '#6c63ff' : 'white'};
  color: ${props => props.selected ? 'white' : '#666'};
  border: 1px solid ${props => props.selected ? '#6c63ff' : '#ddd'};
  border-radius: 20px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #6c63ff;
    color: ${props => props.selected ? 'white' : '#6c63ff'};
  }
`;

const SelectedCount = styled.div`
  text-align: center;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
`;

const FinalStep = styled.div`
  margin-bottom: 2rem;
  
  p {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: #666;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Button = styled.button`
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #6c63ff;
  color: white;
  
  &:hover {
    background-color: #5a52d5;
  }
  
  &:disabled {
    background-color: #a8a8a8;
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
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  text-align: center;
`;

export default Onboarding; 