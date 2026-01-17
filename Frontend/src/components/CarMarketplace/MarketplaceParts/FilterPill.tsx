import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterPillProps {
    label: string;
    value: string;
    onRemove: () => void;
    color?: 'primary' | 'secondary' | 'accent';
}

export const FilterPill: React.FC<FilterPillProps> = ({
    label,
    value,
    onRemove,
    color = 'primary'
}) => {
    const colorClasses = {
        primary: 'bg-primary/10 text-primary border-primary/20',
        secondary: 'bg-secondary/10 text-secondary border-secondary/20',
        accent: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    };

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${colorClasses[color]} transition-all`}
        >
            <span className="font-medium text-xs opacity-70">{label}:</span>
            <span className="font-bold">{value}</span>
            <button
                onClick={onRemove}
                className="ml-1 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors touch-manipulation"
                aria-label={`Remove ${label} filter`}
            >
                <X className="w-3 h-3" />
            </button>
        </motion.div>
    );
};
