const Message = require('../models/FirebaseMessage');
const Match = require('../models/FirebaseMatch');
const User = require('../models/FirebaseUser');

// @desc    Get messages between current user and match
// @route   GET /api/messages/:userId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const matchUserId = req.params.userId;
    
    // Verify that these users have an active match
    const match = await Match.findOne({
      users: { $all: [currentUserId, matchUserId] },
      status: { $in: ['active', 'pinned'] }
    });
    
    if (!match) {
      return res.status(404).json({ message: 'No active match found with this user' });
    }
    
    // Get messages between users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: matchUserId },
        { sender: matchUserId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 }); // Ascending order by time
    
    // Mark all received messages as read
    await Message.updateMany(
      { sender: matchUserId, recipient: currentUserId, read: false },
      { read: true }
    );
    
    res.json(messages);
    
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a message to match
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user._id;
    
    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }
    
    // Verify that these users have an active match
    const match = await Match.findOne({
      users: { $all: [senderId, recipientId] },
      status: { $in: ['active', 'pinned'] }
    });
    
    if (!match) {
      return res.status(404).json({ message: 'No active match found with this user' });
    }
    
    // Create and save message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content
    });
    
    await message.save();
    
    // Update match message count and check for video call unlock
    await match.incrementMessageCount();
    
    // Check if video call milestone is reached (100 messages in 48 hours)
    const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const messageCount = await Message.countMessagesBetweenUsers(senderId, recipientId, fortyEightHours);
    
    const videoCallUnlocked = messageCount >= 100;
    
    res.status(201).json({
      message,
      videoCallUnlocked
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
const markMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const senderId = req.params.userId;
    
    // Mark all messages from sender to current user as read
    const result = await Message.updateMany(
      { sender: senderId, recipient: currentUserId, read: false },
      { read: true }
    );
    
    res.json({
      message: `Marked ${result.nModified} messages as read`,
      count: result.nModified
    });
    
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await Message.countDocuments({
      recipient: userId,
      read: false
    });
    
    res.json({ count });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check if video call is unlocked
// @route   GET /api/messages/video-status/:userId
// @access  Private
const checkVideoCallStatus = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const matchUserId = req.params.userId;
    
    // Verify that these users have an active match
    const match = await Match.findOne({
      users: { $all: [currentUserId, matchUserId] },
      status: { $in: ['active', 'pinned'] }
    });
    
    if (!match) {
      return res.status(404).json({ message: 'No active match found with this user' });
    }
    
    // Check if video call is already unlocked in the match
    if (match.videoCallUnlocked) {
      return res.json({ videoCallUnlocked: true });
    }
    
    // Check message count in the last 48 hours
    const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const messageCount = await Message.countMessagesBetweenUsers(currentUserId, matchUserId, fortyEightHours);
    
    const videoCallUnlocked = messageCount >= 100;
    
    // Update match if video call is now unlocked
    if (videoCallUnlocked && !match.videoCallUnlocked) {
      match.videoCallUnlocked = true;
      await match.save();
    }
    
    res.json({
      videoCallUnlocked,
      messageCount,
      requiredCount: 100,
      remaining: Math.max(0, 100 - messageCount)
    });
    
  } catch (error) {
    console.error('Check video call status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  checkVideoCallStatus
}; 