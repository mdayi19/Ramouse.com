import React from 'react';
import { OrderFormData } from '../types';
import Icon from './Icon';
import { motion } from 'framer-motion';
import StepHelper from './StepHelper';

interface Props {
    formData: OrderFormData;
    prevStep: () => void;
    submitForm: () => void;
    goToStep: (step: number) => void;
    isSubmitting: boolean;
}

// Visual summary card component
const SummaryCard: React.FC<{
    emoji: string;
    title: string;
    value: React.ReactNode;
    step?: number;
    onEdit?: (step: number) => void;
}> = ({ emoji, title, value, step, onEdit }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl p-4 border-2 border-slate-100 dark:border-slate-700 flex items-center gap-4"
    >
        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
            {emoji}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{value}</p>
        </div>
        {step && onEdit && (
            <button
                onClick={() => onEdit(step)}
                className="px-3 py-2 text-sm font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors"
            >
                ✏️
            </button>
        )}
    </motion.div>
);

const Step6Review: React.FC<Props> = ({ formData, prevStep, submitForm, goToStep, isSubmitting }) => {

    const handleSubmit = () => {
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 100]);
        }
        submitForm();
    };

    const getContactMethodText = (method: string) => {
        switch (method) {
            case 'whatsapp': return '💬 واتساب';
            case 'call': return '📱 اتصال';
            case 'email': return '📧 إيميل';
            default: return method;
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-4 pb-8 relative">
            {/* Step Helper */}
            <StepHelper step={6} autoHideDelay={10000} />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <div className="text-6xl sm:text-7xl mb-3">✅</div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                    تأكد من طلبك
                </h3>
                <p className="text-base text-slate-500 dark:text-slate-400">
                    راجع المعلومات ثم اضغط إرسال 👇
                </p>
            </motion.div>

            {/* Summary Cards */}
            <div className="space-y-3 mb-8">
                {/* Car Info */}
                <SummaryCard
                    emoji="🚗"
                    title="السيارة"
                    value={`${formData.brandManual || formData.brand} ${formData.model} ${formData.year}`}
                    step={3}
                    onEdit={goToStep}
                />

                {/* Part Types */}
                <SummaryCard
                    emoji="🔧"
                    title="القطع المطلوبة"
                    value={
                        <div className="flex flex-wrap gap-1">
                            {formData.partTypes.map((part, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                    {part}
                                </span>
                            ))}
                        </div>
                    }
                    step={4}
                    onEdit={goToStep}
                />

                {/* Description/Voice */}
                {(formData.partDescription || formData.voiceNote) && (
                    <SummaryCard
                        emoji={formData.voiceNote ? "🎤" : "📝"}
                        title="الوصف"
                        value={
                            formData.voiceNote
                                ? "✅ تم إرفاق ملاحظة صوتية"
                                : formData.partDescription?.substring(0, 50) + (formData.partDescription && formData.partDescription.length > 50 ? '...' : '')
                        }
                        step={5}
                        onEdit={goToStep}
                    />
                )}

                {/* Media Attachments */}
                {(formData.images.length > 0 || formData.video) && (
                    <SummaryCard
                        emoji="📷"
                        title="المرفقات"
                        value={
                            <div className="flex items-center gap-2">
                                {formData.images.length > 0 && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm">
                                        📸 {formData.images.length} صور
                                    </span>
                                )}
                                {formData.video && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                                        🎬 فيديو
                                    </span>
                                )}
                            </div>
                        }
                        step={5}
                        onEdit={goToStep}
                    />
                )}

                {/* Location */}
                <SummaryCard
                    emoji="📍"
                    title="الموقع"
                    value={formData.city}
                    step={5}
                    onEdit={goToStep}
                />

                {/* Contact Method */}
                <SummaryCard
                    emoji="📞"
                    title="طريقة التواصل"
                    value={getContactMethodText(formData.contactMethod)}
                    step={5}
                    onEdit={goToStep}
                />
            </div>

            {/* Attachments Preview */}
            {formData.images.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6"
                >
                    <p className="text-sm font-bold text-slate-500 mb-2">📸 الصور المرفقة:</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {formData.images.map((img, i) => (
                            <div key={i} className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-slate-200 dark:border-slate-700">
                                <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t-2 border-slate-100 dark:border-slate-800 gap-4">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={prevStep}
                    className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-base min-w-[100px]"
                >
                    <span className="text-lg">→</span>
                    <span>السابق</span>
                </motion.button>

                {/* BIG SUBMIT BUTTON */}
                <motion.button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className={`
                        flex-1 flex items-center justify-center gap-3 
                        py-5 px-6 rounded-2xl font-black text-xl
                        transition-all
                        ${isSubmitting
                            ? 'bg-slate-400 cursor-wait'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl shadow-green-500/30'
                        }
                        text-white
                    `}
                >
                    {isSubmitting ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                ⏳
                            </motion.div>
                            <span>جاري الإرسال...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-2xl">✅</span>
                            <span>إرسال الطلب</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Reassurance message */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-slate-400 text-sm mt-6"
            >
                🔒 معلوماتك آمنة ولن نشاركها مع أحد
            </motion.p>
        </div>
    );
};

export default Step6Review;