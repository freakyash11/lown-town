const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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
const auth = getAuth(app);
const db = getFirestore(app);

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

  // Handle POST request for login
  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUid = userCredential.user.uid;
      
      // Get ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Get additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUid));
      
      if (!userDoc.exists()) {
        return res.status(404).json({ message: 'User profile not found' });
      }
      
      const userData = userDoc.data();

      return res.status(200).json({
        _id: firebaseUid,
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
        token: idToken
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(401).json({ message: 'Invalid email or password', error: error.message });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}; 