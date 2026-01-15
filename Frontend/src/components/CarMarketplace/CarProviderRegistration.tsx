import React, { useState } from 'react';
import { CarProvider, Settings, Notification, NotificationType, GalleryItem } from '../../types';
import { SYRIAN_CITIES } from '../../constants';
import { COUNTRY_CODES } from '../../constants/countries';
import Icon from '../Icon';
import { AuthService } from '../../services/auth.service';
import { CarProviderService } from '../../services/carprovider.service';
import ImageUpload from '../ImageUpload';
import MediaUpload from '../MediaUpload';

interface CarProviderRegistrationProps {
    onComplete: () => void;
    onCancel: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings; // Now passed from App
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType) => void; // Now passed from App
}

// Step icons
const StepIcon: React.FC<{ icon: React.ReactNode, title: string, description?: string }> = ({ icon, title, description }) => (
    <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary-900/40 dark:to-primary-900/20 text-primary border-primary/10`}>
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
        </div>
    </div>
);

const UserCircleIcon = () => <Icon name="User" className="w-8 h-8" />;
const BuildingIcon = () => <Icon name="Building2" className="w-8 h-8" />; // Building2 usually maps to a building
const MapIcon = () => <Icon name="MapPin" className="w-8 h-8" />;
const CameraIcon = () => <Icon name="Camera" className="w-8 h-8" />;
const LinkIcon = () => <Icon name="Link" className="w-8 h-8" />;
const CheckIcon = () => <Icon name="CheckCircle" className="w-8 h-8" />;

const TOTAL_STEPS = 6;

const CarProviderRegistration: React.FC<CarProviderRegistrationProps> = ({
    onComplete,
    onCancel,
    showToast,
    settings,
    addNotificationForUser
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Phone state
    const [countryCode, setCountryCode] = useState('+963');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        phone: '', // Full phone
        password: '',
        confirmPassword: '',
        business_name: '',
        business_type: 'individual' as 'dealership' | 'individual' | 'rental_agency',
        business_license: '',
        email: '',
        city: 'دمشق',
        address: '',
        description: '',
        socials: { facebook: '', instagram: '', whatsapp: '' },
        location: undefined as { latitude: number; longitude: number } | undefined,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Files
    const [profilePhoto, setProfilePhoto] = useState<File[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Helpers
    const validatePhoneNumber = (code: string, number: string): boolean => {
        const country = COUNTRY_CODES.find(c => c.code === code);
        if (!country) return false;
        return country.pattern.test(number);
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        setPhoneNumber(cleaned);

        const fullPhone = countryCode + cleaned;
        const whatsappNumber = countryCode.replace('+', '') + cleaned;

        setFormData(p => ({
            ...p,
            phone: fullPhone,
            socials: { ...p.socials, whatsapp: whatsappNumber }
        }));

        if (cleaned.length > 0) {
            if (validatePhoneNumber(countryCode, cleaned)) {
                setPhoneError('');
            } else {
                const country = COUNTRY_CODES.find(c => c.code === countryCode);
                setPhoneError(`الرقم غير صحيح لـ ${country?.name}`);
            }
        } else {
            setPhoneError('');
        }
    };

    const handleCountryCodeChange = (code: string) => {
        setCountryCode(code);
        const fullPhone = code + phoneNumber;
        const whatsappNumber = code.replace('+', '') + phoneNumber;

        setFormData(p => ({
            ...p,
            phone: fullPhone,
            socials: { ...p.socials, whatsapp: whatsappNumber }
        }));
        setShowCountryDropdown(false);

        if (phoneNumber.length > 0) {
            if (!validatePhoneNumber(code, phoneNumber)) {
                const country = COUNTRY_CODES.find(c => c.code === code);
                setPhoneError(`الرقم غير صحيح لـ ${country?.name}`);
            } else {
                setPhoneError('');
            }
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(p => ({ ...p, location: { latitude, longitude } }));
                    showToast('تم تحديد الموقع بنجاح!', 'success');
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    showToast('لم نتمكن من الحصول على موقعك. تأكد من منح الإذن.', 'error');
                }
            );
        } else {
            showToast('متصفحك لا يدعم تحديد المواقع.', 'error');
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (currentStep === 1) {
                if (!phoneNumber) {
                    setError('يرجى إدخال رقم الهاتف.');
                    setIsLoading(false);
                    return false;
                }
                if (!validatePhoneNumber(countryCode, phoneNumber)) {
                    setError('رقم الهاتف غير صحيح.');
                    setIsLoading(false);
                    return false;
                }

                // Server check
                try {
                    const response = await AuthService.checkPhone(formData.phone);
                    if (response.exists) {
                        setError('رقم الهاتف هذا مسجل بالفعل.');
                        setIsLoading(false);
                        return false;
                    }
                } catch (e) {
                    console.error(e);
                }

                if (!formData.password || formData.password.length < 6) {
                    setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
                    setIsLoading(false);
                    return false;
                }

                if (formData.password !== formData.confirmPassword) {
                    setError('كلمات المرور غير متطابقة.');
                    setIsLoading(false);
                    return false;
                }
            }

            if (currentStep === 2) {
                if (!formData.business_name) {
                    setError('يرجى إدخال اسم العمل.');
                    setIsLoading(false);
                    return false;
                }
            }

            if (currentStep === 3) {
                if (!formData.city || !formData.address) {
                    setError('يرجى إدخال المدينة والعنوان.');
                    setIsLoading(false);
                    return false;
                }
            }

            if (currentStep === 6) { // Review step
                if (!acceptedTerms) {
                    setError('يرجى الموافقة على الشروط والأحكام.');
                    setIsLoading(false);
                    return false;
                }
            }

            setCurrentStep(prev => prev + 1);
        } catch (e: any) {
            console.error(e);
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            const data = new FormData();

            // Append basic fields
            data.append('phone', formData.phone);
            data.append('password', formData.password);
            data.append('business_name', formData.business_name);
            data.append('business_type', formData.business_type);
            data.append('city', formData.city);
            data.append('address', formData.address);

            // Optional fields
            if (formData.business_license) data.append('business_license', formData.business_license);
            if (formData.email) data.append('email', formData.email);
            if (formData.description) data.append('description', formData.description);

            // Socials
            if (formData.socials.facebook) data.append('socials[facebook]', formData.socials.facebook);
            if (formData.socials.instagram) data.append('socials[instagram]', formData.socials.instagram);
            if (formData.socials.whatsapp) data.append('socials[whatsapp]', formData.socials.whatsapp);

            // Location
            if (formData.location) {
                data.append('latitude', formData.location.latitude.toString());
                data.append('longitude', formData.location.longitude.toString());
            }

            // Files
            if (profilePhoto.length > 0) {
                data.append('profile_photo', profilePhoto[0]);
            }

            if (galleryFiles.length > 0) {
                galleryFiles.forEach((file) => {
                    data.append('gallery[]', file);
                });
            }

            await CarProviderService.registerProvider(data);

            // Notify Admin
            const adminPhone = settings.adminPhone || '963900000000'; // Fallback if missing
            addNotificationForUser(adminPhone, {
                title: 'طلب انضمام معرض جديد',
                message: `سجل ${formData.business_name} (${formData.phone}) وينتظر المراجعة.`,
                type: 'NEW_CAR_PROVIDER_REQUEST',
                link: { view: 'adminDashboard', params: { adminView: 'providers' } } // Adjust params as needed
            }, 'NEW_CAR_PROVIDER_REQUEST');

            showToast('تم التسجيل بنجاح! في انتظار الموافقة', 'success');
            onComplete();

        } catch (error: any) {
            console.error("Registration error", error);
            setError(error.response?.data?.message || 'فشل التسجيل');
            showToast('فشل في التسجيل', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "block w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400";
    const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";
    const fadeClass = "animate-slide-up";

    return (
        <div className="w-full max-w-2xl bg-white dark:bg-darkcard rounded-2xl shadow-xl overflow-hidden">
            {/* Progress Header */}
            {currentStep <= TOTAL_STEPS && (
                <div className="p-8 pb-0">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-primary dark:text-primary-400">تسجيل معرض سيارات</h2>
                        <span className="text-sm font-semibold text-slate-500">الخطوة {currentStep} من {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                        <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}></div>
                    </div>
                </div>
            )}

            <div className="p-8">
                {error && <p className="text-center text-red-500 text-sm mb-6 bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/30">{error}</p>}

                {/* Step 1: Account */}
                {currentStep === 1 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<UserCircleIcon />} title="معلومات الحساب" description="أنشئ حسابك الجديد للبدء" />

                        <div>
                            <label className={labelClasses}>رقم الهاتف <span className="text-red-500">*</span></label>
                            <div className="flex gap-2" dir="ltr">
                                <div className="relative w-32">
                                    <button type="button" onClick={() => setShowCountryDropdown(!showCountryDropdown)} className="w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2">
                                        <span className="text-lg">{COUNTRY_CODES.find(c => c.code === countryCode)?.flag}</span>
                                        <span className="text-sm font-semibold">{countryCode}</span>
                                        <Icon name="ChevronDown" className="w-4 h-4 text-slate-400" />
                                    </button>
                                    {showCountryDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                                            {COUNTRY_CODES.map(country => (
                                                <button key={country.code} type="button" onClick={() => handleCountryCodeChange(country.code)} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-right">
                                                    <span className="text-xl">{country.flag}</span>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold">{country.name}</div>
                                                        <div className="text-xs text-slate-500">{country.code}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    <input type="tel" value={phoneNumber} onChange={e => handlePhoneChange(e.target.value)} className={`${inputClasses} pr-11`} placeholder="9xxxxxxxx" dir="ltr" />
                                    <Icon name="Phone" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            {phoneError && <p className="mt-2 text-sm text-red-600">{phoneError}</p>}
                        </div>

                        <div>
                            <label className={labelClasses}>كلمة المرور <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => updateField('password', e.target.value)} className={`${inputClasses} font-mono pr-12`} dir="ltr" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <Icon name={showPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={e => updateField('confirmPassword', e.target.value)} className={`${inputClasses} font-mono pr-12`} dir="ltr" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Business Info */}
                {currentStep === 2 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<BuildingIcon />} title="معلومات العمل" description="تفاصيل المعرض والنشاط التجاري" />

                        <div>
                            <label className={labelClasses}>اسم العمل (المعرض) <span className="text-red-500">*</span></label>
                            <input type="text" value={formData.business_name} onChange={(e) => updateField('business_name', e.target.value)} placeholder="مثال: معرض الشام للسيارات" className={inputClasses} required />
                        </div>

                        <div>
                            <label className={labelClasses}>نوع العمل <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: 'dealership', label: 'معرض' },
                                    { value: 'individual', label: 'فردي' },
                                    { value: 'rental_agency', label: 'تأجير' }
                                ].map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => updateField('business_type', type.value)}
                                        className={`p-3 rounded-xl border-2 transition-all ${formData.business_type === type.value
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{type.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>رقم الترخيص <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <input type="text" value={formData.business_license} onChange={(e) => updateField('business_license', e.target.value)} placeholder="رقم السجل التجاري" className={inputClasses} />
                        </div>

                        <div>
                            <label className={labelClasses}>البريد الإلكتروني <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <div className="relative">
                                <Icon name="Mail" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="example@domain.com" className={`${inputClasses} pr-11`} dir="ltr" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 3 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<MapIcon />} title="الموقع والتفاصيل" description="أين يقع المعرض؟" />

                        <div>
                            <label className={labelClasses}>المدينة <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select value={formData.city} onChange={e => updateField('city', e.target.value)} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Icon name="ChevronDown" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>العنوان بالتفصيل <span className="text-red-500">*</span></label>
                            <textarea value={formData.address} onChange={e => updateField('address', e.target.value)} placeholder="مثال: دمشق - المزة - جانب..." rows={2} className={inputClasses} />
                        </div>

                        <div>
                            <label className={labelClasses}>تحديد الموقع على الخريطة <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className={`mt-1 w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-dashed rounded-xl transition-all ${formData.location
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                    : 'border-primary/30 dark:border-primary/20 text-primary bg-primary/5 hover:bg-primary/10'
                                    }`}
                            >
                                <Icon name={formData.location ? "CheckCircle2" : "MapPin"} className="w-5 h-5" />
                                <span className="font-semibold">{formData.location ? 'تم تحديد الموقع بنجاح!' : 'تحديد الموقع الحالي'}</span>
                            </button>
                        </div>

                        <div>
                            <label className={labelClasses}>نبذة تعريفية <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <textarea value={formData.description} onChange={e => updateField('description', e.target.value)} rows={3} className={inputClasses} placeholder="اكتب نبذة عن المعرض..." />
                        </div>
                    </div>
                )}

                {/* Step 4: Socials */}
                {currentStep === 4 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<LinkIcon />} title="روابط التواصل" description="سهل الوصول إليك عبر السوشيال ميديا" />

                        <div>
                            <label className={labelClasses}><span className="flex items-center gap-2"><Icon name="Facebook" className="w-4 h-4 text-blue-600" /> فيسبوك <span className="text-slate-400 text-xs">(اختياري)</span></span></label>
                            <div className="relative">
                                <input type="url" value={formData.socials.facebook} onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, facebook: e.target.value } }))} className={`${inputClasses} pr-11`} dir="ltr" placeholder="https://facebook.com/..." />
                                <Icon name="Link" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}><span className="flex items-center gap-2"><Icon name="Instagram" className="w-4 h-4 text-pink-500" /> انستغرام <span className="text-slate-400 text-xs">(اختياري)</span></span></label>
                            <div className="relative">
                                <input type="text" value={formData.socials.instagram} onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))} className={`${inputClasses} pl-8`} dir="ltr" placeholder="username" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                رقم الواتساب سيكون نفس رقم هاتفك المسجل ({formData.phone}).
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 5: Media */}
                {currentStep === 5 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<CameraIcon />} title="الصور والوسائط" description="أضف شعار المعرض وصور للمعرض" />

                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <label className={labelClasses}>شعار المعرض (صورة البروفايل) <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <ImageUpload files={profilePhoto} setFiles={setProfilePhoto} maxFiles={1} />
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                            <label className={labelClasses}>صور المعرض <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <MediaUpload files={galleryFiles} setFiles={setGalleryFiles} maxFiles={5} />
                        </div>
                    </div>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<CheckIcon />} title="المراجعة النهائية" description="تأكد من صحة بياناتك" />

                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-slate-500">اسم العمل:</span> <span className="font-semibold block">{formData.business_name}</span></div>
                                <div><span className="text-slate-500">نوع العمل:</span> <span className="font-semibold block">{formData.business_type}</span></div>
                                <div><span className="text-slate-500">رقم الهاتف:</span> <span className="font-semibold block" dir="ltr">{formData.phone}</span></div>
                                <div><span className="text-slate-500">المدينة:</span> <span className="font-semibold block">{formData.city}</span></div>
                            </div>
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-500 block mb-1">العنوان:</span>
                                <span className="font-semibold block">{formData.address}</span>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 p-4 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                            <div className="text-sm">
                                <span className="font-semibold text-slate-900 dark:text-white">أوافق على الشروط والأحكام</span>
                                <p className="text-slate-500 mt-1">أتعهد بأن جميع البيانات المدخلة صحيحة وأتحمل المسؤولية القانونية عنها.</p>
                            </div>
                        </label>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={currentStep === 1 ? onCancel : prevStep}
                        className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                        {currentStep === 1 ? 'إلغاء' : 'السابق'}
                    </button>

                    {currentStep < TOTAL_STEPS ? (
                        <button
                            onClick={validateStep}
                            disabled={isLoading}
                            className="bg-primary hover:bg-primary-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2"
                        >
                            {isLoading ? 'جاري التحقق...' : 'التالي'}
                            <Icon name="ChevronLeft" className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !acceptedTerms}
                            className={`bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:shadow-green-600/20 transition-all flex items-center gap-2 ${(!acceptedTerms || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                            <Icon name="Check" className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CarProviderRegistration;
