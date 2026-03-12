import React from 'react';

interface IconProps {
  name: string;
  className?: string;
  type?: 'filled' | 'outlined';
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({ name, className = '', type = 'outlined', onClick }) => (
  <span
    className={`material-symbols-outlined ${type === 'filled' ? 'filled' : ''} ${className}`}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : undefined }}
  >
    {name}
  </span>
);

export default Icon;
