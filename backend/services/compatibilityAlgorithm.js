/**
 * Lone Town Deep Compatibility Algorithm
 * 
 * This algorithm calculates compatibility between users based on multiple dimensions:
 * 1. Personality Traits (Big Five)
 * 2. Emotional Intelligence
 * 3. Relationship Values
 * 4. Life Goals
 * 5. Communication Style
 * 6. Interests
 * 
 * The algorithm uses a combination of:
 * - Complementary matching (opposites attract)
 * - Similarity matching (birds of a feather)
 * - Weighted factors based on psychological research
 */

const User = require('../models/User');
const Match = require('../models/Match');

// Weights for different compatibility factors (sum = 1)
const WEIGHTS = {
  personalityTraits: 0.25,
  emotionalIntelligence: 0.20,
  relationshipValues: 0.25,
  lifeGoals: 0.15,
  communicationStyle: 0.10,
  interests: 0.05
};

// Determine if a trait should be matched by similarity or complementarity
const MATCH_TYPE = {
  // Personality traits
  openness: 'similarity',
  conscientiousness: 'similarity',
  extraversion: 'complementary',
  agreeableness: 'similarity',
  neuroticism: 'complementary',
  
  // Emotional intelligence
  selfAwareness: 'similarity',
  empathy: 'similarity',
  socialSkills: 'similarity',
  emotionalRegulation: 'similarity',
  
  // Relationship values - all similarity
  commitment: 'similarity',
  loyalty: 'similarity',
  honesty: 'similarity',
  communication: 'similarity',
  independence: 'similarity',
  affection: 'similarity',
  
  // Life goals
  career: 'similarity',
  family: 'similarity',
  personalGrowth: 'similarity',
  adventure: 'complementary',
  stability: 'complementary',
  
  // Communication style
  directness: 'complementary',
  conflictResolution: 'similarity',
  expressiveness: 'complementary',
  listening: 'similarity'
};

/**
 * Calculate compatibility score between two users
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Object} - Compatibility score and factors
 */
const calculateCompatibilityScore = (user1, user2) => {
  // Calculate scores for each factor
  const personalityTraitsScore = calculatePersonalityCompatibility(user1, user2);
  const emotionalIntelligenceScore = calculateEmotionalIntelligenceCompatibility(user1, user2);
  const relationshipValuesScore = calculateRelationshipValuesCompatibility(user1, user2);
  const lifeGoalsScore = calculateLifeGoalsCompatibility(user1, user2);
  const communicationStyleScore = calculateCommunicationStyleCompatibility(user1, user2);
  const interestsScore = calculateInterestsCompatibility(user1, user2);
  
  // Calculate weighted total score
  const totalScore = (
    personalityTraitsScore * WEIGHTS.personalityTraits +
    emotionalIntelligenceScore * WEIGHTS.emotionalIntelligence +
    relationshipValuesScore * WEIGHTS.relationshipValues +
    lifeGoalsScore * WEIGHTS.lifeGoals +
    communicationStyleScore * WEIGHTS.communicationStyle +
    interestsScore * WEIGHTS.interests
  ) * 100; // Convert to 0-100 scale
  
  return {
    compatibilityScore: Math.round(totalScore),
    compatibilityFactors: {
      personalityTraits: Math.round(personalityTraitsScore * 100),
      emotionalIntelligence: Math.round(emotionalIntelligenceScore * 100),
      relationshipValues: Math.round(relationshipValuesScore * 100),
      lifeGoals: Math.round(lifeGoalsScore * 100),
      communicationStyle: Math.round(communicationStyleScore * 100),
      interests: Math.round(interestsScore * 100)
    }
  };
};

