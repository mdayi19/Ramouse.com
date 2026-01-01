import React, { useState } from 'react';
import { Technician, Settings, Notification, NotificationType, GalleryItem, TechnicianSpecialty } from '../types';
import { AuthService } from '../services/auth.service';
import { SYRIAN_CITIES, DEFAULT_TOW_TRUCK_TYPES } from '../constants';
import { COUNTRY_CODES } from '../constants/countries';
import ImageUpload from './ImageUpload';
import MediaUpload from './MediaUpload';
import Icon from './Icon';

interface TechnicianRegistrationProps {
    allTechnicians: Technician[];
    onRegisterTechnician: (technician: Technician) => void;
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType) => void;
    settings: Settings;
    technicianSpecialties: TechnicianSpecialty[];
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
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary-900/40 dark:to-primary-900/20 text-primary flex items-center justify-center shadow-md border border-primary/10">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
        </div>
    </div>
);

const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.5 5.5 0 00-5.447 3.75a.75.75 0 001.5.5A3.5 3.5 0 0110 14.5a3.5 3.5 0 013.447 1.75a.75.75 0 001.5-.5A5.5 5.5 0 0010 12z" clipRule="evenodd" /></svg>;
const ClipboardDocumentListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M5.75 3a.75.75 0 00-1.5 0v1.5H3a.75.75 0 000 1.5h1.25v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5H5.75V3z" /><path fillRule="evenodd" d="M8 3a2.5 2.5 0 00-2.5 2.5v10A2.5 2.5 0 008 18h4a2.5 2.5 0 002.5-2.5V5.5A2.5 2.5 0 0012 3H8zm-1.5 2.5a1 1 0 011-1h4a1 1 0 011 1v10a1 1 0 01-1 1H8a1 1 0 01-1-1V5.5z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M1 8a2 2 0 012-2h.5a2 2 0 011.983 1.738l.42 2.102a2 2 0 01-.16 1.906l-1.01 2.022a2 2 0 00.16 2.126l2.101.42A2 2 0 018 19.5V20a2 2 0 01-2 2H1a2 2 0 01-2-2V8zm12-2a2 2 0 012-2h4a2 2 0 012 2v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6zM4 10a1 1 0 011-1h2a1 1 0 110 2H5a1 1 0 01-1-1zm13 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.872.75.75 0 00.976-.584l.322-1.289a.75.75 0 00-.584-.976 2.5 2.5 0 01-.225-3.665l3-3z" /><path d="M8.603 14.25a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.872.75.75 0 00-.976.584l-.322 1.289a.75.75 0 00.584.976 2.5 2.5 0 01.225 3.665l-3 3z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>;

const TOTAL_STEPS = 5;

