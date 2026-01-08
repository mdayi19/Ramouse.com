import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Car, Tag, ChevronRight } from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import { IconCard } from '../IconCard';

interface Step2CountryBrandModelProps {
    formData: any;
    updateField: (field: string, value: any) => void;
    categories: any[];
    brands: any[];
}

const Step2CountryBrandModel: React.FC<Step2CountryBrandModelProps> = ({
    formData,
    updateField,
    categories,
    brands
}) => {
    const [countries, setCountries] = useState<any[]>([]);
    const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
    const [subStep, setSubStep] = useState(1);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const brandsSectionRef = useRef<HTMLDivElement>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);

    // Fetch countries on mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setLoading(true);
                const response = await CarProviderService.getCountries();
                if (response.success && response.countries) {
                    setCountries(response.countries);
                }
            } catch (error) {
                console.error('Failed to fetch countries:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    // Filter brands by selected country
    useEffect(() => {
        if (formData.country_id && brands.length > 0) {
            const filtered = brands.filter((brand: any) => brand.country === formData.country_id);
            setFilteredBrands(filtered);

            // Auto-advance to sub-step 2 when country selected
            if (subStep === 1) {
                setSubStep(2);
                setTimeout(() => {
                    brandsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else {
            setFilteredBrands([]);
        }
    }, [formData.country_id, brands]);

    // Auto-advance to sub-step 3 when brand selected
    useEffect(() => {
        if (formData.brand_id && subStep === 2) {
            setSubStep(3);
            setTimeout(() => {
                modelInputRef.current?.focus();
            }, 100);
        }
    }, [formData.brand_id]);

    const handleCountrySelect = (countryId: string) => {
        updateField('country_id', countryId);
        // Reset brand and model when country changes
        updateField('brand_id', '');
        updateField('model', '');
        setSubStep(2);
    };

    const handleBrandSelect = (brandId: string) => {
        updateField('brand_id', brandId);
        // Reset model when brand changes
        updateField('model', '');
        setSubStep(3);
    };

    const handleModelChange = (model: string) => {
        updateField('model', model);
    };

    const handleCategorySelect = (categoryId: string) => {
        updateField('category_id', categoryId);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${subStep >= 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>1</div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${subStep >= 2 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>2</div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${subStep >= 3 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'
                    }`}>3</div>
            </div>

            {/* Sub-step 1: Country Selection */}
            <AnimatePresence mode="wait">
                {subStep >= 1 && (
                    <motion.div
                        key="country"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-5 h-5 text-primary" />
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                بلد المنشأ <span className="text-red-500">*</span>
                            </h4>
                            {formData.country_id && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateField('country_id', '');
                                        updateField('brand_id', '');
                                        updateField('model', '');
                                        setSubStep(1);
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mr-auto"
                                >
                                    تغيير
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-sm text-slate-500 mt-2">جاري التحميل...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {countries.map((country: any) => (
                                    <button
                                        key={country.id}
                                        type="button"
                                        onClick={() => handleCountrySelect(country.id)}
                                        disabled={formData.country_id && formData.country_id !== country.id}
                                        className={`p-4 rounded-xl font-bold text-sm transition-all ${formData.country_id === country.id
                                                ? 'bg-primary text-white shadow-lg scale-105'
                                                : formData.country_id
                                                    ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">🌍</div>
                                        {country.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-step 2: Brand Selection */}
            <AnimatePresence mode="wait">
                {subStep >= 2 && formData.country_id && (
                    <motion.div
                        key="brand"
                        ref={brandsSectionRef}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Car className="w-5 h-5 text-primary" />
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                الماركة <span className="text-red-500">*</span>
                            </h4>
                            {formData.brand_id && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        updateField('brand_id', '');
                                        updateField('model', '');
                                        setSubStep(2);
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mr-auto"
                                >
                                    تغيير
                                </button>
                            )}
                        </div>

                        {filteredBrands.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                لا توجد ماركات متاحة لهذا البلد
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {filteredBrands.map((brand: any) => (
                                    <button
                                        key={brand.id}
                                        type="button"
                                        onClick={() => handleBrandSelect(brand.id)}
                                        disabled={formData.brand_id && formData.brand_id !== brand.id}
                                        className={`p-4 rounded-xl font-bold text-sm transition-all ${formData.brand_id === brand.id
                                                ? 'bg-primary text-white shadow-lg scale-105'
                                                : formData.brand_id
                                                    ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                                            }`}
                                    >
                                        {brand.logo ? (
                                            <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain mx-auto mb-2" />
                                        ) : (
                                            <div className="text-2xl mb-1">🚗</div>
                                        )}
                                        {brand.name_ar || brand.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-step 3: Model & Category */}
            <AnimatePresence mode="wait">
                {subStep >= 3 && formData.brand_id && (
                    <motion.div
                        key="model"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {/* Model Input */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <Car className="w-5 h-5 text-primary" />
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                    الموديل <span className="text-red-500">*</span>
                                </h4>
                            </div>

                            <input
                                ref={modelInputRef}
                                type="text"
                                value={formData.model || ''}
                                onChange={(e) => handleModelChange(e.target.value)}
                                placeholder="مثال: كامري، كورولا، سوناتا..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary border-slate-200 dark:border-slate-600"
                                required
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                💡 اكتب اسم الموديل يدوياً
                            </p>
                        </div>

                        {/* Category Selection */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <Tag className="w-5 h-5 text-primary" />
                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                    نوع السيارة (اختياري)
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {categories.map((category: any) => (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => handleCategorySelect(category.id.toString())}
                                        className={`p-3 rounded-xl font-bold text-sm transition-all ${formData.category_id === category.id.toString()
                                                ? 'bg-primary text-white shadow-lg'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                                            }`}
                                    >
                                        {category.name_ar || category.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step2CountryBrandModel;
