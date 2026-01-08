import React from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';

interface StepFeaturesProps {
    formData: any;
    updateField: (field: string, value: any) => void;
}

const FEATURE_GROUPS = {
    'التكنولوجيا': [
        'عرض المعلومات على الزجاج الأمامي',
        'مثبت سرعة متكيف',
        'تحديثات عبر الإنترنت',
        'التعرف على الصوت',
        'مفتاح رقمي',
        'شحن لاسلكي',
        'نظام ملاحة'
    ],
    'السلامة': [
        'مساعد الفرامل الطارئ',
        'نظام التحكم في الثبات',
        'حساسات ركن',
        'كاميرا خلفية',
        'مراقبة النقطة العمياء',
        'تحذير الخروج من المسار',
        'نظام الفرامل المانعة للانغلاق',
        'وسائد هوائية'
    ],
    'الأداء': [
        'نظام تعليق متكيف',
        'مبدلات سرعة خلف المقود',
        'وضعية القيادة الرياضية',
        'دفع رباعي',
        'محرك تيربو'
    ],
    'المظهر الداخلي': [
        'حوامل أكواب',
        'عجلة قيادة جلدية',
        'تحكم من عجلة القيادة',
        'مقاعد خلفية قابلة للطي',
        'إضاءة محيطية',
        'لوحة عدادات رقمية'
    ],
    'المظهر الخارجي': [
        'أضواء نهارية',
        'فتحة سقف / بانورامية',
        'أضواء ضباب',
        'مصابيح أمامية LED',
        'جنوط ألمنيوم'
    ],
    'الترفيه': [
        'راديو / مشغل MP3',
        'ترفيه للمقاعد الخلفية',
        'نظام صوتي فاخر',
        'أبل كاربلاي / أندرويد أوتو',
        'منافذ USB',
        'اتصال بلوتوث',
        'شاشة لمس'
    ],
    'الراحة': [
        'ستارة شمسية خلفية',
        'مسند ذراع',
        'مقاعد جلدية',
        'نظام تحكم بالمناخ مزدوج المناطق',
        'مقاعد قابلة للتعديل كهربائياً'
    ],
    'أخرى': [
        'إطار احتياطي',
        'مجموعة أدوات',
        'مراقبة ضغط الإطارات',
        'مانع تشغيل المحرك',
        'تشغيل عن بُعد',
        'دخول بدون مفتاح'
    ]
};

const StepFeatures: React.FC<StepFeaturesProps> = ({ formData, updateField }) => {
    const selectedFeatures = formData.features || [];

    const toggleFeature = (feature: string) => {
        if (selectedFeatures.includes(feature)) {
            updateField('features', selectedFeatures.filter((f: string) => f !== feature));
        } else {
            updateField('features', [...selectedFeatures, feature]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    اختر المميزات المتوفرة في سيارتك. المميزات الإضافية تساعد في زيادة فرص بيع السيارة وجذب المشترين.
                </p>
            </div>

            <div className="space-y-8">
                {Object.entries(FEATURE_GROUPS).map(([group, features]) => (
                    <div key={group}>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-r-4 border-primary pr-3">
                            {group}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {features.map((feature) => {
                                const isSelected = selectedFeatures.includes(feature);
                                return (
                                    <div
                                        key={feature}
                                        onClick={() => toggleFeature(feature)}
                                        className={`
                                            cursor-pointer select-none
                                            flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                                            ${isSelected
                                                ? 'bg-primary/5 border-primary shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-colors
                                            ${isSelected
                                                ? 'bg-primary border-primary'
                                                : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'
                                            }
                                        `}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {feature}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default StepFeatures;
