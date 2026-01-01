import React from 'react';
import { OrderFormData, PartType } from '../types';
import Icon from './Icon';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';

interface Props {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  partTypes: PartType[];
}

// Emoji mapping for part types
const PART_EMOJIS: { [key: string]: string } = {
  'محرك': '🔧',
  'كهرباء': '⚡',
  'هيكل': '🚗',
  'مكابح': '🛑',
  'تعليق': '🔩',
  'تكييف': '❄️',
  'إطارات': '🛞',
  'زجاج': '🪟',
  'إضاءة': '💡',
  'داخلية': '💺',
  'عادم': '💨',
  'وقود': '⛽',
  'default': '🔧',
};

const Step4PartType: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep, partTypes }) => {

  const handleTogglePartType = (partName: string) => {
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    const currentPartTypes = formData.partTypes;
    const newPartTypes = currentPartTypes.includes(partName)
      ? currentPartTypes.filter(p => p !== partName)
      : [...currentPartTypes, partName];
    updateFormData({ partTypes: newPartTypes });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.partTypes.length > 0) {
      // Success haptic
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      nextStep();
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  } as const;

  const getEmoji = (partName: string) => {
    return PART_EMOJIS[partName] || PART_EMOJIS['default'];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 relative">
      {/* Step Helper */}
      <StepHelper step={4} autoHideDelay={10000} />

      {/* Header with emoji */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6 sm:mb-8"
      >
        <div className="text-6xl sm:text-7xl mb-3">🔧</div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2">
          ماذا تحتاج؟
        </h3>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
          👇 اختر نوع القطعة (يمكنك اختيار أكثر من واحد)
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Part Type Grid - Large cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:gap-5 mb-6"
        >
          {partTypes.map((part) => {
            const isSelected = formData.partTypes.includes(part.name);
            const emoji = getEmoji(part.name);

            return (
              <motion.button
                type="button"
                key={part.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTogglePartType(part.name)}
                className={`
                  group relative flex flex-col items-center justify-center 
                  p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl 
                  transition-all duration-200
                  focus:outline-none focus:ring-4
                  min-h-[130px] sm:min-h-[160px]
                  ${isSelected
                    ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-3 border-primary shadow-xl shadow-primary/20 focus:ring-primary/40'
                    : 'bg-white dark:bg-slate-800 border-3 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:shadow-lg focus:ring-slate-300'
                  }
                `}
                aria-pressed={isSelected}
                aria-label={part.name}
              >
                {/* Selection checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 left-3 bg-primary text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg"
                  >
                    <Icon name="Check" className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                  </motion.div>
                )}

                {/* Large Icon with emoji */}
                <div className={`
                  w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 
                  rounded-2xl sm:rounded-3xl 
                  flex items-center justify-center 
                  mb-3 sm:mb-4
                  transition-all duration-300
                  text-4xl sm:text-5xl md:text-6xl
                  ${isSelected
                    ? 'bg-primary/20 scale-110'
                    : 'bg-slate-100 dark:bg-slate-700/50 group-hover:bg-primary/10 group-hover:scale-105'
                  }
                `}>
                  {emoji}
                </div>

                {/* Part Name */}
                <span className={`
                  font-black text-base sm:text-lg md:text-xl 
                  text-center leading-tight
                  transition-colors duration-200
                  ${isSelected
                    ? 'text-primary'
                    : 'text-slate-700 dark:text-slate-200 group-hover:text-primary'
                  }
                `}>
                  {part.name}
                </span>

                {/* Shimmer effect on selected */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Selection Count Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          {formData.partTypes.length > 0 ? (
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary/10 dark:bg-primary/20 text-primary rounded-full text-lg font-bold">
              <span className="text-2xl">✅</span>
              <span>تم اختيار {formData.partTypes.length} قسم</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-base font-bold animate-pulse">
              <span className="text-xl">👆</span>
              <span>اختر قسم واحد على الأقل</span>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons - Large and prominent */}
        <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100 dark:border-slate-800 gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={prevStep}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-lg min-w-[120px]"
          >
            <span className="text-xl">→</span>
            <span>السابق</span>
          </motion.button>

          <motion.button
            type="submit"
            whileHover={{ scale: formData.partTypes.length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: formData.partTypes.length > 0 ? 0.98 : 1 }}
            disabled={formData.partTypes.length === 0}
            className={`
              flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-lg min-w-[140px]
              transition-all duration-200
              ${formData.partTypes.length > 0
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

export default Step4PartType;