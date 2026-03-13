
import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  type?: 'round' | 'outlined';
}

const Icon: React.FC<IconProps> = ({ name, className = '', type = 'round' }) => {
  const iconClass = type === 'round' ? 'material-icons-round' : 'material-icons-outlined';
  return <span className={`${iconClass} ${className}`}>{name}</span>;
};

export default Icon;
