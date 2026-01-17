import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterPill } from './FilterPill';

export interface ActiveFilter {
    key: string;
    label: string;
    value: string;
    onRemove: () => void;
}

interface ActiveFilterPillsProps {
    activeFilters: ActiveFilter[];
    className?: string;
}

export const ActiveFilterPills: React.FC<ActiveFilterPillsProps> = ({
    activeFilters,
    className
}) => {
    if (activeFilters.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`pb-4 mb-2 border-b border-slate-200 dark:border-slate-700 ${className || ''}`}
        >
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">فلاتر نشطة:</span>
            </div>
            <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                    {activeFilters.map(filter => (
                        <FilterPill
                            key={filter.key}
                            label={filter.label}
                            value={filter.value}
                            onRemove={filter.onRemove}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
