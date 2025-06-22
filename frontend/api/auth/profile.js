const { doc, getDoc, updateDoc } = require('firebase/firestore');
const { db, admin, setCorsHeaders, handlePreflight, verifyAuthToken } = require('../utils/firebase');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (handlePreflight(req, res)) {
    return;
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await verifyAuthToken(req);
    const uid = decodedToken.uid;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (!userDoc.exists()) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userDoc.data();

    // Handle GET request for profile
    if (req.method === 'GET') {
      return res.status(200).json({
        _id: uid,
        name: userData.name,
        email: userData.email,
        userState: userData.userState,
        personalityTraits: userData.personalityTraits,
        emotionalIntelligence: userData.emotionalIntelligence,
        relationshipValues: userData.relationshipValues,
        lifeGoals: userData.lifeGoals,
        communicationStyle: userData.communicationStyle,
        interests: userData.interests,
        bio: userData.bio,
        gender: userData.gender,
        interestedIn: userData.interestedIn,
        dateOfBirth: userData.dateOfBirth,
        location: userData.location
      });
    }

    // Handle PUT request for updating profile
    if (req.method === 'PUT') {
      const updates = req.body;
      
      // Update user data
      const updatedUserData = {
        ...userData,
        ...updates,
        updatedAt: new Date()
      };
      
      // Save updated data to Firestore
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, updatedUserData);
      
      return res.status(200).json({
        _id: uid,
        name: updatedUserData.name,
        email: updatedUserData.email,
        bio: updatedUserData.bio
      });
    }

    // Handle unsupported methods
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(401).json({ message: 'Not authorized', error: error.message });
  }
}; 