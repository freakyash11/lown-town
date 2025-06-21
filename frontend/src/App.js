import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MatchProvider } from './context/MatchContext';
import { MessageProvider } from './context/MessageContext';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Match from './pages/Match';
import Conversation from './pages/Conversation';
import Profile from './pages/Profile';
import MatchHistory from './pages/MatchHistory';
import PersonalityQuiz from './pages/PersonalityQuiz';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Onboarded route component - ensures user has completed personality quiz
const OnboardedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has completed personality quiz by checking if they have personality traits
  // Only redirect if we're sure the user hasn't completed the quiz
  if (currentUser.personalityTraits === undefined || 
      currentUser.emotionalIntelligence === undefined || 
      currentUser.relationshipValues === undefined || 
      currentUser.lifeGoals === undefined || 
      currentUser.communicationStyle === undefined) {
    console.log("User hasn't completed personality quiz, redirecting");
    return <Navigate to="/personality-quiz" />;
  }

  return children;
};

// App component
function App() {
  return (
    <Router>
      <AuthProvider>
        <MatchProvider>
          <MessageProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route 
                path="/personality-quiz" 
                element={
                  <ProtectedRoute>
                    <PersonalityQuiz />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <OnboardedRoute>
                    <Dashboard />
                  </OnboardedRoute>
                } 
              />
              <Route 
                path="/match" 
                element={
                  <OnboardedRoute>
                    <Match />
                  </OnboardedRoute>
                } 
              />
              <Route 
                path="/conversation/:matchId" 
                element={
                  <OnboardedRoute>
                    <Conversation />
                  </OnboardedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <OnboardedRoute>
                    <Profile />
                  </OnboardedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <OnboardedRoute>
                    <MatchHistory />
                  </OnboardedRoute>
                } 
              />
              
              {/* Redirect to login by default */}
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </MessageProvider>
        </MatchProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
