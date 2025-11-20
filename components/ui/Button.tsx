import React from 'react';
import { simpleCn } from '../../utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-nebula-600 hover:bg-nebula-500 text-white shadow-lg shadow-nebula-900/20 border border-transparent',
    secondary: 'bg-dark-surface hover:bg-dark-border text-slate-200 border border-dark-border',
    ghost: 'bg-transparent hover:bg-dark-border/50 text-slate-400 hover:text-slate-100',
    danger: 'bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-9 w-9 p-0 flex items-center justify-center',
  };

  return (
    <button
      className={simpleCn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-nebula-500/50 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
