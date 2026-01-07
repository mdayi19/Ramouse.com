import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberSelectorProps {
    label: string;
    value: number;
    options?: number[]; // For discrete options
    min?: number; // For range mode
    max?: number; // For range mode
    onChange: (value: number) => void;
    icon?: React.ReactNode;
}

export const NumberSelector: React.FC<NumberSelectorProps> = ({
    label,
    value,
    options,
    min,
    max,
    onChange,
    icon
}) => {
    // Determine mode: discrete options or range stepper
    const isRangeMode = min !== undefined && max !== undefined;

    const increment = () => {
        if (isRangeMode && value < max) {
            onChange(value + 1);
        }
    };

    const decrement = () => {
        if (isRangeMode && value > min) {
            onChange(value - 1);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {icon && <span className="inline-flex items-center gap-2">{icon} {label}</span>}
                {!icon && label}
            </label>

            {isRangeMode ? (
                // Range Stepper Mode
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={decrement}
                        disabled={value <= min}
                        className="p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Minus className="w-5 h-5" />
                    </button>

                    <div className="flex-1 text-center">
                        <div className="text-3xl font-bold text-primary">{value}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {min} - {max}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={increment}
                        disabled={value >= max}
                        className="p-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            ) : (
                // Discrete Options Mode
                <div className="flex gap-3">
                    {options?.map(option => (
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
            )}
        </div>
    );
};
