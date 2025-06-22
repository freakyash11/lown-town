const express = require('express');
const router = express.Router();
const { 
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  completeOnboarding,
  logoutUser,
  forgotPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { corsWithOptions, handlePreflight } = require('../middlewares/cors');

// Apply CORS preflight handler to all routes in this router
router.use(handlePreflight);

// Public routes
router.post('/register', corsWithOptions, registerUser);
router.post('/login', corsWithOptions, loginUser);
router.post('/forgot-password', corsWithOptions, forgotPassword);

// Protected routes
router.get('/profile', corsWithOptions, protect, getUserProfile);
router.put('/profile', corsWithOptions, protect, updateUserProfile);
router.post('/onboarding', corsWithOptions, protect, completeOnboarding);
router.post('/logout', corsWithOptions, protect, logoutUser);

module.exports = router; 