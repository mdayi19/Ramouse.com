import React from 'react';

interface NumberSelectorProps {
    label: string;
    value: number;
    options: number[];
    onChange: (value: number) => void;
    icon?: React.ReactNode;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({
    label,
    value,
    options,
    onChange,
    icon
}) => {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {icon && <span className="inline-flex items-center gap-2">{icon} {label}</span>}
                {!icon && label}
            </label>
            <div className="flex gap-3">
                {options.map(option => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={`
                            flex-1 py-4 px-6 rounded-xl border-2 font-bold text-lg
                            transition-all hover:scale-105
                            ${value === option
                                ? 'border-primary bg-primary text-white shadow-lg'
                                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-primary/50'
                            }
                        `}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};
