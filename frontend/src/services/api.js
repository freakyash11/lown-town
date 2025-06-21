import axios from 'axios';
import { getCurrentUserToken } from './firebaseAuth';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from localStorage or refresh if needed
      const token = await getCurrentUserToken(true);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error('API request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log('Token expired, attempting to refresh...');
        // Force refresh token
        const token = await getCurrentUserToken(true);
        
        if (token) {
          console.log('Token refreshed successfully');
          // Update header and retry
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          console.error('Token refresh failed - no token returned');
          return Promise.reject(new Error('Authentication failed. Please log in again.'));
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        // If refresh fails, let the component handle the error
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  // Register user
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },
  
  // Login user
  login: (credentials) => {
    return api.post('/api/auth/login', credentials);
  },
  
  // Get user profile
  getProfile: () => {
    return api.get('/api/auth/profile');
  },
  
  // Update user profile
  updateProfile: (userData) => {
    return api.put('/api/auth/profile', userData);
  },
  
  // Complete onboarding
  completeOnboarding: (onboardingData) => {
    return api.post('/api/auth/onboarding', onboardingData);
  },
  
  // Forgot password
  forgotPassword: (email) => {
    return api.post('/api/auth/forgot-password', { email });
  },
  
  // Logout
  logout: () => {
    return api.post('/api/auth/logout');
  }
};

// Match service
export const matchService = {
  // Get daily match
  getDailyMatch: async () => {
    try {
      const response = await api.get('/api/matches/daily');
      return response.data;
    } catch (error) {
      console.error('Get daily match error:', error);
      throw error;
    }
  },
  
  // Get current match
  getCurrentMatch: async () => {
    try {
      const response = await api.get('/api/matches/current');
      return response.data;
    } catch (error) {
      console.error('Get current match error:', error);
      throw error;
    }
  },
  
  // Get match history
  getMatchHistory: async () => {
    try {
      const response = await api.get('/api/matches/history');
      return response.data;
    } catch (error) {
      console.error('Get match history error:', error);
      throw error;
    }
  },
  
  // Pin match
  pinMatch: async (matchId) => {
    try {
      const response = await api.put(`/api/matches/pin?matchId=${matchId}`);
      return response.data;
    } catch (error) {
      console.error('Pin match error:', error);
      throw error;
    }
  },
  
  // Unpin match
  unpinMatch: async (matchId, feedback) => {
    try {
      const response = await api.put(`/api/matches/unpin?matchId=${matchId}`, feedback);
      return response.data;
    } catch (error) {
      console.error('Unpin match error:', error);
      throw error;
    }
  },
  
  // Get match feedback
  getMatchFeedback: async (matchId) => {
    try {
      const response = await api.get(`/api/matches/${matchId}/feedback`);
      return response.data;
    } catch (error) {
      console.error('Get match feedback error:', error);
      throw error;
    }
  }
};

// Message service
export const messageService = {
  // Get messages for match
  getMessages: async (matchId) => {
    try {
      const response = await api.get(`/api/messages/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  },
  
  // Send message
  sendMessage: async (matchId, messageData) => {
    try {
      const response = await api.post(`/api/messages/${matchId}`, messageData);
      return response.data;
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  },
  
  // Mark message as read
  markAsRead: async (userId) => {
    try {
      const response = await api.put(`/api/messages/read/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  },
  
  // Get unread message count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/api/messages/unread');
      return response.data;
    } catch (error) {
      console.error('Get unread message count error:', error);
      throw error;
    }
  },
  
  // Check video call status
  checkVideoCallStatus: async (userId) => {
    try {
      const response = await api.get(`/api/messages/video-status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Check video call status error:', error);
      throw error;
    }
  }
};

// User service
export const userService = {
  // Get user state
  getUserState: async () => {
    try {
      const response = await api.get('/api/users/state');
      return response.data;
    } catch (error) {
      console.error('Get user state error:', error);
      throw error;
    }
  }
};

// Export services
export default {
  auth: authService,
  match: matchService,
  message: messageService,
  user: userService
}; 