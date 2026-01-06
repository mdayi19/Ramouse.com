import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Upload, Car, Info, Image } from 'lucide-react';
import Icon from '../Icon';
import { CarProviderService } from '../../services/carprovider.service';

interface CarListingWizardProps {
    onComplete: () => void;
    onCancel: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CarListingWizard: React.FC<CarListingWizardProps> = ({
    onComplete,
    onCancel,
    showToast
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        title: '',
        listing_type: 'sale' as 'sale' | 'rent',
        price: '',
        rent_period: 'daily' as 'daily' | 'weekly' | 'monthly',
        category_id: '',
        brand_id: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: '',
        transmission: 'automatic',
        fuel_type: 'gasoline',
        color: '',
        doors: 4,
        seats: 5,
        condition: 'used' as 'new' | 'used' | 'certified_pre_owned',
        body_condition: '{"front": "good", "rear": "good", "left": "good", "right": "good"}',
        features: [] as string[],
        photos: [] as File[],
        video_url: '',
        description: '',
        city: '',
        phone_visible: true
    });

    const totalSteps = 6;
    const stepTitles = [
        'المعلومات الأساسية',
        'الفئة والموديل',
        'المواصفات',
        'الحالة والميزات',
        'الصور والفيديو',
        'المراجعة والنشر'
    ];

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'photos') {
                    formData.photos.forEach(file => data.append('photos[]', file));
                } else if (key === 'features') {
                    data.append('features', JSON.stringify(formData.features));
                } else {
                    data.append(key, (formData as any)[key]);
                }
            });

            await CarProviderService.createListing(data);
            showToast('تم نشر السيارة بنجاح!', 'success');
            onComplete();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'فشل نشر السيارة', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Car className="w-8 h-8" />
                        إضافة سيارة جديدة
                    </h2>
                    <p className="text-white/80 mt-2">
                        الخطوة {currentStep} من {totalSteps}: {stepTitles[currentStep - 1]}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <Step1BasicInfo formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 2 && (
                            <Step2CategoryBrand formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 3 && (
                            <Step3Specs formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 4 && (
                            <Step4Condition formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 5 && (
                            <Step5Media formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 6 && (
                            <Step6Review formData={formData} />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        إلغاء
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                <ChevronRight className="w-5 h-5" />
                                السابق
                            </button>
                        )}

                        {currentStep < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                التالي
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-bold"
                            >
                                <Check className="w-5 h-5" />
                                نشر السيارة
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Step 1: Basic Info
const Step1BasicInfo: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                عنوان الإعلان *
            </label>
            <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="مثال: تويوتا كامري 2020"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نوع الإعلان *
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => updateField('listing_type', 'sale')}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === 'sale'
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                >
                    <div className="font-bold">للبيع</div>
                </button>
                <button
                    onClick={() => updateField('listing_type', 'rent')}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === 'rent'
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                >
                    <div className="font-bold">للإيجار</div>
                </button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {formData.listing_type === 'sale' ? 'السعر (ل.س) *' : 'السعر (ل.س) *'}
            </label>
            <input
                type="number"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>

        {formData.listing_type === 'rent' && (
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    فترة الإيجار
                </label>
                <select
                    value={formData.rent_period}
                    onChange={(e) => updateField('rent_period', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value="daily">يومي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                </select>
            </div>
        )}

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                المدينة *
            </label>
            <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="دمشق"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>
    </motion.div>
);

// Step 2: Category & Brand (simplified - you'll need to fetch categories/brands)
const Step2CategoryBrand: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الفئة *
            </label>
            <select
                value={formData.category_id}
                onChange={(e) => updateField('category_id', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            >
                <option value="">اختر الفئة</option>
                <option value="1">سيدان</option>
                <option value="2">SUV</option>
                <option value="3">شاحنة</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                الموديل *
            </label>
            <input
                type="text"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="كامري"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>
    </motion.div>
);

// Step 3-6: Simplified versions (you can expand these)
const Step3Specs: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        <p className="text-slate-600 dark:text-slate-400">المواصفات التقنية...</p>
    </motion.div>
);

const Step4Condition: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        <p className="text-slate-600 dark:text-slate-400">حالة السيارة...</p>
    </motion.div>
);

const Step5Media: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        <p className="text-slate-600 dark:text-slate-400">رفع الصور...</p>
    </motion.div>
);

const Step6Review: React.FC<any> = ({ formData }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">معاينة الإعلان</h3>
            <div className="space-y-2">
                <p><strong>العنوان:</strong> {formData.title}</p>
                <p><strong>السعر:</strong> {formData.price} ل.س</p>
                <p><strong>النوع:</strong> {formData.listing_type === 'sale' ? 'للبيع' : 'للإيجار'}</p>
            </div>
        </div>
    </motion.div>
);
