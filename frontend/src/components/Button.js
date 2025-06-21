import React from 'react';
import styled from 'styled-components';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  ...props 
}) => {
  return (
    <StyledButton 
      onClick={onClick} 
      variant={variant} 
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  
  /* Size variants */
  padding: ${props => {
    switch (props.size) {
      case 'small':
        return '0.5rem 1rem';
      case 'large':
        return '1rem 2rem';
      default: // medium
        return '0.75rem 1.5rem';
    }
  }};
  
  font-size: ${props => {
    switch (props.size) {
      case 'small':
        return '0.875rem';
      case 'large':
        return '1.125rem';
      default: // medium
        return '1rem';
    }
  }};
  
  /* Color variants */
  background-color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return 'white';
      case 'danger':
        return '#e53935';
      case 'success':
        return '#43a047';
      default: // primary
        return '#6c63ff';
    }
  }};
  
  color: ${props => {
    switch (props.variant) {
      case 'secondary':
        return '#6c63ff';
      default: // primary, danger, success
        return 'white';
    }
  }};
  
  border: ${props => {
    switch (props.variant) {
      case 'secondary':
        return '1px solid #6c63ff';
      default:
        return 'none';
    }
  }};
  
  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'secondary':
          return '#f5f5f5';
        case 'danger':
          return '#c62828';
        case 'success':
          return '#2e7d32';
        default: // primary
          return '#5a52d5';
      }
    }};
  }
  
  &:disabled {
    background-color: ${props => props.variant === 'secondary' ? '#f5f5f5' : '#a8a8a8'};
    color: ${props => props.variant === 'secondary' ? '#a8a8a8' : 'white'};
    border-color: ${props => props.variant === 'secondary' ? '#a8a8a8' : 'transparent'};
    cursor: not-allowed;
  }
`;

export default Button; 