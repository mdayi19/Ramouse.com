import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Lock, Building, MapPin, Upload, CheckCircle,
    ChevronLeft, ChevronRight, Phone, Mail, Eye, EyeOff
} from 'lucide-react';
import Icon from '../Icon';
import { CarProviderService } from '../../services/carprovider.service';

interface RegistrationProps {
    onComplete: () => void;
    onCancel: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CarProviderRegistration: React.FC<RegistrationProps> = ({
    onComplete,
    onCancel,
    showToast
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        phone: '',
        password: '',
        confirmPassword: '',
        business_name: '',
        business_type: 'individual' as 'dealership' | 'individual' | 'rental_agency',
        business_license: '',
        city: '',
        address: '',
        description: '',
        email: '',
        profile_photo: null as File | null,
        gallery: [] as File[]
    });

    const totalSteps = 5;
    const stepTitles = [
        'معلومات الحساب',
        'معلومات العمل',
        'الموقع',
        'الصور',
        'المراجعة'
    ];

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.phone || !formData.password) {
                    showToast('الرجاء إدخال رقم الهاتف وكلمة المرور', 'error');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    showToast('كلمات المرور غير متطابقة', 'error');
                    return false;
                }
                if (formData.password.length < 6) {
                    showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
                    return false;
                }
                return true;
            case 2:
                if (!formData.business_name) {
                    showToast('الرجاء إدخال اسم العمل', 'error');
                    return false;
                }
                return true;
            case 3:
                if (!formData.city || !formData.address) {
                    showToast('الرجاء إدخال المدينة والعنوان', 'error');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                if (key === 'profile_photo' && formData.profile_photo) {
                    data.append('profile_photo', formData.profile_photo);
                } else if (key === 'gallery' && formData.gallery.length > 0) {
                    formData.gallery.forEach(file => data.append('gallery[]', file));
                } else if (key !== 'confirmPassword' && key !== 'profile_photo' && key !== 'gallery') {
                    data.append(key, (formData as any)[key]);
                }
            });

            await CarProviderService.registerProvider(data);
            showToast('تم التسجيل بنجاح! في انتظار الموافقة', 'success');
            onComplete();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'فشل التسجيل', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
        const files = e.target.files;
        if (!files) return;

        if (isGallery) {
            updateField('gallery', [...formData.gallery, ...Array.from(files)]);
        } else {
            updateField('profile_photo', files[0]);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Building className="w-8 h-8" />
                        تسجيل مزود سيارات
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
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <Step1Account
                                formData={formData}
                                updateField={updateField}
                                showPassword={showPassword}
                                setShowPassword={setShowPassword}
                            />
                        )}
                        {currentStep === 2 && (
                            <Step2Business formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 3 && (
                            <Step3Location formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 4 && (
                            <Step4Photos
                                formData={formData}
                                updateField={updateField}
                                handleFileChange={handleFileChange}
                            />
                        )}
                        {currentStep === 5 && (
                            <Step5Review formData={formData} />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        إلغاء
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                            >
                                <ChevronRight className="w-5 h-5" />
                                السابق
                            </button>
                        )}

                        {currentStep < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                التالي
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-bold disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        جار التسجيل...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        إرسال الطلب
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Step Components
const Step1Account: React.FC<any> = ({ formData, updateField, showPassword, setShowPassword }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم الهاتف *
            </label>
            <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                كلمة المرور *
            </label>
            <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="6 أحرف على الأقل"
                    className="w-full pr-12 pl-12 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تأكيد كلمة المرور *
            </label>
            <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                />
            </div>
        </div>
    </motion.div>
);

const Step2Business: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                اسم العمل *
            </label>
            <input
                type="text"
                value={formData.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                placeholder="مثال: معرض الشام للسيارات"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                نوع العمل *
            </label>
            <div className="grid grid-cols-3 gap-4">
                {[
                    { value: 'dealership', label: 'معرض' },
                    { value: 'individual', label: 'فردي' },
                    { value: 'rental_agency', label: 'تأجير' }
                ].map(type => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => updateField('business_type', type.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${formData.business_type === type.value
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}
                    >
                        <div className="font-bold text-gray-900 dark:text-white">{type.label}</div>
                    </button>
                ))}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                رقم الترخيص (اختياري)
            </label>
            <input
                type="text"
                value={formData.business_license}
                onChange={(e) => updateField('business_license', e.target.value)}
                placeholder="رقم السجل التجاري"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                البريد الإلكتروني (اختياري)
            </label>
            <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>
        </div>
    </motion.div>
);

const Step3Location: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                المدينة *
            </label>
            <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="دمشق"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                العنوان بالتفصيل *
            </label>
            <div className="relative">
                <MapPin className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="مثال: شارع بغداد - بناء السلام"
                    rows={3}
                    className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    required
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                وصف النشاط (اختياري)
            </label>
            <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="أخبرنا عن عملك..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
        </div>
    </motion.div>
);

const Step4Photos: React.FC<any> = ({ formData, handleFileChange }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                صورة الملف الشخصي (اختياري)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                <input
                    type="file"
                    id="profile-photo"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, false)}
                    className="hidden"
                />
                <label htmlFor="profile-photo" className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                        {formData.profile_photo ? formData.profile_photo.name : 'اضغط لرفع صورة'}
                    </p>
                </label>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                معرض الصور (اختياري)
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
                <input
                    type="file"
                    id="gallery"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, true)}
                    className="hidden"
                />
                <label htmlFor="gallery" className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                        {formData.gallery.length > 0
                            ? `${formData.gallery.length} صور محملة`
                            : 'اضغط لرفع الصور'}
                    </p>
                </label>
            </div>
        </div>
    </motion.div>
);

const Step5Review: React.FC<any> = ({ formData }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">مراجعة البيانات</h3>
            <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">رقم الهاتف:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.phone}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">اسم العمل:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.business_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">نوع العمل:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                        {formData.business_type === 'dealership' ? 'معرض' :
                            formData.business_type === 'individual' ? 'فردي' : 'تأجير'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">المدينة:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.city}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600 dark:text-gray-400">العنوان:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.address}</span>
                </div>
            </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
                سيتم مراجعة طلبك من قبل الإدارة خلال 24-48 ساعة
            </p>
        </div>
    </motion.div>
);

export default CarProviderRegistration;
