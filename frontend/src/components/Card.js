import React from 'react';
import styled from 'styled-components';

const Card = ({ 
  children, 
  title,
  padding = '2rem',
  elevation = 'medium',
  onClick,
  ...props 
}) => {
  return (
    <CardContainer 
      padding={padding} 
      elevation={elevation}
      onClick={onClick}
      clickable={!!onClick}
      {...props}
    >
      {title && <CardTitle>{title}</CardTitle>}
      {children}
    </CardContainer>
  );
};

const CardContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: ${props => props.padding};
  margin-bottom: 1.5rem;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  transition: transform 0.2s, box-shadow 0.2s;
  
  /* Elevation variants */
  box-shadow: ${props => {
    switch (props.elevation) {
      case 'low':
        return '0 2px 4px rgba(0, 0, 0, 0.05)';
      case 'high':
        return '0 8px 16px rgba(0, 0, 0, 0.15)';
      default: // medium
        return '0 4px 8px rgba(0, 0, 0, 0.1)';
    }
  }};
  
  &:hover {
    ${props => props.clickable && `
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    `}
  }
`;

const CardTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 1rem;
  color: #3a3a3a;
  font-size: 1.25rem;
`;

export default Card; 