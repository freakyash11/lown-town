const { auth } = require('../config/firebase');
const { adminAuth } = require('../config/firebase-admin');
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  sendEmailVerification,
  EmailAuthProvider,
  reauthenticateWithCredential
} = require('firebase/auth');

/**
 * Service for handling Firebase authentication
 */
class FirebaseAuthService {
  /**
   * Register a new user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} userData - Additional user data (name, etc.)
   * @returns {Promise<object>} Firebase user data and UID
   */
  async registerUser(email, password, userData = {}) {
    try {
      // Create user with Firebase Admin SDK
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: userData.name || '',
        photoURL: userData.photoURL || '',
        emailVerified: false,
        disabled: false
      });

      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      };
    } catch (error) {
      console.error('Firebase Auth registration error:', error);
      throw error;
    }
  }

  /**
   * Set custom user claims (for admin privileges, etc.)
   * @param {string} uid - User ID
   * @param {object} claims - Custom claims to set
   * @returns {Promise<void>}
   */
  async setCustomUserClaims(uid, claims) {
    try {
      await adminAuth.setCustomUserClaims(uid, claims);
    } catch (error) {
      console.error('Set custom claims error:', error);
      throw error;
    }
  }

  /**
   * Verify ID token
   * @param {string} idToken - Firebase ID token
   * @returns {Promise<object>} Decoded token
   */
  async verifyIdToken(idToken) {
    try {
      return await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  }

  /**
   * Generate a custom token for a user
   * @param {string} uid - User ID
   * @returns {Promise<string>} Custom token
   */
  async createCustomToken(uid) {
    try {
      return await adminAuth.createCustomToken(uid);
    } catch (error) {
      console.error('Create custom token error:', error);
      throw error;
    }
  }

  /**
   * Get user by UID
   * @param {string} uid - User ID
   * @returns {Promise<object>} User record
   */
  async getUserByUid(uid) {
    try {
      return await adminAuth.getUser(uid);
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<object>} User record
   */
  async getUserByEmail(email) {
    try {
      return await adminAuth.getUserByEmail(email);
    } catch (error) {
      console.error('Get user by email error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} uid - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(uid) {
    try {
      await adminAuth.deleteUser(uid);
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} uid - User ID
   * @param {object} userData - User data to update
   * @returns {Promise<object>} Updated user record
   */
  async updateUser(uid, userData) {
    try {
      return await adminAuth.updateUser(uid, userData);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async sendPasswordResetEmail(email) {
    try {
      await adminAuth.generatePasswordResetLink(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseAuthService(); 