import React, { useState, useEffect } from 'react';
import { Settings, ShippingPriceByCity } from '../../types';
import { ViewHeader, Icon } from './Shared';
import { SYRIAN_CITIES } from '../../constants';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ShippingSettingsViewProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

const ShippingSettingsView: React.FC<ShippingSettingsViewProps> = ({ settings, onSave }) => {
    const [prices, setPrices] = useState<ShippingPriceByCity[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const currentPrices = settings.limitSettings.shippingPrices || [];
        const priceMap = new Map(currentPrices.map(p => [p.city, p]));
        const fullPrices = SYRIAN_CITIES.map(city => {
            return priceMap.get(city) || { city, xs: 0, s: 0, m: 0, l: 0, vl: 0 };
        });
        setPrices(fullPrices);
    }, [settings]);

    const handleChange = (city: string, size: keyof Omit<ShippingPriceByCity, 'city'>, value: string) => {
        const numValue = Number(value) >= 0 ? Number(value) : 0;
        setPrices(prev =>
            prev.map(p => (p.city === city ? { ...p, [size]: numValue } : p))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ limitSettings: { ...settings.limitSettings, shippingPrices: prices } });
        setShowSuccess(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(false);
        }, 2000);
    };

    const sizeLabels: { key: keyof Omit<ShippingPriceByCity, 'city'>, label: string, color: string, icon: string }[] = [
        { key: 'xs', label: 'XS', color: 'from-blue-500 to-cyan-500', icon: 'Circle' },
        { key: 's', label: 'S', color: 'from-emerald-500 to-teal-500', icon: 'Hexagon' },
        { key: 'm', label: 'M', color: 'from-purple-500 to-pink-500', icon: 'Square' },
        { key: 'l', label: 'L', color: 'from-amber-500 to-orange-500', icon: 'Pentagon' },
        { key: 'vl', label: 'VL', color: 'from-red-500 to-rose-500', icon: 'Octagon' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shadow-lg">
                            <Icon name="Truck" className="w-7 h-7 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <ViewHeader title="🚚 إعدادات الشحن" subtitle="تحديد أسعار الشحن بناءً على المدينة وحجم القطعة." />
                        </div>
                    </div>
                    {showSuccess && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-lg animate-fade-in">
                            <Icon name="Check" className="w-4 h-4 ml-2" />
                            تم الحفظ بنجاح
                        </Badge>
                    )}
                </div>
            </Card>

            {/* Size Guide */}
            <Card className="overflow-hidden backdrop-blur-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="p-5">
                    <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                        <Icon name="Info" className="w-5 h-5" />
                        دليل أحجام القطع
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">هذه أمثلة لمساعدة المسؤول على تحديد الأسعار. تظهر هذه الفئات للمزود عند تقديم عرض السعر.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                            { size: 'XS', desc: 'صغير جداً', examples: 'فيوزات، لمبات، حساسات فردية', weight: 'حتى 0.5 كغ', color: 'from-blue-500 to-cyan-500' },
                            { size: 'S', desc: 'صغير', examples: 'فلاتر، بواجي، مفاتيح كهربائية', weight: 'حتى 2 كغ', color: 'from-emerald-500 to-teal-500' },
                            { size: 'M', desc: 'متوسط', examples: 'طقم فرامل، مضخة بنزين، مرايا', weight: '2 - 10 كغ', color: 'from-purple-500 to-pink-500' },
                            { size: 'L', desc: 'كبير', examples: 'صدام أمامي، جنط، ردياتير', weight: '10 - 25 كغ', color: 'from-amber-500 to-orange-500' },
                            { size: 'VL', desc: 'كبير جداً', examples: 'محرك كامل، جيربوكس، باب سيارة', weight: '> 25 كغ', color: 'from-red-500 to-rose-500' },
                        ].map((item) => (
                            <div key={item.size} className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm`}>
                                        <span className="text-white font-bold text-xs">{item.size}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{item.desc}</p>
                                        <p className="text-xs text-slate-500">{item.weight}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{item.examples}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Pricing Table */}
            <form onSubmit={handleSubmit}>
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="DollarSign" className="w-5 h-5" />
                            </div>
                            جدول الأسعار
                        </h3>
                        <p className="text-emerald-100 text-sm mt-2">الأسعار بالدولار الأمريكي ($)</p>
                    </div>
                    <div className="p-6 overflow-x-auto">
                        <table className="w-full min-w-[600px] text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                    <th className="p-3 text-right font-bold text-slate-700 dark:text-slate-200 sticky left-0 bg-slate-50 dark:bg-slate-800/50">
                                        المدينة
                                    </th>
                                    {sizeLabels.map(s => (
                                        <th key={s.key} className="p-3 font-bold">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm`}>
                                                    <span className="text-white font-bold text-xs">{s.label}</span>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {prices.map(({ city, ...tiers }, index) => (
                                    <tr
                                        key={city}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors animate-fade-in"
                                        style={{ animationDelay: `${index * 20}ms` }}
                                    >
                                        <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-darkcard">
                                            <div className="flex items-center gap-2">
                                                <Icon name="MapPin" className="w-4 h-4 text-slate-400" />
                                                {city}
                                            </div>
                                        </td>
                                        {sizeLabels.map(s => (
                                            <td key={s.key} className="p-2">
                                                <div className="relative max-w-[100px] mx-auto">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <span className="text-slate-500 text-xs font-bold">$</span>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={tiers[s.key]}
                                                        onChange={e => handleChange(city, s.key, e.target.value)}
                                                        className="w-full text-center rounded-xl border-slate-200 bg-slate-50 pl-6 pr-2 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/50 text-xs font-medium dark:text-slate-200 transition-all outline-none"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Save Button */}
                <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="px-8 py-3 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <Icon name="Save" className="w-4 h-4 ml-2" />
                                    حفظ جميع الأسعار
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default ShippingSettingsView;