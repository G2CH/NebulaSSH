import React from 'react';
import { ChevronDown } from 'lucide-react';
import { simpleCn } from '../../utils';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: React.ReactNode;
    error?: string;
    options: Array<{ value: string | number; label: string }>;
    size?: 'sm' | 'md' | 'lg';
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    className,
    options,
    size = 'md',
    ...props
}) => {
    const sizeClasses = {
        sm: 'h-8 text-xs px-2 py-1',
        md: 'h-10 text-sm px-3 py-2',
        lg: 'h-12 text-base px-4 py-3'
    };

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className={simpleCn(
                        "w-full rounded-lg border transition-all focus:outline-none focus:ring-2 appearance-none cursor-pointer",
                        "bg-white dark:bg-dark-bg",
                        "border-slate-200 dark:border-dark-border",
                        "text-slate-900 dark:text-slate-100",
                        "shadow-sm dark:shadow-none",
                        "focus:border-nebula-500 focus:ring-nebula-500/20",
                        "dark:focus:ring-nebula-500/30 dark:focus:border-nebula-400",
                        "hover:border-slate-300 dark:hover:border-slate-600",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        sizeClasses[size],
                        className
                    )}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                    <ChevronDown size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
                </div>
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
