import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, AlertCircle } from 'lucide-react';

interface Step6RentalConditionsProps {
    formData: any;
    updateField: (field: string, value: any) => void;
}

const Step6RentalConditions: React.FC<Step6RentalConditionsProps> = ({
    formData,
    updateField
}) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Rental condition suggestions
    const rentalTermsSuggestions = [
        { id: 'insurance_required', label: 'تأمين مُسبق مطلوب', icon: '🛡️', hasInput: true, inputLabel: 'قيمة التأمين', inputField: 'security_deposit', inputPlaceholder: '0' },
        { id: 'valid_license', label: 'رخصة قيادة سارية', icon: '📋', hasInput: true, inputLabel: 'عمر الرخصة (سنوات)', inputField: 'min_license_age', inputPlaceholder: '2' },
        { id: 'min_age', label: 'العمر الادنى للمستأجر', icon: '🎂', hasInput: true, inputLabel: 'العمر (سنة)', inputField: 'min_renter_age', inputPlaceholder: '21' },
        { id: 'credit_card', label: 'بطاقة ائتمانية للضمان', icon: '💳' },
        { id: 'notarized_contract', label: 'عقد موثق', icon: '✍️' },
        { id: 'km_limit', label: 'كيلومترات محدودة يومياً', icon: '📏' },
        { id: 'no_smoking', label: 'ممنوع التدخين', icon: '🚭' },
        { id: 'no_pets', label: 'ممنوع الحيوانات الأليفة', icon: '🐾' },
        { id: 'families_only', label: 'للعائلات فقط', icon: '👨‍👩‍👧‍👦' },
        { id: 'insurance_waiver', label: 'تنازل عن التأمين', icon: '⚠️' },
        { id: 'additional_driver', label: 'سائق إضافي مسموح', icon: '👥' },
        { id: 'fuel_on_renter', label: 'الوقود على المستأجر', icon: '⛽' },
    ];

    const handleTermToggle = (termId: string) => {
        const currentTerms = formData.rental_terms_checkboxes || [];
        const newTerms = currentTerms.includes(termId)
            ? currentTerms.filter((t: string) => t !== termId)
            : [...currentTerms, termId];

        updateField('rental_terms_checkboxes', newTerms);
    };

    const isTermSelected = (termId: string) => {
        return (formData.rental_terms_checkboxes || []).includes(termId);
    };

    const handleRateChange = (field: string, value: string) => {
        updateField(field, value);

        // Clear error when user fills the field
        if (value && errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Validate at least one rate is provided
    const hasRates = formData.daily_rate || formData.weekly_rate || formData.monthly_rate;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Rental Rates */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-3xl p-6 border-2 ${!hasRates && errors.rates
                    ? 'border-red-400'
                    : 'border-blue-200 dark:border-blue-800'
                    }`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        أسعار الإيجار <span className="text-red-500">*</span>
                    </h4>
                </div>

                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    💡 اختر سعر واحد على الأقل (يومي، أسبوعي، أو شهري)
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            يومي (ل.س)
                        </label>
                        <input
                            type="number"
                            value={formData.daily_rate || ''}
                            onChange={(e) => handleRateChange('daily_rate', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            أسبوعي (ل.س)
                        </label>
                        <input
                            type="number"
                            value={formData.weekly_rate || ''}
                            onChange={(e) => handleRateChange('weekly_rate', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                            شهري (ل.س)
                        </label>
                        <input
                            type="number"
                            value={formData.monthly_rate || ''}
                            onChange={(e) => handleRateChange('monthly_rate', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
                        />
                    </div>
                </div>

                {!hasRates && errors.rates && (
                    <p className="text-red-500 text-sm mt-3 font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {errors.rates}
                    </p>
                )}
            </motion.div>

            {/* Rental Terms Checkboxes */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        شروط الإيجار
                    </h4>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    اختر الشروط التي تنطبق على سيارتك
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rentalTermsSuggestions.map((term) => (
                        <div key={term.id} className="space-y-2">
                            <button
                                type="button"
                                onClick={() => handleTermToggle(term.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-right ${isTermSelected(term.id)
                                    ? 'bg-primary/10 border-2 border-primary shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-700 border-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${isTermSelected(term.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-slate-300 dark:border-slate-600'
                                    }`}>
                                    {isTermSelected(term.id) && (
                                        <span className="text-white text-sm">✓</span>
                                    )}
                                </div>
                                <span className="text-2xl">{term.icon}</span>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {term.label}
                                </span>
                            </button>

                            {/* Conditional Input for specific terms */}
                            {term.hasInput && isTermSelected(term.id) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-2"
                                >
                                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                        {term.inputLabel}
                                    </label>
                                    <input
                                        type="number"
                                        value={formData[term.inputField!] || ''}
                                        onChange={(e) => updateField(term.inputField!, e.target.value)}
                                        placeholder={term.inputPlaceholder}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Kilometer Limit - Show only if selected */}
                {isTermSelected('km_limit') && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                    >
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            الحد اليومي للكيلومترات
                        </label>
                        <input
                            type="number"
                            value={formData.km_limit || ''}
                            onChange={(e) => updateField('km_limit', e.target.value)}
                            placeholder="مثال: 200 كم/يوم"
                            min="0"
                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/30"
                        />
                    </motion.div>
                )}
            </motion.div>

            {/* Custom Terms */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center gap-3 mb-3">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        شروط إضافية (اختياري)
                    </h4>
                </div>

                <textarea
                    value={formData.custom_rental_terms || ''}
                    onChange={(e) => updateField('custom_rental_terms', e.target.value)}
                    placeholder="اكتب أي شروط إضافية هنا..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/30"
                />

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    💡 أضف أي شروط خاصة غير موجودة في القائمة أعلاه
                </p>
            </motion.div>
        </motion.div>
    );
};
export default Step6RentalConditions;
