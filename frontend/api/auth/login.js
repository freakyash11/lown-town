const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc } = require('firebase/firestore');

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
      const user = userCredential.user;
      const uid = user.uid;

      // Get ID token
      const idToken = await user.getIdToken();

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      // If user doesn't exist in Firestore, create a basic profile
      if (!userDoc.exists()) {
        console.log('User exists in Auth but not in Firestore. Creating Firestore record.');
        
        // Default values for personality traits
        const defaultPersonalityTraits = {
          openness: Math.floor(Math.random() * 5) + 5,
          conscientiousness: Math.floor(Math.random() * 5) + 5,
          extraversion: Math.floor(Math.random() * 5) + 5,
          agreeableness: Math.floor(Math.random() * 5) + 5,
          neuroticism: Math.floor(Math.random() * 5) + 5
        };

        // Create user data for Firestore
        const userData = {
          _id: uid,
          email: user.email,
          name: user.displayName || email.split('@')[0],
          createdAt: new Date(),
          userState: 'available',
          needsOnboarding: true,
          personalityTraits: defaultPersonalityTraits,
          stateTimestamps: {
            availableForMatchingSince: new Date()
          }
        };

        // Save user data to Firestore
        await setDoc(doc(db, 'users', uid), userData);
        
        // Return user data with token and redirect to onboarding
        return res.status(200).json({
          _id: uid,
          name: userData.name,
          email: userData.email,
          userState: userData.userState,
          token: idToken,
          needsOnboarding: true,
          redirectTo: '/dashboard'
        });
      }
      
      // User exists in Firestore, return user data
      const userData = userDoc.data();
      
      // Determine where to redirect the user
      let redirectTo = '/dashboard';
      
      return res.status(200).json({
        _id: uid,
        name: userData.name,
        email: userData.email,
        userState: userData.userState,
        token: idToken,
        needsOnboarding: userData.needsOnboarding,
        redirectTo: redirectTo
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        return res.status(401).json({ message: 'Invalid email or password' });
      } else if (error.code === 'auth/too-many-requests') {
        return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
      } else if (error.code === 'auth/user-disabled') {
        return res.status(403).json({ message: 'This account has been disabled.' });
      }
      
      return res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}; 