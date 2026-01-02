import React from 'react';
import { Check } from 'lucide-react';

interface AuctionFormBasicProps {
    formData: any;
    updateFormData: (data: any) => void;
}

export const AuctionFormBasic: React.FC<AuctionFormBasicProps> = ({ formData, updateFormData }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">عنوان الإعلان</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={e => updateFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all font-medium"
                        placeholder="مثال: مرسيدس S-Class 2023 فل كامل"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الماركة</label>
                    <input
                        type="text"
                        value={formData.brand}
                        onChange={e => updateFormData({ ...formData, brand: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                        placeholder="Mercedes"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الموديل</label>
                    <input
                        type="text"
                        value={formData.model}
                        onChange={e => updateFormData({ ...formData, model: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                        placeholder="S500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">سنة الصنع</label>
                    <input
                        type="number"
                        value={formData.year}
                        onChange={e => updateFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">رقم الهيكل (VIN)</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={formData.vin}
                            onChange={e => updateFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all uppercase font-mono tracking-widest"
                            placeholder="WDB..."
                        />
                        {formData.vin.length === 17 && (
                            <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                        )}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">الحالة</label>
                    <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                        {(['new', 'used'] as const).map(condition => (
                            <button
                                key={condition}
                                type="button"
                                onClick={() => updateFormData({ ...formData, condition })}
                                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.condition === condition
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {condition === 'new' ? '✨ جديدة' : '🔄 مستعملة'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الوصف</label>
                    <textarea
                        value={formData.description}
                        onChange={e => updateFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all resize-none"
                        placeholder="اكتب أبرز مواصفات وعيوب السيارة..."
                    />
                </div>
            </div>
        </div>
    );
};
