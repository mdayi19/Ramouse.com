import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { FilterGroup, FilterOption } from './filterConfig';

interface FilterDialogProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Dialog title */
    title: string;
    /** Filter groups to display */
    filterGroups: FilterGroup[];
    /** Current filter values */
    currentFilters: Record<string, any>;
    /** Callback when filters change */
    onFilterChange: (filters: Record<string, any>) => void;
    /** Callback when search is triggered */
    onSearch: () => void;
    /** Callback when dialog is closed */
    onClose: () => void;
}

/**
 * FilterDialog Component
 * Advanced filter interface for chatbot search
 * 
 * @example
 * ```tsx
 * <FilterDialog
 *   isOpen={showFilters}
 *   title="فلترة السيارات"
 *   filterGroups={carFilters}
 *   currentFilters={filters}
 *   onFilterChange={setFilters}
 *   onSearch={handleSearch}
 *   onClose={() => setShowFilters(false)}
 * />
 * ```
 */
export const FilterDialog: React.FC<FilterDialogProps> = ({
    isOpen,
    title,
    filterGroups,
    currentFilters,
    onFilterChange,
    onSearch,
    onClose
}) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    /**
     * Handle filter value change
     */
    const handleFilterChange = (filterId: string, value: any, type: string) => {
        setLocalFilters(prev => {
            if (type === 'multiple') {
                // Toggle value in array
                const currentArray = prev[filterId] || [];
                const newArray = currentArray.includes(value)
                    ? currentArray.filter((v: any) => v !== value)
                    : [...currentArray, value];
                return { ...prev, [filterId]: newArray };
            } else {
                // Single value
                return { ...prev, [filterId]: value };
            }
        });
    };

    /**
     * Apply filters and search
     */
    const handleApply = () => {
        onFilterChange(localFilters);
        onSearch();
        onClose();
    };

    /**
     * Reset all filters
     */
    const handleReset = () => {
        setLocalFilters({});
        onFilterChange({});
    };

    /**
     * Check if a filter option is selected
     */
    const isSelected = (filterId: string, value: any, type: string) => {
        if (type === 'multiple') {
            const currentArray = localFilters[filterId] || [];
            return currentArray.includes(value);
        }
        return localFilters[filterId] === value;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[61] flex items-end md:items-center justify-center p-0 md:p-4"
                    >
                        <div className="bg-white dark:bg-slate-900 w-full md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] md:max-h-[80vh]">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10 rounded-t-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                        <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {title}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition-colors"
                                    aria-label="إغلاق"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                                {filterGroups.map((group) => (
                                    <div key={group.id} className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                                            {group.label}
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {group.options.map((option) => {
                                                const selected = isSelected(group.id, option.value, group.type);
                                                return (
                                                    <button
                                                        key={option.value}
                                                        onClick={() => handleFilterChange(group.id, option.value, group.type)}
                                                        className={`
                                                            p-3 rounded-xl border-2 transition-all text-right text-sm font-medium
                                                            ${selected
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {option.icon && (
                                                                <span className="text-lg">{option.icon}</span>
                                                            )}
                                                            <span className="flex-1">{option.label}</span>
                                                            {selected && group.type === 'multiple' && (
                                                                <span className="text-blue-600 dark:text-blue-400">✓</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-3 sticky bottom-0 rounded-b-3xl">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    إعادة تعيين
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    بحث
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
