import React, { useState } from 'react';
import { OrderFormData, Settings } from '../types';
import ImageUpload from './ImageUpload';
import { SYRIAN_CITIES } from '../constants';
import VoiceRecorder from './VoiceRecorder';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';
import Icon from './Icon';

interface Props {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  settings: Settings;
}

const Step5Details: React.FC<Props> = ({ formData, updateFormData, nextStep, prevStep, settings }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // Voice note OR text description required
    if (!formData.partDescription && !formData.voiceNote) {
      newErrors.partDescription = 'اشرح لنا ماذا تريد - تكلم أو اكتب';
    }

    // City is required
    if (!formData.city) {
      newErrors.city = 'اختر مدينتك';
    }

    // Contact method is required
    if (!formData.contactMethod) {
      newErrors.contactMethod = 'اختر طريقة التواصل';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      return;
    }

    // Success haptic
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }

    setErrors({});
    nextStep();
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateFormData({ video: e.target.files[0] });
    }
  };

  const removeVideo = () => {
    updateFormData({ video: null });
  };

  const handleCitySelect = (city: string) => {
    updateFormData({ city });
    if (errors.city) setErrors(prev => ({ ...prev, city: '' }));
  };

  const handleContactMethodSelect = (method: 'whatsapp' | 'call' | 'email') => {
    updateFormData({ contactMethod: method });
    if (errors.contactMethod) setErrors(prev => ({ ...prev, contactMethod: '' }));
  };

  // Popular cities for quick select
  const popularCities = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس'];

  return (
    <div className="max-w-3xl mx-auto px-4 pb-8 relative">
      {/* Step Helper */}
      <StepHelper step={5} autoHideDelay={12000} />

      {/* Header with emoji */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="text-6xl sm:text-7xl mb-3">🎤</div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
          أخبرنا ماذا تريد
        </h3>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400">
          🎤 تكلم صوتياً أو 📷 صور القطعة
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* VOICE RECORDER - PRIMARY INPUT - HUGE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-3xl p-6 border-2 ${formData.voiceNote
            ? 'border-green-400 bg-green-50/30 dark:bg-green-900/20'
            : errors.partDescription
              ? 'border-red-400'
              : 'border-primary/30'
            }`}
        >
          <div className="text-center mb-4">
            <span className="text-4xl sm:text-5xl">{formData.voiceNote ? '✅' : '🎤'}</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-2">
              {formData.voiceNote ? 'تم التسجيل! 🎉' : 'اضغط وتكلم!'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {formData.voiceNote
                ? 'يمكنك إضافة وصف كتابي أيضاً (اختياري)'
                : 'أخبرنا ماذا تريد بصوتك'}
            </p>
          </div>
          <VoiceRecorder
            voiceNote={formData.voiceNote || null}
            setVoiceNote={(blob) => {
              updateFormData({ voiceNote: blob });
              if (errors.partDescription) setErrors(prev => ({ ...prev, partDescription: '' }));
            }}
            maxSizeMB={settings.limitSettings.maxVoiceNoteSizeMB}
          />
        </motion.div>

        {/* Divider - Shows OR clearly */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <span className="text-amber-700 dark:text-amber-400 font-black text-sm">
              {formData.voiceNote || formData.partDescription ? '✅ أو' : '⚡ أو'}
            </span>
          </div>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* IMAGE UPLOAD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700"
        >
          <div className="text-center mb-4">
            <span className="text-4xl sm:text-5xl">📷</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-2">
              صور القطعة
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              التقط صورة للقطعة المطلوبة
            </p>
          </div>
          <ImageUpload
            files={formData.images}
            setFiles={(files) => updateFormData({ images: files })}
            maxFiles={settings.limitSettings.maxImagesPerOrder}
          />
        </motion.div>

        {/* VIDEO UPLOAD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700"
        >
          <div className="text-center mb-4">
            <span className="text-4xl sm:text-5xl">🎬</span>
            <h4 className="text-xl font-black text-slate-800 dark:text-white mt-2">
              إرفاق فيديو
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              اختياري - صور فيديو للمشكلة
            </p>
          </div>

          {formData.video ? (
            <div className="relative rounded-xl overflow-hidden">
              <video
                src={URL.createObjectURL(formData.video)}
                controls
                className="w-full max-h-64 rounded-xl"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                aria-label="حذف الفيديو"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
              <span className="text-5xl mb-2">📹</span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">اضغط لاختيار فيديو</span>
              <span className="text-sm text-slate-500">أو اسحب الفيديو هنا</span>
              <input
                type="file"
                className="sr-only"
                onChange={handleVideoChange}
                accept="video/*"
              />
            </label>
          )}
        </motion.div>

        {/* Text Description - Optional if voice note exists */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${formData.partDescription
              ? 'border-green-400 bg-green-50/30 dark:bg-green-900/20'
              : errors.partDescription && !formData.voiceNote
                ? 'border-red-400 bg-red-50/30'
                : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{formData.partDescription ? '✅' : '📝'}</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              {formData.voiceNote ? 'إضافة وصف كتابي' : 'اكتب ماذا تريد'}
            </h4>
            {formData.voiceNote && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full font-bold">
                اختياري ✓
              </span>
            )}
          </div>
          <textarea
            value={formData.partDescription}
            onChange={e => {
              updateFormData({ partDescription: e.target.value });
              if (errors.partDescription && e.target.value) setErrors(prev => ({ ...prev, partDescription: '' }));
            }}
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary border-slate-200 dark:border-slate-600"
            placeholder="مثال: صدام أمامي، مرايا جانبية..."
          />
          {errors.partDescription && !formData.voiceNote && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.partDescription}
            </p>
          )}
          {formData.partDescription && !formData.voiceNote && (
            <p className="text-green-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>✅</span> الوصف الكتابي كافي - يمكنك المتابعة
            </p>
          )}
        </motion.div>

        {/* City Selection - Visual buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${errors.city ? 'border-red-400 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📍</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              وين موقعك؟ <span className="text-red-500">*</span>
            </h4>
          </div>

          {/* Popular cities as big buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {popularCities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => handleCitySelect(city)}
                className={`py-3 px-4 rounded-xl font-bold text-base transition-all ${formData.city === city
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary/10'
                  }`}
              >
                {city}
              </button>
            ))}
          </div>

          {/* Other cities dropdown */}
          <select
            value={formData.city || ''}
            onChange={e => handleCitySelect(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30"
          >
            <option value="">🏙️ اختر مدينة أخرى ...</option>
            {SYRIAN_CITIES.filter(c => !popularCities.includes(c)).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {errors.city && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.city}
            </p>
          )}
        </motion.div>

        {/* Contact Method - Big colorful buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${errors.contactMethod ? 'border-red-400 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📞</span>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">
              كيف نتواصل معك؟ <span className="text-red-500">*</span>
            </h4>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleContactMethodSelect('whatsapp')}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.contactMethod === 'whatsapp'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200'
                }`}
            >
              <span className="text-3xl">💬</span>
              <span className="text-sm">واتساب</span>
            </button>

            <button
              type="button"
              onClick={() => handleContactMethodSelect('call')}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.contactMethod === 'call'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200'
                }`}
            >
              <span className="text-3xl">📱</span>
              <span className="text-sm">اتصال</span>
            </button>

            <button
              type="button"
              onClick={() => handleContactMethodSelect('email')}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.contactMethod === 'email'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200'
                }`}
            >
              <span className="text-3xl">📧</span>
              <span className="text-sm">إيميل</span>
            </button>
          </div>

          {errors.contactMethod && (
            <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
              <span>⚠️</span> {errors.contactMethod}
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
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg min-w-[120px]"
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

export default Step5Details;