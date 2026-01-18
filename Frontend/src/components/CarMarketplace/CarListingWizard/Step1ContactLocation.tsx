import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, MapPin, Home } from 'lucide-react';
import { SYRIAN_CITIES } from '../../../constants';
import { CarProviderService } from '../../../services/carprovider.service';

interface Step1ContactLocationProps {
    formData: any;
    updateField: (field: string, value: any) => void;
    listingType: 'sale' | 'rent';
    onlySale?: boolean;
}

const Step1ContactLocation: React.FC<Step1ContactLocationProps> = ({
    formData,
    updateField,
    listingType,
    onlySale = false
}) => {
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const whatsappInputRef = useRef<HTMLInputElement>(null);
    const cityButtonsRef = useRef<HTMLDivElement>(null);

    // Popular cities for quick select - matching Step5Details pattern
    const popularCities = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس'];

    // Auto-set listing type to 'sale' when onlySale is true
    useEffect(() => {
        if (onlySale && formData.listing_type !== 'sale') {
            updateField('listing_type', 'sale');
        }
    }, [onlySale]);

    // Auto-fill phone numbers on mount
    useEffect(() => {
        const fetchPhones = async () => {
            try {
                setLoading(true);
                const phones = await CarProviderService.getPhones();

                if (phones && phones.length > 0) {
                    // Find primary phone or use first one
                    const primaryPhone = phones.find((p: any) => p.is_primary) || phones[0];

                    if (primaryPhone && !formData.contact_phone) {
                        updateField('contact_phone', primaryPhone.phone);
                    }

                    // Auto-fill WhatsApp if marked as WhatsApp number
                    if (primaryPhone?.is_whatsapp && !formData.contact_whatsapp) {
                        updateField('contact_whatsapp', primaryPhone.phone);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch phones:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPhones();
    }, []);

    // Validate fields
    const validateField = (field: string, value: any): string => {
        switch (field) {
            case 'contact_phone':
                if (!value) return 'رقم الاتصال مطلوب';
                if (value.length < 10) return 'رقم غير صحيح';
                return '';
            case 'city':
                if (!value) return 'المدينة مطلوبة';
                return '';
            case 'condition':
                if (listingType === 'sale' && !value) return 'حالة السيارة مطلوبة';
                return '';
            default:
                return '';
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        updateField(field, value);

        // Clear error when user fixes the field
        const error = validateField(field, value);
        if (!error && errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleCitySelect = (city: string) => {
        handleFieldChange('city', city);
    };

    // Smart focus - focus first empty required field
    useEffect(() => {
        if (loading) return;

        if (!formData.contact_phone && phoneInputRef.current) {
            phoneInputRef.current.focus();
        } else if (!formData.city && cityButtonsRef.current) {
            cityButtonsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [loading, formData.contact_phone, formData.city]);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Listing Type Selector - Hidden for sale-only users */}
            {!onlySale && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">📋</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                            نوع الإعلان <span className="text-red-500">*</span>
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => updateField('listing_type', 'sale')}
                            className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.listing_type === 'sale'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            <span className="text-3xl">💰</span>
                            <span className="text-sm">للبيع</span>
                        </button>

                        {!onlySale && (
                            <button
                                type="button"
                                onClick={() => updateField('listing_type', 'rent')}
                                className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.listing_type === 'rent'
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                            >
                                <span className="text-3xl">🔄</span>
                                <span className="text-sm">للإيجار</span>
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Condition Selector - Only for Sale */}
            {formData.listing_type === 'sale' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${errors.condition ? 'border-red-400 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'
                        }`}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">🏷️</span>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                            حالة السيارة <span className="text-red-500">*</span>
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => handleFieldChange('condition', 'new')}
                            className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.condition === 'new'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            <span className="text-3xl">✨</span>
                            <span className="text-sm">جديدة</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFieldChange('condition', 'used')}
                            className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl font-bold transition-all ${formData.condition === 'used'
                                ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            <span className="text-3xl">🚗</span>
                            <span className="text-sm">مستعملة</span>
                        </button>
                    </div>

                    {errors.condition && (
                        <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
                            <span>⚠️</span> {errors.condition}
                        </p>
                    )}
                </motion.div>
            )}

            {/* Contact Phone */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${formData.contact_phone
                    ? 'border-green-400 bg-green-50/30 dark:bg-green-900/20'
                    : errors.contact_phone
                        ? 'border-red-400 bg-red-50/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
            >
                <div className="flex items-center gap-3 mb-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        رقم الاتصال <span className="text-red-500">*</span>
                    </h4>
                    {loading && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-bold">
                            جاري التحميل...
                        </span>
                    )}
                </div>

                <input
                    ref={phoneInputRef}
                    type="tel"
                    value={formData.contact_phone || ''}
                    onChange={(e) => handleFieldChange('contact_phone', e.target.value)}
                    placeholder="+963 XXX XXX XXX"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary border-slate-200 dark:border-slate-600"
                    dir="ltr"
                />

                {errors.contact_phone && (
                    <p className="text-red-500 text-sm mt-2 font-bold flex items-center gap-2">
                        <span>⚠️</span> {errors.contact_phone}
                    </p>
                )}
                {formData.contact_phone && !errors.contact_phone && (
                    <p className="text-green-500 text-sm mt-2 font-bold flex items-center gap-2">
                        <span>✅</span> تم التعبئة تلقائياً
                    </p>
                )}
            </motion.div>

            {/* WhatsApp */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        واتساب (اختياري)
                    </h4>
                </div>

                <input
                    ref={whatsappInputRef}
                    type="tel"
                    value={formData.contact_whatsapp || ''}
                    onChange={(e) => handleFieldChange('contact_whatsapp', e.target.value)}
                    placeholder="+963 XXX XXX XXX"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-500 border-slate-200 dark:border-slate-600"
                    dir="ltr"
                />

                {formData.contact_whatsapp && (
                    <p className="text-green-500 text-sm mt-2 font-bold flex items-center gap-2">
                        <span>✅</span> سيتم عرض زر واتساب للمشترين
                    </p>
                )}
            </motion.div>

            {/* City Selection - Matching Step5Details pattern */}
            <motion.div
                ref={cityButtonsRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${errors.city ? 'border-red-400 bg-red-50/30' : 'border-slate-200 dark:border-slate-700'
                    }`}
            >
                <div className="flex items-center gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        المدينة <span className="text-red-500">*</span>
                    </h4>
                </div>

                {/* Popular cities as big buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
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

            {/* Address - Optional */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-700"
            >
                <div className="flex items-center gap-3 mb-3">
                    <Home className="w-5 h-5 text-slate-500" />
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">
                        العنوان التفصيلي (اختياري)
                    </h4>
                </div>

                <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    placeholder="مثال: شارع المتنبي، بناء 15"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-2 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary/30 focus:border-primary border-slate-200 dark:border-slate-600"
                />

                <p className="text-slate-500 text-xs mt-2">
                    💡 العنوان التفصيلي يساعد المشترين في الوصول إليك
                </p>
            </motion.div>
        </motion.div>
    );
};

export default Step1ContactLocation;
