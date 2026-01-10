import React, { useState } from 'react';
import {
    Filter, ChevronDown, ChevronUp, RotateCcw,
    Check, MapPin
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RentFiltersProps {
    filters: FilterType;
    onFilterChange: (key: string, value: any) => void;
    categories: any[];
    onReset: () => void;
    className?: string;
}

const SYRIAN_CITIES = [
    'دمشق',
    'ريف دمشق',
    'حلب',
    'حمص',
    'اللاذقية',
    'طرحوس',
    'حماة',
    'درعا',
    'السويداء',
    'القنيطرة',
    'دير الزور',
    'الحسكة',
    'الرقة',
    'إدلب'
];

export const RentFilters: React.FC<RentFiltersProps> = ({
    filters,
    onFilterChange,
    categories,
    onReset,
    className
}) => {
    // Collapsible sections state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        city: true,
        category: true,
        price: true,
        deposit: true,
        age: true,
        year: true,
        features: true,
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
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
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

    // Common rental features to filter by
    const RENTAL_FEATURES = [
        { id: 'driver_included', label: 'مع سائق' },
        { id: 'delivery', label: 'توصيل للمكان' },
        { id: 'unlimimted_km', label: 'كيلومترات مفتوحة' },
        { id: 'comprehensive_insurance', label: 'تأمين شامل' },
        { id: 'families_only', label: 'للعائلات فقط' },
        { id: 'no_smoking', label: 'ممنوع التدخين' },
        { id: 'additional_driver', label: 'سائق إضافي مسموح' },
    ];

    return (
        <div className={cn("bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5", className)}>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Filter className="w-5 h-5 text-teal-600" />
                    تصفية الإيجارات
                </h3>
            </div>

            {/* City Filter */}
            <FilterSection id="city" title="المدينة">
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!filters.city ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                            {!filters.city && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="radio"
                            name="city"
                            className="hidden"
                            checked={!filters.city}
                            onChange={() => onFilterChange('city', '')}
                        />
                        <span className={`text-sm ${!filters.city ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>الكل</span>
                    </label>
                    {SYRIAN_CITIES.map(city => (
                        <label key={city} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.city === city ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                {filters.city === city && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="city"
                                className="hidden"
                                checked={filters.city === city}
                                onChange={() => onFilterChange('city', city)}
                            />
                            <span className={`text-sm ${filters.city === city ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                {city}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Category Filter */}
            {categories.length > 0 && (
                <FilterSection id="category" title="الفئة">
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!filters.category_id ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                {!filters.category_id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="category"
                                className="hidden"
                                checked={!filters.category_id}
                                onChange={() => onFilterChange('category_id', '')}
                            />
                            <span className={`text-sm ${!filters.category_id ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>الكل</span>
                        </label>
                        {categories.map(cat => (
                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.category_id == cat.id ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                    {filters.category_id == cat.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="category"
                                    className="hidden"
                                    checked={filters.category_id == cat.id}
                                    onChange={() => onFilterChange('category_id', cat.id)}
                                />
                                <span className={`text-sm ${filters.category_id == cat.id ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {cat.name_ar || cat.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Daily Rate Range */}
            <FilterSection id="price" title="السعر اليومي (ل.س)">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={filters.min_price || ''}
                            onChange={(e) => onFilterChange('min_price', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <input
                            type="number"
                            placeholder="أقصى"
                            value={filters.max_price || ''}
                            onChange={(e) => onFilterChange('max_price', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                </div>
            </FilterSection>

            {/* Security Deposit Range */}
            <FilterSection id="deposit" title="مبلغ التأمين (ل.س)">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={filters.min_deposit || ''}
                            onChange={(e) => onFilterChange('min_deposit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <input
                            type="number"
                            placeholder="أقصى"
                            value={filters.max_deposit || ''}
                            onChange={(e) => onFilterChange('max_deposit', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                </div>
            </FilterSection>

            {/* Age Requirements */}
            <FilterSection id="age" title="متطلبات العمر">
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">الحد الأدنى لعمر المستأجر</label>
                        <select
                            value={filters.min_renter_age || ''}
                            onChange={(e) => onFilterChange('min_renter_age', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all appearance-none"
                        >
                            <option value="">لا يهم</option>
                            <option value="18">18 سنة</option>
                            <option value="21">21 سنة</option>
                            <option value="23">23 سنة</option>
                            <option value="25">25 سنة+</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">مدة امتلاك الرخصة (سنوات)</label>
                        <input
                            type="number"
                            placeholder="مثلاً: 1"
                            value={filters.min_license_age || ''}
                            onChange={(e) => onFilterChange('min_license_age', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                </div>
            </FilterSection>


            {/* Rental Features */}
            <FilterSection id="features" title="ميزات الإيجار">
                <div className="space-y-2">
                    {RENTAL_FEATURES.map(feature => {
                        const isSelected = filters.features?.includes(feature.id);
                        return (
                            <label key={feature.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'
                                    }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected || false}
                                    onChange={() => {
                                        const currentFeatures = filters.features || [];
                                        const newFeatures = isSelected
                                            ? currentFeatures.filter(f => f !== feature.id)
                                            : [...currentFeatures, feature.id];
                                        onFilterChange('features', newFeatures);
                                    }}
                                />
                                <span className={`text-sm transition-colors ${isSelected ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400 group-hover:text-teal-600'}`}>
                                    {feature.label}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Year Range */}
            <FilterSection id="year" title="سنة الصنع">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <input
                            type="number"
                            placeholder="2015"
                            value={filters.min_year || ''}
                            onChange={(e) => onFilterChange('min_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <input
                            type="number"
                            placeholder={new Date().getFullYear().toString()}
                            value={filters.max_year || ''}
                            onChange={(e) => onFilterChange('max_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all"
                        />
                    </div>
                </div>
            </FilterSection>
        </div>
    );
};
