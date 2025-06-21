const { db } = require('../config/firebase');
const { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, deleteDoc } = require('firebase/firestore');

class FirebaseMatch {
  constructor(matchData) {
    this._id = matchData.id || null;
    this.user1 = matchData.user1 || null;
    this.user2 = matchData.user2 || null;
    this.matchDate = matchData.matchDate || new Date();
    this.compatibilityScore = matchData.compatibilityScore || 0;
    this.status = matchData.status || 'pending'; // pending, active, expired, pinned
    this.expiresAt = matchData.expiresAt || null;
    this.pinnedBy = matchData.pinnedBy || [];
    this.feedback = matchData.feedback || {
      user1: null,
      user2: null
    };
    this.createdAt = matchData.createdAt || new Date();
    this.updatedAt = matchData.updatedAt || new Date();
  }

  // Convert Firestore document to Match instance
  static fromFirestore(doc) {
    const data = doc.data();
    return new FirebaseMatch({
      id: doc.id,
      ...data,
      matchDate: data.matchDate ? data.matchDate.toDate() : new Date(),
      expiresAt: data.expiresAt ? data.expiresAt.toDate() : null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    });
  }

  // Convert Match instance to Firestore document
  toFirestore() {
    const { _id, ...matchData } = this;
    return {
      ...matchData,
      updatedAt: new Date()
    };
  }

  // Find match by ID
  static async findById(id) {
    try {
      const matchRef = doc(db, 'matches', id);
      const matchSnap = await getDoc(matchRef);
      
      if (matchSnap.exists()) {
        return FirebaseMatch.fromFirestore(matchSnap);
      }
      return null;
    } catch (error) {
      console.error('Error finding match by ID:', error);
      throw error;
    }
  }

  // Find matches by user ID
  static async findByUser(userId) {
    try {
      const matchesRef = collection(db, 'matches');
      const q1 = query(matchesRef, where('user1', '==', userId));
      const q2 = query(matchesRef, where('user2', '==', userId));
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const matches = [];
      snapshot1.forEach(doc => matches.push(FirebaseMatch.fromFirestore(doc)));
      snapshot2.forEach(doc => matches.push(FirebaseMatch.fromFirestore(doc)));
      
      return matches;
    } catch (error) {
      console.error('Error finding matches by user:', error);
      throw error;
    }
  }

  // Create a new match
  static async create(matchData) {
    try {
      const newMatch = new FirebaseMatch({
        ...matchData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Generate a new document with auto ID
      const matchesRef = collection(db, 'matches');
      const newMatchRef = doc(matchesRef);
      
      // Set the ID and save
      newMatch._id = newMatchRef.id;
      await setDoc(newMatchRef, newMatch.toFirestore());
      
      return newMatch;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  // Save match (update or create)
  async save() {
    try {
      this.updatedAt = new Date();
      
      if (this._id) {
        // Update existing match
        const matchRef = doc(db, 'matches', this._id);
        await updateDoc(matchRef, this.toFirestore());
      } else {
        // Create new match
        const matchesRef = collection(db, 'matches');
        const newMatchRef = doc(matchesRef);
        this._id = newMatchRef.id;
        await setDoc(newMatchRef, this.toFirestore());
      }
      
      return this;
    } catch (error) {
      console.error('Error saving match:', error);
      throw error;
    }
  }

  // Find active match for a user
  static async findActiveMatch(userId) {
    try {
      const matchesRef = collection(db, 'matches');
      const q1 = query(
        matchesRef, 
        where('user1', '==', userId),
        where('status', 'in', ['active', 'pinned'])
      );
      const q2 = query(
        matchesRef, 
        where('user2', '==', userId),
        where('status', 'in', ['active', 'pinned'])
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      if (!snapshot1.empty) {
        return FirebaseMatch.fromFirestore(snapshot1.docs[0]);
      }
      
      if (!snapshot2.empty) {
        return FirebaseMatch.fromFirestore(snapshot2.docs[0]);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding active match:', error);
      throw error;
    }
  }
}

module.exports = FirebaseMatch; 