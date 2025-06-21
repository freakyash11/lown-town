import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    dateOfBirth: '',
    gender: '',
    interestedIn: [],
    bio: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle multiple checkboxes for interestedIn
      if (checked) {
        setFormData({
          ...formData,
          interestedIn: [...formData.interestedIn, value]
        });
      } else {
        setFormData({
          ...formData,
          interestedIn: formData.interestedIn.filter(item => item !== value)
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.interestedIn.length === 0) {
      return setError('Please select at least one gender you are interested in');
    }
    
    // Calculate age from date of birth
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    // Check if user is at least 18
    if (age < 18) {
      return setError('You must be at least 18 years old to register');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Remove confirmPassword from data sent to API
      const { confirmPassword, ...registrationData } = formData;
      
      await register(registrationData);
      navigate('/personality-quiz');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create an account');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container>
      <FormCard>
        <Logo>Lone Town</Logo>
        <Tagline>Join the mindful dating community</Tagline>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="name">Full Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Gender</Label>
            <RadioGroup>
              <RadioLabel>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={handleChange}
                  required
                />
                Male
              </RadioLabel>
              <RadioLabel>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={handleChange}
                />
                Female
              </RadioLabel>
              <RadioLabel>
                <input
                  type="radio"
                  name="gender"
                  value="non-binary"
                  checked={formData.gender === 'non-binary'}
                  onChange={handleChange}
                />
                Non-binary
              </RadioLabel>
              <RadioLabel>
                <input
                  type="radio"
                  name="gender"
                  value="other"
                  checked={formData.gender === 'other'}
                  onChange={handleChange}
                />
                Other
              </RadioLabel>
            </RadioGroup>
          </FormGroup>
          
          <FormGroup>
            <Label>Interested In (select all that apply)</Label>
            <CheckboxGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="interestedIn"
                  value="male"
                  checked={formData.interestedIn.includes('male')}
                  onChange={handleChange}
                />
                Men
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="interestedIn"
                  value="female"
                  checked={formData.interestedIn.includes('female')}
                  onChange={handleChange}
                />
                Women
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="interestedIn"
                  value="non-binary"
                  checked={formData.interestedIn.includes('non-binary')}
                  onChange={handleChange}
                />
                Non-binary
              </CheckboxLabel>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  name="interestedIn"
                  value="other"
                  checked={formData.interestedIn.includes('other')}
                  onChange={handleChange}
                />
                Other
              </CheckboxLabel>
            </CheckboxGroup>
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="bio">Short Bio (optional)</Label>
            <TextArea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us a bit about yourself..."
              rows="3"
            />
          </FormGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
        </Form>
        
        <LoginLink>
          Already have an account? <Link to="/login">Login</Link>
        </LoginLink>
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
  padding: 2rem 0;
`;

const FormCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  width: 100%;
  max-width: 500px;
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

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input {
    margin-right: 0.5rem;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  
  input {
    margin-right: 0.5rem;
  }
`;

const TextArea = styled.textarea`
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

const LoginLink = styled.div`
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

export default Register; 