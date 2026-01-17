import React, { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import {
    Filter, ChevronDown,
    Search, Check, X, Minimize2, Maximize2,
    Fuel, Zap, Droplets, Gauge, Settings,
    Calendar, Banknote, Car,
    Globe, RotateCcw,
    BadgeCheck, Sparkles, History,
    MapPin, User, Truck, Infinity as InfinityIcon, ShieldCheck, Users, CigaretteOff, UserPlus
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { RangeSlider } from './RangeSlider';

import { FilterSection } from './FilterSection';
import { ActiveFilterPills } from './ActiveFilterPills';
import { SYRIAN_CITIES } from '../../../constants';

interface RentFiltersProps {
    filters: FilterType;
    onFilterChange: (key: string, value: any) => void;
    categories?: any[]; // Kept for compatibility but unused
    brands?: any[];
    models?: Record<string | number, any[]>;
    countries?: any[];
    onReset: () => void;
    className?: string;
    facetCounts?: {
        originCounts: Record<string | number, number>;
        brandCounts: Record<string | number, number>;
        modelCounts: Record<string, number>;
        cityCounts?: Record<string, number>;
    };
}

export const RentFiltersComponent: React.FC<RentFiltersProps> = ({
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
        city: true,
        origin: true,
        brand: true,
        model: true,
        price: true,
        deposit: true,
        age: true,
        mileage: true,
        fuel_type: true,
        transmission: true,
        year: true,
        condition: true,
        features: true,
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
            case 'city': return filters.city ? 1 : 0;
            case 'origin': return filters.car_category_id ? 1 : 0;
            case 'brand': return filters.brand_id ? 1 : 0;
            case 'model': return filters.model ? 1 : 0;
            case 'price': return (filters.min_price || filters.max_price) ? 1 : 0;
            case 'mileage': return (filters.min_mileage || filters.max_mileage) ? 1 : 0;
            case 'deposit': return (filters.min_deposit || filters.max_deposit) ? 1 : 0;
            case 'year': return (filters.min_year || filters.max_year) ? 1 : 0;
            case 'age': return (filters.min_renter_age || filters.min_license_age) ? 1 : 0;
            case 'fuel_type': return filters.fuel_type ? 1 : 0;
            case 'transmission': return filters.transmission ? 1 : 0;
            case 'condition': return filters.condition ? 1 : 0;
            case 'features': return (filters.features?.length || 0);
            default: return 0;
        }
    };

    // Memoized clear section callback
    const clearSection = useCallback((sectionId: string) => {
        switch (sectionId) {
            case 'city':
                onFilterChange('city', '');
                break;
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
            case 'deposit':
                onFilterChange('min_deposit', '');
                onFilterChange('max_deposit', '');
                break;
            case 'year':
                onFilterChange('min_year', '');
                onFilterChange('max_year', '');
                break;
            case 'age':
                onFilterChange('min_renter_age', '');
                onFilterChange('min_license_age', '');
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
            case 'features':
                onFilterChange('features', []);
                break;
        }
    }, [onFilterChange]);

    // Common rental features to filter by
    const RENTAL_FEATURES = [
        { id: 'driver_included', label: 'مع سائق', icon: User },
        { id: 'delivery', label: 'توصيل للمكان', icon: Truck },
        { id: 'unlimimted_km', label: 'كيلومترات مفتوحة', icon: InfinityIcon },
        { id: 'comprehensive_insurance', label: 'تأمين شامل', icon: ShieldCheck },
        { id: 'families_only', label: 'للعائلات فقط', icon: Users },
        { id: 'no_smoking', label: 'ممنوع التدخين', icon: CigaretteOff },
        { id: 'additional_driver', label: 'سائق إضافي مسموح', icon: UserPlus },
    ];

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

        if (filters.city) {
            active.push({
                key: 'city',
                label: 'المدينة',
                value: filters.city,
                onRemove: () => onFilterChange('city', '')
            });
        }

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

        if (filters.features && Array.isArray(filters.features) && filters.features.length > 0) {
            const featureLabels: Record<string, string> = {
                driver_included: 'مع سائق',
                delivery: 'توصيل',
                unlimimted_km: 'كم مفتوحة',
                comprehensive_insurance: 'تأمين شامل',
                families_only: 'للعائلات',
                no_smoking: 'ممنوع التدخين',
                additional_driver: 'سائق إضافي'
            };
            filters.features?.forEach((feat: string) => {
                active.push({
                    key: `feature-${feat}`,
                    label: 'ميزة',
                    value: featureLabels[feat] || feat,
                    onRemove: () => {
                        const newFeatures = filters.features!.filter((f: string) => f !== feat);
                        onFilterChange('features', newFeatures);
                    }
                });
            });
        }

        return active;
    }, [filters, countries, brands, onFilterChange]);

    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5", className)}>
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
                        {/* Collapse/Expand All - Touch optimized */}
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
                        {Object.values(filters).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) && (
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

                {/* Active Filters Pills - Inside Sticky Header */}
                <ActiveFilterPills activeFilters={getActiveFilters()} />
            </div>

            {/* City Filter */}
            <FilterSection
                id="city"
                title="المدينة"
                icon={MapPin}
                isOpen={openSections['city']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('city')}
                onClear={clearSection}
            >
                <div className="flex flex-wrap gap-2 p-1">
                    <button
                        onClick={() => onFilterChange('city', '')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!filters.city
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                    >
                        الكل
                    </button>
                    {SYRIAN_CITIES.map(city => {
                        const count = facetCounts?.cityCounts?.[city] || 0;
                        return (
                            <button
                                key={city}
                                onClick={() => onFilterChange('city', filters.city === city ? '' : city)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filters.city === city
                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                            >
                                {city} {count > 0 && <span className="text-xs opacity-60 ml-1">({count})</span>}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>



            {/* Model Filter */}
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
                                    />
                                    {modelSearch && (
                                        <button
                                            onClick={() => setModelSearch('')}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {filteredModels.map((model: any) => (
                                    <label
                                        key={model.id || model}
                                        className="flex items-center gap-3 cursor-pointer group"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const modelVal = model.name || model;
                                            onFilterChange('model', filters.model === modelVal ? '' : modelVal);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.model === (model.name || model) ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                            {filters.model === (model.name || model) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <input type="radio" className="hidden" readOnly checked={filters.model === (model.name || model)} />
                                        <span className={`text-sm ${filters.model === (model.name || model) ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {model.name || model}
                                        </span>
                                        {renderCount(model, 'model')}
                                    </label>
                                ))}
                                {filteredModels.length === 0 && modelSearch && (
                                    <div className="text-sm text-slate-400 text-center py-4">لا توجد نتائج للبحث</div>
                                )}
                            </div>
                        </>
                    )}
                </FilterSection>
            )}

            <FilterSection
                id="price"
                title="التعرفة اليومية ($)"
                icon={Banknote}
                isOpen={openSections['price']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('price')}
                onClear={clearSection}
            >
                <RangeSlider
                    min={0}
                    max={5000}
                    value={[
                        Number(filters.min_price) || 0,
                        Number(filters.max_price) || 5000
                    ]}
                    onChange={([min, max]) => {
                        onFilterChange('min_price', min);
                        onFilterChange('max_price', max);
                    }}
                    step={50}
                    formatLabel={formatCurrency}
                />
            </FilterSection>

            {/* Security Deposit Range - NEW */}
            <FilterSection
                id="deposit"
                title="مبلغ التأمين ($)"
                icon={ShieldCheck}
                isOpen={openSections['deposit']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('deposit')}
                onClear={clearSection}
            >
                <RangeSlider
                    min={0}
                    max={10000} // $10k max deposit
                    value={[
                        Number(filters.min_deposit) || 0,
                        Number(filters.max_deposit) || 10000
                    ]}
                    onChange={([min, max]) => {
                        onFilterChange('min_deposit', min);
                        onFilterChange('max_deposit', max);
                    }}
                    step={100}
                    formatLabel={formatCurrency}
                />
            </FilterSection>

            {/* Driver Age & License Logic */}
            <FilterSection
                id="age"
                title="شروط المستأجر"
                icon={User}
                isOpen={openSections['age']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('age')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">العمر (سنوات)</label>
                        <div className="relative">
                            <select
                                value={filters.min_renter_age || ''}
                                onChange={(e) => onFilterChange('min_renter_age', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">كل الأعمار</option>
                                <option value="18">18+</option>
                                <option value="21">21+</option>
                                <option value="23">23+</option>
                                <option value="25">25+</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">رخصة القيادة</label>
                        <div className="relative">
                            <select
                                value={filters.min_license_age || ''}
                                onChange={(e) => onFilterChange('min_license_age', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">أي خبرة</option>
                                <option value="1">سنة واحدة</option>
                                <option value="2">+2 سنوات</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* Mileage (KM) Range - NEW */}
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

            {/* Year Range */}
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
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <div className="relative">
                            <select
                                value={filters.max_year || ''}
                                onChange={(e) => onFilterChange('max_year', e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
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

            {/* Fuel Type - Tile Grid */}
            <FilterSection
                id="fuel_type"
                title="نوع الوقود"
                icon={Fuel}
                isOpen={openSections['fuel_type']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('fuel_type')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2">
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
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Transmission - Tile Grid */}
            <FilterSection
                id="transmission"
                title="ناقل الحركة"
                icon={Settings}
                isOpen={openSections['transmission']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('transmission')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2">
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
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Condition - Tags */}
            <FilterSection
                id="condition"
                title="الحالة"
                icon={BadgeCheck}
                isOpen={openSections['condition']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('condition')}
                onClear={clearSection}
            >
                <div className="grid grid-cols-2 gap-2">
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
                            />
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Features Checkboxes - NEW */}
            <FilterSection
                id="features"
                title="مميزات إضافية"
                icon={Sparkles}
                isOpen={openSections['features']}
                onToggle={toggleSection}
                activeCount={getSectionActiveCount('features')}
                onClear={clearSection}
            >
                <div className="space-y-2">
                    {RENTAL_FEATURES.map(feature => (
                        <label
                            key={feature.id}
                            className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-lg transition-colors"
                        >
                            <div className="relative flex items-center justify-center w-5 h-5">
                                <input
                                    type="checkbox"
                                    className="peer appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-md checked:bg-primary checked:border-primary transition-all"
                                    checked={filters.features?.includes(feature.id) || false}
                                    onChange={(e) => {
                                        const currentFeatures = filters.features || [];
                                        if (e.target.checked) {
                                            onFilterChange('features', [...currentFeatures, feature.id]);
                                        } else {
                                            onFilterChange('features', currentFeatures.filter((f: string) => f !== feature.id));
                                        }
                                    }}
                                />
                                <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                                <feature.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{feature.label}</span>
                            </div>
                        </label>
                    ))}
                </div>
            </FilterSection>

        </div>
    );
}

export const RentFilters = React.memo(RentFiltersComponent);
