import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { useMessages } from '../context/MessageContext';
import { sendTypingStart, sendTypingStop } from '../services/socket';

const Conversation = () => {
  const { matchId } = useParams();
  const { currentUser } = useAuth();
  const { currentMatch, matchPartner } = useMatch();
  const { 
    messages, 
    sendMessage, 
    getMessages, 
    loading, 
    error, 
    typingUsers,
    videoCallStatus,
    checkVideoCallStatus
  } = useMessages();
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Load messages on mount
  useEffect(() => {
    if (matchPartner?._id) {
      getMessages(matchPartner._id);
      checkVideoCallStatus(matchPartner._id);
    }
  }, [matchPartner, getMessages, checkVideoCallStatus]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle typing indicator
  useEffect(() => {
    if (isTyping && matchPartner) {
      sendTypingStart(matchPartner._id);
    }
    
    return () => {
      if (matchPartner) {
        sendTypingStop(matchPartner._id);
      }
    };
  }, [isTyping, matchPartner]);
  
  // Handle message input change
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    
    // Set typing indicator
    if (!isTyping) {
      setIsTyping(true);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (matchPartner) {
        sendTypingStop(matchPartner._id);
      }
    }, 2000);
    
    setTypingTimeout(timeout);
  };
  
  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || !matchPartner) return;
    
    try {
      await sendMessage(matchPartner._id, messageText.trim());
      setMessageText('');
      setIsTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };
  
  // Handle back button click
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // Handle video call button click
  const handleVideoCall = () => {
    // In a real app, this would initiate a video call
    alert('Video call feature would be implemented here');
  };
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get conversation messages
  const conversationMessages = matchPartner?._id ? messages[matchPartner._id] || [] : [];
  
  // Check if partner is typing
  const partnerIsTyping = matchPartner && typingUsers[matchPartner._id];
  
  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <ProfileInfo>
          <ProfilePicture>
            {matchPartner?.profilePicture ? (
              <img src={matchPartner.profilePicture} alt={matchPartner.name} />
            ) : (
              <ProfilePlaceholder>{matchPartner?.name?.charAt(0) || '?'}</ProfilePlaceholder>
            )}
          </ProfilePicture>
          <ProfileName>{matchPartner?.name || 'Loading...'}</ProfileName>
        </ProfileInfo>
        {videoCallStatus.unlocked && (
          <VideoCallButton onClick={handleVideoCall}>
            <span role="img" aria-label="video">📹</span> Video Call
          </VideoCallButton>
        )}
      </Header>
      
      <MessageProgress>
        <ProgressText>
          {videoCallStatus.unlocked ? (
            'Video calling unlocked! You can now start a video call.'
          ) : (
            `${videoCallStatus.messageCount || 0}/100 messages exchanged. 
             ${videoCallStatus.remaining || 100} more to unlock video calling.`
          )}
        </ProgressText>
        <ProgressBar>
          <ProgressFill 
            width={Math.min(
              100, 
              ((videoCallStatus.messageCount || 0) / videoCallStatus.requiredCount) * 100
            )} 
          />
        </ProgressBar>
      </MessageProgress>
      
      <MessagesContainer>
        {loading && !conversationMessages.length ? (
          <LoadingMessage>Loading messages...</LoadingMessage>
        ) : (
          <>
            {conversationMessages.map((msg) => (
              <MessageBubble 
                key={msg._id} 
                isCurrentUser={msg.sender._id === currentUser?._id}
              >
                <MessageText>{msg.content}</MessageText>
                <MessageTime>{formatTime(msg.createdAt)}</MessageTime>
              </MessageBubble>
            ))}
            
            {partnerIsTyping && (
              <TypingIndicator>
                {matchPartner.name} is typing...
              </TypingIndicator>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </MessagesContainer>
      
      <MessageInputForm onSubmit={handleSendMessage}>
        <MessageInput
          type="text"
          placeholder="Type a message..."
          value={messageText}
          onChange={handleInputChange}
        />
        <SendButton 
          type="submit" 
          disabled={!messageText.trim()}
        >
          Send
        </SendButton>
      </MessageInputForm>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  
  &:hover {
    color: #6c63ff;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  margin-left: 1rem;
`;

const ProfilePicture = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfilePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: #6c63ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
`;

const ProfileName = styled.h2`
  font-size: 1.2rem;
  margin: 0;
  color: #3a3a3a;
`;

const VideoCallButton = styled.button`
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  
  &:hover {
    background-color: #5a52d5;
  }
`;

const MessageProgress = styled.div`
  padding: 0.75rem 1rem;
  background-color: white;
  border-bottom: 1px solid #eee;
`;

const ProgressText = styled.div`
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const ProgressBar = styled.div`
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #6c63ff;
  width: ${props => props.width}%;
  transition: width 0.3s ease;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  margin: 2rem 0;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  margin-bottom: 0.5rem;
  align-self: ${props => props.isCurrentUser ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.isCurrentUser ? '#6c63ff' : 'white'};
  color: ${props => props.isCurrentUser ? 'white' : '#3a3a3a'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const MessageText = styled.div`
  word-break: break-word;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.8;
  text-align: right;
  margin-top: 0.25rem;
`;

const TypingIndicator = styled.div`
  font-size: 0.8rem;
  color: #666;
  padding: 0.5rem;
  align-self: flex-start;
`;

const MessageInputForm = styled.form`
  display: flex;
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #eee;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 24px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

const SendButton = styled.button`
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 0.75rem 1.5rem;
  margin-left: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background-color: #5a52d5;
  }
  
  &:disabled {
    background-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

export default Conversation; 