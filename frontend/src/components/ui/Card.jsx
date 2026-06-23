import React from 'react';

export default function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:bg-slate-900/80 hover:border-slate-700/80 active:scale-[0.99]' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}
