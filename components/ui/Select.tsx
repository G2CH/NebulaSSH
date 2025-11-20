import React from 'react';
import { simpleCn } from '../../utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: Array<{ value: string | number; label: string }>;
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    className,
    options,
    ...props
}) => {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className="text-xs font-medium text-slate-700 dark:text-slate-400 ml-1">
                    {label}
                </label>
            )}
            <select
                className={simpleCn(
                    "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2",
                    "bg-white border-slate-300 text-slate-900 shadow-sm",
                    "focus:border-nebula-500 focus:ring-nebula-500/20",
                    "dark:border-dark-border dark:bg-dark-bg dark:text-slate-200 dark:shadow-none",
                    "dark:focus:ring-nebula-500/50 dark:focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
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
            {error && (
                <p className="text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
