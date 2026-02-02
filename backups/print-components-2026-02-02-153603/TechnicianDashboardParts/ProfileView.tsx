import React, { useState, useEffect, useRef } from 'react';
import { Technician, Settings, TechnicianSpecialty, GalleryItem } from '../../types';
import ImageUpload from '../ImageUpload';
import MediaUpload from '../MediaUpload';
import Icon from '../Icon';
import Modal from '../Modal';
import PrintableTechnicianProfile from '../PrintableTechnicianProfile';
import { SYRIAN_CITIES } from '../../constants';
import { api } from '../../lib/api';

interface ProfileViewProps {
    technician: Technician;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
    technicianSpecialties: TechnicianSpecialty[];
    onLogout: () => void;
    onProfileUpdate?: (updatedProfile: Partial<Technician>) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ technician, showToast, settings, technicianSpecialties, onLogout, onProfileUpdate }) => {
    const [formData, setFormData] = useState<Partial<Technician>>({});
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isUploadingGallery, setIsUploadingGallery] = useState(false);

    const [showPreview, setShowPreview] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isReadyForExport, setIsReadyForExport] = useState(false);
    const printableProfileRef = useRef<HTMLDivElement>(null);

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
                filename: `profile-${technician.uniqueId}.pdf`,
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

    // Load profile from API on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await api.get('/technician/profile');
                const profileData = response.data.data;

                setFormData({
                    name: profileData.name,
                    specialty: profileData.specialty,
                    city: profileData.city,
                    workshopAddress: profileData.workshopAddress,
                    location: profileData.location,
                    description: profileData.description,
                    socials: profileData.socials || { facebook: '', instagram: '', whatsapp: '' },
                });

                setProfilePhoto(profileData.profilePhoto);
                setGallery(profileData.gallery || []);
            } catch (error: any) {
                console.error('Error loading profile:', error);
                showToast('فشل في تحميل الملف الشخصي', 'error');
            }
        };

        loadProfile();
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
                    showToast('لم نتمكن من الحصول على موقعك. تأكد من منح الإذن.', 'error');
                }
            );
        } else {
            showToast('متصفحك لا يدعم تحديد المواقع.', 'error');
        }
    };

    const handleProfilePhotoUpload = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploadingPhoto(true);
        const file = files[0];

        try {
            const formData = new FormData();
            formData.append('photo', file);

            const response = await api.post('/technician/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setProfilePhoto(response.data.data.profilePhoto);
                showToast('تم رفع الصورة الشخصية بنجاح!', 'success');
                if (onProfileUpdate) {
                    onProfileUpdate({ profilePhoto: response.data.data.profilePhoto });
                }
            }
        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            showToast(error.response?.data?.error || 'فشل في رفع الصورة', 'error');
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleGalleryUpload = async (files: File[]) => {
        if (files.length === 0) return;

        setIsUploadingGallery(true);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/technician/profile/gallery', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.success) {
                    setGallery(response.data.data.gallery);
                }
            }
            showToast('تم رفع الصور بنجاح!', 'success');
        } catch (error: any) {
            console.error('Error uploading gallery:', error);
            showToast(error.response?.data?.error || 'فشل في رفع الصور', 'error');
        } finally {
            setIsUploadingGallery(false);
        }
    };

    const handleDeleteGalleryItem = async (index: number) => {
        if (!window.confirm('هل تريد حذف هذا العنصر من المعرض؟')) return;

        try {
            const response = await api.delete(`/technician/profile/gallery/${index}`);

            if (response.data.success) {
                setGallery(response.data.data.gallery);
                showToast('تم حذف العنصر بنجاح!', 'success');
            }
        } catch (error: any) {
            console.error('Error deleting gallery item:', error);
            showToast(error.response?.data?.error || 'فشل في حذف العنصر', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const response = await api.put('/technician/profile', {
                name: formData.name,
                specialty: formData.specialty,
                city: formData.city,
                workshopAddress: formData.workshopAddress,
                location: formData.location,
                description: formData.description,
                socials: formData.socials
            });

            if (response.data.success) {
                showToast('تم حفظ التغييرات بنجاح!', 'success');
                if (onProfileUpdate) {
                    onProfileUpdate(response.data.data);
                }
            }
        } catch (error: any) {
            console.error("Failed to save profile:", error);
            showToast(error.response?.data?.error || 'حدث خطأ أثناء حفظ التغييرات.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm";

    return (
        <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">ملفي الشخصي</h3>
                <button
                    onClick={handleOpenPreview}
                    disabled={isGenerating}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg disabled:opacity-50 text-sm"
                >
                    <Icon name="Printer" className="w-4 h-4" />
                    <span>معاينة / طباعة</span>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <h4 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="CircleUser" className="w-5 h-5" />المعلومات العامة</h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium">الاسم الكامل</label><input type="text" value={formData.name || ''} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputClasses} required /></div>
                            <div><label className="block text-sm font-medium">التخصص</label><select value={formData.specialty} onChange={e => setFormData(p => ({ ...p, specialty: e.target.value }))} className={inputClasses} required>{technicianSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className="block text-sm font-medium">المدينة</label><select value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} className={inputClasses} required>{SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                            <div><label className="block text-sm font-medium">عنوان الورشة</label><input type="text" value={formData.workshopAddress || ''} onChange={e => setFormData(p => ({ ...p, workshopAddress: e.target.value }))} className={inputClasses} /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">موقع الورشة على الخريطة</label>
                            <button type="button" onClick={handleGetLocation} className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/50 dark:hover:bg-primary-900">
                                <Icon name="MapPin" className="w-5 h-5" />
                                <span>تحديث/تحديد الموقع الحالي</span>
                            </button>
                            {formData.location ? (
                                <div className="mt-2 text-xs text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-2">
                                    <span>الموقع الحالي المسجل: ({Number(formData.location.latitude).toFixed(6)}, {Number(formData.location.longitude).toFixed(6)})</span>
                                    <a
                                        href={`https://www.google.com/maps?q=${formData.location.latitude},${formData.location.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        عرض على الخريطة
                                    </a>
                                </div>
                            ) : (
                                <div className="mt-2 text-xs text-slate-500 text-center">
                                    لم يتم تحديد الموقع بعد.
                                </div>
                            )}
                        </div>
                        <div><label className="block text-sm font-medium">وصف (نبذة عنك وعن خبراتك)</label><textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={4} className={inputClasses}></textarea></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <h4 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Image" className="w-5 h-5" />الصور والمعرض</h4>
                    <div className="space-y-8">
                        {/* Profile Photo Section */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-600 shadow-lg bg-slate-200 dark:bg-slate-700">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="الصورة الشخصية"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.name || 'User') + '&background=random';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <Icon name="User" className="w-12 h-12" />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-primary-700 transition-colors" title="تغيير الصورة الشخصية">
                                    <Icon name="Camera" className="w-4 h-4" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files && handleProfilePhotoUpload(Array.from(e.target.files))}
                                        disabled={isUploadingPhoto}
                                    />
                                </label>
                            </div>
                            <div className="flex-1 text-center sm:text-right">
                                <h5 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">الصورة الشخصية</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                    قم برفع صورة شخصية واضحة لزيادة ثقة العملاء. يفضل أن تكون الصورة ذات خلفية محايدة.
                                </p>
                                {isUploadingPhoto && <span className="text-xs text-primary font-medium animate-pulse">جاري رفع الصورة...</span>}
                            </div>
                        </div>

                        {/* Gallery Section */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">معرض الأعمال</h4>
                                    <p className="text-xs text-slate-500 mt-1">أضف صوراً لأعمالك السابقة (الحد الأقصى 20 صورة/فيديو)</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${gallery.length >= 20 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {gallery.length} / 20
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                                {/* Upload Button */}
                                <label className={`relative flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${gallery.length >= 20 || isUploadingGallery ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm mb-2">
                                        <Icon name="Plus" className="w-6 h-6 text-primary" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">إضافة صور/فيديو</span>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => e.target.files && handleGalleryUpload(Array.from(e.target.files))}
                                        disabled={isUploadingGallery || gallery.length >= 20}
                                    />
                                    {isUploadingGallery && (
                                        <div className="absolute inset-0 bg-white/80 dark:bg-black/50 flex items-center justify-center rounded-xl">
                                            <Icon name="Loader" className="w-6 h-6 text-primary animate-spin" />
                                        </div>
                                    )}
                                </label>

                                {/* Gallery Items */}
                                {gallery.map((item, index) => (
                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        {item.type === 'image' ? (
                                            <img
                                                src={item.url || ''}
                                                alt={`Gallery ${index}`}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Error';
                                                }}
                                            />
                                        ) : (
                                            <video src={item.url || ''} className="w-full h-full object-cover" controls />
                                        )}

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-2 opacity-0 group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteGalleryItem(index)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                                title="حذف"
                                            >
                                                <Icon name="Trash" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <h4 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200"><Icon name="Link" className="w-5 h-5" />روابط التواصل الاجتماعي</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-medium">فيسبوك (رابط الصفحة)</label><input type="url" value={formData.socials?.facebook || ''} onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, facebook: e.target.value } }))} className={`${inputClasses} text-left`} dir="ltr" placeholder="https://facebook.com/username" /></div>
                        <div><label className="block text-sm font-medium">انستغرام (اسم المستخدم)</label><input type="text" value={formData.socials?.instagram || ''} onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, instagram: e.target.value } }))} className={`${inputClasses} text-left`} dir="ltr" placeholder="username" /></div>
                        <div><label className="block text-sm font-medium">واتساب (الرقم مع الرمز الدولي)</label><input type="tel" value={formData.socials?.whatsapp || ''} onChange={e => setFormData(p => ({ ...p, socials: { ...p.socials, whatsapp: e.target.value } }))} className={`${inputClasses} text-left`} dir="ltr" placeholder="9639..." /></div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-20 md:pb-0">
                    <button type="submit" disabled={isSaving} className="bg-primary text-white font-bold px-8 py-2.5 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 w-full sm:w-auto">
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </button>
                </div>

                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md border border-red-200 dark:border-red-700 hidden md:block">
                    <h4 className="flex items-center gap-2 font-semibold text-lg mb-4 text-red-600 dark:text-red-400"><Icon name="LogOut" className="w-5 h-5" />تسجيل الخروج</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">الخروج من حسابك على هذا الجهاز.</p>
                    <button type="button" onClick={onLogout} className="bg-red-100 text-red-700 font-bold px-6 py-2 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                        تسجيل الخروج
                    </button>
                </div>
            </form>

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
                    <div className="w-full max-w-[210mm] bg-white dark:bg-darkcard p-3 rounded-t-lg shadow-lg flex justify-between items-center print-hidden">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">معاينة الملف الشخصي</h3>
                        <div className="flex gap-2">
                            <button onClick={handleDownload} disabled={isGenerating || !isReadyForExport} className="flex items-center gap-2 bg-primary text-white font-semibold text-xs sm:text-sm px-3 py-2 rounded-md disabled:bg-slate-400">
                                {isGenerating ? <><Icon name="Loader" className="w-4 h-4 animate-spin" /> جارٍ التحميل...</> : <><Icon name="Download" className="w-4 h-4" /> تحميل PDF</>}
                            </button>
                            <button onClick={handlePrint} disabled={!isReadyForExport} className="flex items-center gap-2 bg-slate-600 text-white font-semibold text-xs sm:text-sm px-3 py-2 rounded-md disabled:bg-slate-400">
                                <Icon name="Printer" className="w-4 h-4" /> طباعة
                            </button>
                            <button onClick={() => setShowPreview(false)} className="text-2xl text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white p-1">&times;</button>
                        </div>
                    </div>

                    <div className="printable-area w-full max-w-[210mm] h-[calc(100vh-80px)] print:h-auto overflow-y-auto bg-white shadow-lg pb-10">
                        {/* The content is scaled slightly on mobile screens to fit width if needed */}
                        <div className="md:scale-100 scale-[0.8] origin-top-left w-[125%] md:w-full">
                            <PrintableTechnicianProfile
                                ref={printableProfileRef}
                                technician={{ ...technician, ...formData, profilePhoto, gallery } as Technician}
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
