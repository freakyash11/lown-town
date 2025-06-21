import React, { forwardRef } from 'react';
import styled from 'styled-components';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  fullWidth = false,
  type = 'text',
  ...props 
}, ref) => {
  return (
    <InputContainer fullWidth={fullWidth}>
      {label && <Label>{label}</Label>}
      <StyledInput 
        type={type} 
        hasError={!!error}
        ref={ref}
        {...props} 
      />
      {(error || helperText) && (
        <HelperText isError={!!error}>
          {error || helperText}
        </HelperText>
      )}
    </InputContainer>
  );
});

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #3a3a3a;
`;

const StyledInput = styled.input`
  padding: 0.75rem;
  border: 1px solid ${props => props.hasError ? '#e53935' : '#ddd'};
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#e53935' : '#6c63ff'};
    box-shadow: 0 0 0 2px ${props => props.hasError ? 'rgba(229, 57, 53, 0.2)' : 'rgba(108, 99, 255, 0.2)'};
  }
  
  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const HelperText = styled.div`
  font-size: 0.8rem;
  margin-top: 0.5rem;
  color: ${props => props.isError ? '#e53935' : '#666'};
`;

export default Input; 