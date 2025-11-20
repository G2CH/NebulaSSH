import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { simpleCn } from '../../utils';

interface ComboBoxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    error?: string;
    options: string[];
    value: string;
    onChange: (value: string) => void;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
    label,
    error,
    className,
    options,
    value,
    onChange,
    placeholder,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Filter options based on input value
        if (value) {
            const filtered = options.filter(option =>
                option.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered);
        } else {
            setFilteredOptions(options);
        }
    }, [value, options]);

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    return (
        <div className="space-y-1.5" ref={containerRef}>
            {label && (
                <label className="text-xs font-medium text-slate-700 dark:text-slate-400 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={simpleCn(
                        "flex h-10 w-full rounded-lg border px-3 py-2 pr-10 text-sm transition-all focus:outline-none focus:ring-2",
                        "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 shadow-sm",
                        "focus:border-nebula-500 focus:ring-nebula-500/20",
                        "dark:border-dark-border dark:bg-dark-bg dark:text-slate-200 dark:placeholder:text-slate-600 dark:shadow-none",
                        "dark:focus:ring-nebula-500/50 dark:focus:border-transparent",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
                        className
                    )}
                    {...props}
                />
                <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />

                {/* Dropdown */}
                {isOpen && filteredOptions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                        {filteredOptions.map((option, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelect(option)}
                                className={simpleCn(
                                    "w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between",
                                    "hover:bg-slate-50 dark:hover:bg-dark-border/50",
                                    value === option
                                        ? "bg-nebula-50 dark:bg-nebula-500/10 text-nebula-600 dark:text-nebula-400"
                                        : "text-slate-900 dark:text-slate-200"
                                )}
                            >
                                <span>{option}</span>
                                {value === option && (
                                    <Check size={14} className="text-nebula-500" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
