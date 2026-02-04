import React from 'react';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';

interface SortOption {
    value: string;
    label: string;
}

interface SortControlsProps {
    /** Total number of results */
    totalResults: number;
    /** Currently selected sort option */
    currentSort: string;
    /** Available sort options */
    sortOptions: SortOption[];
    /** Callback when sort changes */
    onSortChange: (sort: string) => void;
    /** Optional callback to open filters */
    onOpenFilters?: () => void;
}

/**
 * SortControls Component
 * Displays result count and sort/filter controls
 * 
 * @example
 * ```tsx
 * <SortControls
 *   totalResults={15}
 *   currentSort="lowest_price"
 *   sortOptions={carSortOptions}
 *   onSortChange={setSortBy}
 *   onOpenFilters={() => setShowFilters(true)}
 * />
 * ```
 */
export const SortControls: React.FC<SortControlsProps> = ({
    totalResults,
    currentSort,
    sortOptions,
    onSortChange,
    onOpenFilters
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {/* Result Count */}
            <div className="flex items-center gap-2">
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {totalResults}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    نتيجة
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {/* Filter Button */}
                {onOpenFilters && (
                    <button
                        onClick={onOpenFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        aria-label="فتح الفلاتر"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span className="hidden sm:inline">فلترة</span>
                    </button>
                )}

                {/* Sort Dropdown */}
                <div className="relative">
                    <select
                        value={currentSort}
                        onChange={(e) => onSortChange(e.target.value)}
                        className="appearance-none pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        aria-label="ترتيب حسب"
                    >
                        {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>
    );
};

// Predefined sort options for different result types
export const carSortOptions: SortOption[] = [
    { value: 'newest', label: 'الأحدث' },
    { value: 'lowest_price', label: 'الأقل سعراً' },
    { value: 'highest_price', label: 'الأعلى سعراً' },
    { value: 'nearest', label: 'الأقرب' },
    { value: 'highest_rated', label: 'الأعلى تقييماً' },
    { value: 'lowest_mileage', label: 'أقل مسافة' }
];

export const technicianSortOptions: SortOption[] = [
    { value: 'nearest', label: 'الأقرب' },
    { value: 'highest_rated', label: 'الأعلى تقييماً' },
    { value: 'most_reviews', label: 'الأكثر تقييماً' },
    { value: 'lowest_price', label: 'الأقل سعراً' },
    { value: 'available_now', label: 'متاح الآن' }
];

export const towTruckSortOptions: SortOption[] = [
    { value: 'nearest', label: 'الأقرب' },
    { value: 'fastest_response', label: 'أسرع استجابة' },
    { value: 'lowest_price', label: 'الأقل سعراً' },
    { value: 'highest_rated', label: 'الأعلى تقييماً' },
    { value: 'available_now', label: 'متاح الآن' }
];
