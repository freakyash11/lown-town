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

// Add request interceptor to include Firebase auth token in requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Get fresh token from Firebase
      const token = await getCurrentUserToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
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