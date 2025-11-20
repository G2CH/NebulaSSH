
import React from 'react';
import { X } from 'lucide-react';
import { simpleCn } from '../utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'md' }) => {
  if (!isOpen) return null;

  // Check if maxWidth is a predefined size or custom value
  const predefinedSizes = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'max-w-full',
  };

  const maxWidthClass = predefinedSizes[maxWidth as keyof typeof predefinedSizes];
  const maxWidthStyle = maxWidthClass ? {} : { maxWidth };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={simpleCn(
          "relative w-full rounded-xl shadow-2xl transform transition-all bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border flex flex-col max-h-[90vh]",
          maxWidthClass
        )}
        style={maxWidthStyle}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-dark-border flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
