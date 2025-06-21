import React, { createContext, useState, useEffect, useContext } from 'react';
import { messageService } from '../services/api';
import { getSocket, sendMessage as socketSendMessage, markMessageRead } from '../services/socket';
import { useAuth } from './AuthContext';

// Create context
const MessageContext = createContext();

export const useMessages = () => {
  return useContext(MessageContext);
};

export const MessageProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [videoCallStatus, setVideoCallStatus] = useState({
    unlocked: false,
    messageCount: 0,
    requiredCount: 100
  });

  // Socket event listeners for messages
  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();

    // New message received
    socket.on('new_message', (message) => {
      setMessages(prevMessages => {
        const userId = message.sender._id;
        return {
          ...prevMessages,
          [userId]: [...(prevMessages[userId] || []), message]
        };
      });
      
      // Mark message as read
      markMessageRead(message._id);
      
      // Update unread count
      getUnreadCount();
    });

    // Message read status update
    socket.on('message_read', ({ messageId }) => {
      setMessages(prevMessages => {
        // Find and update the message in all conversations
        const updatedMessages = { ...prevMessages };
        
        Object.keys(updatedMessages).forEach(userId => {
          updatedMessages[userId] = updatedMessages[userId].map(msg => 
            msg._id === messageId ? { ...msg, read: true } : msg
          );
        });
        
        return updatedMessages;
      });
    });

    // Typing indicators
    socket.on('typing_start', ({ userId }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: true }));
    });

    socket.on('typing_stop', ({ userId }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: false }));
    });

    // Video call unlock
    socket.on('video_call_unlocked', () => {
      setVideoCallStatus(prev => ({
        ...prev,
        unlocked: true
      }));
    });

    return () => {
      socket.off('new_message');
      socket.off('message_read');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('video_call_unlocked');
    };
  }, [currentUser]);

  // Get messages for a specific user
  const getMessages = async (userId) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      const { data } = await messageService.getMessages(userId);
      
      setMessages(prev => ({
        ...prev,
        [userId]: data
      }));
      
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (recipientId, content) => {
    try {
      setError(null);
      
      // Try socket first for real-time updates
      try {
        const messageData = await socketSendMessage(recipientId, content);
        
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [recipientId]: [...(prev[recipientId] || []), messageData]
        }));
        
        // Check if video call is unlocked
        if (messageData.videoCallUnlocked) {
          setVideoCallStatus(prev => ({
            ...prev,
            unlocked: true
          }));
        }
        
        return messageData;
      } catch (socketErr) {
        // Fall back to REST API if socket fails
        console.warn('Socket message send failed, using REST API:', socketErr);
        const { data } = await messageService.sendMessage({
          recipientId,
          content
        });
        
        // Update messages state
        setMessages(prev => ({
          ...prev,
          [recipientId]: [...(prev[recipientId] || []), data.message]
        }));
        
        // Check if video call is unlocked
        if (data.videoCallUnlocked) {
          setVideoCallStatus(prev => ({
            ...prev,
            unlocked: true
          }));
        }
        
        return data.message;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      throw err;
    }
  };

  // Mark messages as read
  const markAsRead = async (userId) => {
    try {
      await messageService.markAsRead(userId);
      
      // Update local message state
      setMessages(prev => {
        if (!prev[userId]) return prev;
        
        return {
          ...prev,
          [userId]: prev[userId].map(msg => 
            msg.sender._id === userId ? { ...msg, read: true } : msg
          )
        };
      });
      
      // Update unread count
      getUnreadCount();
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  // Get unread message count
  const getUnreadCount = async () => {
    try {
      const { data } = await messageService.getUnreadCount();
      setUnreadCount(data.count);
      return data.count;
    } catch (err) {
      console.error('Error getting unread count:', err);
    }
  };

  // Check video call status
  const checkVideoCallStatus = async (userId) => {
    try {
      const { data } = await messageService.checkVideoCallStatus(userId);
      setVideoCallStatus({
        unlocked: data.videoCallUnlocked,
        messageCount: data.messageCount,
        requiredCount: data.requiredCount,
        remaining: data.remaining
      });
      return data;
    } catch (err) {
      console.error('Error checking video call status:', err);
    }
  };

  // Context value
  const value = {
    messages,
    unreadCount,
    loading,
    error,
    typingUsers,
    videoCallStatus,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    checkVideoCallStatus
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext; 