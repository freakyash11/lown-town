import axios from 'axios';
import { getCurrentUserToken } from './firebaseAuth';

// API URL is now relative since we're hosting backend and frontend together
const API_URL = '/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Track if we're currently refreshing the token
let isRefreshingToken = false;
let tokenRefreshPromise = null;

// Function to get a fresh token
const getFreshToken = async () => {
  if (isRefreshingToken) {
    return tokenRefreshPromise;
  }
  
  isRefreshingToken = true;
  tokenRefreshPromise = getCurrentUserToken(true); // Force refresh
  
  try {
    const token = await tokenRefreshPromise;
    return token;
  } finally {
    isRefreshingToken = false;
    tokenRefreshPromise = null;
  }
};

// Add request interceptor to include Firebase auth token in requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from localStorage first for speed
      let token = localStorage.getItem('userToken');
      
      // If no token in localStorage or this is an auth endpoint, get fresh token
      if (!token || config.url.includes('/auth/')) {
        token = await getFreshToken();
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Update token in localStorage
        localStorage.setItem('userToken', token);
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to get a fresh token
        const token = await getFreshToken();
        
        if (token) {
          // Update the token in the request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          // Update token in localStorage
          localStorage.setItem('userToken', token);
          // Retry the request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // If token refresh fails, redirect to login
        if (window.location.pathname !== '/login') {
          console.log('Redirecting to login due to authentication failure');
          window.location.href = '/login';
        }
      }
    }
    
    // For other errors, or if token refresh failed
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login due to authentication failure');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  completeOnboarding: (onboardingData) => api.post('/auth/onboarding', onboardingData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  logout: () => api.post('/auth/logout')
};

// Match services
export const matchService = {
  getDailyMatch: () => api.get('/matches/daily'),
  getCurrentMatch: () => api.get('/matches/current'),
  pinMatch: (matchId) => api.put(`/matches/${matchId}/pin`),
  unpinMatch: (matchId, feedback) => api.put(`/matches/${matchId}/unpin`, { feedback }),
  getMatchHistory: () => api.get('/matches/history'),
  getMatchFeedback: (matchId) => api.get(`/matches/${matchId}/feedback`)
};

// Message services
export const messageService = {
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markAsRead: (userId) => api.put(`/messages/read/${userId}`),
  getUnreadCount: () => api.get('/messages/unread'),
  checkVideoCallStatus: (userId) => api.get(`/messages/video-status/${userId}`)
};

// User services
export const userService = {
  getUserState: () => api.get('/users/state')
};

export default api; 