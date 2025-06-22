const { doc, getDoc, updateDoc } = require('firebase/firestore');
const { db, setCorsHeaders, handlePreflight, verifyAuthToken } = require('../utils/firebase');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (handlePreflight(req, res)) {
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await verifyAuthToken(req);
    const uid = decodedToken.uid;
    
    // Get user data from Firestore
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userDoc.data();
    const onboardingData = req.body;
    
    // Update user with onboarding data
    const updatedUserData = {
      ...userData,
      personalityTraits: onboardingData.personalityTraits || userData.personalityTraits,
      emotionalIntelligence: onboardingData.emotionalIntelligence || userData.emotionalIntelligence,
      relationshipValues: onboardingData.relationshipValues || userData.relationshipValues,
      lifeGoals: onboardingData.lifeGoals || userData.lifeGoals,
      communicationStyle: onboardingData.communicationStyle || userData.communicationStyle,
      interests: onboardingData.interests || userData.interests,
      needsOnboarding: false,
      updatedAt: new Date()
    };
    
    // Save updated data to Firestore
    await updateDoc(userRef, updatedUserData);
    
    // Return the updated user data
    return res.status(200).json({
      _id: uid,
      name: updatedUserData.name,
      email: updatedUserData.email,
      personalityTraits: updatedUserData.personalityTraits,
      emotionalIntelligence: updatedUserData.emotionalIntelligence,
      relationshipValues: updatedUserData.relationshipValues,
      lifeGoals: updatedUserData.lifeGoals,
      communicationStyle: updatedUserData.communicationStyle,
      interests: updatedUserData.interests,
      needsOnboarding: false
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 