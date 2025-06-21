const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'non-binary', 'other']
  },
  interestedIn: {
    type: [String],
    required: true,
    enum: ['male', 'female', 'non-binary', 'other']
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    city: String,
    country: String
  },
  profilePicture: String,
  bio: String,
  
  // Personality traits (Big Five)
  personalityTraits: {
    openness: { type: Number, min: 1, max: 10 },
    conscientiousness: { type: Number, min: 1, max: 10 },
    extraversion: { type: Number, min: 1, max: 10 },
    agreeableness: { type: Number, min: 1, max: 10 },
    neuroticism: { type: Number, min: 1, max: 10 }
  },
  
  // Emotional intelligence factors
  emotionalIntelligence: {
    selfAwareness: { type: Number, min: 1, max: 10 },
    empathy: { type: Number, min: 1, max: 10 },
    socialSkills: { type: Number, min: 1, max: 10 },
    emotionalRegulation: { type: Number, min: 1, max: 10 }
  },
  
  // Relationship values
  relationshipValues: {
    commitment: { type: Number, min: 1, max: 10 },
    loyalty: { type: Number, min: 1, max: 10 },
    honesty: { type: Number, min: 1, max: 10 },
    communication: { type: Number, min: 1, max: 10 },
    independence: { type: Number, min: 1, max: 10 },
    affection: { type: Number, min: 1, max: 10 }
  },
  
  // Life goals and aspirations
  lifeGoals: {
    career: { type: Number, min: 1, max: 10 },
    family: { type: Number, min: 1, max: 10 },
    personalGrowth: { type: Number, min: 1, max: 10 },
    adventure: { type: Number, min: 1, max: 10 },
    stability: { type: Number, min: 1, max: 10 }
  },
  
  // Communication style
  communicationStyle: {
    directness: { type: Number, min: 1, max: 10 },
    conflictResolution: { type: Number, min: 1, max: 10 },
    expressiveness: { type: Number, min: 1, max: 10 },
    listening: { type: Number, min: 1, max: 10 }
  },
  
  // Interests and hobbies (free-form tags)
  interests: [String],
  
  // User state management
  userState: {
    type: String,
    enum: ['available', 'matched', 'pinned', 'frozen'],
    default: 'available'
  },
  
  // Match-related timestamps
  stateTimestamps: {
    lastMatched: Date,
    lastPinned: Date,
    frozenUntil: Date,
    availableForMatchingSince: Date
  },
  
  // Current match
  currentMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Match history
  matchHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startDate: Date,
    endDate: Date,
    unpinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    feedback: String
  }],
  
  // Intentionality analytics
  analytics: {
    averageResponseTime: Number,
    averageConversationLength: Number,
    matchSuccessRate: Number,
    averageMatchDuration: Number
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for location-based queries
UserSchema.index({ location: '2dsphere' });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User; 