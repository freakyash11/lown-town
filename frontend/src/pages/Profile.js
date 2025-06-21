import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { currentUser, updateProfile, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load user data when component mounts
  useEffect(() => {
    if (currentUser) {
      setFormData(prevState => ({
        ...prevState,
        name: currentUser.name || '',
        email: currentUser.email || '',
        bio: currentUser.bio || ''
      }));
    }
  }, [currentUser]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Only send fields that have changed
      const updatedFields = {};
      
      if (formData.name !== currentUser.name) {
        updatedFields.name = formData.name;
      }
      
      if (formData.bio !== currentUser.bio) {
        updatedFields.bio = formData.bio;
      }
      
      // Only include password fields if user is trying to change password
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('New passwords do not match');
        }
        
        updatedFields.currentPassword = formData.currentPassword;
        updatedFields.newPassword = formData.newPassword;
      }
      
      // Only make API call if there are changes
      if (Object.keys(updatedFields).length > 0) {
        await updateProfile(updatedFields);
        setSuccess('Profile updated successfully');
        
        // Clear password fields
        setFormData(prevState => ({
          ...prevState,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
      } else {
        setSuccess('No changes to save');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Container>
      <Header>
        <BackButton onClick={handleBack}>← Back</BackButton>
        <Title>Your Profile</Title>
      </Header>
      
      <Content>
        <ProfileCard>
          <form onSubmit={handleProfileUpdate}>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            {authError && <ErrorMessage>{authError}</ErrorMessage>}
            
            <SectionTitle>Basic Information</SectionTitle>
            
            <Input
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              fullWidth
              helperText="Email cannot be changed"
            />
            
            <Input
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              fullWidth
              as="textarea"
              rows="4"
              placeholder="Tell others about yourself..."
            />
            
            <SectionTitle>Change Password</SectionTitle>
            
            <Input
              label="Current Password"
              name="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={handleChange}
              fullWidth
            />
            
            <Input
              label="New Password"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              fullWidth
              disabled={!formData.currentPassword}
            />
            
            <Input
              label="Confirm New Password"
              name="confirmNewPassword"
              type="password"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              fullWidth
              disabled={!formData.newPassword}
              error={
                formData.newPassword && 
                formData.confirmNewPassword && 
                formData.newPassword !== formData.confirmNewPassword
                  ? 'Passwords do not match'
                  : ''
              }
            />
            
            <ButtonContainer>
              <Button 
                type="submit" 
                disabled={loading}
                fullWidth
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </ButtonContainer>
          </form>
        </ProfileCard>
      </Content>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  padding: 1.5rem 2rem;
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
  margin-right: 1rem;
  
  &:hover {
    color: #6c63ff;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  color: #3a3a3a;
  margin: 0;
`;

const Content = styled.main`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileCard = styled(Card)`
  padding: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  color: #3a3a3a;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
`;

const ButtonContainer = styled.div`
  margin-top: 2rem;
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

const SuccessMessage = styled.div`
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
`;

export default Profile; 