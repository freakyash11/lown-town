const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
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

  // Handle GET request for current match
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
      
      // Get current user data
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // For this demo, we'll just return the last match from daily.js
      // In a real application, you would query a matches collection
      
      // Get the most recent match for this user
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef,
        where('users', 'array-contains', uid),
        where('status', '==', 'active')
      );
      
      const matchesSnapshot = await getDocs(matchQuery);
      
      if (matchesSnapshot.empty) {
        return res.status(404).json({ message: 'No active match found' });
      }
      
      // Get the most recent match
      let currentMatch = null;
      let latestDate = new Date(0);
      
      matchesSnapshot.forEach(doc => {
        const matchData = doc.data();
        const matchDate = matchData.createdAt ? new Date(matchData.createdAt.seconds * 1000) : new Date(0);
        
        if (matchDate > latestDate) {
          latestDate = matchDate;
          currentMatch = {
            _id: doc.id,
            ...matchData
          };
        }
      });
      
      if (!currentMatch) {
        return res.status(404).json({ message: 'No active match found' });
      }
      
      // Get the match partner (the other user in the match)
      const matchPartnerId = currentMatch.users.find(id => id !== uid);
      const matchPartnerDoc = await getDoc(doc(db, 'users', matchPartnerId));
      
      if (!matchPartnerDoc.exists()) {
        return res.status(404).json({ message: 'Match partner not found' });
      }
      
      const matchPartnerData = matchPartnerDoc.data();
      
      // Return match data
      return res.status(200).json({
        match: {
          _id: currentMatch._id,
          status: currentMatch.status,
          createdAt: currentMatch.createdAt,
          users: currentMatch.users
        },
        matchPartner: {
          _id: matchPartnerId,
          name: matchPartnerData.name,
          bio: matchPartnerData.bio,
          interests: matchPartnerData.interests
        }
      });
    } catch (error) {
      console.error('Get current match error:', error);
      
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