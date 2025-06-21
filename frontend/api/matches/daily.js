const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');
const admin = require('firebase-admin');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase Admin if not already initialized
let adminApp;
if (!admin.apps.length) {
  try {
    // Try to initialize with service account JSON if available
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      // Otherwise initialize with application default credentials
      adminApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Simple compatibility algorithm
const calculateCompatibility = (user1, user2) => {
  // Calculate compatibility based on personality traits
  let compatibilityScore = 50; // Start with a base score
  
  // Personality traits compatibility (opposites attract)
  if (user1.personalityTraits && user2.personalityTraits) {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    let traitPoints = 0;
    let traitCount = 0;
    
    traits.forEach(trait => {
      if (user1.personalityTraits[trait] !== undefined && user2.personalityTraits[trait] !== undefined) {
        // Traits closer to middle (5) are more compatible
        const diff = Math.abs(user1.personalityTraits[trait] - user2.personalityTraits[trait]);
        traitPoints += (10 - diff) / 2; // Max 5 points per trait
        traitCount++;
      }
    });
    
    if (traitCount > 0) {
      compatibilityScore += (traitPoints / traitCount) * 2; // Normalize and add up to 10 points
    }
  }
  
  // Relationship values compatibility (similar values are better)
  if (user1.relationshipValues && user2.relationshipValues) {
    const values = ['commitment', 'loyalty', 'honesty', 'communication', 'independence', 'affection'];
    let valuePoints = 0;
    let valueCount = 0;
    
    values.forEach(value => {
      if (user1.relationshipValues[value] !== undefined && user2.relationshipValues[value] !== undefined) {
        const diff = Math.abs(user1.relationshipValues[value] - user2.relationshipValues[value]);
        valuePoints += (10 - diff) / 2; // Max 5 points per value
        valueCount++;
      }
    });
    
    if (valueCount > 0) {
      compatibilityScore += (valuePoints / valueCount) * 2; // Normalize and add up to 10 points
    }
  }
  
  // Interests compatibility (shared interests are better)
  if (user1.interests && user2.interests && Array.isArray(user1.interests) && Array.isArray(user2.interests)) {
    const sharedInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );
    compatibilityScore += Math.min(30, sharedInterests.length * 5); // Up to 30 points for shared interests
  }
  
  return Math.min(100, Math.max(0, compatibilityScore));
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request for daily match
  if (req.method === 'GET') {
    try {
      // Get token from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      console.log('User ID:', uid);
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const currentUser = userDoc.data();
      console.log('Current user data:', currentUser.name);
      
      // Check if user already has an active match
      const matchesRef = collection(db, 'matches');
      const activeMatchQuery = query(
        matchesRef,
        where('users', 'array-contains', uid),
        where('status', '==', 'active')
      );
      
      const activeMatchSnapshot = await getDocs(activeMatchQuery);
      
      if (!activeMatchSnapshot.empty) {
        // User already has an active match
        let activeMatch = null;
        let matchPartner = null;
        
        // Get the first active match
        activeMatchSnapshot.forEach(doc => {
          activeMatch = {
            _id: doc.id,
            ...doc.data()
          };
        });
        
        console.log('Found active match:', activeMatch._id);
        
        // Get the match partner
        const matchPartnerId = activeMatch.users.find(id => id !== uid);
        const matchPartnerDoc = await getDoc(doc(db, 'users', matchPartnerId));
        
        if (matchPartnerDoc.exists()) {
          const matchPartnerData = matchPartnerDoc.data();
          matchPartner = {
            _id: matchPartnerId,
            name: matchPartnerData.name,
            bio: matchPartnerData.bio,
            interests: matchPartnerData.interests
          };
        }
        
        return res.status(200).json({
          message: 'You already have an active match',
          match: activeMatch,
          matchPartner: matchPartner
        });
      }
      
      // Find potential matches
      const usersRef = collection(db, 'users');
      let matchQuery;
      
      try {
        // Filter by gender preference if specified
        if (currentUser.interestedIn && currentUser.interestedIn !== 'not specified') {
          matchQuery = query(
            usersRef, 
            where('gender', '==', currentUser.interestedIn),
            where('userState', '==', 'available')
          );
        } else {
          matchQuery = query(
            usersRef, 
            where('userState', '==', 'available')
          );
        }
        
        const potentialMatchesSnapshot = await getDocs(matchQuery);
        console.log('Found potential matches:', potentialMatchesSnapshot.size);
        
        // Filter out the current user and calculate compatibility
        const potentialMatches = [];
        potentialMatchesSnapshot.forEach(matchDoc => {
          const matchData = matchDoc.data();
          if (matchDoc.id !== uid) {
            try {
              const compatibilityScore = calculateCompatibility(currentUser, matchData);
              potentialMatches.push({
                ...matchData,
                _id: matchDoc.id,
                compatibilityScore
              });
            } catch (err) {
              console.error('Error calculating compatibility for user:', matchDoc.id, err);
              // Skip this potential match
            }
          }
        });
        
        console.log('Filtered potential matches:', potentialMatches.length);
        
        // Sort by compatibility score and get the top match
        potentialMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        
        if (potentialMatches.length === 0) {
          return res.status(200).json({ message: 'No matches available at this time' });
        }
        
        const dailyMatch = potentialMatches[0];
        console.log('Selected daily match:', dailyMatch._id, 'with score:', dailyMatch.compatibilityScore);
        
        // Create a new match in Firestore
        const newMatch = {
          users: [uid, dailyMatch._id],
          status: 'active',
          createdAt: serverTimestamp(),
          compatibilityScore: dailyMatch.compatibilityScore,
          pinnedBy: []
        };
        
        const matchRef = await addDoc(collection(db, 'matches'), newMatch);
        console.log('Created new match with ID:', matchRef.id);
        
        // Return match data
        return res.status(200).json({
          match: {
            _id: matchRef.id,
            ...newMatch,
            createdAt: new Date()
          },
          matchPartner: {
            _id: dailyMatch._id,
            name: dailyMatch.name,
            bio: dailyMatch.bio,
            interests: dailyMatch.interests
          }
        });
      } catch (err) {
        console.error('Error in match finding process:', err);
        return res.status(500).json({ 
          message: 'Error finding matches', 
          error: err.message 
        });
      }
    } catch (error) {
      console.error('Get daily match error:', error);
      
      // If token verification fails, return 401
      if (error.code === 'auth/id-token-expired' || 
          error.code === 'auth/id-token-revoked' ||
          error.code === 'auth/invalid-id-token') {
        return res.status(401).json({ 
          message: 'Authentication token expired or invalid', 
          code: error.code 
        });
      }
      
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}; 