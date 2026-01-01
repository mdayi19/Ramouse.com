import React, { useState } from 'react';
import { TowTruck, Settings, Notification, NotificationType, GalleryItem } from '../types';
import { SYRIAN_CITIES, DEFAULT_TOW_TRUCK_TYPES } from '../constants';
import { COUNTRY_CODES } from '../constants/countries';
import Icon from './Icon';
import { AuthService } from '../services/auth.service';
import ImageUpload from './ImageUpload';
import MediaUpload from './MediaUpload';

interface TowTruckRegistrationProps {
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType) => void;
    settings: Settings;
}



const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// Step icons
const StepIcon: React.FC<{ icon: React.ReactNode, title: string, description?: string }> = ({ icon, title, description }) => (
    <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border ${icon && (icon as any).type === TruckIcon ? 'bg-primary border-primary/20' : 'bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary-900/40 dark:to-primary-900/20 text-primary border-primary/10'}`}>
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
const TruckIcon = () => <Icon name="towtruck" className="w-10 h-10 text-white" />;
const CameraIcon = () => <Icon name="Camera" className="w-8 h-8" />;
const LinkIcon = () => <Icon name="Link" className="w-8 h-8" />;
const CheckIcon = () => <Icon name="Check" className="w-8 h-8" />;

const TOTAL_STEPS = 5;

const TowTruckRegistration: React.FC<TowTruckRegistrationProps> = (props) => {
    const { onBack, showToast, addNotificationForUser, settings } = props;
    const [currentStep, setCurrentStep] = useState(1);

    // Phone validation state
    const [countryCode, setCountryCode] = useState('+963');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    // Form state
    const [formData, setFormData] = useState<Partial<TowTruck>>({
        phone: '',
        name: '',
        vehicleType: DEFAULT_TOW_TRUCK_TYPES[0]?.name || '',
        city: 'دمشق',
        serviceArea: '',
        description: '',
        socials: { facebook: '', instagram: '', whatsapp: '' },
        location: undefined,
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<File[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const nextStep = () => setCurrentStep(prev => (prev < TOTAL_STEPS + 1 ? prev + 1 : prev));
    const prevStep = () => setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));

    // Validate phone number based on country code
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

    const handleSubmit = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Convert files to base64
            let profilePhotoBase64 = undefined;
            if (profilePhoto.length > 0) {
                profilePhotoBase64 = await fileToBase64(profilePhoto[0]);
            }

            const galleryBase64: GalleryItem[] = await Promise.all(galleryFiles.map(async (file) => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                type: (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video',
                data: await fileToBase64(file), // Using 'data' as expected by updated controller logic
                url: await fileToBase64(file),  // keeping url for frontend compatibility if needed
                caption: ''
            })));

            const newTowTruck: any = {
                phone: formData.phone,
                id: formData.phone,
                name: formData.name,
                password: password,
                vehicleType: formData.vehicleType,
                city: formData.city,
                serviceArea: formData.serviceArea,
                description: formData.description,
                socials: formData.socials,
                location: formData.location,
                profilePhoto: profilePhotoBase64,
                gallery: galleryBase64.length > 0 ? galleryBase64 : undefined,
                isVerified: false,
                rating: 5,
                isActive: true,
                joinDate: new Date().toISOString().split('T')[0],
            };

            // Send to backend
            let registeredTowTruck = newTowTruck;
            try {
                const response = await AuthService.registerTowTruck(newTowTruck);
                if (response.data && response.data.user) {
                    registeredTowTruck = response.data.user;
                }
            } catch (apiError: any) {
                console.error("API Registration failed", apiError);
                throw apiError;
            }

            // Notify admin
            addNotificationForUser(settings.adminPhone, {
                title: 'طلب انضمام سائق سطحة جديد',
                message: `سجل ${formData.name} (${formData.phone}) وينتظر المراجعة والتوثيق.`,
                type: 'NEW_TOW_TRUCK_REQUEST',
                link: { view: 'adminDashboard', params: { adminView: 'towTruckManagement' } }
            }, 'NEW_TOW_TRUCK_REQUEST');

            showToast('تم إرسال طلبك بنجاح!', 'success');
            nextStep();
        } catch (err: any) {
            console.error('Error registering tow truck:', err);
            setError(err.response?.data?.message || 'فشل في إرسال الطلب. حاول مرة أخرى.');
            showToast('فشل في التسجيل', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const validateStep = async () => {
        setError('');
        setIsLoading(true);

        try {
            if (currentStep === 1) {
                if (!formData.name || formData.name.trim().length < 3) {
                    setError('يرجى إدخال الاسم الكامل (3 أحرف على الأقل).');
                    setIsLoading(false);
                    return false;
                }

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

                // Server-side Check
                try {
                    const fullPhone = countryCode + phoneNumber;
                    const response = await AuthService.checkPhone(fullPhone);
                    if (response.exists) {
                        setError('رقم الهاتف هذا مسجل بالفعل.');
                        setIsLoading(false);
                        return false;
                    }
                } catch (e) {
                    console.error('Phone check error', e);
                }

                if (!password || password.length < 6) {
                    setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
                    setIsLoading(false);
                    return false;
                }
                if (password !== confirmPassword) {
                    setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
                    setIsLoading(false);
                    return false;
                }
            }

            if (currentStep === 5) {
                if (!acceptedTerms) {
                    setError('يرجى الموافقة على الشروط والأحكام للمتابعة.');
                    setIsLoading(false);
                    return false;
                }
            }

            nextStep();
        } catch (e) {
            console.error(e);
            setError('حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = "block w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400";
    const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";
    const fadeClass = "animate-slide-up";

    return (
        <div className="w-full max-w-2xl">
            {currentStep <= TOTAL_STEPS && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-primary dark:text-primary-400">تسجيل سائق سطحة</h2>
                        <span className="text-sm font-semibold text-slate-500">الخطوة {currentStep} من {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}></div></div>
                </div>
            )}
            <div className="p-8 bg-white dark:bg-darkcard rounded-xl shadow-xl">
                {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

                {/* Step 1: Account Info */}
                {currentStep === 1 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<UserCircleIcon />} title="معلومات الحساب" description="قم بإنشاء حسابك للبدء" />

                        <div>
                            <label className={labelClasses}>الاسم الكامل <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`${inputClasses} pr-11`} placeholder="الاسم الكامل" required />
                                <Icon name="User" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

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
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" dir="rtl">
                                مثال: لسوريا اختر +963 ثم أدخل 9xxxxxxxx
                            </p>
                        </div>

                        <div>
                            <label className={labelClasses}>كلمة المرور <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className={`${inputClasses} font-mono pr-12`} dir="ltr" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <Icon name={showPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                يجب أن تحتوي على 6 أحرف على الأقل
                            </p>
                        </div>

                        <div>
                            <label className={labelClasses}>تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`${inputClasses} font-mono pr-12`} dir="ltr" placeholder="••••••••" />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Professional Details */}
                {currentStep === 2 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<TruckIcon />} title="تفاصيل المركبة" description="أخبرنا عن نوع المركبة ومنطقة الخدمة" />

                        <div>
                            <label className={labelClasses}>نوع المركبة</label>
                            <div className="relative">
                                <select value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    {DEFAULT_TOW_TRUCK_TYPES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                                <Icon name="ChevronDown" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>المدينة</label>
                            <div className="relative">
                                <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className={`${inputClasses} appearance-none cursor-pointer`}>
                                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <Icon name="MapPin" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>منطقة الخدمة <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <div className="relative">
                                <input type="text" value={formData.serviceArea} onChange={e => setFormData({ ...formData, serviceArea: e.target.value })} className={inputClasses} placeholder="مثال: دمشق وريفها" />
                                <Icon name="Map" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>موقع التمركز المعتاد <span className="text-slate-400 text-xs">(اختياري)</span></label>
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
                            {formData.location && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
                                    {Number(formData.location.latitude).toFixed(6)}, {Number(formData.location.longitude).toFixed(6)}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={labelClasses}>نبذة تعريفية <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={4} className={inputClasses} placeholder="اكتب نبذة عن خدماتك..." />
                            <div className="mt-1 text-xs text-slate-400 text-left" dir="ltr">
                                {formData.description?.length || 0} / 500
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Media */}
                {currentStep === 3 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<CameraIcon />} title="الصور والوثائق" description="أضف صورة للمركبة وصور للأعمال السابقة" />

                        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <label className={labelClasses}>صورة المركبة/الشخصية <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <ImageUpload files={profilePhoto} setFiles={setProfilePhoto} maxFiles={1} />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <label className={labelClasses}>صور إضافية <span className="text-slate-400 text-xs">(اختياري)</span></label>
                            <MediaUpload files={galleryFiles} setFiles={setGalleryFiles} maxFiles={5} />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-semibold mb-1">نصيحة:</p>
                                    <p className="text-blue-600 dark:text-blue-400">الصور الواضحة للمركبة تزيد من ثقة العملاء</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Socials */}
                {currentStep === 4 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<LinkIcon />} title="روابط التواصل" description="سهل على العملاء الوصول إليك" />

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 mb-4">
                            <div className="flex gap-3">
                                <Icon name="Lightbulb" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    جميع الحقول اختيارية، لكن إضافة معلومات التواصل تزيد من فرص حصولك على عملاء
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}><span className="flex items-center gap-2"><Icon name="Facebook" className="w-4 h-4 text-blue-600" /> فيسبوك <span className="text-slate-400 text-xs">(اختياري)</span></span></label>
                            <div className="relative">
                                <input type="url" value={formData.socials?.facebook || ''} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, facebook: e.target.value } })} className={`${inputClasses} pr-11`} dir="ltr" placeholder="https://facebook.com/..." />
                                <Icon name="Link" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}><span className="flex items-center gap-2"><Icon name="Instagram" className="w-4 h-4 text-pink-500" /> انستغرام <span className="text-slate-400 text-xs">(اختياري)</span></span></label>
                            <div className="relative">
                                <input type="text" value={formData.socials?.instagram || ''} onChange={e => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })} className={`${inputClasses} pl-8`} dir="ltr" placeholder="username" />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}><span className="flex items-center gap-2"><Icon name="MessageCircle" className="w-4 h-4 text-green-500" /> واتساب <span className="text-slate-400 text-xs">(تلقائي)</span></span></label>
                            <div className="relative">
                                <input type="tel" value={formData.socials?.whatsapp || ''} readOnly className={`${inputClasses} bg-slate-100 dark:bg-slate-700 pr-11`} dir="ltr" />
                                <Icon name="Phone" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                تم استخدام رقمك مع الرمز الدولي تلقائياً
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon icon={<CheckIcon />} title="المراجعة النهائية" description="تأكد من صحة بياناتك" />

                        <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">المعلومات الشخصية</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">الاسم</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">رقم الهاتف</span>
                                        <span className="font-medium text-slate-900 dark:text-white" dir="ltr">{formData.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">تفاصيل المركبة</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">النوع</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{formData.vehicleType}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">المدينة</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{formData.city}</span>
                                    </div>
                                    {formData.serviceArea && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">منطقة الخدمة</span>
                                            <span className="font-medium text-slate-900 dark:text-white">{formData.serviceArea}</span>
                                        </div>
                                    )}
                                </div>
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

                {/* Success Step */}
                {currentStep === 6 && (
                    <div className="text-center py-8">
                        <Icon name="CheckCircle" className="w-20 h-20 text-green-500 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">تم استلام طلبك!</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">سيتم التواصل معك قريباً لتفعيل الفعالية.</p>
                    </div>
                )}

                <div className="flex justify-between mt-8">
                    {currentStep > 1 && currentStep <= TOTAL_STEPS && (<button onClick={prevStep} className="px-6 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium transition-colors">السابق</button>)}
                    {currentStep < TOTAL_STEPS && (
                        <button onClick={validateStep} disabled={isLoading} className="ml-auto px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-700 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                            {isLoading ? <Icon name="Loader" className="animate-spin" /> : 'التالي'}
                        </button>
                    )}
                    {currentStep === TOTAL_STEPS && (
                        <button onClick={handleSubmit} disabled={isLoading} className="ml-auto px-6 py-2 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105">
                            {isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                        </button>
                    )}
                    {currentStep > TOTAL_STEPS && (
                        <button onClick={onBack} className="mx-auto px-6 py-2 rounded-lg bg-primary text-white font-bold hover:bg-primary-700 transition-colors">العودة للرئيسية</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TowTruckRegistration;