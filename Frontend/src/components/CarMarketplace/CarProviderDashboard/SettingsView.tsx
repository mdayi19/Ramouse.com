import React, { useState, useEffect, useMemo } from 'react';
import { Save, User, Building2, MapPin, Building, FileText, Loader, Camera, Image as ImageIcon, Globe, Mail, Clock, Plus, Trash2, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';
import { PhotoUploader } from '../PhotoUploader';

interface SettingsViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateProvider: (updatedData: Partial<CarProvider>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ provider, showToast, onUpdateProvider }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'media' | 'contact' | 'hours'>('general');
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Form States
    const [formData, setFormData] = useState({
        name: provider.name || '',
        business_name: provider.business_name || '',
        business_type: provider.business_type || 'dealership',
        description: provider.description || '',
        city: provider.city || '',
        address: provider.address || '',
        website: provider.website || '',
        public_email: provider.public_email || '',
        working_hours: provider.working_hours || '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setHasUnsavedChanges(true);
        // Clear validation error for this field
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
            // Validate file size (max 5MB)
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
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت', 'error');
                return;
            }
            setCover(file);
            setCoverPreview(URL.createObjectURL(file));
            setHasUnsavedChanges(true);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validate business name
        if (!formData.business_name.trim()) {
            errors.business_name = 'اسم المعرض مطلوب';
        }

        // Validate email format if provided
        if (formData.public_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.public_email)) {
            errors.public_email = 'البريد الإلكتروني غير صحيح';
        }

        // Validate website URL if provided
        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            errors.website = 'رابط الموقع يجب أن يبدأ بـ http:// أو https://';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validate form
        if (!validateForm()) {
            showToast('يرجى تصحيح الأخطاء في النموذج', 'error');
            return;
        }

        setSaving(true);
        try {
            const data = new FormData();

            // Append Text Data
            Object.entries(formData).forEach(([key, value]) => {
                data.append(key, value || '');
            });

            // Append Socials
            data.append('socials', JSON.stringify(socials));

            // Append Files
            if (logo) data.append('profile_photo', logo);
            if (cover) data.append('cover_photo', cover);

            // Append Gallery
            // Separate existing URLs from new Files
            const existingGallery = gallery.filter(item => typeof item === 'string');
            const newGalleryFiles = gallery.filter(item => item instanceof File);

            data.append('existing_gallery', JSON.stringify(existingGallery));

            newGalleryFiles.forEach((file) => {
                data.append('gallery[]', file);
            });

            const updated = await CarProviderService.updateProfile(data);
            onUpdateProvider(updated);
            setHasUnsavedChanges(false);
            showToast('تم حفظ التغييرات بنجاح', 'success');
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'فشل حفظ التغييرات';
            showToast(errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!hasUnsavedChanges || confirm('هل أنت متأكد من إلغاء التغييرات؟')) {
            // Reset form data
            setFormData({
                name: provider.name || '',
                business_name: provider.business_name || '',
                business_type: provider.business_type || 'dealership',
                description: provider.description || '',
                city: provider.city || '',
                address: provider.address || '',
                website: provider.website || '',
                public_email: provider.public_email || '',
                working_hours: provider.working_hours || '',
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

    const tabs = [
        { id: 'general', label: 'المعلومات العامة', icon: Building2 },
        { id: 'media', label: 'الوسائط', icon: ImageIcon },
        { id: 'contact', label: 'التواصل والموقع', icon: MapPin },
        { id: 'hours', label: 'ساعات العمل', icon: Clock },
    ];

    const tabContentVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-6 pb-20"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الملف الشخصي</h2>
                        {hasUnsavedChanges && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold rounded-full flex items-center gap-1"
                            >
                                <AlertCircle className="w-3 h-3" />
                                تغييرات غير محفوظة
                            </motion.span>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">قم بتحديث معلومات معرضك وصور العرض</p>
                </div>
                <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={handleReset}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium flex items-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">إلغاء التغييرات</span>
                        </motion.button>
                    )}
                    <button
                        onClick={() => handleSubmit()}
                        disabled={saving || !hasUnsavedChanges}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {saving ? <Loader className="w-5 h-5 animate-spin" /> : hasUnsavedChanges ? <Save className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 flex overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[120px] relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${activeTab === tab.id
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative flex items-center gap-2">
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <motion.div
                            key="general"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">المعلومات الأساسية</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم المعرض (التجاري) *</label>
                                <div className="relative">
                                    <Building className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="business_name"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        className={`w-full pr-10 pl-4 py-3 rounded-xl border ${validationErrors.business_name ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'} bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 transition-shadow`}
                                        placeholder="مثال: معرض النخبة للسيارات"
                                        required
                                    />
                                </div>
                                {validationErrors.business_name && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"
                                    >
                                        <AlertCircle className="w-3 h-3" />
                                        {validationErrors.business_name}
                                    </motion.p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم المدير المسؤول</label>
                                <div className="relative">
                                    <User className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="الاسم الشخصي"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">نوع النشاط</label>
                                <select
                                    name="business_type"
                                    value={formData.business_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                >
                                    <option value="dealership">معرض سيارات</option>
                                    <option value="individual">بائع فردي</option>
                                    <option value="rental_agency">مكتب تأجير</option>
                                </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">نبذة عن المعرض</label>
                                <div className="relative">
                                    <FileText className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="اكتب وصفاً مختصراً عن خدماتك، أنواع السيارات المتوفرة، وتاريخ المعرض..."
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {/* Logo & Cover */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Logo */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">شعار المعرض</h3>
                                    <div className="relative w-full aspect-square bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                                <span className="text-sm text-slate-500">اضغط لرفع الشعار</span>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleLogoUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {logoPreview && (
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                                <span className="text-white font-medium">تغيير الصورة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Photo */}
                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">صورة الغلاف</h3>
                                    <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden group hover:border-blue-500 transition-colors">
                                        {coverPreview ? (
                                            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                                <span className="text-sm text-slate-500">اضغط لرفع صورة الغلاف</span>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleCoverUpload} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            {/* Gallery */}
                            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">معرض الصور</h3>
                                <p className="text-sm text-slate-500 mb-4">أضف صوراً إضافية للمعرض، صالة العرض، أو فريق العمل لتظهر في ملفك الشخصي.</p>
                                <PhotoUploader
                                    photos={gallery}
                                    onPhotosChange={setGallery}
                                    maxPhotos={10}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
                        <motion.div
                            key="contact"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">الموقع الجغرافي</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">المدينة</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">العنوان التفصيلي</label>
                                <div className="relative">
                                    <MapPin className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 md:col-span-2 pt-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">بيانات التواصل الإلكتروني</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">البريد الإلكتروني (المعلن)</label>
                                <div className="relative">
                                    <Mail className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="public_email"
                                        value={formData.public_email}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">الموقع الإلكتروني</label>
                                <div className="relative">
                                    <Globe className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 md:col-span-2 pt-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">وسائل التواصل الاجتماعي</h3>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Facebook URL</label>
                                <input
                                    type="url"
                                    name="facebook"
                                    value={socials.facebook}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr transition-shadow"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Instagram URL</label>
                                <input
                                    type="url"
                                    name="instagram"
                                    value={socials.instagram}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr transition-shadow"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Twitter (X) URL</label>
                                <input
                                    type="url"
                                    name="twitter"
                                    value={socials.twitter}
                                    onChange={handleSocialChange}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr transition-shadow"
                                    placeholder="https://x.com/..."
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Hours Tab */}
                    {activeTab === 'hours' && (
                        <motion.div
                            key="hours"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">ساعات العمل</h3>
                                <p className="text-sm text-slate-500">حدد ساعات العمل الخاصة بالمعرض لتظهر للعملاء.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">أوقات الدوام</label>
                                <div className="relative">
                                    <Clock className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                    <textarea
                                        name="working_hours"
                                        value={formData.working_hours}
                                        onChange={handleChange}
                                        rows={5}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                        placeholder="مثال:&#10;السبت - الخميس: 9:00 ص - 10:00 م&#10;الجمعة: 4:00 م - 10:00 م"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div >
    );
};
