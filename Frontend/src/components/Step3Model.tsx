import React, { useState, useMemo, useRef, useEffect } from 'react';
import { OrderFormData } from '../types';
import { Search, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';

interface Props {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  brandModels: { [key: string]: string[] };
}

const Step3Model: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep, brandModels }) => {
  const [modelSearch, setModelSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showManualModel, setShowManualModel] = useState(false);
  const [manualModelValue, setManualModelValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Model is required
    if (!formData.model && !manualModelValue) {
      newErrors.model = 'اختر أو أدخل الموديل';
    }

    // Year is required
    if (!formData.year) {
      newErrors.year = 'اختر سنة الصنع';
    }

    if (!formData.engineType) {
      newErrors.engineType = 'اختر نوع المحرك';
    }
    if (!formData.transmission) {
      newErrors.transmission = 'اختر ناقل الحركة';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      return;
    }

    // Save manual model if entered
    if (showManualModel && manualModelValue) {
      updateFormData({ model: manualModelValue });
    }

    setErrors({});
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    nextStep();
  };

  const currentYear = new Date().getFullYear();

  const modelsForBrand = brandModels[formData.brand];

  const filteredModels = useMemo(() => {
    if (!modelsForBrand) return [];
    if (!modelSearch.trim()) return modelsForBrand;
    return modelsForBrand.filter(model =>
      model.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [modelsForBrand, modelSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelSelect = (model: string) => {
    if (model === 'other') {
      setShowManualModel(true);
      updateFormData({ model: '' });
    } else {
      updateFormData({ model });
      setShowManualModel(false);
      setManualModelValue('');
    }
    setModelSearch('');
    setIsDropdownOpen(false);
    if (navigator.vibrate) navigator.vibrate(30);
    if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
  };

  const handleManualModelChange = (value: string) => {
    setManualModelValue(value);
    if (errors.model && value) setErrors(prev => ({ ...prev, model: '' }));
  };

  const engineTypes = [
    { value: 'بنزين', label: 'بنزين', emoji: '⛽' },
    { value: 'ديزل', label: 'ديزل', emoji: '🛢️' },
    { value: 'كهربائي', label: 'كهربائي', emoji: '🔋' },
    { value: 'هجين', label: 'هجين', emoji: '🌿' },
  ];

  const transmissionTypes = [
    { value: 'عادي', label: 'عادي (جير)', emoji: '🕹️' },
    { value: 'أوتوماتيك', label: 'أوتوماتيك', emoji: '🅰️' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8 relative">
      {/* Step Helper */}
      <StepHelper step={3} autoHideDelay={10000} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-6xl sm:text-7xl mb-3">📅</div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          تفاصيل السيارة
        </h3>
        <p className="text-base text-slate-500 dark:text-slate-400">
          أخبرنا أكثر عن سيارتك
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${errors.model ? 'border-red-400 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🚙</span>
            <label className="text-lg font-bold text-slate-800 dark:text-white">
              الموديل <span className="text-red-500">*</span>
            </label>
          </div>

          {modelsForBrand && !showManualModel ? (
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-lg cursor-pointer flex items-center justify-between"
              >
                <span className={formData.model ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                  {formData.model || 'اختر الموديل...'}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {/* Search input */}
                  <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                    <input
                      type="text"
                      value={modelSearch}
                      onChange={(e) => setModelSearch(e.target.value)}
                      placeholder="🔍 ابحث..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-base"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {filteredModels.map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => handleModelSelect(model)}
                      className={`w-full text-right px-4 py-3 hover:bg-primary/10 transition-colors text-lg ${formData.model === model ? 'bg-primary/10 text-primary font-bold' : ''
                        }`}
                    >
                      {model}
                    </button>
                  ))}

                  {/* Not found - manual input option */}
                  <button
                    type="button"
                    onClick={() => handleModelSelect('other')}
                    className="w-full text-right px-4 py-3 text-amber-600 border-t hover:bg-amber-50 dark:hover:bg-amber-900/20 font-bold"
                  >
                    ❓ غير موجود - أدخل يدوياً
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Manual model input - always shown if no models or user selected "other" */
            <div>
              <input
                type="text"
                value={showManualModel ? manualModelValue : formData.model}
                onChange={e => showManualModel ? handleManualModelChange(e.target.value) : updateFormData({ model: e.target.value })}
                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
                placeholder="أدخل اسم الموديل..."
                required
              />
              {showManualModel && modelsForBrand && (
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModel(false);
                    setManualModelValue('');
                  }}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  ← العودة للقائمة
                </button>
              )}
            </div>
          )}

          {errors.model && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.model}
            </p>
          )}
        </motion.div>

        {/* Year Selection - REQUIRED */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${errors.year ? 'border-red-400 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📆</span>
            <label className="text-lg font-bold text-slate-800 dark:text-white">
              سنة الصنع <span className="text-red-500">*</span>
            </label>
          </div>

          {/* Popular recent years */}
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4].map(year => (
              <button
                key={year}
                type="button"
                onClick={() => {
                  updateFormData({ year: String(year) });
                  if (errors.year) setErrors(prev => ({ ...prev, year: '' }));
                }}
                className={`py-3 rounded-xl font-bold text-lg transition-all ${formData.year === String(year)
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                  }`}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Full year dropdown */}
          <select
            value={formData.year}
            onChange={e => {
              updateFormData({ year: e.target.value });
              if (errors.year) setErrors(prev => ({ ...prev, year: '' }));
            }}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-lg"
            required
          >
            <option value="">📅 اختر سنة أخرى...</option>
            {Array.from({ length: 50 }, (_, i) => currentYear - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {errors.year && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.year}
            </p>
          )}
        </motion.div>

        {/* Engine Type - Big visual cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${errors.engineType ? 'border-red-400 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⛽</span>
            <label className="text-lg font-bold text-slate-800 dark:text-white">
              نوع المحرك <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {engineTypes.map((engine) => {
              const isSelected = formData.engineType === engine.value;
              return (
                <motion.button
                  key={engine.value}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    updateFormData({ engineType: engine.value as any });
                    if (errors.engineType) setErrors(prev => ({ ...prev, engineType: '' }));
                  }}
                  className={`
                    relative py-4 px-3 rounded-xl flex flex-col items-center gap-2 transition-all
                    ${isSelected
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                    }
                  `}
                >
                  <span className="text-3xl">{engine.emoji}</span>
                  <span className="font-bold text-sm">{engine.label}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 text-lg"
                    >
                      ✅
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {errors.engineType && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.engineType}
            </p>
          )}
        </motion.div>

        {/* Transmission Type - 2 Big buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border-2 ${errors.transmission ? 'border-red-400 bg-red-50/50' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚙️</span>
            <label className="text-lg font-bold text-slate-800 dark:text-white">
              ناقل الحركة <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {transmissionTypes.map((trans) => {
              const isSelected = formData.transmission === trans.value;
              return (
                <motion.button
                  key={trans.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    updateFormData({ transmission: trans.value as any });
                    if (errors.transmission) setErrors(prev => ({ ...prev, transmission: '' }));
                  }}
                  className={`
                    relative py-6 px-4 rounded-2xl flex flex-col items-center gap-3 transition-all
                    ${isSelected
                      ? 'bg-primary text-white shadow-xl shadow-primary/30'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                    }
                  `}
                >
                  <span className="text-4xl">{trans.emoji}</span>
                  <span className="font-black text-lg">{trans.label}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 text-xl"
                    >
                      ✅
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {errors.transmission && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.transmission}
            </p>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 gap-4">
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black bg-primary text-white hover:bg-primary-700 shadow-lg shadow-primary/30 text-lg min-w-[140px]"
          >
            <span>التالي</span>
            <span className="text-xl">←</span>
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default Step3Model;