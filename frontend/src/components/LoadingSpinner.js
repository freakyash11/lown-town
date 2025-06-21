import React from 'react';
import styled, { keyframes } from 'styled-components';

const LoadingSpinner = ({ size = '40px', color = '#6c63ff' }) => {
  return (
    <SpinnerContainer>
      <Spinner size={size} color={color} />
    </SpinnerContainer>
  );
};

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const Spinner = styled.div`
  width: ${props => props.size};
  height: ${props => props.size};
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${props => props.color};
  animation: ${spin} 0.8s linear infinite;
`;

export default LoadingSpinner; 