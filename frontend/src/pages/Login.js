import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      // Check if user has completed personality quiz
      if (currentUser.personalityTraits === undefined || 
          currentUser.emotionalIntelligence === undefined || 
          currentUser.relationshipValues === undefined || 
          currentUser.lifeGoals === undefined || 
          currentUser.communicationStyle === undefined) {
        console.log("User needs to complete personality quiz");
        navigate('/personality-quiz');
      } else {
        console.log("User has completed personality quiz, going to dashboard");
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      const user = await login({ email, password });
      
      // Check if user has completed personality quiz
      if (user.personalityTraits === undefined || 
          user.emotionalIntelligence === undefined || 
          user.relationshipValues === undefined || 
          user.lifeGoals === undefined || 
          user.communicationStyle === undefined) {
        navigate('/personality-quiz');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log in');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <FormCard>
        <Logo>Lone Town</Logo>
        <Tagline>One thoughtful match. Every day.</Tagline>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>
        
        <RegisterLink>
          Don't have an account? <Link to="/register">Register</Link>
        </RegisterLink>
      </FormCard>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
`;

const FormCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 400px;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  color: #3a3a3a;
  text-align: center;
  margin-bottom: 0.5rem;
`;

const Tagline = styled.p`
  font-size: 1rem;
  color: #777;
  text-align: center;
  margin-bottom: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #3a3a3a;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

const Button = styled.button`
  background-color: #6c63ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #5a52d5;
  }
  
  &:disabled {
    background-color: #a8a8a8;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const RegisterLink = styled.div`
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  
  a {
    color: #6c63ff;
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export default Login; 