const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

  // Handle POST request for registration
  if (req.method === 'POST') {
    try {
      const {
        email,
        password,
        name,
        dateOfBirth,
        gender,
        interestedIn,
        location,
        bio
      } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ message: 'Email, password, and name are required' });
      }

      // Default values for personality traits
      const defaultPersonalityTraits = {
        openness: Math.floor(Math.random() * 5) + 5, // 5-10
        conscientiousness: Math.floor(Math.random() * 5) + 5,
        extraversion: Math.floor(Math.random() * 5) + 5,
        agreeableness: Math.floor(Math.random() * 5) + 5,
        neuroticism: Math.floor(Math.random() * 5) + 3 // 3-8
      };

      // Default values for emotional intelligence
      const defaultEmotionalIntelligence = {
        selfAwareness: Math.floor(Math.random() * 5) + 5,
        empathy: Math.floor(Math.random() * 5) + 5,
        socialSkills: Math.floor(Math.random() * 5) + 5,
        emotionalRegulation: Math.floor(Math.random() * 5) + 5
      };

      // Default values for relationship values
      const defaultRelationshipValues = {
        commitment: Math.floor(Math.random() * 5) + 5,
        loyalty: Math.floor(Math.random() * 5) + 5,
        honesty: Math.floor(Math.random() * 5) + 5,
        communication: Math.floor(Math.random() * 5) + 5,
        independence: Math.floor(Math.random() * 5) + 5,
        affection: Math.floor(Math.random() * 5) + 5
      };

      // Default values for life goals
      const defaultLifeGoals = {
        career: Math.floor(Math.random() * 5) + 5,
        family: Math.floor(Math.random() * 5) + 5,
        personalGrowth: Math.floor(Math.random() * 5) + 5,
        adventure: Math.floor(Math.random() * 5) + 5,
        stability: Math.floor(Math.random() * 5) + 5
      };

      // Default values for communication style
      const defaultCommunicationStyle = {
        directness: Math.floor(Math.random() * 5) + 5,
        conflictResolution: Math.floor(Math.random() * 5) + 5,
        expressiveness: Math.floor(Math.random() * 5) + 5,
        listening: Math.floor(Math.random() * 5) + 5
      };

      // Default interests based on gender
      const defaultInterests = gender === 'male' 
        ? ['sports', 'technology', 'movies', 'travel'] 
        : ['reading', 'art', 'music', 'travel'];

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Update profile with name
      await updateProfile(userCredential.user, { displayName: name });

      // Get ID token
      const idToken = await userCredential.user.getIdToken();

      // Create user data for Firestore
      const userData = {
        _id: uid,
        email,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
        gender: gender || 'not specified',
        interestedIn: interestedIn || 'not specified',
        location: location || { type: 'Point', coordinates: [0, 0] },
        bio: bio || `Hi, I'm ${name}!`,
        personalityTraits: defaultPersonalityTraits,
        emotionalIntelligence: defaultEmotionalIntelligence,
        relationshipValues: defaultRelationshipValues,
        lifeGoals: defaultLifeGoals,
        communicationStyle: defaultCommunicationStyle,
        interests: defaultInterests,
        userState: 'available',
        stateTimestamps: {
          availableForMatchingSince: new Date()
        },
        createdAt: new Date()
      };

      // Save user data to Firestore
      await setDoc(doc(db, 'users', uid), userData);

      return res.status(201).json({
        _id: uid,
        name: userData.name,
        email: userData.email,
        userState: userData.userState,
        token: idToken
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({ message: 'Method not allowed' });
}; 