const TechnicianRegistration: React.FC<TechnicianRegistrationProps> = (props) => {
    const { allTechnicians, onRegisterTechnician, onBack, showToast, addNotificationForUser, settings, technicianSpecialties } = props;
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [formData, setFormData] = useState<Partial<Technician>>({
        id: '',
        name: '',
        specialty: technicianSpecialties[0]?.name || '',
        city: 'دمشق',
        workshopAddress: '',
        description: '',
        socials: { facebook: '', instagram: '', whatsapp: '' },
        location: undefined,
    });

    // Phone validation state
    const [countryCode, setCountryCode] = useState('+963');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<File[]>([]);
    const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Validate phone number based on country code
    const validatePhoneNumber = (code: string, number: string): boolean => {
        const country = COUNTRY_CODES.find(c => c.code === code);
        if (!country) return false;
        return country.pattern.test(number);
    };

    // Handle phone number change
    const handlePhoneChange = (value: string) => {
        // Only allow numbers
        const cleaned = value.replace(/\D/g, '');
        setPhoneNumber(cleaned);

        // Update full phone ID and WhatsApp number by default
        const fullPhone = countryCode + cleaned;
        const whatsappNumber = countryCode.replace('+', '') + cleaned; // Remove + for WhatsApp format
        setFormData(p => ({
            ...p,
            id: fullPhone,
            socials: {
                ...p.socials,
                whatsapp: whatsappNumber // Set WhatsApp with country code without +
            }
        }));

        // Validate
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

    // Handle country code change
    const handleCountryCodeChange = (code: string) => {
        setCountryCode(code);
        const fullPhone = code + phoneNumber;
        const whatsappNumber = code.replace('+', '') + phoneNumber; // Remove + for WhatsApp format
        setFormData(p => ({
            ...p,
            id: fullPhone,
            socials: {
                ...p.socials,
                whatsapp: whatsappNumber // Update WhatsApp with country code without +
            }
        }));
        setShowCountryDropdown(false);

        // Revalidate with new country code
        if (phoneNumber.length > 0) {
            if (!validatePhoneNumber(code, phoneNumber)) {
                const country = COUNTRY_CODES.find(c => c.code === code);
                setPhoneError(`الرقم غير صحيح لـ ${country?.name}`);
            } else {
                setPhoneError('');
            }
        }
    };

    const nextStep = () => setCurrentStep(prev => (prev < TOTAL_STEPS + 1 ? prev + 1 : prev));
    const prevStep = () => setCurrentStep(prev => (prev > 1 ? prev - 1 : prev));

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
            let profilePhotoBase64 = null;
            if (profilePhoto.length > 0) {
                profilePhotoBase64 = await fileToBase64(profilePhoto[0]);
            }

            const galleryBase64: GalleryItem[] = await Promise.all(galleryFiles.map(async (file) => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                type: (file.type.startsWith('image/') ? 'image' : 'video') as 'image' | 'video',
                url: await fileToBase64(file),
                caption: ''
            })));

            // Build technician object matching backend expectations
            // IMPORTANT: Map id to phone for backend
            const newTechnician: any = {
                phone: formData.id!,
                id: formData.id!, // Keep id for frontend consistency if needed locally before refresh
                name: formData.name!,
                password: password,
                specialty: formData.specialty!,
                city: formData.city!,
                workshopAddress: formData.workshopAddress,
                description: formData.description,
                socials: formData.socials,
                location: formData.location,
                profilePhoto: profilePhotoBase64 || undefined,
                gallery: galleryBase64.length > 0 ? galleryBase64 : undefined,
                isVerified: false,
                rating: 5,
                reviewCount: 0,
                completedJobs: 0,
                responseTime: '0',
                availability: true,
                joinDate: new Date().toISOString().split('T')[0],
            };

            // Send to backend first
            let registeredTechnician = newTechnician;
            try {
                const response = await AuthService.registerTechnician(newTechnician);
                if (response.data && response.data.user) {
                    registeredTechnician = response.data.user;
                }
            } catch (apiError) {
                console.error("API Registration failed", apiError);
                throw apiError; // Re-throw to be caught by the outer catch block
            }

            // Call the registration handler directly (updates local state)
            onRegisterTechnician(registeredTechnician);

            // Notify admin
            addNotificationForUser(settings.adminPhone, {
                title: 'طلب انضمام فني جديد',
                message: `سجل الفني ${formData.name} (${formData.id}) وينتظر المراجعة والتوثيق.`,
                link: { view: 'adminDashboard', params: { tab: 'technicians' } },
                type: 'NEW_TECHNICIAN_REQUEST'
            }, 'NEW_TECHNICIAN_REQUEST');

            showToast('تم إرسال طلبك بنجاح!', 'success');
            nextStep();
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'فشل في إرسال الطلب. حاول مرة أخرى.');
            showToast('فشل في التسجيل', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const validateStep = async () => {
        setIsLoading(true); // Start loading for potential async checks
        setError('');

        try {

            if (currentStep === 1) {
                // Validate name
                if (!formData.name || formData.name.trim().length < 3) {
                    setError('يرجى إدخال اسم كامل (3 أحرف على الأقل).');
                    setIsLoading(false);
                    return false;
                }

                // Validate phone
                if (!phoneNumber) {
                    setError('يرجى إدخال رقم الهاتف.');
                    setIsLoading(false);
                    return false;
                }

                if (!validatePhoneNumber(countryCode, phoneNumber)) {
                    setError('رقم الهاتف غير صحيح. تحقق من الرقم والرمز الدولي.');
                    setIsLoading(false);
                    return false;
                }

                // Check if phone exists (local)
                if (allTechnicians.some(t => t.id === formData.id)) {
                    setError('رقم الهاتف هذا مسجل بالفعل.');
                    setIsLoading(false);
                    return false;
                }

                // Server-side phone check
                try {
                    const response = await AuthService.checkPhone(formData.id!);
                    if (response.exists) {
                        setError('رقم الهاتف هذا مسجل بالفعل في النظام.');
                        setIsLoading(false);
                        return false;
                    }
                } catch (error) {
                    console.error('Phone check error:', error);
                    // Optional: fail open or closed? Let's warn but maybe allow proceding if it's just a network error? 
                    // Better safe:
                    // setError('فشل التحقق من رقم الهاتف. يرجى المحاولة مرة أخرى.');
                    // setIsLoading(false);
                    // return false; 
                }

                // Validate password
                if (!password || password.length < 6) {
                    setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.');
                    setIsLoading(false);
                    return false;
                }

                // Validate password confirmation
                if (password !== confirmPassword) {
                    setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين.');
                    setIsLoading(false);
                    return false;
                }
            }

            if (currentStep === 2) {
                if (!formData.specialty) {
                    setError('يرجى اختيار التخصص.');
                    setIsLoading(false);
                    return false;
                }
                if (!formData.city) {
                    setError('يرجى اختيار المدينة.');
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

    const renderStep = () => {
        const inputClasses = "block w-full px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 text-slate-900 dark:text-white placeholder:text-slate-400";
        const labelClasses = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";
        const fadeClass = "animate-slide-up";

        switch (currentStep) {
            case 1: // Account Info
                return (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon
                            icon={<UserCircleIcon />}
                            title="معلومات الحساب"
                            description="قم بإنشاء حسابك للبدء"
                        />

                        {/* Full Name */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    الاسم الكامل
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className={`${inputClasses} pr-11`}
                                    required
                                    placeholder="أدخل الاسم والشهرة"
                                />
                                <Icon name="User" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        {/* Phone Number with Country Code */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    رقم الهاتف
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="flex gap-2" dir="ltr">
                                {/* Country Code Selector */}
                                <div className="relative w-32">
                                    <button
                                        type="button"
                                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                        className="w-full px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2"
                                    >
                                        <span className="text-lg">{COUNTRY_CODES.find(c => c.code === countryCode)?.flag}</span>
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{countryCode}</span>
                                        <Icon name="ChevronDown" className="w-4 h-4 text-slate-400" />
                                    </button>

                                    {/* Dropdown */}
                                    {showCountryDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                                            {COUNTRY_CODES.map(country => (
                                                <button
                                                    key={country.code}
                                                    type="button"
                                                    onClick={() => handleCountryCodeChange(country.code)}
                                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-right"
                                                >
                                                    <span className="text-xl">{country.flag}</span>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{country.name}</div>
                                                        <div className="text-xs text-slate-500">{country.code}</div>
                                                    </div>
                                                    {countryCode === country.code && (
                                                        <Icon name="Check" className="w-4 h-4 text-primary" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Phone Number Input */}
                                <div className="flex-1 relative">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={e => handlePhoneChange(e.target.value)}
                                        className={`${inputClasses} pr-11 ${phoneError ? 'border-red-300 dark:border-red-700' : ''}`}
                                        dir="ltr"
                                        required
                                        placeholder="9xxxxxxxx"
                                    />
                                    <Icon name="Phone" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                </div>
                            </div>

                            {phoneError && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <Icon name="AlertCircle" className="w-4 h-4" />
                                    {phoneError}
                                </p>
                            )}

                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400" dir="rtl">
                                مثال: لسوريا اختر +963 ثم أدخل 9xxxxxxxx
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    كلمة المرور
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className={`${inputClasses} font-mono pr-12`}
                                    dir="ltr"
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <Icon name={showPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                يجب أن تحتوي على 6 أحرف على الأقل
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    تأكيد كلمة المرور
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`${inputClasses} font-mono pr-12 ${confirmPassword && password !== confirmPassword ? 'border-red-300 dark:border-red-700' : ''}`}
                                    dir="ltr"
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                >
                                    <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                </button>
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                    <Icon name="AlertCircle" className="w-4 h-4" />
                                    كلمتا المرور غير متطابقتين
                                </p>
                            )}
                        </div>
                    </div>
                );

            case 2: // Professional Details
                return (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon
                            icon={<ClipboardDocumentListIcon />}
                            title="التفاصيل المهنية"
                            description="أخبرنا عن تخصصك وموقع ورشتك"
                        />

                        {/* Specialty */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    التخصص
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.specialty}
                                    onChange={e => setFormData(p => ({ ...p, specialty: e.target.value }))}
                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                >
                                    {technicianSpecialties.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                                <Icon name="ChevronDown" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* City */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    المدينة
                                    <span className="text-red-500">*</span>
                                </span>
                            </label>
                            <div className="relative">
                                <select
                                    value={formData.city}
                                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                                    className={`${inputClasses} appearance-none cursor-pointer`}
                                >
                                    {SYRIAN_CITIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <Icon name="MapPin" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Workshop Address */}
                        <div>
                            <label className={labelClasses}>
                                عنوان الورشة <span className="text-slate-400 text-xs">(اختياري)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.workshopAddress || ''}
                                    onChange={e => setFormData(p => ({ ...p, workshopAddress: e.target.value }))}
                                    className={`${inputClasses} pr-11`}
                                    placeholder="مثال: المنطقة الصناعية - جانب مركز خدمة..."
                                />
                                <Icon name="Building2" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className={labelClasses}>
                                موقع الورشة على الخريطة <span className="text-slate-400 text-xs">(اختياري)</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className={`mt-1 w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-dashed rounded-xl transition-all ${formData.location
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                    : 'border-primary/30 dark:border-primary/20 text-primary bg-primary/5 hover:bg-primary/10'
                                    }`}
                            >
                                <Icon name={formData.location ? "CheckCircle2" : "MapPin"} className="w-5 h-5" />
                                <span className="font-semibold">
                                    {formData.location ? 'تم تحديد الموقع بنجاح!' : 'تحديد الموقع الحالي'}
                                </span>
                            </button>
                            {formData.location && (
                                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
                                    {Number(formData.location.latitude).toFixed(6)}, {Number(formData.location.longitude).toFixed(6)}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelClasses}>
                                نبذة تعريفية <span className="text-slate-400 text-xs">(اختياري)</span>
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                rows={4}
                                className={inputClasses}
                                placeholder="تحدث عن خبراتك، خدماتك، وما يميزك عن غيرك لجذب المزيد من الزبائن..."
                                maxLength={500}
                            ></textarea>
                            <div className="mt-1 text-xs text-slate-400 text-left" dir="ltr">
                                {formData.description?.length || 0} / 500
                            </div>
                        </div>
                    </div>
                );

            case 3: // Media
                return (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon
                            icon={<CameraIcon />}
                            title="الصورة الشخصية والمعرض"
                            description="أضف صوراً لتعزيز مصداقيتك"
                        />

                        {/* Profile Photo */}
                        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Icon name="User" className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        الصورة الشخصية <span className="text-slate-400 text-xs">(اختياري)</span>
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">صورة واضحة لوجهك أو شعار ورشتك</p>
                                </div>
                            </div>
                            <ImageUpload files={profilePhoto} setFiles={setProfilePhoto} maxFiles={1} />
                        </div>

                        {/* Gallery */}
                        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary-900/30 flex items-center justify-center">
                                    <Icon name="Image" className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        معرض الأعمال <span className="text-slate-400 text-xs">(اختياري)</span>
                                    </label>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">صور وفيديوهات لأعمالك السابقة</p>
                                </div>
                            </div>
                            <MediaUpload
                                files={galleryFiles}
                                setFiles={setGalleryFiles}
                                maxFiles={settings.limitSettings.maxImagesPerOrder}
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-semibold mb-1">نصيحة:</p>
                                    <p className="text-blue-600 dark:text-blue-400">الحسابات التي تحتوي على صور حقيقية تحصل على ثقة أكبر من العملاء وطلبات أكثر بنسبة 70%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4: // Social Links
                return (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon
                            icon={<LinkIcon />}
                            title="روابط التواصل الاجتماعي"
                            description="اربط حساباتك لزيادة الثقة والتواصل"
                        />

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-4 mb-4">
                            <div className="flex gap-3">
                                <Icon name="Lightbulb" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    جميع الحقول اختيارية، لكن إضافة معلومات التواصل تزيد من فرص حصولك على عملاء
                                </p>
                            </div>
                        </div>

                        {/* Facebook */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    <Icon name="Facebook" className="w-4 h-4" />
                                    فيسبوك
                                    <span className="text-slate-400 text-xs">(اختياري)</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    value={formData.socials?.facebook || ''}
                                    onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, facebook: e.target.value } }))}
                                    className={`${inputClasses} font-mono pr-11`}
                                    dir="ltr"
                                    placeholder="https://facebook.com/username"
                                />
                                <Icon name="Link" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                        </div>

                        {/* Instagram */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    <Icon name="Instagram" className="w-4 h-4" />
                                    انستغرام
                                    <span className="text-slate-400 text-xs">(اختياري)</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.socials?.instagram || ''}
                                    onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))}
                                    className={`${inputClasses} font-mono pl-8`}
                                    dir="ltr"
                                    placeholder="username"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">@</span>
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div>
                            <label className={labelClasses}>
                                <span className="flex items-center gap-2">
                                    <Icon name="MessageCircle" className="w-4 h-4" />
                                    واتساب
                                    <span className="text-slate-400 text-xs">(تم التعبئة تلقائياً)</span>
                                </span>
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.socials?.whatsapp || ''}
                                    onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, whatsapp: e.target.value } }))}
                                    className={`${inputClasses} font-mono bg-slate-50 dark:bg-slate-800/50 pr-11`}
                                    dir="ltr"
                                    placeholder="963951951951"
                                />
                                <Icon name="Phone" className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                تم استخدام رقمك مع الرمز الدولي تلقائياً (بدون علامة +). يمكنك التعديل إذا أردت
                            </p>
                        </div>
                    </div>
                );

            case 5: // Review & Submit
                return (
                    <div className={`space-y-6 ${fadeClass}`}>
                        <StepIcon
                            icon={<CheckIcon />}
                            title="المراجعة النهائية"
                            description="تحقق من بياناتك قبل الإرسال"
                        />

                        {/* Summary Card */}
                        <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            {/* Personal Info */}
                            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">المعلومات الشخصية</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">الاسم</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">رقم الهاتف</span>
                                        <span className="font-semibold font-mono text-slate-900 dark:text-white" dir="ltr">{formData.id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Info */}
                            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">المعلومات المهنية</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">التخصص</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formData.specialty}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">المدينة</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">{formData.city}</span>
                                    </div>
                                    {formData.workshopAddress && (
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">عنوان الورشة</span>
                                            <span className="font-medium text-slate-900 dark:text-white text-right">{formData.workshopAddress}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">الموقع</span>
                                        <span className={`font-semibold ${formData.location ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            {formData.location ? 'تم التحديد ✓' : 'غير محدد'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Media */}
                            <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">الوسائط</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">الصورة الشخصية</span>
                                        <span className={`font-semibold ${profilePhoto.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                            {profilePhoto.length > 0 ? 'تم الرفع ✓' : 'لم يتم الرفع'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-600 dark:text-slate-400">معرض الأعمال</span>
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {galleryFiles.length > 0 ? `${galleryFiles.length} ملف` : 'لا يوجد'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Social */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3">روابط التواصل</h4>
                                <div className="space-y-2.5">
                                    {[
                                        { key: 'facebook', label: 'فيسبوك', icon: 'Facebook' },
                                        { key: 'instagram', label: 'انستغرام', icon: 'Instagram' },
                                        { key: 'whatsapp', label: 'واتساب', icon: 'MessageCircle' }
                                    ].map(social => {
                                        const value = formData.socials?.[social.key as keyof typeof formData.socials];
                                        return (
                                            <div key={social.key} className="flex justify-between items-center">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                    <Icon name={social.icon as any} className="w-4 h-4" />
                                                    {social.label}
                                                </span>
                                                <span className={`font-medium ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                                    {value || 'غير متوفر'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Terms & Conditions */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={e => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    أوافق على{' '}
                                    <a href="#" className="text-primary font-semibold hover:underline">الشروط والأحكام</a>
                                    {' '}و{' '}
                                    <a href="#" className="text-primary font-semibold hover:underline">سياسة الخصوصية</a>
                                    {' '}الخاصة بمنصة راموسة
                                </span>
                            </label>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex gap-3">
                                <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p className="font-semibold mb-1">ماذا بعد التسجيل؟</p>
                                    <p className="text-blue-600 dark:text-blue-400">
                                        سيقوم فريق الإدارة بمراجعة بياناتك خلال 24-48 ساعة. ستتلقى إشعاراً عند تفعيل حسابك وستتمكن من استقبال طلبات الخدمة.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 6: // Success
                return (
                    <div className="text-center py-8 animate-modal-in">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Icon name="CheckCircle2" className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">تم استلام طلبك بنجاح!</h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                            شكراً لانضمامك إلى منصة راموسة. سيقوم فريق الإدارة بمراجعة بياناتك وتفعيل حسابك خلال 24-48 ساعة. ستصلك رسالة عند اكتمال العملية.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                            <button
                                onClick={onBack}
                                className="flex-1 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary/25 transition-all"
                            >
                                العودة للرئيسية
                            </button>
                            <button
                                className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                            >
                                تتبع الطلب
                            </button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto py-6 px-4">
            {/* Progress Bar */}
            {currentStep <= TOTAL_STEPS && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold bg-gradient-to-l from-primary to-primary-700 bg-clip-text text-transparent">
                            تسجيل فني جديد
                        </h2>
                        <div className="px-4 py-2 bg-gradient-to-l from-primary/10 to-primary/5 dark:from-primary-900/30 dark:to-primary-900/20 rounded-full border border-primary/20">
                            <span className="text-sm font-bold text-primary dark:text-primary-400">
                                {currentStep} / {TOTAL_STEPS}
                            </span>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="relative">
                        <div className="flex justify-between mb-2">
                            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(step => (
                                <div key={step} className="flex flex-col items-center flex-1">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step < currentStep
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : step === currentStep
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                        }`}>
                                        {step < currentStep ? <Icon name="Check" className="w-5 h-5" /> : step}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-5 right-0 left-0 h-1 bg-slate-200 dark:bg-slate-700 -z-10 mx-5">
                            <div
                                className="h-full bg-gradient-to-l from-primary to-primary-700 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(2,132,199,0.5)]"
                                style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Form Card */}
            <div className={`p-6 sm:p-10 bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 w-full transition-all duration-300 ${currentStep > TOTAL_STEPS ? 'max-w-2xl mx-auto' : ''
                }`}>
                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-50/50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 rounded-xl animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                {/* Step Content */}
                {renderStep()}

                {/* Navigation Buttons */}
                {currentStep <= TOTAL_STEPS && (
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                        {currentStep > 1 ? (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-semibold px-6 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                            >
                                <Icon name="ChevronRight" className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                <span>السابق</span>
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < TOTAL_STEPS && (
                            <button
                                onClick={() => validateStep()}
                                disabled={isLoading}
                                className="flex items-center gap-2 bg-gradient-to-l from-primary to-primary-700 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-primary/30 hover:scale-105 active:scale-95 transition-all group disabled:opacity-70 disabled:cursor-wait"
                            >
                                {isLoading ? (
                                    <Icon name="Loader" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>التالي</span>
                                        <Icon name="ChevronLeft" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </button>
                        )}

                        {currentStep === TOTAL_STEPS && (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !acceptedTerms}
                                className="flex items-center gap-2 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-bold px-8 py-3.5 rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed transition-all"
                            >
                                {isLoading ? (
                                    <>
                                        <Icon name="Loader" className="w-5 h-5 animate-spin" />
                                        <span>جاري الإرسال...</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Send" className="w-5 h-5" />
                                        <span>إرسال الطلب</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicianRegistration;