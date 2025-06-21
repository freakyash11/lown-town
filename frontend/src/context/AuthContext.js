import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import firebaseAuth, { onAuthChange, getCurrentUserToken } from '../services/firebaseAuth';

// Create context
const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // User is signed in, get token
          const token = await user.getIdToken();
          localStorage.setItem('userToken', token);
          
          // Get user profile from backend
          const { data } = await authService.getProfile();
          setCurrentUser(data);
          
          // Connect socket
          connectSocket(token);
        } catch (err) {
          console.error('Error loading user profile:', err);
          // If we can't get the profile, sign out from Firebase
          await firebaseAuth.logout();
          setCurrentUser(null);
        }
      } else {
        // User is signed out
        localStorage.removeItem('userToken');
        setCurrentUser(null);
        disconnectSocket();
      }
      
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Register user
  const register = async (userData) => {
    try {
      setError(null);
      
      // Register with Firebase Auth
      const data = await firebaseAuth.registerWithEmailAndPassword(
        userData.email, 
        userData.password, 
        userData.name
      );
      
      setCurrentUser(data);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      setError(null);
      
      // Login with Firebase Auth
      const data = await firebaseAuth.login(
        credentials.email, 
        credentials.password
      );
      
      setCurrentUser(data);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await firebaseAuth.logout();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message || 'Logout failed');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setError(null);
      
      // Get fresh token
      const token = await getCurrentUserToken();
      
      // Update profile in backend
      const { data } = await authService.updateProfile(userData);
      
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...data
      }));
      
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  };

  // Complete onboarding
  const completeOnboarding = async (onboardingData) => {
    try {
      setError(null);
      console.log("AuthContext: Sending onboarding data to server", onboardingData);
      
      // Get fresh token
      const token = await getCurrentUserToken();
      
      const { data } = await authService.completeOnboarding(onboardingData);
      console.log("AuthContext: Received response from server", data);
      
      // Update the current user with all the returned data
      setCurrentUser(prevUser => {
        const updatedUser = {
          ...prevUser,
          ...data,
          personalityTraits: data.personalityTraits || prevUser.personalityTraits,
          emotionalIntelligence: data.emotionalIntelligence || prevUser.emotionalIntelligence,
          relationshipValues: data.relationshipValues || prevUser.relationshipValues,
          lifeGoals: data.lifeGoals || prevUser.lifeGoals,
          communicationStyle: data.communicationStyle || prevUser.communicationStyle,
          interests: data.interests || prevUser.interests
        };
        console.log("AuthContext: Updated user state", updatedUser);
        return updatedUser;
      });
      
      return data;
    } catch (err) {
      console.error("AuthContext: Error completing onboarding", err);
      setError(err.response?.data?.message || 'Failed to complete onboarding');
      throw err;
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      setError(null);
      await firebaseAuth.resetPassword(email);
    } catch (err) {
      setError(err.message || 'Failed to send password reset email');
      throw err;
    }
  };

  // Context value
  const value = {
    currentUser,
    firebaseUser,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    completeOnboarding,
    resetPassword,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 