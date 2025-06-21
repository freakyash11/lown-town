import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUFzsdjtOCpEZyPIrD3_RvmBmA4Xee9OE",
  authDomain: "litamor-8ce39.firebaseapp.com",
  projectId: "litamor-8ce39",
  storageBucket: "litamor-8ce39.firebasestorage.app",
  messagingSenderId: "194822139322",
  appId: "1:194822139322:web:6aa10d71e51f36e4c7c183",
  measurementId: "G-5RXJZCR4DQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User name
 * @returns {Promise<object>} User data and token
 */
export const registerWithEmailAndPassword = async (email, password, name) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with name
    await updateProfile(userCredential.user, { displayName: name });
    
    // Get token
    const token = await userCredential.user.getIdToken();
    
    // Register user in backend
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        email,
        password,
        name
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Sign out the user if registration in backend failed
      await signOut(auth);
      
      // Throw error with data from backend
      const error = new Error(data.message || 'Registration failed');
      error.code = data.code;
      error.response = { data };
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    
    // If Firebase throws email-already-in-use error, handle it specially
    if (error.code === 'auth/email-already-in-use') {
      const customError = new Error('Email already in use. Please login instead.');
      customError.code = error.code;
      customError.redirectTo = '/login';
      customError.response = { data: { redirectTo: '/login' } };
      throw customError;
    }
    
    // For other errors, pass them through
    throw error;
  }
};

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User data and token
 */
export const login = async (email, password) => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get token
    const token = await userCredential.user.getIdToken();
    
    // Login to backend
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // If backend returns an error, sign out from Firebase
      await signOut(auth);
      
      const error = new Error(data.message || 'Login failed');
      error.code = data.code;
      error.response = { data };
      throw error;
    }
    
    // Store token in local storage
    localStorage.setItem('userToken', token);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please register first.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many login attempts. Please try again later or reset your password.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled.');
    }
    
    // For other errors, pass them through
    throw error;
  }
};

/**
 * Sign out user
 * @returns {Promise<void>}
 */
export const logout = async () => {
  try {
    // Get token before signing out
    const token = await auth.currentUser?.getIdToken();
    
    // Sign out from Firebase Auth
    await signOut(auth);
    
    // Clear local storage
    localStorage.removeItem('userToken');
    
    // Logout from backend
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * @returns {object|null} Current user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get current user token
 * @param {boolean} forceRefresh - Whether to force refresh the token
 * @returns {Promise<string|null>} ID token or null
 */
export const getCurrentUserToken = async (forceRefresh = false) => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await user.getIdToken(forceRefresh); // Force refresh if requested
  } catch (error) {
    console.error('Get token error:', error);
    return null;
  }
};

/**
 * Listen for auth state changes
 * @param {function} callback - Callback function with user object
 * @returns {function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export default {
  auth,
  registerWithEmailAndPassword,
  login,
  logout,
  resetPassword,
  getCurrentUser,
  getCurrentUserToken,
  onAuthChange
}; 