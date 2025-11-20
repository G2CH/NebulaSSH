
import React from 'react';
import { simpleCn } from '../../utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ className, label, error, ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-700 dark:text-slate-400 ml-1">
          {label}
        </label>
      )}
      <input
        className={simpleCn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2",
          // Light Mode styles
          "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
          "focus:border-nebula-500 focus:ring-nebula-500/20",
          // Dark Mode styles
          "dark:border-dark-border dark:bg-dark-bg dark:text-slate-200 dark:placeholder:text-slate-600 dark:shadow-none",
          "dark:focus:ring-nebula-500/50 dark:focus:border-transparent",
          error && "border-red-500/50 focus:ring-red-500/50",
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500 ml-1">{error}</span>}
    </div>
  );
};
