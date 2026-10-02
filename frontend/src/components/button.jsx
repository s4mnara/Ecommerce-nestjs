import React from 'react';

export default function Button({ children, onClick, type = 'button', className = '', disabled }) {
  return (
    <button
      type={type}
      className={`button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
