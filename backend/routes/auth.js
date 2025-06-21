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

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/onboarding', protect, completeOnboarding);
router.post('/logout', protect, logoutUser);

module.exports = router; 