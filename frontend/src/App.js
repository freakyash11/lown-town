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

// Onboarded route component - ensures user has completed onboarding
const OnboardedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user needs onboarding
  if (currentUser.needsOnboarding === true) {
    console.log("User needs onboarding, redirecting");
    return <Navigate to="/onboarding" />;
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
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/match" 
                element={
                  <ProtectedRoute>
                    <Match />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/conversation/:matchId" 
                element={
                  <ProtectedRoute>
                    <Conversation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute>
                    <MatchHistory />
                  </ProtectedRoute>
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
