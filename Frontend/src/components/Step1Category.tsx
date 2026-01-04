import React from 'react';
import { OrderFormData, Category } from '../types';
import { HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';
import Icon from './Icon';

interface Props {
  updateFormData: (data: Partial<OrderFormData>) => void;
  nextStep: () => void;
  carCategories: Category[];
  onExit: () => void;
}

const Step1Category: React.FC<Props> = ({ updateFormData, nextStep, carCategories, onExit }) => {
  const handleSelect = (category: string) => {
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    updateFormData({ category, brand: '' });
    nextStep();
  };

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
      },
    },
  } as const;

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4 relative">
      {/* Exit Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onExit}
        className="absolute top-0 left-4 z-20 flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transaction-colors duration-200 text-base sm:text-lg"
      >
        <span className="text-xl">✕</span>
        <span>خروج</span>
      </motion.button>

      {/* Step Helper - Animated guide */}
      <StepHelper step={1} autoHideDelay={10000} />

      {/* Header with emoji - minimal text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8 pt-12 sm:pt-0"
      >
        <div className="text-6xl sm:text-7xl mb-3">🚗</div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
          ما هي سيارتك؟
        </h3>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
          👇 اضغط على نوع سيارتك
        </p>
      </motion.div>

      {/* Category Grid - Large touch-friendly cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6"
      >
        {carCategories.map((cat, index) => (
          <motion.button
            key={cat.id}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(cat.name)}
            className="group relative flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 bg-white dark:bg-slate-800 border-3 border-slate-200 dark:border-slate-700 rounded-2xl sm:rounded-3xl hover:border-primary hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary/40 min-h-[140px] sm:min-h-[180px]"
            aria-label={`اختر فئة ${cat.name}`}
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 rounded-2xl sm:rounded-3xl transition-all duration-300" />

            {/* Pulse ring on hover */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl group-hover:animate-pulse-ring" />

            {/* Large Icon/Flag - Much bigger for easy tapping */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-800 flex items-center justify-center text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50">
              {cat.flag}
            </div>

            {/* Category Name - Larger, bolder text */}
            <span className="font-black text-slate-800 dark:text-slate-200 text-base sm:text-xl md:text-2xl relative z-10 group-hover:text-primary transition-colors duration-300 text-center leading-tight">
              {cat.name}
            </span>

            {/* Selection indicator line */}
            <motion.div
              className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 h-1 sm:h-1.5 bg-primary rounded-full"
              initial={{ width: 0 }}
              whileHover={{ width: '60%' }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        ))}

        {/* "Not Sure" Option - Prominent with different styling */}
        <motion.button
          variants={itemVariants}
          whileHover={{ scale: 1.03, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelect('غير متأكد')}
          className="group relative flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-3 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl sm:rounded-3xl hover:border-amber-500 hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-amber-400/40 min-h-[140px] sm:min-h-[180px]"
          aria-label="غير متأكد من فئة السيارة"
        >
          {/* Icon Container */}
          <div className="relative w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-all duration-300 border-2 border-amber-200 dark:border-amber-700 shadow-md">
            <span className="text-4xl sm:text-5xl md:text-6xl">❓</span>
          </div>

          {/* Text */}
          <span className="font-black text-amber-700 dark:text-amber-400 text-base sm:text-xl md:text-2xl group-hover:text-amber-600 transition-colors duration-300 text-center leading-tight">
            مش عارف 🤷
          </span>

          {/* Helper text */}
          <span className="text-xs sm:text-sm text-amber-600/70 dark:text-amber-500/70 mt-1">
            بنساعدك!
          </span>
        </motion.button>
      </motion.div>

      {/* Bottom hint with animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
      >
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-full text-sm text-slate-500 dark:text-slate-400">
          <span className="text-lg">👆</span>
          <span>اضغط على الخيار المناسب</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Step1Category;