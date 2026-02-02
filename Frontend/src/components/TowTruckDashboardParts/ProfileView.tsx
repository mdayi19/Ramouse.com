import React, { useState, useEffect, useRef } from 'react';
import { TowTruck, Settings, GalleryItem } from '../../types';
import MediaUpload from '../MediaUpload';
import Icon from '../Icon';
import Modal from '../Modal';
import { SYRIAN_CITIES, DEFAULT_TOW_TRUCK_TYPES } from '../../constants';
import PrintableTowTruckProfile from '../PrintableTowTruckProfile';
import ImageUpload from '../ImageUpload';
import { getImageUrl } from '../../utils/helpers';
import MediaViewer from '../MediaViewer';
import { AuthService } from '../../services/auth.service';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useSimplePrint } from '../../hooks/usePrint';

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

interface ProfileViewProps {
    towTruck: TowTruck;
    updateTowTruckData: (truckId: string, updatedData: Partial<TowTruck>, newPassword?: string) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
    onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ towTruck, updateTowTruckData, showToast, settings, onLogout }) => {
    const [formData, setFormData] = useState<Partial<TowTruck>>({});
    const [profilePhotoFile, setProfilePhotoFile] = useState<File[]>([]);
    const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [viewingMedia, setViewingMedia] = useState<{ type: 'image' | 'video'; data: string } | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadyForExport, setIsReadyForExport] = useState(false);
    const printableProfileRef = useRef<HTMLDivElement>(null);

    const handleOpenPreview = () => { setIsReadyForExport(false); setShowPreview(true); };
    // Use simple print hook (works on all devices)
    const handlePrint = useSimplePrint();

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

            const opt = {
                margin: 0,
                filename: `profile-${towTruck.uniqueId}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(printableProfileRef.current!).save();
            setIsGenerating(false);
        } catch (err: any) {
            console.error("PDF generation failed:", err);
            showToast('فشل إنشاء ملف PDF.', 'error');
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                const data = await AuthService.getProfile();
                setFormData({
                    name: data.name,
                    vehicleType: data.vehicle_type || data.vehicleType,
                    city: data.city,
                    serviceArea: data.service_area || data.serviceArea,
                    location: data.location,
                    description: data.description,
                    profilePhoto: data.profile_photo || data.profilePhoto,
                    socials: data.socials || { facebook: '', instagram: '', whatsapp: '' },
                    gallery: data.gallery || [],
                });
            } catch (error) {
                console.error("Error loading profile:", error);
                setFormData({
                    name: towTruck.name, vehicleType: towTruck.vehicleType, city: towTruck.city, serviceArea: towTruck.serviceArea,
                    location: towTruck.location, description: towTruck.description, profilePhoto: towTruck.profilePhoto,
                    socials: towTruck.socials || { facebook: '', instagram: '', whatsapp: '' },
                    gallery: towTruck.gallery || [],
                });
            }
        };

        loadProfileData();
        setProfilePhotoFile([]);
        setNewGalleryFiles([]);
    }, []);

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setFormData(p => ({ ...p, location: { latitude, longitude } }));
                    showToast('تم تحديث الموقع بنجاح!', 'success');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showToast('لم نتمكن من الحصول على موقعك. تأكد من منح الإذن.', 'error');
                }
            );
        } else {
            showToast('متصفحك لا يدعم تحديد المواقع.', 'error');
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
            setFormData(prev => ({ ...prev, gallery: (prev.gallery || []).filter((_, i) => i !== index) }));
        }
    };

    const handleViewMedia = (item: GalleryItem) => {
        const src = item.data ? getImageUrl(item.data) : (item.path ? getImageUrl(item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '');
        setViewingMedia({ type: item.type, data: src });
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name || formData.name.trim().length < 3) {
            errors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
        }

        if (!formData.vehicleType) {
            errors.vehicleType = 'يرجى اختيار نوع المركبة';
        }

        if (!formData.city) {
            errors.city = 'يرجى اختيار المدينة';
        }

        if (formData.socials?.whatsapp && !/^9639\d{8}$/.test(formData.socials.whatsapp)) {
            errors.whatsapp = 'رقم الواتساب يجب أن يكون بالصيغة: 9639XXXXXXXX';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast('يرجى تصحيح الأخطاء في النموذج', 'error');
            return;
        }

        setIsSaving(true);
        try {
            let finalData: Partial<TowTruck> = { ...formData };

            if (profilePhotoFile.length > 0) {
                finalData.profilePhoto = await fileToBase64(profilePhotoFile[0]);
            }

            const newGalleryItems: GalleryItem[] = await Promise.all(
                newGalleryFiles.map(async file => ({
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    data: await fileToBase64(file),
                    uploaded_at: new Date().toISOString() // Add client-side timestamp for immediate sort
                }))
            );
            finalData.gallery = [...(formData.gallery || []), ...newGalleryItems];

            const cleanSocials: TowTruck['socials'] = {};
            if (finalData.socials?.facebook?.trim()) cleanSocials.facebook = finalData.socials.facebook.trim();
            if (finalData.socials?.instagram?.trim()) cleanSocials.instagram = finalData.socials.instagram.trim();
            if (finalData.socials?.whatsapp?.trim()) cleanSocials.whatsapp = finalData.socials.whatsapp.trim();
            finalData.socials = cleanSocials;

            await updateTowTruckData(towTruck.id, finalData);

            setProfilePhotoFile([]);
            setNewGalleryFiles([]);
            setValidationErrors({});
            showToast('تم حفظ التغييرات بنجاح!', 'success');

            // Reload profile data to get backend-processed paths if possible
            // But for now we rely on the local state update which includes the base64 data

        } catch (error: any) {
            console.error("Failed to save profile:", error);
            const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء حفظ التغييرات';
            showToast(errorMessage, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200";
    const errorClasses = "text-red-600 dark:text-red-400 text-xs mt-1.5 flex items-center gap-1";
    const labelClasses = "block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300";

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent mb-2">
                        ملفي الشخصي
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">قم بتحديث معلوماتك وصورك</p>
                </div>
                <Button
                    onClick={handleOpenPreview}
                    disabled={isGenerating}
                    variant="outline"
                    className="h-auto py-3 px-6 text-base shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                    <Icon name="Printer" className="w-5 h-5 ml-2" />
                    طباعة/تحميل الملف
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Information Section */}
                <Card className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Icon name="User" className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">المعلومات العامة</h4>
                    </div>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="transform transition-all duration-200 hover:scale-[1.02]">
                                <Input
                                    label={<span>الاسم الكامل <span className="text-red-500">*</span></span>}
                                    value={formData.name || ''}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    error={validationErrors.name}
                                    required
                                    className="py-3"
                                />
                            </div>
                            <div className="transform transition-all duration-200 hover:scale-[1.02]">
                                <label className={labelClasses}>
                                    نوع المركبة <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.vehicleType}
                                    onChange={e => setFormData(p => ({ ...p, vehicleType: e.target.value }))}
                                    className={`${inputClasses} ${validationErrors.vehicleType ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                                    required
                                >
                                    {DEFAULT_TOW_TRUCK_TYPES.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                                {validationErrors.vehicleType && (
                                    <p className={errorClasses}>
                                        <Icon name="AlertCircle" className="w-3 h-3" />
                                        {validationErrors.vehicleType}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="transform transition-all duration-200 hover:scale-[1.02]">
                                <label className={labelClasses}>
                                    المدينة <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.city}
                                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                                    className={`${inputClasses} ${validationErrors.city ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900' : ''}`}
                                    required
                                >
                                    {SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {validationErrors.city && (
                                    <p className={errorClasses}>
                                        <Icon name="AlertCircle" className="w-3 h-3" />
                                        {validationErrors.city}
                                    </p>
                                )}
                            </div>
                            <div className="transform transition-all duration-200 hover:scale-[1.02]">
                                <Input
                                    label="منطقة الخدمة"
                                    value={formData.serviceArea || ''}
                                    onChange={e => setFormData(p => ({ ...p, serviceArea: e.target.value }))}
                                    placeholder="مثال: دمشق والريف"
                                    className="py-3"
                                />
                            </div>
                        </div>
                        <div className="transform transition-all duration-200 hover:scale-[1.02]">
                            <label className={labelClasses}>
                                الموقع الحالي (اختياري)
                                {formData.location && (
                                    <Badge variant="success" className="mr-2">✓ محدد</Badge>
                                )}
                            </label>
                            <Button
                                type="button"
                                onClick={handleGetLocation}
                                variant="outline"
                                className="w-full py-6 border-dashed border-2 hover:border-primary text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            >
                                <Icon name="MapPin" className="w-5 h-5 ml-2" />
                                تحديث/تحديد الموقع الحالي
                            </Button>
                            {formData.location && (
                                <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon name="Navigation" className="w-4 h-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">الموقع المسجل:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-green-600/70 dark:text-green-400/70">خط العرض:</span>
                                            <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-green-700 dark:text-green-300">
                                                {Number(formData.location.latitude).toFixed(6)}
                                            </code>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-green-600/70 dark:text-green-400/70">خط الطول:</span>
                                            <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-green-700 dark:text-green-300">
                                                {Number(formData.location.longitude).toFixed(6)}
                                            </code>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${formData.location.latitude},${formData.location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                                    >
                                        <Icon name="ExternalLink" className="w-3 h-3" />
                                        عرض على خرائط جوجل
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="transform transition-all duration-200 hover:scale-[1.02]">
                            <label className={labelClasses}>وصف</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                rows={4}
                                className={inputClasses}
                                placeholder="أدخل وصفاً تفصيلياً عن خدماتك..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Social Media Section */}
                <Card className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Icon name="Link" className="w-6 h-6 text-blue-500" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">روابط التواصل الاجتماعي</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="transform transition-all duration-200 hover:scale-[1.02]">
                            <Input
                                label={<span><Icon name="MessageCircle" className="w-4 h-4 inline mr-1 text-green-500" /> واتساب (الرقم مع الرمز الدولي)</span>}
                                type="tel"
                                value={formData.socials?.whatsapp || ''}
                                onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, whatsapp: e.target.value } }))}
                                className="text-left py-3"
                                dir="ltr"
                                placeholder="9639XXXXXXXX"
                                error={validationErrors.whatsapp}
                            />
                        </div>
                        <div className="transform transition-all duration-200 hover:scale-[1.02]">
                            <Input
                                label={<span><Icon name="Facebook" className="w-4 h-4 inline mr-1 text-blue-600" /> فيسبوك (رابط الصفحة)</span>}
                                type="url"
                                value={formData.socials?.facebook || ''}
                                onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, facebook: e.target.value } }))}
                                className="text-left py-3"
                                dir="ltr"
                                placeholder="https://facebook.com/username"
                            />
                        </div>
                        <div className="transform transition-all duration-200 hover:scale-[1.02]">
                            <Input
                                label={<span><Icon name="Instagram" className="w-4 h-4 inline mr-1 text-pink-500" /> انستغرام (اسم المستخدم)</span>}
                                type="text"
                                value={formData.socials?.instagram || ''}
                                onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))}
                                className="text-left py-3"
                                dir="ltr"
                                placeholder="username"
                            />
                        </div>
                    </div>
                </Card>

                {/* Media Section */}
                <Card className="p-8">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Icon name="Image" className="w-6 h-6 text-purple-500" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">الصور والمعرض</h4>
                    </div>
                    <div className="space-y-8">
                        {/* Profile Photo */}
                        <div>
                            <label className={labelClasses}>
                                <Icon name="User" className="w-4 h-4 inline mr-1" />
                                الصورة الشخصية
                                {formData.profilePhoto && (
                                    <Badge variant="success" className="mr-2">✓ موجودة</Badge>
                                )}
                            </label>
                            {formData.profilePhoto && !profilePhotoFile.length && (
                                <div className="mb-4 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative group">
                                            <img
                                                src={getImageUrl(formData.profilePhoto ? (formData.profilePhoto.startsWith('storage') || formData.profilePhoto.startsWith('/storage') || formData.profilePhoto.startsWith('http') || formData.profilePhoto.startsWith('data') ? formData.profilePhoto : `storage/${formData.profilePhoto}`) : '')}
                                                alt="Profile"
                                                className="w-40 h-40 rounded-full object-cover border-4 border-primary/30 shadow-xl ring-4 ring-primary/10 transition-all duration-200 group-hover:scale-[1.05]"
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => handleViewMedia({ type: 'image', data: formData.profilePhoto! })}
                                                variant="ghost"
                                                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 rounded-full w-full h-full p-0"
                                            >
                                                <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Icon name="Eye" className="w-5 h-5 text-primary" />
                                                </div>
                                            </Button>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (window.confirm('هل أنت متأكد من حذف الصورة الشخصية؟')) {
                                                    setFormData(p => ({ ...p, profilePhoto: undefined }));
                                                    showToast('تم حذف الصورة الشخصية. احفظ التغييرات لتأكيد الحذف.', 'info');
                                                }
                                            }}
                                            variant="danger"
                                            className="bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border-none"
                                        >
                                            <Icon name="Trash2" className="w-4 h-4 ml-2" />
                                            حذف الصورة الشخصية
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <ImageUpload files={profilePhotoFile} setFiles={setProfilePhotoFile} maxFiles={1} />
                            {!formData.profilePhoto && !profilePhotoFile.length && (
                                <div className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 text-sm flex items-start gap-2">
                                    <Icon name="AlertCircle" className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>لم يتم تحميل صورة شخصية بعد. قم برفع صورة لإكمال ملفك الشخصي.</span>
                                </div>
                            )}
                        </div>

                        {/* Gallery */}
                        <div>
                            <label className={labelClasses}>
                                <Icon name="GalleryHorizontal" className="w-4 h-4 inline mr-1" />
                                معرض الأعمال الحالي
                                <Badge variant="secondary" className="mr-2">
                                    {formData.gallery?.length || 0} / 10
                                </Badge>
                            </label>
                            {formData.gallery && formData.gallery.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                                    {[...formData.gallery]
                                        .sort((a, b) => {
                                            if (a.uploaded_at && b.uploaded_at) {
                                                return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
                                            }
                                            return 0;
                                        })
                                        .map((item, index) => (
                                            <div
                                                key={index}
                                                className="relative group aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                                            >
                                                <div
                                                    className="w-full h-full cursor-pointer"
                                                    onClick={() => handleViewMedia(item)}
                                                >
                                                    {item.type === 'image' ? (
                                                        <img
                                                            src={item.data ? getImageUrl(item.data) : (item.path ? getImageUrl(item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '')}
                                                            alt={`Gallery ${index}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="relative w-full h-full bg-slate-900">
                                                            <video
                                                                src={item.data ? getImageUrl(item.data) : (item.path ? getImageUrl(item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '')}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                                                                <div className="p-3 bg-white/90 rounded-full">
                                                                    <Icon name="Play" className="w-6 h-6 text-primary" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveGalleryImage(index);
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 z-10"
                                                    title="حذف"
                                                >
                                                    <Icon name="X" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="mb-4 p-8 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-center">
                                    <Icon name="ImageOff" className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">معرض أعمالك فارغ حالياً.</p>
                                </div>
                            )}
                            <label className={labelClasses}>
                                <Icon name="Upload" className="w-4 h-4 inline mr-1" />
                                إضافة ملفات جديدة للمعرض
                            </label>
                            <MediaUpload
                                files={newGalleryFiles}
                                setFiles={setNewGalleryFiles}
                                maxFiles={Math.max(0, 10 - (formData.gallery?.length || 0))}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                <Icon name="Info" className="w-3 h-3" />
                                يمكنك إضافة حتى {10 - (formData.gallery?.length || 0)} ملفات إضافية
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        variant="primary"
                        className="px-10 py-4 h-auto text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        {isSaving ? (
                            <>
                                <Icon name="Loader" className="w-5 h-5 anime-spin ml-2" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Icon name="Save" className="w-5 h-5 ml-2" />
                                حفظ التغييرات
                            </>
                        )}
                    </Button>
                </div>

                {/* Logout Section */}
                <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                            <Icon name="LogOut" className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-lg mb-2 text-red-700 dark:text-red-400">تسجيل الخروج</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">الخروج من حسابك على هذا الجهاز.</p>
                            <Button
                                type="button"
                                onClick={onLogout}
                                variant="danger"
                                className="shadow-md hover:shadow-lg transform hover:scale-105"
                            >
                                تسجيل الخروج
                            </Button>
                        </div>
                    </div>
                </Card>
            </form>

            {/* Media Viewer */}
            {viewingMedia && (
                <MediaViewer
                    items={[viewingMedia]}
                    activeIndex={0}
                    onIndexChange={() => { }}
                    onClose={() => setViewingMedia(null)}
                />
            )}

            {/* Print/PDF Preview Modal - Custom implementation to avoid Modal component interference */}
            {showPreview && (
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
                    <div className="w-full max-w-[210mm] bg-white dark:bg-darkcard p-3 rounded-t-lg shadow-lg flex justify-between items-center print:hidden">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">معاينة الملف الشخصي</h3>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleDownload}
                                disabled={isGenerating || !isReadyForExport}
                                className="flex items-center gap-2"
                                size="sm"
                            >
                                {isGenerating ? (
                                    <>
                                        <Icon name="Loader" className="w-4 h-4 animate-spin ml-2" />
                                        جارٍ التحميل...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Download" className="w-4 h-4 ml-2" />
                                        تحميل PDF
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handlePrint}
                                disabled={!isReadyForExport}
                                variant="secondary"
                                className="flex items-center gap-2"
                                size="sm"
                            >
                                <Icon name="Printer" className="w-4 h-4 ml-2" />
                                طباعة
                            </Button>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="text-2xl text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white p-1"
                            >
                                &times;
                            </button>
                        </div>
                    </div>

                    <div className="printable-area w-full max-w-[210mm] h-[calc(100vh-100px)] print:h-auto overflow-y-auto bg-white shadow-lg pb-10">
                        {/* The content is scaled slightly on mobile screens to fit width if needed */}
                        <div className="md:scale-100 scale-[0.8] origin-top-left w-[125%] md:w-full">
                            <PrintableTowTruckProfile
                                ref={printableProfileRef}
                                towTruck={{ ...towTruck, ...formData } as TowTruck}
                                settings={settings}
                                onReady={() => setIsReadyForExport(true)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;