import React, { useState } from 'react';
import {
    Filter, ChevronDown, ChevronUp, RotateCcw,
    Search, Check,
    Fuel, Zap, Droplets, Gauge, Settings,
    Calendar, Banknote, Car, Palette, Timer,
    Globe, Tag, Sparkles, History, BadgeCheck
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RangeSlider } from './RangeSlider';
import { FilterPresets } from './FilterPresets';

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

export const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
    filters,
    onFilterChange,
    categories,
    brands = [],
    models = {},
    countries = [],
    onReset,
    className,
    facetCounts
}) => {
    // Collapsible sections state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        category: true,
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

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const FilterSection = ({
        id,
        title,
        children,
        icon: Icon
    }: {
        id: string;
        title: string;
        children: React.ReactNode;
        icon?: React.ElementType;
    }) => (
        <div className="border-b border-slate-200 dark:border-slate-700 py-4 last:border-0">
            <button
                onClick={() => toggleSection(id)}
                className="flex items-center justify-between w-full text-left mb-2 group"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-primary/80" />}
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {title}
                    </span>
                </div>
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
        return new Intl.NumberFormat('ar-SY', {
            style: 'currency',
            currency: 'SYP',
            maximumFractionDigits: 0,
            notation: 'compact'
        }).format(value);
    };

    const formatMileage = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k كم`;
        }
        return `${value} كم`;
    };

    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5", className)}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Filter className="w-5 h-5 text-primary" />
                    تصفية النتائج
                    {/* Active Filters Count */}
                    {Object.values(filters).some(v => v && v !== '') && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary rounded-full"
                        >
                            {Object.values(filters).filter(v => v && v !== '').length}
                        </motion.span>
                    )}
                </h3>

                {/* Reset Button */}
                {Object.values(filters).some(v => v && v !== '') && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary bg-slate-100 dark:bg-slate-700/50 hover:bg-primary/10 rounded-lg transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        إعادة تعيين
                    </motion.button>
                )}
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

            {/* 1. Origin (Country) Filter */}
            <FilterSection id="origin" title="المنشأ" icon={Globe}>
                {countries.length === 0 ? (
                    <div className="text-sm text-slate-400 p-2">لا توجد بيانات للمنشأ</div>
                ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {countries.map(country => (
                            <label
                                key={country.id}
                                className="flex items-center gap-3 cursor-pointer group"
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
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.car_category_id == country.id ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                    {filters.car_category_id == country.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="radio" className="hidden" readOnly checked={filters.car_category_id == country.id} />
                                <span className={`text-sm ${filters.car_category_id == country.id ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {country.name}
                                </span>
                                {renderCount(country, 'origin')}
                            </label>
                        ))}
                    </div>
                )}
            </FilterSection>

            {/* 2. Brand Filter - Show only if Origin is selected */}
            {filters.car_category_id && (
                <FilterSection id="brand" title="الماركة" icon={Car}>
                    {brands.filter(b => b.country == filters.car_category_id).length === 0 ? (
                        <div className="text-sm text-slate-400 p-2">اختر المنشأ لعرض الماركات</div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {brands
                                .filter(brand => brand.country == filters.car_category_id)
                                .map(brand => (
                                    <label
                                        key={brand.id}
                                        className="flex items-center gap-3 cursor-pointer group"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            // Reset model when brand changes
                                            if (filters.brand_id != brand.id) {
                                                onFilterChange('model', '');
                                            }
                                            onFilterChange('brand_id', filters.brand_id == brand.id ? '' : brand.id);
                                        }}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.brand_id == brand.id ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                            {filters.brand_id == brand.id && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        {brand.logo && <img src={brand.logo} alt={brand.name} className="w-6 h-6 object-contain" />}
                                        <input type="radio" className="hidden" readOnly checked={filters.brand_id == brand.id} />
                                        <span className={`text-sm ${filters.brand_id == brand.id ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {brand.name}
                                        </span>
                                        {renderCount(brand, 'brand')}
                                    </label>
                                ))}
                        </div>
                    )}
                </FilterSection>
            )}

            {/* 3. Model Filter - Only show if brand is selected */}
            {filters.brand_id && (
                <FilterSection id="model" title="الموديل" icon={Car}>
                    {!models[filters.brand_id] || models[filters.brand_id].length === 0 ? (
                        <div className="text-sm text-slate-400 p-2">اختر الماركة لعرض الموديلات</div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {models[filters.brand_id].map((model: any) => (
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
                        </div>
                    )}
                </FilterSection>
            )}

            {/* 4. Category Filter (Moved after Model) */}
            {categories.length > 0 && (
                <FilterSection id="category" title="الفئة" icon={Car}>
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
                            <label
                                key={cat.id}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onFilterChange('category_id', filters.category_id == cat.id ? '' : cat.id);
                                }}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.category_id == cat.id ? 'bg-primary border-primary' : 'border-slate-300 dark:border-slate-600 group-hover:border-primary'}`}>
                                    {filters.category_id == cat.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="category"
                                    className="hidden"
                                    checked={filters.category_id == cat.id}
                                    readOnly
                                />
                                <span className={`text-sm ${filters.category_id == cat.id ? 'font-bold text-primary' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {cat.name_ar || cat.name}
                                </span>
                                {renderCount(cat, 'origin')}
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* 5. Price Range with Slider */}
            <FilterSection id="price" title="السعر (ل.س)" icon={Banknote}>
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
            <FilterSection id="mileage" title="المسافة المقطوعة" icon={Gauge}>
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
            <FilterSection id="year" title="سنة الصنع" icon={Calendar}>
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
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </FilterSection>

            {/* 7.5. Fuel Type - Tile Grid */}
            <FilterSection id="fuel_type" title="نوع الوقود" icon={Fuel}>
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

            {/* 7.6. Transmission - Tile Grid */}
            <FilterSection id="transmission" title="ناقل الحركة" icon={Settings}>
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

            {/* 8. Condition - Tags */}
            <FilterSection id="condition" title="الحالة" icon={Tag}>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'new', label: 'جديدة', icon: Sparkles },
                        { value: 'used', label: 'مستعملة', icon: History },
                        { value: 'certified_pre_owned', label: 'مستعملة معتمدة', icon: BadgeCheck }
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`px-3 py-2 rounded-xl border flex items-center gap-2 text-sm font-bold cursor-pointer transition-all ${filters.condition === option.value
                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                                }`}
                            onClick={(e) => {
                                e.preventDefault();
                                onFilterChange('condition', filters.condition === option.value ? '' : option.value);
                            }}
                        >
                            {option.icon && <option.icon className="w-4 h-4" />}
                            {option.label}
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
        </div>
    );
};
