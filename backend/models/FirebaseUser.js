const { db } = require('../config/firebase');
const { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc } = require('firebase/firestore');
const bcrypt = require('bcrypt');

class FirebaseUser {
  constructor(userData) {
    this._id = userData.id || null;
    this.email = userData.email || '';
    this.password = userData.password || '';
    this.name = userData.name || '';
    this.dateOfBirth = userData.dateOfBirth || null;
    this.gender = userData.gender || '';
    this.interestedIn = userData.interestedIn || [];
    this.location = userData.location || {
      type: 'Point',
      coordinates: [0, 0],
      city: '',
      country: ''
    };
    this.profilePicture = userData.profilePicture || '';
    this.bio = userData.bio || '';
    this.personalityTraits = userData.personalityTraits || {
      openness: 5,
      conscientiousness: 5,
      extraversion: 5,
      agreeableness: 5,
      neuroticism: 5
    };
    this.emotionalIntelligence = userData.emotionalIntelligence || {
      selfAwareness: 5,
      empathy: 5,
      socialSkills: 5,
      emotionalRegulation: 5
    };
    this.relationshipValues = userData.relationshipValues || {
      commitment: 5,
      loyalty: 5,
      honesty: 5,
      communication: 5,
      independence: 5,
      affection: 5
    };
    this.lifeGoals = userData.lifeGoals || {
      career: 5,
      family: 5,
      personalGrowth: 5,
      adventure: 5,
      stability: 5
    };
    this.communicationStyle = userData.communicationStyle || {
      directness: 5,
      conflictResolution: 5,
      expressiveness: 5,
      listening: 5
    };
    this.interests = userData.interests || [];
    this.userState = userData.userState || 'available';
    this.stateTimestamps = userData.stateTimestamps || {
      lastMatched: null,
      lastPinned: null,
      frozenUntil: null,
      availableForMatchingSince: new Date()
    };
    this.currentMatch = userData.currentMatch || null;
    this.matchHistory = userData.matchHistory || [];
    this.analytics = userData.analytics || {
      averageResponseTime: 0,
      averageConversationLength: 0,
      matchSuccessRate: 0,
      averageMatchDuration: 0
    };
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
  }

  // Convert Firestore document to User instance
  static fromFirestore(doc) {
    const data = doc.data();
    return new FirebaseUser({
      id: doc.id,
      ...data,
      dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toDate() : null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    });
  }

  // Convert User instance to Firestore document
  toFirestore() {
    const { _id, ...userData } = this;
    return {
      ...userData,
      dateOfBirth: this.dateOfBirth,
      createdAt: this.createdAt,
      updatedAt: new Date()
    };
  }

  // Find user by ID
  static async findById(id) {
    try {
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return FirebaseUser.fromFirestore(userSnap);
      }
      return null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findOne(filter) {
    try {
      const usersRef = collection(db, 'users');
      let q;
      
      if (filter.email) {
        q = query(usersRef, where('email', '==', filter.email));
      } else {
        throw new Error('Unsupported filter for findOne');
      }
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return FirebaseUser.fromFirestore(querySnapshot.docs[0]);
      }
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create user instance
      const newUser = new FirebaseUser({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Generate a new document with auto ID
      const usersRef = collection(db, 'users');
      const newUserRef = doc(usersRef);
      
      // Set the ID and save
      newUser._id = newUserRef.id;
      await setDoc(newUserRef, newUser.toFirestore());
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Save user (update or create)
  async save() {
    try {
      this.updatedAt = new Date();
      
      if (this._id) {
        // Update existing user
        const userRef = doc(db, 'users', this._id);
        await updateDoc(userRef, this.toFirestore());
      } else {
        // Create new user
        const usersRef = collection(db, 'users');
        const newUserRef = doc(usersRef);
        this._id = newUserRef.id;
        await setDoc(newUserRef, this.toFirestore());
      }
      
      return this;
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // Match password
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Select specific fields (for compatibility with Mongoose)
  static select(fields) {
    // This is a stub for compatibility
    return this;
  }
}

module.exports = FirebaseUser; 