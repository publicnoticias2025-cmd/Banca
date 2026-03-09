
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
