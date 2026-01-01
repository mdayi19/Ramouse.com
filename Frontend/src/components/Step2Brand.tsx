import React, { useState, useMemo } from 'react';
import { OrderFormData, Category, Brand } from '../types';
import Icon from './Icon';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';

interface Props {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  carCategories: Category[];
  allBrands: Brand[];
}

const Step2Brand: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep, carCategories, allBrands }) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectedCategory = carCategories.find(c => c.name === formData.category);

  const filteredBrands = useMemo(() => {
    if (!selectedCategory?.brands) return [];
    if (!searchTerm.trim()) return selectedCategory.brands;
    return selectedCategory.brands.filter(brand =>
      brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCategory, searchTerm]);

  const handleSelect = (brand: string) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    updateFormData({ brand, brandManual: '' });
    setShowManualInput(false);
    // Auto-advance after short delay
    setTimeout(() => nextStep(), 200);
  };

  const handleManualClick = () => {
    updateFormData({ brand: 'غير موجود' });
    setShowManualInput(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.brand) {
      nextStep();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  } as const;

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 relative">
      {/* Step Helper */}
      <StepHelper step={2} autoHideDelay={10000} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-6xl sm:text-7xl mb-3">🏭</div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          ما هي الشركة؟
        </h3>
        <p className="text-base text-slate-500 dark:text-slate-400">
          👇 اضغط على شعار شركة سيارتك
        </p>
      </motion.div>

      {/* Search - simplified, optional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          <input
            type="text"
            placeholder="ابحث..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-14 pl-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Brands Grid - Large logo cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4 mb-6"
        >
          {filteredBrands.map((brandName) => {
            const brandData = allBrands.find(b => b.name === brandName);
            const isSelected = formData.brand === brandName;

            return (
              <motion.button
                type="button"
                key={brandName}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(brandName)}
                className={`
                  relative flex flex-col items-center justify-center 
                  p-3 sm:p-4 rounded-2xl transition-all duration-200
                  aspect-square
                  ${isSelected
                    ? 'bg-primary/10 border-3 border-primary shadow-lg shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-md'
                  }
                `}
              >
                {/* Selection check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  >
                    <Icon name="Check" className="w-4 h-4 text-white stroke-[3]" />
                  </motion.div>
                )}

                {/* Brand Logo or Icon */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center mb-2">
                  {brandData?.logo ? (
                    <img src={brandData.logo} alt={brandName} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-4xl sm:text-5xl">🚗</span>
                  )}
                </div>

                {/* Brand Name */}
                <span className={`
                  text-xs sm:text-sm font-bold text-center leading-tight
                  ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}
                `}>
                  {brandName}
                </span>
              </motion.button>
            );
          })}

          {/* Not Found Button */}
          <motion.button
            type="button"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleManualClick}
            className={`
              flex flex-col items-center justify-center 
              p-3 sm:p-4 rounded-2xl transition-all duration-200
              aspect-square
              ${showManualInput
                ? 'bg-amber-100 dark:bg-amber-900/30 border-3 border-amber-500'
                : 'bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-500'
              }
            `}
          >
            <span className="text-4xl sm:text-5xl mb-2">❓</span>
            <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 text-center">
              غير موجود
            </span>
          </motion.button>
        </motion.div>

        {/* No results */}
        {filteredBrands.length === 0 && !showManualInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6"
          >
            <span className="text-5xl mb-3 block">🔍</span>
            <p className="text-slate-500 dark:text-slate-400 mb-2">لم نجد هذه الشركة</p>
            <p className="text-sm text-slate-400">اضغط على "غير موجود" لإدخالها يدوياً</p>
          </motion.div>
        )}

        {/* Manual Input */}
        {showManualInput && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border-2 border-amber-200 dark:border-amber-800"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✏️</span>
              <label className="text-lg font-bold text-slate-800 dark:text-white">
                اكتب اسم الشركة
              </label>
            </div>
            <input
              type="text"
              value={formData.brandManual}
              onChange={(e) => updateFormData({ brandManual: e.target.value })}
              className="w-full px-4 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
              placeholder="مثال: جيلي، شيري..."
              autoFocus
            />
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100 dark:border-slate-800 gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={prevStep}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-lg min-w-[120px]"
          >
            <span className="text-xl">→</span>
            <span>السابق</span>
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: formData.brand ? 1.02 : 1 }}
            whileTap={{ scale: formData.brand ? 0.98 : 1 }}
            disabled={!formData.brand || (showManualInput && !formData.brandManual)}
            className={`
              flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg min-w-[140px]
              ${formData.brand && (!showManualInput || formData.brandManual)
                ? 'bg-primary text-white hover:bg-primary-700 shadow-lg shadow-primary/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            <span>التالي</span>
            <span className="text-xl">←</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default Step2Brand;
