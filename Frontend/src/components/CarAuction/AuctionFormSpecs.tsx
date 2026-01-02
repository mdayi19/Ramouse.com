import React from 'react';
import { MapPin, Check } from 'lucide-react';
import { BODY_TYPES, TRANSMISSIONS, FUEL_TYPES, COLORS, FEATURES } from '../../constants/carOptions';

interface AuctionFormSpecsProps {
    formData: any;
    updateFormData: (data: any) => void;
    toggleFeature: (feature: string) => void;
}

export const AuctionFormSpecs: React.FC<AuctionFormSpecsProps> = ({ formData, updateFormData, toggleFeature }) => {
    return (
        <div className="space-y-8">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">نوع الهيكل</label>
                <div className="flex flex-wrap gap-2">
                    {BODY_TYPES.map(type => (
                        <button
                            key={type.id}
                            type="button"
                            onClick={() => updateFormData({ ...formData, body_type: type.id })}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${formData.body_type === type.id
                                ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الممشى (كم)</label>
                    <input
                        type="number"
                        value={formData.mileage}
                        onChange={e => updateFormData({ ...formData, mileage: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">الموقع</label>
                    <div className="relative">
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={formData.location}
                            onChange={e => updateFormData({ ...formData, location: e.target.value })}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 dark:focus:ring-blue-900/50 transition-all"
                            placeholder="المدينة، المنطقة"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">ناقل الحركة</label>
                    <div className="flex rounded-xl bg-gray-50 dark:bg-slate-800 p-1">
                        {TRANSMISSIONS.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => updateFormData({ ...formData, transmission: t.id })}
                                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.transmission === t.id
                                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">الوقود</label>
                    <div className="flex flex-wrap gap-2">
                        {FUEL_TYPES.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => updateFormData({ ...formData, fuel_type: f.id })}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${formData.fuel_type === f.id
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">اللون الخارجي</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => updateFormData({ ...formData, exterior_color: c.id })}
                                className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${formData.exterior_color === c.id
                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                    : 'border-gray-200'
                                    }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">اللون الداخلي</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.slice(0, 6).map(c => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => updateFormData({ ...formData, interior_color: c.id })}
                                className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${formData.interior_color === c.id
                                    ? 'ring-2 ring-blue-500 ring-offset-2'
                                    : 'border-gray-200'
                                    }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">المميزات الإضافية</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {FEATURES.map(feature => (
                        <button
                            key={feature}
                            type="button"
                            onClick={() => toggleFeature(feature)}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 justify-center border ${formData.features.includes(feature)
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-100 dark:border-slate-700 hover:border-gray-200'
                                }`}
                        >
                            {formData.features.includes(feature) && <Check size={14} className="text-green-600" />}
                            {feature}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
