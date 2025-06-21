const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for efficient message retrieval
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Static method to count messages between users in a given time period
MessageSchema.statics.countMessagesBetweenUsers = async function(user1Id, user2Id, timeFrame) {
  const startTime = new Date(Date.now() - timeFrame);
  
  return await this.countDocuments({
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ],
    createdAt: { $gte: startTime }
  });
};

// Static method to check if video call milestone is reached (100 messages in 48 hours)
MessageSchema.statics.checkVideoCallMilestone = async function(user1Id, user2Id) {
  const fortyEightHours = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
  const messageCount = await this.countMessagesBetweenUsers(user1Id, user2Id, fortyEightHours);
  
  return messageCount >= 100;
};

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message; 