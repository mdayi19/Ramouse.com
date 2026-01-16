import React, { useState } from 'react';
import {
    Filter, ChevronDown, ChevronUp, RotateCcw,
    Check, MapPin, Globe, Car, Banknote,
    Fuel, Zap, Droplets, Settings, Calendar,
    User, Truck, Infinity as InfinityIcon, ShieldCheck, Users, CigaretteOff, UserPlus,
    Gauge
} from 'lucide-react';
import { MarketplaceFilters as FilterType } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RangeSlider } from './RangeSlider';
import { FilterPresets } from './FilterPresets';

interface RentFiltersProps {
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
        category: true,
        origin: true,
        brand: true,
        model: true,
        fuel_type: true,
        transmission: true,
        price: true,
        deposit: true,
        age: true,
        mileage: true,
        year: true,
        features: true,
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
                    {Icon && <Icon className="w-5 h-5 text-teal-600/80" />}
                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
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
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                    <Filter className="w-5 h-5 text-teal-600" />
                    تصفية الإيجارات
                    {/* Active Filters Count */}
                    {Object.values(filters).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-teal-600 rounded-full"
                        >
                            {Object.values(filters).filter(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)).length}
                        </motion.span>
                    )}
                </h3>

                {/* Reset Button */}
                {Object.values(filters).some(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) && (
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={onReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-500 bg-slate-100 dark:bg-slate-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        إعادة تعيين
                    </motion.button>
                )}
            </div>

            {/* City Filter */}
            <FilterSection id="city" title="المدينة" icon={MapPin}>
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
                        <label
                            key={city}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={(e) => {
                                e.preventDefault();
                                onFilterChange('city', filters.city === city ? '' : city);
                            }}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.city === city ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                {filters.city === city && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="radio"
                                name="city"
                                className="hidden"
                                checked={filters.city === city}
                                readOnly
                            />
                            <span className={`text-sm ${filters.city === city ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                {city}
                            </span>
                        </label>
                    ))}
                </div>
            </FilterSection>

            {/* Origin (Country) Filter */}
            {countries.length > 0 && (
                <FilterSection id="origin" title="المنشأ" icon={Globe}>
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
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.car_category_id == country.id ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                    {filters.car_category_id == country.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="radio" className="hidden" readOnly checked={filters.car_category_id == country.id} />
                                <span className={`text-sm ${filters.car_category_id == country.id ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {country.name}
                                </span>
                                {renderCount(country, 'origin')}
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Brand Filter - Show only if Origin is selected */}
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
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.brand_id == brand.id ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                            {filters.brand_id == brand.id && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        {brand.logo && <img src={brand.logo} alt={brand.name} className="w-6 h-6 object-contain" />}
                                        <input type="radio" className="hidden" readOnly checked={filters.brand_id == brand.id} />
                                        <span className={`text-sm ${filters.brand_id == brand.id ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {brand.name}
                                        </span>
                                        {renderCount(brand, 'brand')}
                                    </label>
                                ))}
                        </div>
                    )}
                </FilterSection>
            )}

            {/* Model Filter */}
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
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.model === (model.name || model) ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                        {filters.model === (model.name || model) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <input type="radio" className="hidden" readOnly checked={filters.model === (model.name || model)} />
                                    <span className={`text-sm ${filters.model === (model.name || model) ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {model.name || model}
                                    </span>
                                    {renderCount(model, 'model')}
                                </label>
                            ))}
                        </div>
                    )}
                </FilterSection>
            )}

            {/* Category Filter */}
            {categories.length > 0 && (
                <FilterSection id="category" title="الفئة" icon={Car}>
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
                            <label
                                key={cat.id}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onFilterChange('category_id', filters.category_id == cat.id ? '' : cat.id);
                                }}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.category_id == cat.id ? 'bg-teal-600 border-teal-600' : 'border-slate-300 dark:border-slate-600 group-hover:border-teal-600'}`}>
                                    {filters.category_id == cat.id && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="radio"
                                    name="category"
                                    className="hidden"
                                    checked={filters.category_id == cat.id}
                                    readOnly
                                />
                                <span className={`text-sm ${filters.category_id == cat.id ? 'font-bold text-teal-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                    {cat.name_ar || cat.name}
                                </span>
                                {renderCount(cat, 'origin')}
                            </label>
                        ))}
                    </div>
                </FilterSection>
            )}

            {/* Daily Rate Range */}
            <FilterSection id="price" title="التعرفة اليومية (ل.س)" icon={Banknote}>
                <RangeSlider
                    min={0}
                    max={5000000}
                    value={[
                        Number(filters.min_price) || 0,
                        Number(filters.max_price) || 5000000
                    ]}
                    onChange={([min, max]) => {
                        onFilterChange('min_price', min);
                        onFilterChange('max_price', max);
                    }}
                    step={50000}
                    formatLabel={formatCurrency}
                />
            </FilterSection>

            {/* Mileage (KM) Range - NEW */}
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

            {/* Fuel Type - NEW */}
            <FilterSection id="fuel_type" title="نوع الوقود" icon={Fuel}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'gas', label: 'بنزين', icon: Fuel },
                        { value: 'diesel', label: 'ديزل', icon: Droplets },
                        { value: 'electric', label: 'كهرباء', icon: Zap },
                        { value: 'hybrid', label: 'هايبرد', icon: Zap }
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${filters.fuel_type === option.value
                                ? 'border-teal-600 bg-teal-50 text-teal-600'
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

            {/* Transmission - NEW */}
            <FilterSection id="transmission" title="ناقل الحركة" icon={Settings}>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'automatic', label: 'أوتوماتيك', icon: Zap },
                        { value: 'manual', label: 'عادي', icon: Settings }
                    ].map(option => (
                        <label
                            key={option.value}
                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${filters.transmission === option.value
                                ? 'border-teal-600 bg-teal-50 text-teal-600'
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

            {/* Security Deposit Range */}
            <FilterSection id="deposit" title="مبلغ التأمين (ل.س)" icon={ShieldCheck}>
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
            <FilterSection id="age" title="متطلبات العمر" icon={User}>
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
            <FilterSection id="features" title="ميزات الإيجار" icon={Check}>
                <div className="space-y-2">
                    {RENTAL_FEATURES.map(feature => {
                        const isSelected = filters.features?.includes(feature.id);
                        return (
                            <label key={feature.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-teal-600'
                                    }`}>
                                    {feature.icon && <feature.icon className="w-4 h-4" />}
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
            <FilterSection id="year" title="سنة الصنع" icon={Calendar}>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">من</label>
                        <select
                            value={filters.min_year || ''}
                            onChange={(e) => onFilterChange('min_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">اختر السنة</option>
                            {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">إلى</label>
                        <select
                            value={filters.max_year || ''}
                            onChange={(e) => onFilterChange('max_year', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">اختر السنة</option>
                            {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </FilterSection>
        </div>
    );
};
