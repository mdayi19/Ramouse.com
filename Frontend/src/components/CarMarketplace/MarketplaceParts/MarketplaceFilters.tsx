import React, { useState } from 'react';
import {
    Filter, ChevronDown, ChevronUp, RotateCcw,
    Search, Check
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceRangeSlider } from './PriceRangeSlider';
import { FilterPresets } from './FilterPresets';

interface MarketplaceFiltersProps {
    filters: FilterType;
    onFilterChange: (key: string, value: any) => void;
    categories: any[];
    onReset: () => void;
    className?: string;
}

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
    filters,
    onFilterChange,
    categories,
    onReset,
    className
}) => {
    // Collapsible sections state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        category: true,
        price: true,
        year: true,
        condition: true,
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const FilterSection = ({
        id,
        title,
        children
    }: {
        id: string;
        title: string;
        children: React.ReactNode;
    }) => (
        <div className="border-b border-slate-200 dark:border-slate-700 py-4 last:border-0">
            <button
                onClick={() => toggleSection(id)}
                className="flex items-center justify-between w-full text-left mb-2 group"
            >
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {title}
                </span>
                {openSections[id] ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>
            <AnimatePresence>
                {openSections[id] && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 pb-1 space-y-3">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5", className)}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Filter className="w-5 h-5 text-primary" />
                    تصفية النتائج
                </h3>
                <button
                    onClick={onReset}
                    className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                    <RotateCcw className="w-3 h-3" />
                    إعادة تعيين
                </button>
            </div>

            {/* Filter Presets - Quick filters */}
            <FilterPresets
                onApplyPreset={(presetFilters) => {
                    Object.entries(presetFilters).forEach(([key, value]) => {
                        onFilterChange(key, value);
                    });
                }}
                currentFilters={filters}
            />

            {/* Category Filter */}
            {categories.length > 0 && (
                <FilterSection id="category" title="الفئة">
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!filters.category_id ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                {!filters.category_id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="category"
                                className="hidden"
                                checked={!filters.category_id}
                                onChange={() => onFilterChange('category_id', '')}
                            />
                            <span className={`text-sm ${!filters.category_id ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>الكل</span>
                        </label>
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.category_id == cat.id ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                    {filters.category_id == cat.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="category"
                                    className="hidden"
                                    checked={filters.category_id == cat.id}
                                    onChange={() => onFilterChange('category_id', cat.id)}
                                />
                                <span className={`text-sm ${filters.category_id == cat.id ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {cat.name_ar || cat.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Price Range with Slider */}
            <FilterSection id="price" title="السعر (ل.س)">
                <PriceRangeSlider
                    min={0}
                    max={100000000}
                    value={[
                        Number(filters.min_price) || 0,
                        Number(filters.max_price) || 100000000
                    ]}
                    onChange={([min, max]) => {
                        onFilterChange('min_price', min);
                        onFilterChange('max_price', max);
                    }}
                    step={1000000}
                />
            </FilterSection>

            {/* Year Range */}
            <FilterSection id="year" title="سنة الصنع">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <input
                            type="number"
                            placeholder="1990"
                            value={filters.min_year || ''}
                            onChange={(e) => onFilterChange('min_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <input
                            type="number"
                            placeholder={new Date().getFullYear().toString()}
                            value={filters.max_year || ''}
                            onChange={(e) => onFilterChange('max_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                </div>
            </FilterSection>

            {/* Condition */}
            <FilterSection id="condition" title="الحالة">
                <div className="space-y-2">
                    {[
                        { value: 'new', label: 'جديدة' },
                        { value: 'used', label: 'مستعملة' },
                        { value: 'certified_pre_owned', label: 'مستعملة معتمدة' }
                    ].map(option => (
                        <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.condition === option.value ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                {filters.condition === option.value && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="condition"
                                className="hidden"
                                checked={filters.condition === option.value}
                                onChange={() => onFilterChange('condition', filters.condition === option.value ? '' : option.value)}
                                onClick={() => { if (filters.condition === option.value) onFilterChange('condition', ''); }}
                            />
                            <span className={`text-sm ${filters.condition === option.value ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>
        </div>
    );
};
