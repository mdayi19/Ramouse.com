import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface QuickFilter {
    label: string;
    filters: Record<string, any>;
}

interface QuickFilterChipsProps {
    /** Array of quick filter options */
    filters: QuickFilter[];
    /** Callback when a filter is selected */
    onFilterSelect: (filters: Record<string, any>, label: string) => void;
}

/**
 * QuickFilterChips Component
 * Displays one-click filter shortcuts for common searches
 * 
 * @example
 * ```tsx
 * <QuickFilterChips
 *   filters={quickFilters.cars}
 *   onFilterSelect={(filters, label) => applyFilters(filters)}
 * />
 * ```
 */
export const QuickFilterChips: React.FC<QuickFilterChipsProps> = ({
    filters,
    onFilterSelect
}) => {
    if (!filters || filters.length === 0) return null;

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    بحث سريع:
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {filters.map((filter, index) => (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onFilterSelect(filter.filters, filter.label)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 hover:shadow-md transition-all transform hover:scale-105"
                    >
                        {filter.label}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};
