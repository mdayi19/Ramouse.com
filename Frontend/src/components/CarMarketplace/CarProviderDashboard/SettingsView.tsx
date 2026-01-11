import React, { useState } from 'react';
import { Save, Building2, MapPin, Loader, Camera, Image as ImageIcon, Globe, Mail, Clock, RotateCcw, AlertCircle, Phone, Check, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';
import { PhotoUploader } from '../PhotoUploader';
import { getStorageUrl } from '../../../config/api';

interface SettingsViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateProvider: (updatedData: Partial<CarProvider>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ provider, showToast, onUpdateProvider }) => {
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
                return;
            }
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
            setHasUnsavedChanges(true);
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
                return;
            }
            setCover(file);
            setCoverPreview(URL.createObjectURL(file));
            setHasUnsavedChanges(true);
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
            className="max-w-4xl mx-auto space-y-8 pb-20"
        >
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-50 dark:bg-slate-900/95 backdrop-blur-sm z-10 py-4 border-b border-slate-200 dark:border-slate-800">
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
                    <a
                        href={`/car-provider/${provider.id}`} // Assuming route structure, verify if slug exists or use ID
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

            <div className="space-y-8">
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
                                <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer">
                                    {logoPreview ? (
                                        <img src={getStorageUrl(logoPreview)} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                            <span className="text-xs text-slate-500">رفع الشعار</span>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-medium">تغيير</div>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                                <label className={labelClasses}>صورة الغلاف</label>
                                <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors cursor-pointer">
                                    {coverPreview ? (
                                        <img src={getStorageUrl(coverPreview)} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                            <span className="text-sm text-slate-500">اضغط لرفع صورة الغلاف</span>
                                        </div>
                                    )}
                                    <input type="file" onChange={handleCoverUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-sm font-medium">تغيير</div>
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
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className={`${inputClasses} ${validationErrors.city ? 'border-red-500 ring-red-500' : ''}`}
                            />
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
                    </div>
                </div>

                {/* 5. Working Hours */}
                <div className={cardClasses}>
                    <h3 className={sectionHeaderClasses}><Clock className="w-6 h-6 text-orange-500" /> ساعات العمل</h3>
                    <div className="space-y-2">
                        <label className={labelClasses}>أوقات الدوام</label>
                        <textarea
                            name="working_hours"
                            value={formData.working_hours}
                            onChange={handleChange}
                            rows={5}
                            className={`${inputClasses} ${validationErrors.working_hours ? 'border-red-500 ring-red-500' : ''}`}
                            placeholder="مثال:&#10;السبت - الخميس: 9:00 ص - 10:00 م&#10;الجمعة: 4:00 م - 10:00 م"
                        />
                        {validationErrors.working_hours && <p className="text-xs text-red-500 mt-1">{validationErrors.working_hours}</p>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
