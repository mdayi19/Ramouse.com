import React, { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import {
    Filter,
    Search, Check, X, Minimize2, Maximize2,
    Fuel, Zap, Droplets, Gauge, Settings,
    Calendar, Banknote, Car,
    Globe, RotateCcw,
    BadgeCheck, Sparkles, History
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { RangeSlider } from './RangeSlider';

import { FilterSection } from './FilterSection';
import { ActiveFilterPills } from './ActiveFilterPills';

interface MarketplaceFiltersProps {
    filters: FilterType;
    onFilterChange: (key: string, value: any) => void;
    categories: any[];
    brands?: any[];
    models?: Record<string | number, any[]>;
    countries?: any[];
    onReset: () => void;
    className?: string;
    facetCounts?: {
        originCounts: Record<string | number, number>;
        brandCounts: Record<string | number, number>;
        modelCounts: Record<string, number>;
    };
}

export const MarketplaceFiltersComponent: React.FC<MarketplaceFiltersProps> = ({
    filters,
    onFilterChange,
    brands = [],
    models = {},
    countries = [],
    onReset,
    className,
    facetCounts
}) => {
    // Collapsible sections state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        origin: true,
        brand: true,
        model: true,
        price: true,
        mileage: true,
        fuel_type: true,
        transmission: true,
        year: true,
        condition: true,
    });

    // Search states
    const [brandSearch, setBrandSearch] = useState('');
    const [modelSearch, setModelSearch] = useState('');

    // Debounced search values to reduce filtering operations
    const debouncedBrandSearch = useDebounce(brandSearch, 300);
    const debouncedModelSearch = useDebounce(modelSearch, 300);

    // Memoized callbacks to prevent unnecessary re-renders
    const toggleSection = useCallback((section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    }, []);

    const collapseAll = useCallback(() => {
        setOpenSections(Object.keys(openSections).reduce((acc, key) => ({ ...acc, [key]: false }), {}));
    }, [openSections]);

    const expandAll = useCallback(() => {
        setOpenSections(Object.keys(openSections).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    }, [openSections]);

    // Filtered brands and models based on debounced search
    const filteredBrands = useMemo(() => {
        if (!debouncedBrandSearch) return brands;
        return brands.filter(brand =>
            brand.name.toLowerCase().includes(debouncedBrandSearch.toLowerCase())
        );
    }, [brands, debouncedBrandSearch]);

    const filteredModels = useMemo(() => {
        if (!filters.brand_id || !models[filters.brand_id]) return [];
        const brandModels = models[filters.brand_id];
        if (!debouncedModelSearch) return brandModels;
        return brandModels.filter((model: any) => {
            const modelName = model.name || model;
            return modelName.toLowerCase().includes(debouncedModelSearch.toLowerCase());
        });
    }, [models, filters.brand_id, debouncedModelSearch]);

    // Helper to check if a section has active filters
    const getSectionActiveCount = (sectionId: string): number => {
        switch (sectionId) {
            case 'origin': return filters.car_category_id ? 1 : 0;
            case 'brand': return filters.brand_id ? 1 : 0;
            case 'model': return filters.model ? 1 : 0;
            case 'price': return (filters.min_price || filters.max_price) ? 1 : 0;
            case 'mileage': return (filters.min_mileage || filters.max_mileage) ? 1 : 0;
            case 'year': return (filters.min_year || filters.max_year) ? 1 : 0;
            case 'fuel_type': return filters.fuel_type ? 1 : 0;
            case 'transmission': return filters.transmission ? 1 : 0;
            case 'condition': return filters.condition ? 1 : 0;
            default: return 0;
        }
    };

    // Memoized clear section callback
    const clearSection = useCallback((sectionId: string) => {
        switch (sectionId) {
            case 'origin':
                onFilterChange('car_category_id', '');
                onFilterChange('brand_id', '');
                onFilterChange('model', '');
                break;
            case 'brand':
                onFilterChange('brand_id', '');
                onFilterChange('model', '');
                break;
            case 'model':
                onFilterChange('model', '');
                break;
            case 'price':
                onFilterChange('min_price', '');
                onFilterChange('max_price', '');
                break;
            case 'mileage':
                onFilterChange('min_mileage', '');
                onFilterChange('max_mileage', '');
                break;
            case 'year':
                onFilterChange('min_year', '');
                onFilterChange('max_year', '');
                break;
            case 'fuel_type':
                onFilterChange('fuel_type', '');
                break;
            case 'transmission':
                onFilterChange('transmission', '');
                break;
            case 'condition':
                onFilterChange('condition', '');
                break;
        }
    }, [onFilterChange]);

    const renderCount = (item: any, type: 'origin' | 'brand' | 'model') => {
        let count = 0;

        if (facetCounts) {
            if (type === 'origin') count = facetCounts.originCounts[item.id] || 0;
            else if (type === 'brand') count = facetCounts.brandCounts[item.id] || 0;
            else if (type === 'model') count = facetCounts.modelCounts[item.name || item] || 0;
        } else {
            count = item.count || item.listings_count || 0;
        }

        return <span className="text-xs text-slate-400 dark:text-slate-500 mr-auto ml-1">({count})</span>;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(value) + ' $';
    };

    const formatMileage = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k كم`;
        }
        return `${value} كم`;
    };

    const allCollapsed = Object.values(openSections).every(v => !v);

    // Get active filters for pills display
    const getActiveFilters = useCallback(() => {
        const active: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

        if (filters.car_category_id) {
            const country = countries.find(c => c.id == filters.car_category_id);
            if (country) {
                active.push({
                    key: 'origin',
                    label: 'المنشأ',
                    value: country.name,
                    onRemove: () => {
                        onFilterChange('car_category_id', '');
                        onFilterChange('brand_id', '');
                        onFilterChange('model', '');
                    }
                });
            }
        }

        if (filters.brand_id) {
            const brand = brands.find(b => b.id == filters.brand_id);
            if (brand) {
                active.push({
                    key: 'brand',
                    label: 'الماركة',
                    value: brand.name,
                    onRemove: () => {
                        onFilterChange('brand_id', '');
                        onFilterChange('model', '');
                    }
                });
            }
        }

        if (filters.model) {
            active.push({
                key: 'model',
                label: 'الموديل',
                value: filters.model,
                onRemove: () => onFilterChange('model', '')
            });
        }

        if (filters.fuel_type) {
            const fuelLabels: Record<string, string> = { gas: 'بنزين', diesel: 'ديزل', electric: 'كهرباء', hybrid: 'هايبرد' };
            active.push({
                key: 'fuel',
                label: 'الوقود',
                value: fuelLabels[filters.fuel_type] || filters.fuel_type,
                onRemove: () => onFilterChange('fuel_type', '')
            });
        }

        if (filters.transmission) {
            const transLabels: Record<string, string> = { automatic: 'أوتوماتيك', manual: 'عادي' };
            active.push({
                key: 'transmission',
                label: 'ناقل الحركة',
                value: transLabels[filters.transmission] || filters.transmission,
                onRemove: () => onFilterChange('transmission', '')
            });
        }

        if (filters.condition) {
            const condLabels: Record<string, string> = { new: 'جديدة', used: 'مستعملة', certified_pre_owned: 'مستعملة معتمدة' };
            active.push({
                key: 'condition',
                label: 'الحالة',
                value: condLabels[filters.condition] || filters.condition,
                onRemove: () => onFilterChange('condition', '')
            });
        }

        return active;
    }, [filters, countries, brands, onFilterChange]);

    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5", className)} role="region" aria-label="فلاتر البحث">
            {/* Sticky Filter Header on Mobile */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 -mx-5 -mt-5 px-5 pt-5 pb-4 mb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                        <Filter className="w-5 h-5 text-primary" />
                        تصفية النتائج
                        {/* Active Filters Count */}
                        {Object.values(filters).some(v => v && v !== '') && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full"
                                aria-label={`${Object.values(filters).filter(v => v && v !== '').length} فلاتر نشطة`}
                            >
                                {Object.values(filters).filter(v => v && v !== '').length}
                            </motion.span>
                        )}
                    </h3>

                    <div className="flex items-center gap-2">
                        {/* Collapse/Expand All - Optimized for touch */}
                        <button
                            onClick={allCollapsed ? expandAll : collapseAll}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                            title={allCollapsed ? 'توسيع الكل' : 'طي الكل'}
                            aria-label={allCollapsed ? 'توسيع جميع الأقسام' : 'طي جميع الأقسام'}
                        >
                            {allCollapsed ? (
                                <Maximize2 className="w-4 h-4 text-slate-400" />
                            ) : (
                                <Minimize2 className="w-4 h-4 text-slate-400" />
                            )}
                        </button>

                        {/* Reset Button - Touch optimized */}
                        {Object.values(filters).some(v => v && v !== '') && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{
                                    scale: {
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: 'reverse'
                                    }
                                }}
                                onClick={onReset}
                                className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all touch-manipulation shadow-lg hover:shadow-xl"
                                aria-label="إعادة تعيين جميع الفلاتر"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                إعادة تعيين
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Active Filters Pills */}
                <ActiveFilterPills activeFilters={getActiveFilters()} />
            </div>

            {/* 1. Origin (Country) Filter */}
            <FilterSection
                id="origin"
                title="المنشأ"
                icon={Globe}
                isOpen={openSections['origin']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('origin')}
                onClear={clearSection}
            >
                {countries.length === 0 ? (
                    <div className="text-sm text-slate-400 p-2">لا توجد بيانات للمنشأ</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {countries.map(country => (
                            <button
                                key={country.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    const newValue = filters.car_category_id == country.id ? '' : country.id;
                                    // Cascade reset
                                    if (newValue !== filters.car_category_id) {
                                        onFilterChange('brand_id', '');
                                        onFilterChange('model', '');
                                    }
                                    onFilterChange('car_category_id', newValue);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${filters.car_category_id == country.id
                                    ? 'border-primary bg-primary text-white'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {country.name} {renderCount(country, 'origin')}
                            </button>
                        ))}
                    </div>
                )}
            </FilterSection>

            {/* 2. Brand Filter - Show only if Origin is selected */}
            {filters.car_category_id && (
                <FilterSection
                    id="brand"
                    title="الماركة"
                    icon={Car}
                    isOpen={openSections['brand']}
                    onToggle={toggleSection}
                    activeCount={getSectionActiveCount('brand')}
                    onClear={clearSection}
                >
                    {brands.filter(b => b.country == filters.car_category_id).length === 0 ? (
                        <div className="text-sm text-slate-400 p-2">اختر المنشأ لعرض الماركات</div>
                    ) : (
                        <>
                            {/* Search input if more than 5 brands */}
                            {brands.filter(b => b.country == filters.car_category_id).length > 5 && (
                                <div className="relative mb-3">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="ابحث عن ماركة..."
                                        value={brandSearch}
                                        onChange={(e) => setBrandSearch(e.target.value)}
                                        className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        aria-label="البحث عن ماركة"
                                        role="searchbox"
                                    />
                                    {brandSearch && (
                                        <button
                                            onClick={() => setBrandSearch('')}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                            aria-label="مسح البحث"
                                            type="button"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {filteredBrands
                                    .filter(brand => brand.country == filters.car_category_id)
                                    .map(brand => (
                                        <button
                                            key={brand.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Reset model when brand changes
                                                if (filters.brand_id != brand.id) {
                                                    onFilterChange('model', '');
                                                }
                                                onFilterChange('brand_id', filters.brand_id == brand.id ? '' : brand.id);
                                            }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${filters.brand_id == brand.id
                                                ? 'border-primary bg-primary text-white'
                                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                                                }`}
                                        >
                                            {brand.logo && <img src={brand.logo} alt={brand.name} className="w-4 h-4 object-contain" />}
                                            {brand.name} {renderCount(brand, 'brand')}
                                        </button>
                                    ))}
                                {filteredBrands.filter(b => b.country == filters.car_category_id).length === 0 && brandSearch && (
                                    <div className="text-sm text-slate-400 text-center py-4 w-full">لا توجد نتائج للبحث</div>
                                )}
                            </div>
                        </>
                    )}
                </FilterSection>
            )}

            {/* 3. Model Filter - Only show if brand is selected */}
            {filters.brand_id && (
                <FilterSection
                    id="model"
                    title="الموديل"
                    icon={Car}
                    isOpen={openSections['model']}
                    onToggle={toggleSection}
                    activeCount={getSectionActiveCount('model')}
                    onClear={clearSection}
                >
                    {!models[filters.brand_id] || models[filters.brand_id].length === 0 ? (
                        <div className="text-sm text-slate-400 p-2">اختر الماركة لعرض الموديلات</div>
                    ) : (
                        <>
                            {/* Search input if more than 5 models */}
                            {models[filters.brand_id].length > 5 && (
                                <div className="relative mb-3">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="ابحث عن موديل..."
                                        value={modelSearch}
                                        onChange={(e) => setModelSearch(e.target.value)}
                                        className="w-full pr-10 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        aria-label="البحث عن موديل"
                                        role="searchbox"
                                    />
                                    {modelSearch && (
                                        <button
                                            onClick={() => setModelSearch('')}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                            aria-label="مسح البحث"
                                            type="button"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredModels.map((model: any) => (
                                    <button
                                        key={model.id || model}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const modelVal = model.name || model;
                                            onFilterChange('model', filters.model === modelVal ? '' : modelVal);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border-2 ${filters.model === (model.name || model)
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary'
                                            }`}
                                    >
                                        {model.name || model} {renderCount(model, 'model')}
                                    </button>
                                ))}
                                {filteredModels.length === 0 && modelSearch && (
                                    <div className="text-sm text-slate-400 text-center py-4 w-full">لا توجد نتائج للبحث</div>
                                )}
                            </div>
                        </>
                    )}
                </FilterSection>
            )}

            {/* 5. Price Range with Slider */}
            <FilterSection
                id="price"
                title="السعر ($)"
                icon={Banknote}
                isOpen={openSections['price']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('price')}
                onClear={clearSection}
            >
                <RangeSlider
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
                    formatLabel={formatCurrency}
                />
            </FilterSection>

            {/* 6. Mileage (KM) Range */}
            <FilterSection
                id="mileage"
                title="المسافة المقطوعة"
                icon={Gauge}
                isOpen={openSections['mileage']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('mileage')}
                onClear={clearSection}
            >
                <RangeSlider
                    min={0}
                    max={300000}
                    value={[
                        Number(filters.min_mileage) || 0,
                        Number(filters.max_mileage) || 300000
                    ]}
                    onChange={([min, max]) => {
                        onFilterChange('min_mileage', min);
                        onFilterChange('max_mileage', max);
                    }}
                    step={5000}
                    formatLabel={formatMileage}
                />
            </FilterSection>

            {/* 7. Year Range */}
            <FilterSection
                id="year"
                title="سنة الصنع"
                icon={Calendar}
                isOpen={openSections['year']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('year')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <div className="relative">
                            <select
                                value={filters.min_year || ''}
                                onChange={(e) => onFilterChange('min_year', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                aria-label="سنة الصنع من"
                            >
                                <option value="">اختر السنة</option>
                                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            {/* ChevronDown icon was used here but didn't import it separately? No, I imported it in the block above? No I removed it from imports intentionally? 
                                Wait, I need to check imports. I removed ChevronDown from imports in my 'clean' version because I am using Lucide icons.
                                But here I need it for the select wrapper.
                                It was in the original imports. 
                                Let me re-add ChevronDown to imports.
                            */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <div className="relative">
                            <select
                                value={filters.max_year || ''}
                                onChange={(e) => onFilterChange('max_year', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                aria-label="سنة الصنع إلى"
                            >
                                <option value="">اختر السنة</option>
                                {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* 7.5. Fuel Type - Tile Grid */}
            <FilterSection
                id="fuel_type"
                title="نوع الوقود"
                icon={Fuel}
                isOpen={openSections['fuel_type']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('fuel_type')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="نوع الوقود">
                    {[
                        { value: 'gas', label: 'بنزين', icon: Fuel },
                        { value: 'diesel', label: 'ديزل', icon: Droplets },
                        { value: 'electric', label: 'كهرباء', icon: Zap },
                        { value: 'hybrid', label: 'هايبرد', icon: Zap } // or leaf/plug
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${filters.fuel_type === option.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                onFilterChange('fuel_type', filters.fuel_type === option.value ? '' : option.value);
                            }}
                        >
                            <option.icon className={`w-6 h-6 mb-2 ${filters.fuel_type === option.value ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{option.label}</span>
                            <input
                                type="radio"
                                className="hidden"
                                checked={filters.fuel_type === option.value}
                                readOnly
                                aria-label={option.label}
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* 7.6. Transmission - Tile Grid */}
            <FilterSection
                id="transmission"
                title="ناقل الحركة"
                icon={Settings}
                isOpen={openSections['transmission']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('transmission')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="ناقل الحركة">
                    {[
                        { value: 'automatic', label: 'أوتوماتيك', icon: Zap }, // Maybe "A" icon?
                        { value: 'manual', label: 'عادي', icon: Settings } // Gear icon
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${filters.transmission === option.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                onFilterChange('transmission', filters.transmission === option.value ? '' : option.value);
                            }}
                        >
                            <option.icon className="w-6 h-6 mb-2" />
                            <span className="text-xs font-bold">{option.label}</span>
                            <input
                                type="radio"
                                className="hidden"
                                checked={filters.transmission === option.value}
                                readOnly
                                aria-label={option.label}
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* 7.7. Condition - Tile Grid */}
            <FilterSection
                id="condition"
                title="الحالة"
                icon={BadgeCheck}
                isOpen={openSections['condition']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('condition')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="حالة السيارة">
                    {[
                        { value: 'new', label: 'جديد', icon: Sparkles },
                        { value: 'used', label: 'مستعمل', icon: History },
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${filters.condition === option.value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                onFilterChange('condition', filters.condition === option.value ? '' : option.value);
                            }}
                        >
                            <option.icon className="w-6 h-6 mb-2" />
                            <span className="text-xs font-bold">{option.label}</span>
                            <input
                                type="radio"
                                className="hidden"
                                checked={filters.condition === option.value}
                                readOnly
                                aria-label={option.label}
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>
        </div>
    );
}

export const MarketplaceFilters = React.memo(MarketplaceFiltersComponent);
