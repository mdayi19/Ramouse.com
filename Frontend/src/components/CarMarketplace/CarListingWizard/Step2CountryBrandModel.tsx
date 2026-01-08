import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Car, Tag, ChevronRight } from 'lucide-react';
import { IconCard } from '../IconCard';
import { Category } from '../../../types';

interface Step2CategoryBrandModelProps {
    formData: any;
    updateField: (field: string, value: any) => void;
    carCategories: Category[];
    brands: any[];
}

const Step2CategoryBrandModel: React.FC<Step2CategoryBrandModelProps> = ({
    formData,
    updateField,
    carCategories,
    brands
}) => {
    const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
    const [subStep, setSubStep] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const brandsSectionRef = useRef<HTMLDivElement>(null);
    const modelInputRef = useRef<HTMLInputElement>(null);

    // Find selected category when component mounts or formData changes
    useEffect(() => {
        if (formData.car_category_id) {
            const category = carCategories.find(c => c.id === formData.car_category_id);
            if (category) {
                setSelectedCategory(category);
                setSubStep(2);
            }
        }
    }, [formData.car_category_id, carCategories]);

    // Filter brands by selected category
    useEffect(() => {
        if (selectedCategory && brands.length > 0) {
            // Filter brands that are in the category's brands list
            const categoryBrandNames = selectedCategory.brands || [];
            const filtered = brands.filter((brand: any) =>
                categoryBrandNames.includes(brand.name) ||
                categoryBrandNames.includes(brand.name_ar) ||
                categoryBrandNames.some(cb => brand.name.includes(cb) || brand.name_ar?.includes(cb))
            );
            setFilteredBrands(filtered);

            // Auto-advance to sub-step 2 when category selected
            if (subStep === 1) {
                setSubStep(2);
                setTimeout(() => {
                    brandsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else {
            setFilteredBrands([]);
        }
    }, [selectedCategory, brands]);

    // Auto-advance to sub-step 3 when brand selected
    useEffect(() => {
        if (formData.brand_id && subStep === 2) {
            setSubStep(3);
            setTimeout(() => {
                modelInputRef.current?.focus();
            }, 100);
        }
    }, [formData.brand_id]);

    const handleCategorySelect = (category: Category) => {
        setSelectedCategory(category);
        updateField('car_category_id', category.id);
        // Reset brand and model when category changes
        updateField('brand_id', '');
        updateField('model', '');
        updateField('category_id', ''); // Clear listing category
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

            {/* Sub-step 1: Category Selection */}
            <AnimatePresence mode="wait">
                {subStep >= 1 && (
                    <motion.div
                        key="category"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Globe className="w-5 h-5 text-primary" />
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                                فئة السيارة <span className="text-red-500">*</span>
                            </h4>
                            {selectedCategory && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory(null);
                                        updateField('car_category_id', '');
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

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {carCategories.map((category: Category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleCategorySelect(category)}
                                    disabled={!!(selectedCategory && selectedCategory.id !== category.id)}
                                    className={`p-4 rounded-xl font-bold text-sm transition-all ${selectedCategory?.id === category.id
                                        ? 'bg-primary text-white shadow-lg scale-105'
                                        : selectedCategory
                                            ? 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 cursor-not-allowed'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{category.flag}</div>
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sub-step 2: Brand Selection */}
            <AnimatePresence mode="wait">
                {subStep >= 2 && selectedCategory && (
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
                                لا توجد ماركات متاحة لهذه الفئة
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

            {/* Sub-step 3: Model Input */}
            <AnimatePresence mode="wait">
                {subStep >= 3 && formData.brand_id && (
                    <motion.div
                        key="model"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
                    >
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
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Step2CategoryBrandModel;
