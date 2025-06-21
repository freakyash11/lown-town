const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const { connectDB } = require('./config/db');

// Sample user data
const users = [
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Doe',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    interestedIn: ['female'],
    location: {
      coordinates: [0, 0],
      city: 'New York',
      country: 'USA'
    },
    bio: 'I love hiking and reading books.',
    personalityTraits: {
      openness: 8,
      conscientiousness: 7,
      extraversion: 6,
      agreeableness: 8,
      neuroticism: 4
    },
    emotionalIntelligence: {
      selfAwareness: 7,
      empathy: 8,
      socialSkills: 6,
      emotionalRegulation: 7
    },
    relationshipValues: {
      commitment: 9,
      loyalty: 9,
      honesty: 8,
      communication: 7,
      independence: 6,
      affection: 8
    },
    lifeGoals: {
      career: 8,
      family: 9,
      personalGrowth: 8,
      adventure: 7,
      stability: 6
    },
    communicationStyle: {
      directness: 7,
      conflictResolution: 6,
      expressiveness: 5,
      listening: 8
    },
    interests: ['hiking', 'reading', 'cooking', 'travel'],
    userState: 'available'
  },
  {
    email: 'jane@example.com',
    password: 'password123',
    name: 'Jane Smith',
    dateOfBirth: new Date('1992-05-20'),
    gender: 'female',
    interestedIn: ['male'],
    location: {
      coordinates: [0, 0],
      city: 'Los Angeles',
      country: 'USA'
    },
    bio: 'I enjoy painting and yoga.',
    personalityTraits: {
      openness: 9,
      conscientiousness: 6,
      extraversion: 7,
      agreeableness: 8,
      neuroticism: 5
    },
    emotionalIntelligence: {
      selfAwareness: 8,
      empathy: 9,
      socialSkills: 7,
      emotionalRegulation: 6
    },
    relationshipValues: {
      commitment: 8,
      loyalty: 9,
      honesty: 9,
      communication: 8,
      independence: 7,
      affection: 7
    },
    lifeGoals: {
      career: 7,
      family: 8,
      personalGrowth: 9,
      adventure: 8,
      stability: 5
    },
    communicationStyle: {
      directness: 6,
      conflictResolution: 7,
      expressiveness: 8,
      listening: 8
    },
    interests: ['painting', 'yoga', 'music', 'travel'],
    userState: 'available'
  }
];

// Seed the database
const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Clearing existing users...');
    await User.deleteMany({});
    
    console.log('Creating users...');
    
    // Hash passwords and create users
    for (const userData of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        ...userData,
        password: hashedPassword,
        stateTimestamps: {
          availableForMatchingSince: new Date()
        }
      });
      
      await user.save();
      console.log(`Created user: ${user.name} (${user._id})`);
    }
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 