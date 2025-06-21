const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle GET request for profile
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
      
      const userData = userDoc.data();

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
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(401).json({ message: 'Not authorized', error: error.message });
    }
  }

  // Handle PUT request for updating profile
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
      
      // Get user data from Firestore
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const userData = userDoc.data();
      const updates = req.body;
      
      // Update user data
      const updatedUserData = {
        ...userData,
        ...updates,
        updatedAt: new Date()
      };
      
      // Save updated data to Firestore
      await setDoc(userRef, updatedUserData);
      
      return res.status(200).json({
        _id: uid,
        name: updatedUserData.name,
        email: updatedUserData.email,
        bio: updatedUserData.bio
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}; 