import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket;

export const initSocket = () => {
  socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true
  });

  // Socket event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

export const connectSocket = (token) => {
  if (!socket) {
    initSocket();
  }

  // Connect and authenticate
  socket.connect();
  if (token) {
    socket.emit('authenticate', token);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// Message functions
export const sendMessage = (recipientId, content) => {
  if (!socket || !socket.connected) return Promise.reject('Socket not connected');
  
  return new Promise((resolve, reject) => {
    socket.emit('private_message', { recipientId, content });
    
    // Wait for confirmation
    const onMessageSent = (data) => {
      socket.off('message_sent', onMessageSent);
      socket.off('error', onError);
      resolve(data);
    };
    
    const onError = (error) => {
      socket.off('message_sent', onMessageSent);
      socket.off('error', onError);
      reject(error);
    };
    
    socket.on('message_sent', onMessageSent);
    socket.on('error', onError);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      socket.off('message_sent', onMessageSent);
      socket.off('error', onError);
      reject('Message send timeout');
    }, 5000);
  });
};

// Match functions
export const pinMatch = (matchId) => {
  if (!socket || !socket.connected) return Promise.reject('Socket not connected');
  
  return new Promise((resolve, reject) => {
    socket.emit('pin_match', matchId);
    
    // Wait for confirmation
    const onPinConfirmed = (data) => {
      socket.off('pin_confirmed', onPinConfirmed);
      socket.off('error', onError);
      resolve(data);
    };
    
    const onError = (error) => {
      socket.off('pin_confirmed', onPinConfirmed);
      socket.off('error', onError);
      reject(error);
    };
    
    socket.on('pin_confirmed', onPinConfirmed);
    socket.on('error', onError);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      socket.off('pin_confirmed', onPinConfirmed);
      socket.off('error', onError);
      reject('Pin match timeout');
    }, 5000);
  });
};

export const unpinMatch = (matchId, feedback) => {
  if (!socket || !socket.connected) return Promise.reject('Socket not connected');
  
  return new Promise((resolve, reject) => {
    socket.emit('unpin_match', { matchId, feedback });
    
    // Wait for confirmation
    const onUnpinned = (data) => {
      socket.off('match_unpinned', onUnpinned);
      socket.off('error', onError);
      resolve(data);
    };
    
    const onError = (error) => {
      socket.off('match_unpinned', onUnpinned);
      socket.off('error', onError);
      reject(error);
    };
    
    socket.on('match_unpinned', onUnpinned);
    socket.on('error', onError);
    
    // Timeout after 5 seconds
    setTimeout(() => {
      socket.off('match_unpinned', onUnpinned);
      socket.off('error', onError);
      reject('Unpin match timeout');
    }, 5000);
  });
};

// Typing indicators
export const sendTypingStart = (recipientId) => {
  if (socket && socket.connected) {
    socket.emit('typing_start', recipientId);
  }
};

export const sendTypingStop = (recipientId) => {
  if (socket && socket.connected) {
    socket.emit('typing_stop', recipientId);
  }
};

// Mark message as read
export const markMessageRead = (messageId) => {
  if (socket && socket.connected) {
    socket.emit('mark_read', messageId);
  }
};

export default {
  initSocket,
  connectSocket,
  disconnectSocket,
  getSocket,
  sendMessage,
  pinMatch,
  unpinMatch,
  sendTypingStart,
  sendTypingStop,
  markMessageRead
}; 