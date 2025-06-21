const { db } = require('../config/firebase');
const { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, orderBy, limit, deleteDoc } = require('firebase/firestore');

class FirebaseMessage {
  constructor(messageData) {
    this._id = messageData.id || null;
    this.sender = messageData.sender || null;
    this.receiver = messageData.receiver || null;
    this.match = messageData.match || null;
    this.content = messageData.content || '';
    this.read = messageData.read || false;
    this.readAt = messageData.readAt || null;
    this.type = messageData.type || 'text'; // text, image, video, etc.
    this.createdAt = messageData.createdAt || new Date();
    this.updatedAt = messageData.updatedAt || new Date();
  }

  // Convert Firestore document to Message instance
  static fromFirestore(doc) {
    const data = doc.data();
    return new FirebaseMessage({
      id: doc.id,
      ...data,
      readAt: data.readAt ? data.readAt.toDate() : null,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
    });
  }

  // Convert Message instance to Firestore document
  toFirestore() {
    const { _id, ...messageData } = this;
    return {
      ...messageData,
      updatedAt: new Date()
    };
  }

  // Find message by ID
  static async findById(id) {
    try {
      const messageRef = doc(db, 'messages', id);
      const messageSnap = await getDoc(messageRef);
      
      if (messageSnap.exists()) {
        return FirebaseMessage.fromFirestore(messageSnap);
      }
      return null;
    } catch (error) {
      console.error('Error finding message by ID:', error);
      throw error;
    }
  }

  // Find messages between two users
  static async findByUsers(user1Id, user2Id, options = {}) {
    try {
      const messagesRef = collection(db, 'messages');
      const q1 = query(
        messagesRef,
        where('sender', '==', user1Id),
        where('receiver', '==', user2Id),
        orderBy('createdAt', 'desc'),
        limit(options.limit || 50)
      );
      
      const q2 = query(
        messagesRef,
        where('sender', '==', user2Id),
        where('receiver', '==', user1Id),
        orderBy('createdAt', 'desc'),
        limit(options.limit || 50)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const messages = [];
      snapshot1.forEach(doc => messages.push(FirebaseMessage.fromFirestore(doc)));
      snapshot2.forEach(doc => messages.push(FirebaseMessage.fromFirestore(doc)));
      
      // Sort by createdAt
      return messages.sort((a, b) => a.createdAt - b.createdAt);
    } catch (error) {
      console.error('Error finding messages between users:', error);
      throw error;
    }
  }

  // Find messages by match
  static async findByMatch(matchId, options = {}) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('match', '==', matchId),
        orderBy('createdAt', options.sort || 'asc'),
        limit(options.limit || 100)
      );
      
      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach(doc => {
        messages.push(FirebaseMessage.fromFirestore(doc));
      });
      
      return messages;
    } catch (error) {
      console.error('Error finding messages by match:', error);
      throw error;
    }
  }

  // Create a new message
  static async create(messageData) {
    try {
      const newMessage = new FirebaseMessage({
        ...messageData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Generate a new document with auto ID
      const messagesRef = collection(db, 'messages');
      const newMessageRef = doc(messagesRef);
      
      // Set the ID and save
      newMessage._id = newMessageRef.id;
      await setDoc(newMessageRef, newMessage.toFirestore());
      
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Save message (update or create)
  async save() {
    try {
      this.updatedAt = new Date();
      
      if (this._id) {
        // Update existing message
        const messageRef = doc(db, 'messages', this._id);
        await updateDoc(messageRef, this.toFirestore());
      } else {
        // Create new message
        const messagesRef = collection(db, 'messages');
        const newMessageRef = doc(messagesRef);
        this._id = newMessageRef.id;
        await setDoc(newMessageRef, this.toFirestore());
      }
      
      return this;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(userId, senderId) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiver', '==', userId),
        where('sender', '==', senderId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      const updatePromises = [];
      
      snapshot.forEach(doc => {
        const messageRef = doc.ref;
        updatePromises.push(
          updateDoc(messageRef, {
            read: true,
            readAt: new Date(),
            updatedAt: new Date()
          })
        );
      });
      
      await Promise.all(updatePromises);
      return snapshot.size; // Return number of messages marked as read
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Get unread message count
  static async getUnreadCount(userId) {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('receiver', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

module.exports = FirebaseMessage; 