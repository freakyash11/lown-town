// const User = require('../models/User');
const User = require('../models/FirebaseUser');
const jwt = require('jsonwebtoken');
const firebaseAuthService = require('../services/firebaseAuthService');
const { adminAuth } = require('../config/firebase-admin');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'lonetown_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
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

    // Check if user already exists in Firestore
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
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

    // Default interests based on gender (just for demonstration)
    const defaultInterests = gender === 'male' 
      ? ['sports', 'technology', 'movies', 'travel'] 
      : ['reading', 'art', 'music', 'travel'];

    // Create user with Firebase Auth
    const firebaseUser = await firebaseAuthService.registerUser(email, password, { name });
    const uid = firebaseUser.uid;

    // Create user data for Firestore
    const userData = {
      _id: uid, // Use Firebase UID as document ID
      email,
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      interestedIn,
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
      }
    };

    // Create user in Firestore
    const user = new User(userData);
    await user.save();

    // Generate custom token for client authentication
    const token = await firebaseAuthService.createCustomToken(uid);

    res.status(201).json({
      _id: uid,
      name: user.name,
      email: user.email,
      userState: user.userState,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if user exists in Firestore
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Get Firebase user
    const firebaseUser = await firebaseAuthService.getUserByEmail(email);
    const uid = firebaseUser.uid;

    // Generate custom token for client authentication
    const token = await firebaseAuthService.createCustomToken(uid);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      userState: user.userState,
      personalityTraits: user.personalityTraits,
      emotionalIntelligence: user.emotionalIntelligence,
      relationshipValues: user.relationshipValues,
      lifeGoals: user.lifeGoals,
      communicationStyle: user.communicationStyle,
      interests: user.interests,
      bio: user.bio,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: 'Invalid email or password', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    const user = req.user;

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        userState: user.userState,
        personalityTraits: user.personalityTraits,
        emotionalIntelligence: user.emotionalIntelligence,
        relationshipValues: user.relationshipValues,
        lifeGoals: user.lifeGoals,
        communicationStyle: user.communicationStyle,
        interests: user.interests,
        bio: user.bio,
        gender: user.gender,
        interestedIn: user.interestedIn,
        dateOfBirth: user.dateOfBirth,
        location: user.location
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    // User is already attached to req by the auth middleware
    const user = req.user;
    const uid = user._id;

    if (user) {
      // Update Firebase Auth profile if name or email changed
      const authUpdateData = {};
      
      if (req.body.name && req.body.name !== user.name) {
        authUpdateData.displayName = req.body.name;
      }
      
      if (req.body.email && req.body.email !== user.email) {
        authUpdateData.email = req.body.email;
      }
      
      // Update password if provided
      if (req.body.password) {
        authUpdateData.password = req.body.password;
      }
      
      // Update Firebase Auth user if needed
      if (Object.keys(authUpdateData).length > 0) {
        await firebaseAuthService.updateUser(uid, authUpdateData);
      }
      
      // Update Firestore user data
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.bio = req.body.bio || user.bio;
      
      if (req.body.location) {
        user.location = req.body.location;
      }
      
      if (req.body.personalityTraits) {
        user.personalityTraits = {
          ...user.personalityTraits,
          ...req.body.personalityTraits
        };
      }
      
      if (req.body.emotionalIntelligence) {
        user.emotionalIntelligence = {
          ...user.emotionalIntelligence,
          ...req.body.emotionalIntelligence
        };
      }
      
      if (req.body.relationshipValues) {
        user.relationshipValues = {
          ...user.relationshipValues,
          ...req.body.relationshipValues
        };
      }
      
      if (req.body.lifeGoals) {
        user.lifeGoals = {
          ...user.lifeGoals,
          ...req.body.lifeGoals
        };
      }
      
      if (req.body.communicationStyle) {
        user.communicationStyle = {
          ...user.communicationStyle,
          ...req.body.communicationStyle
        };
      }
      
      if (req.body.interests) {
        user.interests = req.body.interests;
      }

      const updatedUser = await user.save();
      
      // Generate a new custom token
      const token = await firebaseAuthService.createCustomToken(uid);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        token
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Complete onboarding questionnaire
// @route   POST /api/auth/onboarding
// @access  Private
const completeOnboarding = async (req, res) => {
  try {
    const {
      personalityTraits,
      emotionalIntelligence,
      relationshipValues,
      lifeGoals,
      communicationStyle,
      interests,
      bio
    } = req.body;

    // User is already attached to req by the auth middleware
    const user = req.user;

    if (user) {
      // Update user profile with onboarding data
      user.personalityTraits = personalityTraits;
      user.emotionalIntelligence = emotionalIntelligence;
      user.relationshipValues = relationshipValues;
      user.lifeGoals = lifeGoals;
      user.communicationStyle = communicationStyle;
      user.interests = interests;
      user.bio = bio || user.bio;
      
      // Set user as available for matching
      user.userState = 'available';
      user.stateTimestamps.availableForMatchingSince = new Date();

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        userState: updatedUser.userState,
        personalityTraits: updatedUser.personalityTraits,
        emotionalIntelligence: updatedUser.emotionalIntelligence,
        relationshipValues: updatedUser.relationshipValues,
        lifeGoals: updatedUser.lifeGoals,
        communicationStyle: updatedUser.communicationStyle,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        message: 'Onboarding completed successfully'
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // Firebase handles logout on client side
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    await firebaseAuthService.sendPasswordResetEmail(email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  completeOnboarding,
  logoutUser,
  forgotPassword
}; 