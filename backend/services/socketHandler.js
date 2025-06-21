const User = require('../models/User');
const Match = require('../models/Match');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

/**
 * Socket.io handler for real-time messaging and connection management
 * @param {Object} socket - Socket.io socket object
 */
const socketHandler = (socket) => {
  console.log(`New socket connection: ${socket.id}`);
  let currentUser = null;
  
  // Authenticate user with token
  socket.on('authenticate', async (token) => {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lonetown_secret_key');
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        socket.emit('error', { message: 'Authentication failed' });
        return;
      }
      
      // Store user in socket
      currentUser = user;
      
      // Join user's room
      socket.join(user._id.toString());
      
      // Notify client of successful authentication
      socket.emit('authenticated', { user: { id: user._id, name: user.name } });
      
      console.log(`User authenticated: ${user.name} (${user._id})`);
      
      // Get active match if exists
      const activeMatch = await Match.findActiveMatch(user._id);
      if (activeMatch) {
        socket.emit('match_status', { match: activeMatch });
      }
      
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
  
  // Handle private messages
  socket.on('private_message', async (data) => {
    try {
      if (!currentUser) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { recipientId, content } = data;
      
      // Validate recipient
      if (!recipientId || !content) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }
      
      // Check if users are matched
      const match = await Match.findOne({
        users: { $all: [currentUser._id, recipientId] },
        status: { $in: ['active', 'pinned'] }
      });
      
      if (!match) {
        socket.emit('error', { message: 'No active match with this user' });
        return;
      }
      
      // Create and save message
      const message = new Message({
        sender: currentUser._id,
        recipient: recipientId,
        content
      });
      
      await message.save();
      
      // Increment message count in match
      await match.incrementMessageCount();
      
      // Check if video call milestone is reached
      if (match.videoCallUnlocked) {
        socket.emit('video_call_unlocked');
        socket.to(recipientId).emit('video_call_unlocked');
      }
      
      // Broadcast message to recipient
      const messageData = {
        _id: message._id,
        sender: {
          _id: currentUser._id,
          name: currentUser.name
        },
        content: message.content,
        createdAt: message.createdAt
      };
      
      socket.emit('message_sent', messageData);
      socket.to(recipientId).emit('new_message', messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle message read status
  socket.on('mark_read', async (messageId) => {
    try {
      if (!currentUser) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const message = await Message.findById(messageId);
      
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
      
      // Ensure the current user is the recipient
      if (message.recipient.toString() !== currentUser._id.toString()) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Mark as read
      message.read = true;
      await message.save();
      
      // Notify sender that message was read
      socket.to(message.sender.toString()).emit('message_read', { messageId });
      
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('error', { message: 'Failed to mark message as read' });
    }
  });
  
  // Handle pin/unpin actions
  socket.on('pin_match', async (matchId) => {
    try {
      if (!currentUser) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const match = await Match.findById(matchId);
      
      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }
      
      // Check if user is part of the match
      if (!match.users.includes(currentUser._id)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Add user to pinnedBy array if not already there
      if (!match.pinnedBy.includes(currentUser._id)) {
        match.pinnedBy.push(currentUser._id);
      }
      
      // If both users have pinned, update match status
      if (match.pinnedBy.length === 2) {
        match.status = 'pinned';
        match.pinnedAt = new Date();
        
        // Update both users' state
        for (const userId of match.users) {
          await User.findByIdAndUpdate(userId, {
            userState: 'pinned',
            'stateTimestamps.lastPinned': new Date()
          });
          
          // Notify the other user
          if (userId.toString() !== currentUser._id.toString()) {
            socket.to(userId.toString()).emit('match_pinned', { match });
          }
        }
      }
      
      await match.save();
      
      socket.emit('pin_confirmed', { match });
      
    } catch (error) {
      console.error('Error pinning match:', error);
      socket.emit('error', { message: 'Failed to pin match' });
    }
  });
  
  socket.on('unpin_match', async (data) => {
    try {
      if (!currentUser) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { matchId, feedback } = data;
      
      const match = await Match.findById(matchId);
      
      if (!match) {
        socket.emit('error', { message: 'Match not found' });
        return;
      }
      
      // Check if user is part of the match
      if (!match.users.includes(currentUser._id)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }
      
      // Update match
      match.status = 'ended';
      match.endReason = 'unpin';
      match.unpinnedBy = currentUser._id;
      match.endedAt = new Date();
      
      // Add feedback if provided
      if (feedback) {
        match.feedback = {
          fromUser: currentUser._id,
          content: feedback.content,
          categories: feedback.categories || []
        };
      }
      
      await match.save();
      
      // Get the other user's ID
      const otherUserId = match.users.find(id => id.toString() !== currentUser._id.toString());
      
      // Update current user's state - frozen for 24 hours
      const frozenUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      await User.findByIdAndUpdate(currentUser._id, {
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
      
      // Notify both users
      socket.emit('match_unpinned', { 
        frozenUntil,
        message: 'You have unpinned this match. You can receive a new match in 24 hours.'
      });
      
      socket.to(otherUserId.toString()).emit('match_unpinned_by_other', {
        availableAfter,
        feedback: match.feedback,
        message: 'Your match has unpinned. You will receive a new match in 2 hours.'
      });
      
    } catch (error) {
      console.error('Error unpinning match:', error);
      socket.emit('error', { message: 'Failed to unpin match' });
    }
  });
  
  // Handle typing indicators
  socket.on('typing_start', (recipientId) => {
    if (!currentUser) return;
    socket.to(recipientId).emit('typing_start', { userId: currentUser._id });
  });
  
  socket.on('typing_stop', (recipientId) => {
    if (!currentUser) return;
    socket.to(recipientId).emit('typing_stop', { userId: currentUser._id });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (currentUser) {
      socket.to(currentUser._id.toString()).emit('user_offline');
    }
  });
};

module.exports = socketHandler; 