
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div 
      className={`bg-slate-900 border border-gray-800 rounded-xl shadow-sm ${!noPadding ? 'p-4' : ''} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};
