import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navigateTo = (path) => {
    navigate(path);
  };
  
  if (!currentUser) return null;
  
  return (
    <NavContainer>
      <Logo onClick={() => navigateTo('/dashboard')}>Lone Town</Logo>
      <NavLinks>
        <NavItem onClick={() => navigateTo('/dashboard')}>Dashboard</NavItem>
        {currentUser && (
          <>
            <NavItem onClick={() => navigateTo('/profile')}>Profile</NavItem>
            <NavItem onClick={() => navigateTo('/history')}>Match History</NavItem>
            <NavItem onClick={handleLogout}>Logout</NavItem>
          </>
        )}
      </NavLinks>
    </NavContainer>
  );
};

const NavContainer = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #6c63ff;
  cursor: pointer;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 1.5rem;
`;

const NavItem = styled.div`
  color: #3a3a3a;
  cursor: pointer;
  
  &:hover {
    color: #6c63ff;
  }
`;

export default Navbar; 