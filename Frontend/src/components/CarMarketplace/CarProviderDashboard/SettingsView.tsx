import React, { useState } from 'react';
import { Save, User, Building2, MapPin, Building, FileText, Loader } from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';

interface SettingsViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateProvider: (updatedData: Partial<CarProvider>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ provider, showToast, onUpdateProvider }) => {
    const [formData, setFormData] = useState({
        name: provider.name || '',
        business_name: provider.business_name || '',
        phone: (provider as any).phone || '',
        address: provider.address || '',
        city: provider.city || '',
        description: provider.description || ''
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await CarProviderService.updateProfile(formData);
            onUpdateProvider(updated);
            showToast('تم حفظ التغييرات بنجاح', 'success');
        } catch (error) {
            showToast('فشل حفظ التغييرات', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">الإعدادات</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">تحديث معلومات المعرض والملف الشخصي</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* Public Info Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-500" />
                            المعلومات العامة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    الاسم الشخصي
                                </label>
                                <div className="relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="اسم المدير المسؤول"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    اسم المعرض (التجاري)
                                </label>
                                <div className="relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="business_name"
                                        value={formData.business_name}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="اسم المعرض"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-500" />
                            الموقع والتواصل
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    المدينة
                                </label>
                                <div className="relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    العنوان التفصيلي
                                </label>
                                <div className="relative">
                                    <div className="absolute top-1/2 -translate-y-1/2 right-3 text-slate-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-purple-500" />
                            نبذة عن المعرض
                        </h3>
                        <div className="space-y-2">
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="اكتب وصفاً مختصراً عن المعرض والخدمات التي تقدمها..."
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {saving ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                حفظ التغييرات
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
