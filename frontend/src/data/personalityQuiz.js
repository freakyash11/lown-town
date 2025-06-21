// Personality Quiz Questions and Scoring Logic

export const quizQuestions = [
  {
    id: 1,
    question: "How do you typically spend your free time?",
    options: [
      { text: "Exploring new places or trying new activities", trait: "openness", score: 3 },
      { text: "Following a planned schedule of activities", trait: "conscientiousness", score: 3 },
      { text: "Socializing with friends or meeting new people", trait: "extraversion", score: 3 },
      { text: "Relaxing at home with a book or movie", trait: "neuroticism", score: -2 }
    ]
  },
  {
    id: 2,
    question: "In a disagreement, you are more likely to:",
    options: [
      { text: "Listen carefully and try to understand the other person's perspective", trait: "empathy", score: 3 },
      { text: "Analyze the facts and focus on finding a logical solution", trait: "selfAwareness", score: 2 },
      { text: "Express your feelings openly and honestly", trait: "expressiveness", score: 3 },
      { text: "Try to find a compromise that makes everyone happy", trait: "agreeableness", score: 3 }
    ]
  },
  {
    id: 3,
    question: "Which of these values is most important to you in a relationship?",
    options: [
      { text: "Loyalty and commitment", trait: "commitment", score: 3 },
      { text: "Honesty and open communication", trait: "honesty", score: 3 },
      { text: "Personal space and independence", trait: "independence", score: 3 },
      { text: "Emotional connection and affection", trait: "affection", score: 3 }
    ]
  },
  {
    id: 4,
    question: "What is your approach to planning for the future?",
    options: [
      { text: "Setting clear goals and working methodically toward them", trait: "career", score: 3 },
      { text: "Focusing on building meaningful relationships and family", trait: "family", score: 3 },
      { text: "Staying flexible and open to new opportunities", trait: "adventure", score: 3 },
      { text: "Creating stability and security", trait: "stability", score: 3 }
    ]
  },
  {
    id: 5,
    question: "When faced with a challenge, you typically:",
    options: [
      { text: "Tackle it head-on with enthusiasm", trait: "extraversion", score: 2 },
      { text: "Carefully analyze the situation before acting", trait: "conscientiousness", score: 2 },
      { text: "Seek advice or support from others", trait: "socialSkills", score: 2 },
      { text: "Feel anxious but push through anyway", trait: "emotionalRegulation", score: -2 }
    ]
  },
  {
    id: 6,
    question: "In conversations, you tend to:",
    options: [
      { text: "Listen more than you speak", trait: "listening", score: 3 },
      { text: "Express your thoughts clearly and directly", trait: "directness", score: 3 },
      { text: "Enjoy debating different viewpoints", trait: "conflictResolution", score: 2 },
      { text: "Focus on keeping the conversation positive", trait: "agreeableness", score: 2 }
    ]
  },
  {
    id: 7,
    question: "What do you value most in your personal growth?",
    options: [
      { text: "Learning new skills and expanding your knowledge", trait: "personalGrowth", score: 3 },
      { text: "Becoming more emotionally aware and balanced", trait: "selfAwareness", score: 3 },
      { text: "Building stronger and deeper relationships", trait: "empathy", score: 3 },
      { text: "Achieving your goals and ambitions", trait: "career", score: 2 }
    ]
  },
  {
    id: 8,
    question: "How do you handle stress?",
    options: [
      { text: "Take time to process your emotions alone", trait: "neuroticism", score: 1 },
      { text: "Talk it through with friends or family", trait: "socialSkills", score: 2 },
      { text: "Use practical strategies like exercise or meditation", trait: "emotionalRegulation", score: 3 },
      { text: "Make a plan to address the source of stress", trait: "conscientiousness", score: 2 }
    ]
  },
  {
    id: 9,
    question: "What type of environment helps you thrive?",
    options: [
      { text: "Dynamic and constantly changing", trait: "openness", score: 3 },
      { text: "Structured and organized", trait: "conscientiousness", score: 3 },
      { text: "Collaborative and social", trait: "extraversion", score: 3 },
      { text: "Calm and peaceful", trait: "neuroticism", score: -2 }
    ]
  },
  {
    id: 10,
    question: "In a relationship, which approach do you prefer for resolving conflicts?",
    options: [
      { text: "Address issues immediately and directly", trait: "directness", score: 3 },
      { text: "Take time to cool down before discussing", trait: "emotionalRegulation", score: 2 },
      { text: "Find a compromise that works for both parties", trait: "conflictResolution", score: 3 },
      { text: "Focus on understanding each other's feelings", trait: "communication", score: 3 }
    ]
  }
];

// Calculate personality traits based on quiz answers
export const calculateTraits = (answers) => {
  // Initialize default trait values (middle of the scale)
  const traits = {
    // Personality traits
    openness: 5,
    conscientiousness: 5,
    extraversion: 5,
    agreeableness: 5,
    neuroticism: 5,
    
    // Emotional intelligence
    selfAwareness: 5,
    empathy: 5,
    socialSkills: 5,
    emotionalRegulation: 5,
    
    // Relationship values
    commitment: 5,
    loyalty: 5,
    honesty: 5,
    communication: 5,
    independence: 5,
    affection: 5,
    
    // Life goals
    career: 5,
    family: 5,
    personalGrowth: 5,
    adventure: 5,
    stability: 5,
    
    // Communication style
    directness: 5,
    conflictResolution: 5,
    expressiveness: 5,
    listening: 5
  };
  
  // Apply scores from answers
  answers.forEach(answer => {
    const { trait, score } = answer;
    if (traits.hasOwnProperty(trait)) {
      traits[trait] += score;
      
      // Ensure values stay within 1-10 range
      if (traits[trait] < 1) traits[trait] = 1;
      if (traits[trait] > 10) traits[trait] = 10;
    }
  });
  
  // Group traits into categories
  return {
    personalityTraits: {
      openness: traits.openness,
      conscientiousness: traits.conscientiousness,
      extraversion: traits.extraversion,
      agreeableness: traits.agreeableness,
      neuroticism: traits.neuroticism
    },
    emotionalIntelligence: {
      selfAwareness: traits.selfAwareness,
      empathy: traits.empathy,
      socialSkills: traits.socialSkills,
      emotionalRegulation: traits.emotionalRegulation
    },
    relationshipValues: {
      commitment: traits.commitment,
      loyalty: traits.loyalty,
      honesty: traits.honesty,
      communication: traits.communication,
      independence: traits.independence,
      affection: traits.affection
    },
    lifeGoals: {
      career: traits.career,
      family: traits.family,
      personalGrowth: traits.personalGrowth,
      adventure: traits.adventure,
      stability: traits.stability
    },
    communicationStyle: {
      directness: traits.directness,
      conflictResolution: traits.conflictResolution,
      expressiveness: traits.expressiveness,
      listening: traits.listening
    }
  };
}; 