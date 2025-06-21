import React, { createContext, useState, useEffect, useContext } from 'react';
import { matchService } from '../services/api';
import { getSocket, pinMatch as socketPinMatch, unpinMatch as socketUnpinMatch } from '../services/socket';
import { useAuth } from './AuthContext';

// Create context
const MatchContext = createContext();

export const useMatch = () => {
  return useContext(MatchContext);
};

export const MatchProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [currentMatch, setCurrentMatch] = useState(null);
  const [matchPartner, setMatchPartner] = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Load current match when user is authenticated
  useEffect(() => {
    const loadCurrentMatch = async () => {
      if (!currentUser) {
        setCurrentMatch(null);
        setMatchPartner(null);
        setMatchLoading(false);
        return;
      }

      try {
        setMatchLoading(true);
        setMatchError(null);
        const { data } = await matchService.getCurrentMatch();
        setCurrentMatch(data.match);
        setMatchPartner(data.matchPartner);
      } catch (err) {
        if (err.response?.status === 404) {
          // No active match, not an error
          setCurrentMatch(null);
          setMatchPartner(null);
        } else {
          setMatchError(err.response?.data?.message || 'Failed to load match');
          console.error('Error loading match:', err);
        }
      } finally {
        setMatchLoading(false);
      }
    };

    loadCurrentMatch();
  }, [currentUser]);

  // Socket event listeners for match updates
  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();

    // Match status update
    socket.on('match_status', ({ match }) => {
      setCurrentMatch(match);
    });

    // Match pinned by other user
    socket.on('match_pinned', ({ match }) => {
      setCurrentMatch(match);
    });

    // Match unpinned by other user
    socket.on('match_unpinned_by_other', (data) => {
      setCurrentMatch(null);
      setMatchPartner(null);
    });

    return () => {
      socket.off('match_status');
      socket.off('match_pinned');
      socket.off('match_unpinned_by_other');
    };
  }, [currentUser]);

  // Get daily match
  const getDailyMatch = async () => {
    try {
      setMatchLoading(true);
      setMatchError(null);
      console.log('Calling getDailyMatch API...');
      const { data } = await matchService.getDailyMatch();
      console.log('getDailyMatch API response:', data);
      
      if (data.match) {
        setCurrentMatch(data.match);
        // Find match partner from users array
        const partner = data.match.users.find(
          user => user._id !== currentUser._id
        );
        setMatchPartner(partner);
      }
      
      return data;
    } catch (err) {
      console.error('getDailyMatch error details:', err);
      setMatchError(err.response?.data?.message || 'Failed to get daily match');
      throw err;
    } finally {
      setMatchLoading(false);
    }
  };

  // Pin match
  const pinMatch = async (matchId) => {
    try {
      setMatchError(null);
      
      // Try socket first for real-time updates
      try {
        const result = await socketPinMatch(matchId);
        setCurrentMatch(result.match);
        return result;
      } catch (socketErr) {
        // Fall back to REST API if socket fails
        console.warn('Socket pin failed, using REST API:', socketErr);
        const { data } = await matchService.pinMatch(matchId);
        setCurrentMatch(data.match);
        return data;
      }
    } catch (err) {
      setMatchError(err.response?.data?.message || 'Failed to pin match');
      throw err;
    }
  };

  // Unpin match
  const unpinMatch = async (matchId, feedback) => {
    try {
      setMatchError(null);
      
      // Try socket first for real-time updates
      try {
        const result = await socketUnpinMatch(matchId, feedback);
        setCurrentMatch(null);
        setMatchPartner(null);
        return result;
      } catch (socketErr) {
        // Fall back to REST API if socket fails
        console.warn('Socket unpin failed, using REST API:', socketErr);
        const { data } = await matchService.unpinMatch(matchId, feedback);
        setCurrentMatch(null);
        setMatchPartner(null);
        return data;
      }
    } catch (err) {
      setMatchError(err.response?.data?.message || 'Failed to unpin match');
      throw err;
    }
  };

  // Get match history
  const getMatchHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await matchService.getMatchHistory();
      setMatchHistory(data);
      return data;
    } catch (err) {
      console.error('Error loading match history:', err);
      throw err;
    } finally {
      setHistoryLoading(false);
    }
  };

  // Get match feedback
  const getMatchFeedback = async (matchId) => {
    try {
      const { data } = await matchService.getMatchFeedback(matchId);
      return data;
    } catch (err) {
      console.error('Error loading match feedback:', err);
      throw err;
    }
  };

  // Context value
  const value = {
    currentMatch,
    matchPartner,
    matchLoading,
    matchError,
    matchHistory,
    historyLoading,
    getDailyMatch,
    pinMatch,
    unpinMatch,
    getMatchHistory,
    getMatchFeedback,
    setCurrentMatch,
    setMatchPartner
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};

export default MatchContext; 