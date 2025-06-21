const Match = require('../models/FirebaseMatch');
const User = require('../models/FirebaseUser');
const Message = require('../models/FirebaseMessage');
const compatibilityAlgorithm = require('../services/compatibilityAlgorithm');

// @desc    Get daily match for user
// @route   GET /api/matches/daily
// @access  Private
const getDailyMatch = async (req, res) => {
  try {
    console.log('getDailyMatch controller called');
    
    // Ensure user is available in request
    if (!req.user || !req.user._id) {
      console.error('User not found in request');
      return res.status(401).json({ message: 'User not authenticated properly' });
    }
    
    const userId = req.user._id;
    console.log(`User ID: ${userId}`);
    
    // Check if user already has an active match
    const existingMatch = await Match.findOne({
      users: userId,
      status: { $in: ['active', 'pinned'] }
    }).populate('users', 'name profilePicture bio');
    
    if (existingMatch) {
      console.log(`User already has an active match: ${existingMatch._id}`);
      return res.json({ match: existingMatch });
    }
    
    // Check if user is in frozen state
    const user = await User.findById(userId);
    
    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`User state: ${user.userState}`);
    
    if (user.userState === 'frozen') {
      const now = new Date();
      const frozenUntil = user.stateTimestamps?.frozenUntil;
      
      if (frozenUntil && frozenUntil > now) {
        const timeRemaining = Math.ceil((frozenUntil - now) / (1000 * 60 * 60)); // hours remaining
        console.log(`User is frozen for ${timeRemaining} more hours`);
        return res.json({
          message: `You are in reflection period. New matches will be available in ${timeRemaining} hours.`,
          frozenUntil
        });
      } else {
        // Update user state if frozen period has passed
        console.log('Frozen period has passed, updating user state to available');
        await User.findByIdAndUpdate(userId, {
          userState: 'available',
          'stateTimestamps.availableForMatchingSince': new Date()
        });
        
        // Update local user object
        user.userState = 'available';
      }
    }
    
    // Check if user is available for new match
    if (user.userState !== 'available') {
      console.log(`User is not available for matching. Current state: ${user.userState}`);
      return res.status(400).json({
        message: 'You are not available for new matches at this time.'
      });
    }
    
    // Find a new match for the user
    console.log('Finding a new match for the user');
    const newMatch = await compatibilityAlgorithm.findDailyMatch(userId);
    
    if (!newMatch) {
      console.log('No compatible match found');
      return res.json({
        message: 'No compatible matches found today. Please check back later.'
      });
    }
    
    // Populate user details
    const populatedMatch = await Match.findById(newMatch._id).populate('users', 'name profilePicture bio');
    console.log(`New match found and populated: ${populatedMatch._id}`);
    
    return res.json({
      match: populatedMatch,
      message: 'New match found!'
    });
    
  } catch (error) {
    console.error('Get daily match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current match details
// @route   GET /api/matches/current
// @access  Private
const getCurrentMatch = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find active match
    const match = await Match.findOne({
      users: userId,
      status: { $in: ['active', 'pinned'] }
    }).populate('users', 'name profilePicture bio');
    
    if (!match) {
      return res.status(404).json({ message: 'No active match found' });
    }
    
    // Get match partner
    const matchPartner = match.users.find(user => user._id.toString() !== userId.toString());
    
    // Get recent messages
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: matchPartner._id },
        { sender: matchPartner._id, recipient: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    // Check if video call is unlocked
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const messageCount = await Message.countMessagesBetweenUsers(
      userId,
      matchPartner._id,
      48 * 60 * 60 * 1000 // 48 hours in milliseconds
    );
    
    const videoCallUnlocked = messageCount >= 100;
    
    res.json({
      match,
      matchPartner,
      messages: messages.reverse(),
      messageCount,
      videoCallUnlocked
    });
    
  } catch (error) {
    console.error('Get current match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Pin a match
// @route   PUT /api/matches/:id/pin
// @access  Private
const pinMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Add user to pinnedBy array if not already there
    if (!match.pinnedBy.includes(userId)) {
      match.pinnedBy.push(userId);
    }
    
    // If both users have pinned, update match status
    if (match.pinnedBy.length === 2) {
      match.status = 'pinned';
      match.pinnedAt = new Date();
      
      // Update both users' state
      for (const matchUserId of match.users) {
        await User.findByIdAndUpdate(matchUserId, {
          userState: 'pinned',
          'stateTimestamps.lastPinned': new Date()
        });
      }
    }
    
    await match.save();
    
    res.json({
      match,
      message: match.status === 'pinned' ? 'Match pinned by both users!' : 'You pinned this match!'
    });
    
  } catch (error) {
    console.error('Pin match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Unpin a match
// @route   PUT /api/matches/:id/unpin
// @access  Private
const unpinMatch = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;
    const { feedback } = req.body;
    
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update match
    match.status = 'ended';
    match.endReason = 'unpin';
    match.unpinnedBy = userId;
    match.endedAt = new Date();
    
    // Add feedback if provided
    if (feedback) {
      match.feedback = {
        fromUser: userId,
        content: feedback.content,
        categories: feedback.categories || []
      };
    }
    
    await match.save();
    
    // Get the other user's ID
    const otherUserId = match.users.find(id => id.toString() !== userId.toString());
    
    // Update current user's state - frozen for 24 hours
    const frozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await User.findByIdAndUpdate(userId, {
      userState: 'frozen',
      'stateTimestamps.frozenUntil': frozenUntil,
      currentMatch: null
    });
    
    // Update other user's state - available in 2 hours
    const availableAfter = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
    await User.findByIdAndUpdate(otherUserId, {
      userState: 'available',
      'stateTimestamps.availableForMatchingSince': availableAfter,
      currentMatch: null
    });
    
    res.json({
      message: 'Match unpinned. You will be in reflection period for 24 hours.',
      frozenUntil
    });
    
  } catch (error) {
    console.error('Unpin match error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get match history
// @route   GET /api/matches/history
// @access  Private
const getMatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const matches = await Match.find({
      users: userId,
      status: 'ended'
    })
    .populate('users', 'name profilePicture')
    .populate('unpinnedBy', 'name')
    .sort({ endedAt: -1 });
    
    res.json(matches);
    
  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get match feedback
// @route   GET /api/matches/:id/feedback
// @access  Private
const getMatchFeedback = async (req, res) => {
  try {
    const matchId = req.params.id;
    const userId = req.user._id;
    
    const match = await Match.findById(matchId)
      .populate('feedback.fromUser', 'name');
    
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }
    
    // Check if user is part of the match
    if (!match.users.includes(userId)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Check if feedback exists and was not from the requesting user
    if (!match.feedback || match.feedback.fromUser.toString() === userId.toString()) {
      return res.status(404).json({ message: 'No feedback available' });
    }
    
    res.json(match.feedback);
    
  } catch (error) {
    console.error('Get match feedback error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDailyMatch,
  getCurrentMatch,
  pinMatch,
  unpinMatch,
  getMatchHistory,
  getMatchFeedback
}; 