import React, { useState } from 'react';
import { Save, User, Building2, MapPin, Building, FileText, Loader, Camera, Image as ImageIcon, Globe, Mail, Clock, Plus, Trash2 } from 'lucide-react';
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
    };

    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSocials({ ...socials, [e.target.name]: e.target.value });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCover(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
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
            showToast('تم حفظ التغييرات بنجاح', 'success');
        } catch (error) {
            console.error(error);
            showToast('فشل حفظ التغييرات', 'error');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'المعلومات العامة', icon: Building2 },
        { id: 'media', label: 'الوسائط', icon: ImageIcon },
        { id: 'contact', label: 'التواصل والموقع', icon: MapPin },
        { id: 'hours', label: 'ساعات العمل', icon: Clock },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة الملف الشخصي</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">قم بتحديث معلومات معرضك وصور العرض</p>
                </div>
                <button
                    onClick={() => handleSubmit()}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                    {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ التغييرات
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-2 flex overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all font-medium ${activeTab === tab.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-4 md:col-span-2">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2 dark:border-slate-700">المعلومات الأساسية</h3>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">اسم المعرض (التجاري)</label>
                            <div className="relative">
                                <Building className="absolute top-3 right-3 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="business_name"
                                    value={formData.business_name}
                                    onChange={handleChange}
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="مثال: معرض النخبة للسيارات"
                                />
                            </div>
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="اكتب وصفاً مختصراً عن خدماتك، أنواع السيارات المتوفرة، وتاريخ المعرض..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    </div>
                )}

                {/* Contact Tab */}
                {activeTab === 'contact' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr"
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
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500 ltr"
                                placeholder="https://x.com/..."
                            />
                        </div>
                    </div>
                )}

                {/* Hours Tab */}
                {activeTab === 'hours' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="مثال:&#10;السبت - الخميس: 9:00 ص - 10:00 م&#10;الجمعة: 4:00 م - 10:00 م"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
