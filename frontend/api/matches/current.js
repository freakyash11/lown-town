const { doc, getDoc } = require('firebase/firestore');
const { db, setCorsHeaders, handlePreflight, verifyAuthToken } = require('../utils/firebase');

module.exports = async (req, res) => {
  // Set CORS headers
  setCorsHeaders(res);

  // Handle OPTIONS request (preflight)
  if (handlePreflight(req, res)) {
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
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
    
    // Check if user has a current match
    if (!userData.currentMatch) {
      return res.status(404).json({ message: 'No current match found' });
    }
    
    // Get the match document
    const matchDoc = await getDoc(doc(db, 'matches', userData.currentMatch));
    
    if (!matchDoc.exists()) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    const matchData = matchDoc.data();
    
    // Get the matched user ID (the one that's not the current user)
    const matchedUserId = matchData.users[0] === uid ? matchData.users[1] : matchData.users[0];
    
    // Get the matched user's data
    const matchedUserDoc = await getDoc(doc(db, 'users', matchedUserId));
    
    if (!matchedUserDoc.exists()) {
      return res.status(404).json({ message: 'Matched user not found' });
    }
    
    const matchedUserData = matchedUserDoc.data();
    
    // Return the match data with the matched user's information
    return res.status(200).json({
      _id: matchData._id,
      matchDate: matchData.matchDate,
      status: matchData.status,
      compatibilityScore: matchData.compatibilityScore,
      matchedUser: {
        _id: matchedUserId,
        name: matchedUserData.name,
        bio: matchedUserData.bio,
        interests: matchedUserData.interests,
        personalityTraits: matchedUserData.personalityTraits
      }
    });
  } catch (error) {
    console.error('Get current match error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 