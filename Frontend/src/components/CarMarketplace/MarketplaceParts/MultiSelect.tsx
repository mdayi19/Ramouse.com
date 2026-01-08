import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MultiSelectProps {
    options: Array<{ value: string; label: string }>;
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    maxShown?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selected,
    onChange,
    placeholder = 'اختر',
    maxShown = 3
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const getDisplayText = () => {
        if (selected.length === 0) return placeholder;
        if (selected.length <= maxShown) {
            return selected.map(val =>
                options.find(opt => opt.value === val)?.label
            ).join(', ');
        }
        return `${selected.length} محدد`;
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 text-right border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:border-primary/50 transition-colors flex items-center justify-between"
            >
                <span className="text-sm truncate">{getDisplayText()}</span>
                <svg
                    className={cn(
                        'w-4 h-4 transition-transform text-slate-400',
                        isOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {options.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleOption(option.value)}
                                className="w-full px-4 py-2.5 text-right hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group"
                            >
                                <span className="text-sm text-slate-900 dark:text-white">
                                    {option.label}
                                </span>
                                <div className={cn(
                                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                                    selected.includes(option.value)
                                        ? 'bg-primary border-primary'
                                        : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'
                                )}>
                                    {selected.includes(option.value) && (
                                        <Check className="w-3 h-3 text-white" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MultiSelect;
