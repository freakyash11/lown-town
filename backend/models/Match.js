const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'pinned', 'ended'],
    default: 'active'
  },
  pinnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  unpinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  compatibilityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  compatibilityFactors: {
    personalityTraits: Number,
    emotionalIntelligence: Number,
    relationshipValues: Number,
    lifeGoals: Number,
    communicationStyle: Number,
    interests: Number
  },
  messageCount: {
    type: Number,
    default: 0
  },
  videoCallUnlocked: {
    type: Boolean,
    default: false
  },
  lastMessageAt: Date,
  endReason: {
    type: String,
    enum: ['unpin', 'timeout', 'admin', 'mutual']
  },
  feedback: {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    categories: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  pinnedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Create index for efficient queries
MatchSchema.index({ users: 1 });
MatchSchema.index({ status: 1, createdAt: -1 });

// Static method to find active match for a user
MatchSchema.statics.findActiveMatch = async function(userId) {
  return await this.findOne({
    users: userId,
    status: { $in: ['active', 'pinned'] }
  }).populate('users', 'name profilePicture');
};

// Static method to check if users can be matched (no active matches)
MatchSchema.statics.canBeMatched = async function(userId) {
  const activeMatch = await this.findOne({
    users: userId,
    status: { $in: ['active', 'pinned'] }
  });
  
  return !activeMatch;
};

// Method to update message count
MatchSchema.methods.incrementMessageCount = async function() {
  this.messageCount += 1;
  this.lastMessageAt = new Date();
  
  // Check if video call should be unlocked (100 messages in 48 hours)
  if (this.messageCount >= 100) {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    if (this.createdAt >= fortyEightHoursAgo || this.pinnedAt >= fortyEightHoursAgo) {
      this.videoCallUnlocked = true;
    }
  }
  
  return await this.save();
};

const Match = mongoose.model('Match', MatchSchema);

module.exports = Match; 