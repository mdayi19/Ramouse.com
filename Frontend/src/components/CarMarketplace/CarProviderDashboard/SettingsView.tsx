import React, { useState, useCallback, useEffect } from 'react';
import { Save, Building2, MapPin, Loader, Camera, Image as ImageIcon, Globe, Mail, Clock, RotateCcw, AlertCircle, Phone, Check, Eye, X, Printer, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';
import { PhotoUploader } from '../PhotoUploader';
import { getStorageUrl } from '../../../config/api';
import PrintableCarProviderProfile from '../PrintableCarProviderProfile';
import { Settings } from '../../../types';
import { SYRIAN_CITIES } from '../../../constants';

interface SettingsViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateProvider: (updatedData: Partial<CarProvider>) => void;
    settings: Settings;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ provider, showToast, onUpdateProvider, settings }) => {
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Print / PDF States
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadyForExport, setIsReadyForExport] = useState(false);
    const printableProfileRef = React.useRef<HTMLDivElement>(null);

    const handleOpenPreview = () => {
        setIsReadyForExport(false);
        setShowPreview(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = async () => {
        if (!printableProfileRef.current || !isReadyForExport) {
            showToast('الرجاء الانتظار حتى يكتمل تحميل المعاينة.', 'info');
            return;
        }
        setIsGenerating(true);
        showToast('جارٍ إنشاء ملف PDF...', 'info');

        try {
            // @ts-ignore
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default;

            if (!html2pdf) {
                throw new Error("html2pdf library not found");
            }

            const element = printableProfileRef.current;
            const opt = {
                margin: 0,
                filename: `profile-${provider.id || 'provider'}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();
            setIsGenerating(false);
        } catch (err: any) {
            console.error("PDF generation failed:", err);
            showToast('فشل إنشاء ملف PDF.', 'error');
            setIsGenerating(false);
        }
    };

    // Schedule Builder State
    const [useScheduleBuilder, setUseScheduleBuilder] = useState(true);
    const [defaultStart, setDefaultStart] = useState('09:00');
    const [defaultEnd, setDefaultEnd] = useState('22:00');
    const [exceptions, setExceptions] = useState<{ day: string, start: string, end: string, isClosed: boolean }[]>([]);

    const daysMap = {
        'Sat': 'السبت',
        'Sun': 'الأحد',
        'Mon': 'الاثنين',
        'Tue': 'الثلاثاء',
        'Wed': 'الأربعاء',
        'Thu': 'الخميس',
        'Fri': 'الجمعة'
    };

    const generateScheduleString = useCallback(() => {
        if (!useScheduleBuilder) return;

        const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const scheduleMap: Record<string, string> = {};

        days.forEach(day => {
            const exception = exceptions.find(e => e.day === day);
            if (exception) {
                if (exception.isClosed) {
                    scheduleMap[day] = 'مغلق';
                } else {
                    scheduleMap[day] = `${formatTime(exception.start)} - ${formatTime(exception.end)}`;
                }
            } else {
                scheduleMap[day] = `${formatTime(defaultStart)} - ${formatTime(defaultEnd)}`;
            }
        });

        // Grouping logic
        const groups: { days: string[], time: string }[] = [];
        let currentGroup: { days: string[], time: string } | null = null;

        days.forEach(day => {
            const time = scheduleMap[day];
            if (currentGroup && currentGroup.time === time) {
                currentGroup.days.push(daysMap[day as keyof typeof daysMap]);
            } else {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = { days: [daysMap[day as keyof typeof daysMap]], time };
            }
        });
        if (currentGroup) groups.push(currentGroup);

        const formattedString = groups.map(g => {
            const dayRange = g.days.length > 2
                ? `${g.days[0]} - ${g.days[g.days.length - 1]}`
                : g.days.join('، ');
            return `${dayRange}: ${g.time}`;
        }).join('\n');

        setFormData(prev => ({ ...prev, working_hours: formattedString }));
        setHasUnsavedChanges(true); // Mark as modified
    }, [useScheduleBuilder, defaultStart, defaultEnd, exceptions]);

    // Update string when builder state changes
    useEffect(() => {
        if (useScheduleBuilder) {
            generateScheduleString();
        }
    }, [useScheduleBuilder, defaultStart, defaultEnd, exceptions, generateScheduleString]);

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hour, minute] = time.split(':');
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'م' : 'ص';
        const displayH = h % 12 || 12;
        return `${displayH}:${minute} ${ampm}`;
    };

    const addException = () => {
        const usedDays = exceptions.map(e => e.day);
        const allDays = ['Fri', 'Thu', 'Wed', 'Tue', 'Mon', 'Sun', 'Sat']; // Fri first as common exception
        const nextDay = allDays.find(d => !usedDays.includes(d)) || 'Fri';

        setExceptions([...exceptions, { day: nextDay, start: defaultStart, end: defaultEnd, isClosed: true }]);
    };

    const removeException = (index: number) => {
        const newExceptions = [...exceptions];
        newExceptions.splice(index, 1);
        setExceptions(newExceptions);
    };

    const updateException = (index: number, field: string, value: any) => {
        const newExceptions = [...exceptions];
        newExceptions[index] = { ...newExceptions[index], [field]: value };
        setExceptions(newExceptions);
    };

    // Form States
    const [formData, setFormData] = useState({
        name: provider.name || '',
        business_type: provider.business_type || 'dealership',
        description: provider.description || '',
        city: provider.city || '',
        address: provider.address || '',
        website: provider.website || '',
        public_email: provider.public_email || '',
        working_hours: provider.working_hours || '',
        latitude: provider.latitude || '',
        longitude: provider.longitude || '',
    });

    const [socials, setSocials] = useState({
        facebook: provider.socials?.facebook || '',
        instagram: provider.socials?.instagram || '',
        whatsapp: provider.socials?.whatsapp || '',
        twitter: provider.socials?.twitter || '',
        tiktok: provider.socials?.tiktok || '',
    });

    // Media States
    const [logo, setLogo] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(provider.profile_photo || null);

    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(provider.cover_photo || null);

    const [gallery, setGallery] = useState<(File | string)[]>(provider.gallery || []);

    // Sync state with provider prop when it changes (e.g. after data fetch)
    React.useEffect(() => {
        setFormData({
            name: provider.name || '',
            business_type: provider.business_type || 'dealership',
            description: provider.description || '',
            city: provider.city || '',
            address: provider.address || '',
            website: provider.website || '',
            public_email: provider.public_email || '',
            working_hours: provider.working_hours || '',
            latitude: provider.latitude || '',
            longitude: provider.longitude || '',
        });
        setSocials({
            facebook: provider.socials?.facebook || '',
            instagram: provider.socials?.instagram || '',
            whatsapp: provider.socials?.whatsapp || '',
            twitter: provider.socials?.twitter || '',
            tiktok: provider.socials?.tiktok || '',
        });
        setLogoPreview(provider.profile_photo || null);
        setCoverPreview(provider.cover_photo || null);
        setGallery(provider.gallery || []);
    }, [provider]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setHasUnsavedChanges(true);
        if (validationErrors[e.target.name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[e.target.name];
                return newErrors;
            });
        }
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSocials({ ...socials, [e.target.name]: e.target.value });
        setHasUnsavedChanges(true);
    };


    const validateImage = (file: File): boolean => {
        if (!file.type.startsWith('image/')) {
            showToast('يجب تحميل ملف صورة فقط', 'error');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت', 'error');
            return false;
        }
        return true;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent, type: 'logo' | 'cover') => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (file && validateImage(file)) {
            if (type === 'logo') {
                setLogo(file);
                setLogoPreview(URL.createObjectURL(file));
            } else {
                setCover(file);
                setCoverPreview(URL.createObjectURL(file));
            }
            setHasUnsavedChanges(true);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (validateImage(file)) {
                setLogo(file);
                setLogoPreview(URL.createObjectURL(file));
                setHasUnsavedChanges(true);
            }
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (validateImage(file)) {
                setCover(file);
                setCoverPreview(URL.createObjectURL(file));
                setHasUnsavedChanges(true);
            }
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(prev => ({ ...prev, latitude: latitude.toString(), longitude: longitude.toString() }));
                    setHasUnsavedChanges(true);
                    showToast('تم تحديث الموقع بنجاح!', 'success');
                },
                (error) => {
                    console.error(error);
                    showToast('لم نتمكن من الحصول على موقعك. تأكد من منح الإذن.', 'error');
                }
            );
        } else {
            showToast('متصفحك لا يدعم تحديد المواقع.', 'error');
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name.trim()) {
            errors.name = 'اسم المعرض مطلوب';
        }

        if (formData.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.public_email)) {
            errors.public_email = 'البريد الإلكتروني غير صحيح';
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            errors.website = 'رابط الموقع يجب أن يبدأ بـ http:// أو https://';
        }

        setValidationErrors(errors);

        // Scroll to first error
        if (Object.keys(errors).length > 0) {
            const firstErrorField = Object.keys(errors)[0];
            const element = document.getElementsByName(firstErrorField)[0];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.focus();
            }
        }

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            showToast('يرجى تصحيح الأخطاء في النموذج', 'error');
            return;
        }

        setSaving(true);
        setValidationErrors({}); // Clear previous errors

        try {
            const data = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, (value ?? '').toString());
            });

            data.append('socials', JSON.stringify(socials));

            if (logo) data.append('profile_photo', logo);
            if (cover) data.append('cover_photo', cover);

            const existingGallery = gallery.filter(item => typeof item === 'string');
            const newGalleryFiles = gallery.filter(item => item instanceof File);

            existingGallery.forEach((item) => {
                data.append('existing_gallery[]', item as string);
            });

            newGalleryFiles.forEach((file) => {
                data.append('gallery[]', file);
            });

            const updated = await CarProviderService.updateProfile(data);
            onUpdateProvider(updated);

            // Update local state with fresh data from server
            setLogo(null);
            if (updated.profile_photo) setLogoPreview(updated.profile_photo);

            setCover(null);
            if (updated.cover_photo) setCoverPreview(updated.cover_photo);

            if (updated.gallery) setGallery(updated.gallery);

            setHasUnsavedChanges(false);
            showToast('تم حفظ التغييرات بنجاح', 'success');
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'فشل حفظ التغييرات';
            showToast(errorMsg, 'error');

            // Handle Server Validation Errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const serverErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, messages]: [string, any]) => {
                    serverErrors[key] = Array.isArray(messages) ? messages[0] : messages;
                });
                setValidationErrors(serverErrors);

                // Scroll to first error
                if (Object.keys(serverErrors).length > 0) {
                    const firstErrorField = Object.keys(serverErrors)[0];
                    const element = document.getElementsByName(firstErrorField)[0];
                    if (element) {
                        setTimeout(() => {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.focus();
                        }, 100);
                    }
                }
            }
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!hasUnsavedChanges || confirm('هل أنت متأكد من إلغاء التغييرات؟')) {
            setFormData({
                name: provider.name || '',
                business_type: provider.business_type || 'dealership',
                description: provider.description || '',
                city: provider.city || '',
                address: provider.address || '',
                website: provider.website || '',
                public_email: provider.public_email || '',
                working_hours: provider.working_hours || '',
                latitude: provider.latitude || '',
                longitude: provider.longitude || '',
            });

            setSocials({
                facebook: provider.socials?.facebook || '',
                instagram: provider.socials?.instagram || '',
                whatsapp: provider.socials?.whatsapp || '',
                twitter: provider.socials?.twitter || '',
                tiktok: provider.socials?.tiktok || '',
            });

            setLogo(null);
            setLogoPreview(provider.profile_photo || null);
            setCover(null);
            setCoverPreview(provider.cover_photo || null);
            setGallery(provider.gallery || []);
            setHasUnsavedChanges(false);
            setValidationErrors({});
            showToast('تم إلغاء التغييرات', 'info');
        }
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
    const labelClasses = "text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block";
    const cardClasses = "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 overflow-hidden";
    const sectionHeaderClasses = "text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full pb-20"
        >
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-4 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إعدادات الملف الشخصي</h2>
                        {hasUnsavedChanges && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1"
                            >
                                <AlertCircle className="w-3 h-3" />
                                غير محفوظ
                            </motion.span>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">قم بتحديث معلومات معرضك وصور العرض لزيادة ثقة العملاء.</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">إلغاء</span>
                        </button>
                    )}
                    <button
                        onClick={handleOpenPreview}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">طباعة / PDF</span>
                    </button>
                    <a
                        href={`/car-providers/${provider.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">عرض الملف العام</span>
                    </a>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving || !hasUnsavedChanges}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>

            <div className="space-y-8 px-4 md:px-8 mt-8">
                {/* 1. General Information */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><Building2 className="w-6 h-6 text-blue-500" /> المعلومات العامة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className={labelClasses}>اسم العرض التجاري (اسم المعرض) *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`${inputClasses} ${validationErrors.name ? 'border-red-500 ring-red-500' : ''}`}
                                placeholder="مثال: معرض النخبة للسيارات"
                            />
                            {validationErrors.name && <p className="text-xs text-red-500 mt-1">{validationErrors.name}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>نوع النشاط</label>
                            <select
                                name="business_type"
                                value={formData.business_type}
                                onChange={handleChange}
                                className={`${inputClasses} ${validationErrors.business_type ? 'border-red-500 ring-red-500' : ''}`}
                            >
                                <option value="dealership">معرض سيارات</option>
                                <option value="individual">بائع فردي</option>
                                <option value="rental_agency">مكتب تأجير</option>
                            </select>
                            {validationErrors.business_type && <p className="text-xs text-red-500 mt-1">{validationErrors.business_type}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>نبذة تعريفية</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className={`${inputClasses} ${validationErrors.description ? 'border-red-500 ring-red-500' : ''}`}
                                placeholder="اكتب وصفاً مختصراً عن خدماتك، أنواع السيارات المتوفرة..."
                            />
                            {validationErrors.description && <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Media & Gallery */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><ImageIcon className="w-6 h-6 text-purple-500" /> الوسائط والصور</h3>
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className={labelClasses}>شعار المعرض</label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'logo')}
                                    className="relative w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-full border-4 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer shadow-lg"
                                >
                                    {logoPreview ? (
                                        <img src={getStorageUrl(logoPreview)} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                            <span className="text-xs text-slate-500 font-medium">رفع الشعار</span>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-50" />

                                    {/* Overlay for Edit */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                        <Camera className="w-8 h-8 text-white drop-shadow-md" />
                                    </div>

                                    {/* Edit Icon Badge */}
                                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-md z-10 pointer-events-none group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className={labelClasses}>صورة الغلاف</label>
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, 'cover')}
                                    className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    {coverPreview ? (
                                        <img src={getStorageUrl(coverPreview)} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4 space-y-2">
                                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mx-auto group-hover:scale-110 transition-transform">
                                                <ImageIcon className="w-6 h-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">اسحب صورة الغلاف هنا</p>
                                                <p className="text-xs text-slate-500 mt-1">أو اضغط للاختيار من الجهاز</p>
                                            </div>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleCoverUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-50" />

                                    {/* Overlay for Edit */}
                                    {coverPreview && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-medium pointer-events-none">
                                            <span className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                                                <Camera className="w-4 h-4" />
                                                تغيير الصورة
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                            <label className={labelClasses}>معرض الصور الإضافية</label>
                            <p className="text-sm text-slate-500 mb-4">أضف صوراً إضافية للمعرض أو السيارات المميزة.</p>
                            <PhotoUploader
                                photos={gallery}
                                onPhotosChange={(newPhotos) => {
                                    setGallery(newPhotos);
                                    setHasUnsavedChanges(true);
                                }}
                                maxPhotos={10}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Location & Contact */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><MapPin className="w-6 h-6 text-red-500" /> الموقع والتواصل</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>المدينة</label>
                            <select
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={`${inputClasses} ${validationErrors.city ? 'border-red-500 ring-red-500' : ''}`}
                            >
                                <option value="">اختر المدينة...</option>
                                {SYRIAN_CITIES.map((city) => (
                                    <option key={city} value={city}>
                                        {city}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.city && <p className="text-xs text-red-500 mt-1">{validationErrors.city}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>العنوان</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className={`${inputClasses} ${validationErrors.address ? 'border-red-500 ring-red-500' : ''}`}
                            />
                            {validationErrors.address && <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClasses}>موقع المعرض على الخريطة</label>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                                <div className="absolute inset-0 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=24.7136,46.6753&zoom=5&size=600x300&maptype=roadmap&key=YOUR_API_KEY')] bg-cover bg-center opacity-10 grayscale group-hover:grayscale-0 transition-all duration-700"></div>
                                <div className="relative p-6 flex flex-col items-center justify-center min-h-[160px] text-center gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg">
                                        <MapPin className={`w-8 h-8 ${formData.latitude ? 'text-green-500' : 'text-slate-400'}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white">موقع المعرض</h4>
                                        <p className="text-sm text-slate-500">
                                            {formData.latitude && formData.longitude
                                                ? 'تم تحديد الإحداثيات بنجاح'
                                                : 'لم يتم تحديد الموقع بعد'
                                            }
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-bold shadow-lg shadow-blue-600/20"
                                        >
                                            <MapPin className="w-4 h-4" />
                                            {formData.latitude ? 'تحديث موقعي الحالي' : 'تحديد موقعي الحالي'}
                                        </button>
                                        {formData.latitude && formData.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
                                            >
                                                <Globe className="w-4 h-4" />
                                                عرض على Google Maps
                                            </a>
                                        )}
                                    </div>
                                    {formData.latitude && (
                                        <p className="text-[10px] text-slate-400 font-mono mt-2">
                                            {Number(formData.latitude).toFixed(6)}, {Number(formData.longitude).toFixed(6)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>البريد الإلكتروني (المعلن)</label>
                            <div className="relative">
                                <Mail className="absolute top-3.5 right-4 w-5 h-5 text-slate-400" />
                                <input
                                    type="email"
                                    name="public_email"
                                    value={formData.public_email}
                                    onChange={handleChange}
                                    className={`${inputClasses} pr-12 ${validationErrors.public_email ? 'border-red-500 ring-red-500' : ''}`}
                                    placeholder="email@example.com"
                                />
                            </div>
                            {validationErrors.public_email && <p className="text-xs text-red-500 mt-1">{validationErrors.public_email}</p>}
                        </div>
                        <div>
                            <label className={labelClasses}>الموقع الإلكتروني</label>
                            <div className="relative">
                                <Globe className="absolute top-3.5 right-4 w-5 h-5 text-slate-400" />
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className={`${inputClasses} pr-12 ${validationErrors.website ? 'border-red-500 ring-red-500' : ''}`}
                                    placeholder="https://example.com"
                                />
                            </div>
                            {validationErrors.website && <p className="text-xs text-red-500 mt-1">{validationErrors.website}</p>}
                        </div>
                    </div>
                </div>

                {/* 4. Social Media */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><Globe className="w-6 h-6 text-indigo-500" /> التواصل الاجتماعي</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClasses}>WhatsApp Number</label>
                            <div className="relative">
                                <Phone className="absolute top-3.5 right-4 w-5 h-5 text-green-500" />
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={socials.whatsapp}
                                    onChange={handleSocialChange}
                                    className={`${inputClasses} pr-12`}
                                    placeholder="9639..."
                                    dir="ltr"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1 mr-1">الرقم مع الرمز الدولي (بدون +)</p>
                        </div>
                        <div>
                            <label className={labelClasses}>Facebook URL</label>
                            <input
                                type="url"
                                name="facebook"
                                value={socials.facebook}
                                onChange={handleSocialChange}
                                className={inputClasses}
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Instagram URL</label>
                            <input
                                type="url"
                                name="instagram"
                                value={socials.instagram}
                                onChange={handleSocialChange}
                                className={inputClasses}
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Twitter (X) URL</label>
                            <input
                                type="url"
                                name="twitter"
                                value={socials.twitter}
                                onChange={handleSocialChange}
                                className={inputClasses}
                                placeholder="https://x.com/..."
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>TikTok URL</label>
                            <input
                                type="url"
                                name="tiktok"
                                value={socials.tiktok}
                                onChange={handleSocialChange}
                                className={inputClasses}
                                placeholder="https://tiktok.com/@..."
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Working Hours */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><Clock className="w-6 h-6 text-orange-500" /> ساعات العمل</h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between mb-4">
                            <label className={labelClasses}>أوقات الدوام</label>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${useScheduleBuilder ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {useScheduleBuilder ? 'منشئ الجدول الذكي' : 'نص يدوي'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setUseScheduleBuilder(!useScheduleBuilder)}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${useScheduleBuilder ? 'bg-blue-600' : 'bg-slate-300'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useScheduleBuilder ? 'translate-x-4' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {useScheduleBuilder ? (
                            <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                {/* Default Hours */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">بداية الدوام (الافتراضي)</label>
                                        <input
                                            type="time"
                                            value={defaultStart}
                                            onChange={(e) => setDefaultStart(e.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 mb-1 block">نهاية الدوام (الافتراضي)</label>
                                        <input
                                            type="time"
                                            value={defaultEnd}
                                            onChange={(e) => setDefaultEnd(e.target.value)}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                {/* Exceptions */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                        <span>الاستثناءات / أيام العطل</span>
                                        <button type="button" onClick={addException} className="text-blue-600 hover:text-blue-700 text-xs">+ إضافة استثناء</button>
                                    </label>

                                    {exceptions.map((ex, idx) => (
                                        <div key={idx} className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <select
                                                value={ex.day}
                                                onChange={(e) => updateException(idx, 'day', e.target.value)}
                                                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none w-20"
                                            >
                                                {Object.entries(daysMap).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>

                                            <label className="flex items-center gap-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={ex.isClosed}
                                                    onChange={(e) => updateException(idx, 'isClosed', e.target.checked)}
                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-slate-500">مغلق</span>
                                            </label>

                                            {!ex.isClosed && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={ex.start}
                                                        onChange={(e) => updateException(idx, 'start', e.target.value)}
                                                        className="w-24 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-900 rounded border-none"
                                                    />
                                                    <span className="text-slate-400">-</span>
                                                    <input
                                                        type="time"
                                                        value={ex.end}
                                                        onChange={(e) => updateException(idx, 'end', e.target.value)}
                                                        className="w-24 px-2 py-1 text-sm bg-slate-100 dark:bg-slate-900 rounded border-none"
                                                    />
                                                </>
                                            )}

                                            <button onClick={() => removeException(idx)} className="mr-auto text-red-500 hover:text-red-600">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {exceptions.length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">لا توجد استثناءات، سيتم تطبيق التوقيت الافتراضي على جميع الأيام.</p>}
                                </div>

                                {/* Preview */}
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">معاينة النص الناتج:</label>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                                        {formData.working_hours || '...'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <textarea
                                name="working_hours"
                                value={formData.working_hours}
                                onChange={handleChange}
                                rows={5}
                                className={`${inputClasses} ${validationErrors.working_hours ? 'border-red-500 ring-red-500' : ''}`}
                                placeholder="مثال:&#10;السبت - الخميس: 9:00 ص - 10:00 م&#10;الجمعة: 4:00 م - 10:00 م"
                            />
                        )}
                        {validationErrors.working_hours && <p className="text-xs text-red-500 mt-1">{validationErrors.working_hours}</p>}
                    </div>
                </div>
            </div>
            {
                showPreview && (
                    <div className="fixed inset-0 bg-black/70 flex flex-col items-center z-[100] p-4 print:p-0 print:bg-white animate-fade-in">
                        <style>{`
                        @media print {
                            @page {
                                size: A4 portrait;
                                margin: 0;
                            }
                            html, body {
                                height: 297mm !important;
                                width: 210mm !important;
                                overflow: hidden !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            body * {
                                visibility: hidden;
                            }
                            .printable-area, .printable-area * {
                                visibility: visible;
                            }
                            .printable-area {
                                position: fixed;
                                top: 0;
                                left: 50% !important;
                                transform: translateX(-50%) scale(0.95) !important;
                                transform-origin: top center !important;
                                width: 210mm !important;
                                height: 297mm !important;
                                margin: 0;
                                padding: 0;
                                overflow: hidden !important;
                                background: white;
                                z-index: 99999;
                                page-break-after: avoid !important;
                                page-break-before: avoid !important;
                            }
                            .printable-area > div {
                                transform: none !important;
                                width: 100% !important;
                            }
                            .print-hidden {
                                display: none !important;
                            }
                        }
                    `}</style>
                        <div className="w-full max-w-[210mm] bg-white dark:bg-slate-800 p-3 rounded-t-lg shadow-lg flex justify-between items-center print-hidden">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200">معاينة الملف الشخصي</h3>
                            <div className="flex gap-2">
                                <button onClick={handleDownload} disabled={isGenerating || !isReadyForExport} className="flex items-center gap-2 bg-blue-600 text-white font-semibold text-xs sm:text-sm px-3 py-2 rounded-md disabled:bg-slate-400">
                                    {isGenerating ? <><Loader className="w-4 h-4 animate-spin" /> جارٍ التحميل...</> : <><Download className="w-4 h-4" /> تحميل PDF</>}
                                </button>
                                <button onClick={handlePrint} disabled={!isReadyForExport} className="flex items-center gap-2 bg-slate-600 text-white font-semibold text-xs sm:text-sm px-3 py-2 rounded-md disabled:bg-slate-400">
                                    <Printer className="w-4 h-4" /> طباعة
                                </button>
                                <button onClick={() => setShowPreview(false)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white p-1">&times;</button>
                            </div>
                        </div>

                        <div className="printable-area w-full max-w-[210mm] h-[calc(100vh-80px)] print:h-auto overflow-y-auto bg-white shadow-lg pb-10">
                            {/* The content is scaled slightly on mobile screens to fit width if needed */}
                            <div className="md:scale-100 scale-[0.8] origin-top-left w-[125%] md:w-full">
                                <PrintableCarProviderProfile
                                    ref={printableProfileRef}
                                    provider={{ ...provider, ...formData, profile_photo: logoPreview || undefined, cover_photo: coverPreview || undefined, gallery: gallery as string[] }}
                                    settings={settings}
                                    onReady={() => setIsReadyForExport(true)}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </motion.div >
    );
};
