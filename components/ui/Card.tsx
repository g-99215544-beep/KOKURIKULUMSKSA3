
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-red-50/50
        ${hoverable 
          ? 'shadow-sm hover:shadow-xl hover:shadow-red-200/50 hover:-translate-y-1 cursor-pointer' 
          : 'shadow-sm'
        } 
        transition-all duration-300 ease-out
        p-5
        ${className}
      `}
    >
      {children}
    </div>
  );
};
