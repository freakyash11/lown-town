const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, arrayUnion } = require('firebase/firestore');
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
  res.setHeader('Access-Control-Allow-Methods', 'PUT,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle PUT request for pinning a match
  if (req.method === 'PUT') {
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
      
      // Get match ID from URL
      const matchId = req.query.matchId;
      if (!matchId) {
        return res.status(400).json({ message: 'Match ID is required' });
      }
      
      // Get match data from Firestore
      const matchRef = doc(db, 'matches', matchId);
      const matchDoc = await getDoc(matchRef);
      
      if (!matchDoc.exists()) {
        return res.status(404).json({ message: 'Match not found' });
      }
      
      const matchData = matchDoc.data();
      
      // Check if user is part of this match
      if (!matchData.users.includes(uid)) {
        return res.status(403).json({ message: 'Not authorized to pin this match' });
      }
      
      // Add user to pinnedBy array if not already there
      if (!matchData.pinnedBy || !matchData.pinnedBy.includes(uid)) {
        await updateDoc(matchRef, {
          pinnedBy: arrayUnion(uid)
        });
      }
      
      // Get updated match data
      const updatedMatchDoc = await getDoc(matchRef);
      const updatedMatchData = updatedMatchDoc.data();
      
      return res.status(200).json({
        match: {
          _id: matchId,
          ...updatedMatchData
        },
        message: 'Match pinned successfully'
      });
    } catch (error) {
      console.error('Pin match error:', error);
      
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