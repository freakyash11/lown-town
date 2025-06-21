const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');
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

  // Handle GET request for match history
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
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get match history for this user
      const matchesRef = collection(db, 'matches');
      const matchQuery = query(
        matchesRef,
        where('users', 'array-contains', uid)
      );
      
      const matchesSnapshot = await getDocs(matchQuery);
      
      if (matchesSnapshot.empty) {
        return res.status(200).json([]);
      }
      
      // Process matches and get partner info
      const matches = [];
      const partnerPromises = [];
      
      matchesSnapshot.forEach(doc => {
        const matchData = doc.data();
        const match = {
          _id: doc.id,
          ...matchData,
          partner: null
        };
        
        // Find partner ID
        const partnerId = matchData.users.find(id => id !== uid);
        
        // Add promise to get partner info
        partnerPromises.push(
          getDoc(doc(db, 'users', partnerId))
            .then(partnerDoc => {
              if (partnerDoc.exists()) {
                const partnerData = partnerDoc.data();
                match.partner = {
                  _id: partnerId,
                  name: partnerData.name,
                  bio: partnerData.bio,
                  interests: partnerData.interests
                };
              }
              return match;
            })
        );
        
        matches.push(match);
      });
      
      // Wait for all partner info to be fetched
      await Promise.all(partnerPromises);
      
      // Sort by creation date (newest first)
      matches.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt.seconds * 1000) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt.seconds * 1000) : new Date(0);
        return dateB - dateA;
      });
      
      return res.status(200).json(matches);
    } catch (error) {
      console.error('Get match history error:', error);
      
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