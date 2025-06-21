const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// @desc    Get user state
// @route   GET /api/users/state
// @access  Private
router.get('/state', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('userState stateTimestamps');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if frozen period has passed
    if (user.userState === 'frozen') {
      const now = new Date();
      const frozenUntil = user.stateTimestamps.frozenUntil;
      
      if (frozenUntil && frozenUntil <= now) {
        // Update user state
        user.userState = 'available';
        user.stateTimestamps.availableForMatchingSince = now;
        await user.save();
      }
    }
    
    res.json({
      userState: user.userState,
      stateTimestamps: user.stateTimestamps
    });
    
  } catch (error) {
    console.error('Get user state error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 