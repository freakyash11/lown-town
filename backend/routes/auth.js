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

// Handle preflight requests
router.options('*', (req, res) => {
  console.log('Auth route OPTIONS request received');
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://lown-town.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

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