const User = require('../models/FirebaseUser');
const { adminAuth } = require('../config/firebase-admin');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Get user from Firestore
      const user = await User.findById(uid);
      
      if (!user) {
        console.error('User not found with Firebase UID:', uid);
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Add user and token data to request
      req.user = user;
      req.firebaseUser = decodedToken;
      req.token = token;
      
      return next();
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  }

  if (!token) {
    console.error('No token provided');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = async (req, res, next) => {
  try {
    // Check if user has admin custom claim
    if (req.firebaseUser && req.firebaseUser.admin === true) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as an admin' });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ message: 'Not authorized', error: error.message });
  }
};

module.exports = { protect, admin }; 