/**
 * Calculate trait compatibility based on match type (similarity or complementary)
 * @param {Number} trait1 - First user's trait value (1-10)
 * @param {Number} trait2 - Second user's trait value (1-10)
 * @param {String} matchType - 'similarity' or 'complementary'
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateTraitCompatibility = (trait1, trait2, matchType) => {
  const normalizedTrait1 = (trait1 - 1) / 9; // Convert from 1-10 to 0-1
  const normalizedTrait2 = (trait2 - 1) / 9;
  
  if (matchType === 'similarity') {
    // For similarity, higher score when traits are closer
    return 1 - Math.abs(normalizedTrait1 - normalizedTrait2);
  } else {
    // For complementary, higher score when traits are opposite
    return Math.abs(normalizedTrait1 - normalizedTrait2);
  }
};

/**
 * Calculate personality traits compatibility
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculatePersonalityCompatibility = (user1, user2) => {
  const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  let totalScore = 0;
  
  for (const trait of traits) {
    const trait1 = user1.personalityTraits[trait];
    const trait2 = user2.personalityTraits[trait];
    const matchType = MATCH_TYPE[trait];
    
    totalScore += calculateTraitCompatibility(trait1, trait2, matchType);
  }
  
  return totalScore / traits.length;
};

/**
 * Calculate emotional intelligence compatibility
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateEmotionalIntelligenceCompatibility = (user1, user2) => {
  const traits = ['selfAwareness', 'empathy', 'socialSkills', 'emotionalRegulation'];
  let totalScore = 0;
  
  for (const trait of traits) {
    const trait1 = user1.emotionalIntelligence[trait];
    const trait2 = user2.emotionalIntelligence[trait];
    const matchType = MATCH_TYPE[trait];
    
    totalScore += calculateTraitCompatibility(trait1, trait2, matchType);
  }
  
  return totalScore / traits.length;
};

/**
 * Calculate relationship values compatibility
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateRelationshipValuesCompatibility = (user1, user2) => {
  const traits = ['commitment', 'loyalty', 'honesty', 'communication', 'independence', 'affection'];
  let totalScore = 0;
  
  for (const trait of traits) {
    const trait1 = user1.relationshipValues[trait];
    const trait2 = user2.relationshipValues[trait];
    const matchType = MATCH_TYPE[trait];
    
    totalScore += calculateTraitCompatibility(trait1, trait2, matchType);
  }
  
  return totalScore / traits.length;
};

/**
 * Calculate life goals compatibility
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateLifeGoalsCompatibility = (user1, user2) => {
  const traits = ['career', 'family', 'personalGrowth', 'adventure', 'stability'];
  let totalScore = 0;
  
  for (const trait of traits) {
    const trait1 = user1.lifeGoals[trait];
    const trait2 = user2.lifeGoals[trait];
    const matchType = MATCH_TYPE[trait];
    
    totalScore += calculateTraitCompatibility(trait1, trait2, matchType);
  }
  
  return totalScore / traits.length;
};

/**
 * Calculate communication style compatibility
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateCommunicationStyleCompatibility = (user1, user2) => {
  const traits = ['directness', 'conflictResolution', 'expressiveness', 'listening'];
  let totalScore = 0;
  
  for (const trait of traits) {
    const trait1 = user1.communicationStyle[trait];
    const trait2 = user2.communicationStyle[trait];
    const matchType = MATCH_TYPE[trait];
    
    totalScore += calculateTraitCompatibility(trait1, trait2, matchType);
  }
  
  return totalScore / traits.length;
};

/**
 * Calculate interests compatibility based on shared interests
 * @param {Object} user1 - First user object
 * @param {Object} user2 - Second user object
 * @returns {Number} - Compatibility score (0-1)
 */
const calculateInterestsCompatibility = (user1, user2) => {
  const interests1 = new Set(user1.interests);
  const interests2 = new Set(user2.interests);
  
  // Find common interests
  const commonInterests = [...interests1].filter(interest => interests2.has(interest));
  
  // Calculate Jaccard similarity coefficient
  const unionSize = new Set([...interests1, ...interests2]).size;
  const similarityScore = unionSize === 0 ? 0 : commonInterests.length / unionSize;
  
  return similarityScore;
};

/**
 * Find the best match for a user from a pool of candidates
 * @param {Object} user - User to find a match for
 * @param {Array} candidates - Array of potential match candidates
 * @returns {Object} - Best match with compatibility score
 */
const findBestMatch = (user, candidates) => {
  let bestMatch = null;
  let highestScore = -1;
  let compatibilityDetails = null;
  
  for (const candidate of candidates) {
    const compatibility = calculateCompatibilityScore(user, candidate);
    
    if (compatibility.compatibilityScore > highestScore) {
      highestScore = compatibility.compatibilityScore;
      bestMatch = candidate;
      compatibilityDetails = compatibility;
    }
  }
  
  return {
    match: bestMatch,
    ...compatibilityDetails
  };
};

/**
 * Find daily match for a user
 * @param {String} userId - User ID to find a match for
 * @returns {Promise<Object>} - Match object or null if no match found
 */
const findDailyMatch = async (userId) => {
  try {
    console.log(`Finding daily match for user: ${userId}`);
    
    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      throw new Error('User not found');
    }
    
    console.log(`User found: ${user.name}, state: ${user.userState}`);
    
    // Check if user is available for matching
    if (user.userState !== 'available') {
      console.log(`User ${userId} is not available for matching. Current state: ${user.userState}`);
      return null;
    }
    
    // Find potential matches
    const potentialMatches = await User.find({
      _id: { $ne: userId },
      userState: 'available',
      gender: { $in: user.interestedIn },
      interestedIn: { $in: [user.gender] }
    });
    
    console.log(`Found ${potentialMatches.length} potential matches`);
    
    if (potentialMatches.length === 0) {
      console.log('No potential matches found');
      return null;
    }
    
    // Find best match
    const bestMatchResult = findBestMatch(user, potentialMatches);
    
    if (!bestMatchResult.match) {
      console.log('No best match found');
      return null;
    }
    
    console.log(`Best match found: ${bestMatchResult.match.name} with score: ${bestMatchResult.compatibilityScore}`);
    
    // Create a new match
    const newMatch = new Match({
      users: [userId, bestMatchResult.match._id],
      compatibilityScore: bestMatchResult.compatibilityScore,
      compatibilityFactors: bestMatchResult.compatibilityFactors
    });
    
    await newMatch.save();
    console.log(`New match created with ID: ${newMatch._id}`);
    
    // Update both users' state
    await User.updateMany(
      { _id: { $in: [userId, bestMatchResult.match._id] } },
      { 
        userState: 'matched',
        'stateTimestamps.lastMatched': new Date(),
        currentMatch: newMatch._id
      }
    );
    
    console.log(`Updated user states for users: ${userId} and ${bestMatchResult.match._id}`);
    
    return newMatch;
  } catch (error) {
    console.error('Error finding daily match:', error);
    throw error;
  }
};

module.exports = {
  calculateCompatibilityScore,
  findBestMatch,
  findDailyMatch
}; 