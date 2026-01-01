import React, { useState, useEffect } from 'react';
import { Settings, ShippingPriceByCity } from '../../types';
import { ViewHeader } from './Shared';
import { SYRIAN_CITIES } from '../../constants';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ShippingSettingsViewProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

const ShippingSettingsView: React.FC<ShippingSettingsViewProps> = ({ settings, onSave }) => {
    const [prices, setPrices] = useState<ShippingPriceByCity[]>([]);

    useEffect(() => {
        // Ensure all cities from constants are present in the state
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ limitSettings: { ...settings.limitSettings, shippingPrices: prices } });
    };

    const sizeLabels: { key: keyof Omit<ShippingPriceByCity, 'city'>, label: string }[] = [
        { key: 'xs', label: 'صغير جداً (XS)' },
        { key: 's', label: 'صغير (S)' },
        { key: 'm', label: 'متوسط (M)' },
        { key: 'l', label: 'كبير (L)' },
        { key: 'vl', label: 'كبير جداً (VL)' },
    ];

    return (
        <Card className="p-6">
            <ViewHeader title="إعدادات الشحن" subtitle="تحديد أسعار الشحن بناءً على المدينة وحجم القطعة." />

            <div className="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 text-sm">
                <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">دليل أحجام القطع</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300">هذه أمثلة لمساعدة المسؤول على تحديد الأسعار. تظهر هذه الفئات للمزود عند تقديم عرض السعر.</p>
                <ul className="list-disc list-inside mt-2 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                    <li><b>صغير جداً (XS):</b> فيوزات، لمبات، حساسات فردية (حتى 0.5 كغ)</li>
                    <li><b>صغير (S):</b> فلاتر، بواجي، مفاتيح كهربائية (حتى 2 كغ)</li>
                    <li><b>متوسط (M):</b> طقم فرامل، مضخة بنزين، مرايا جانبية (2 - 10 كغ)</li>
                    <li><b>كبير (L):</b> صدام أمامي، جنط، ردياتير (10 - 25 كغ)</li>
                    <li><b>كبير جداً (VL):</b> محرك كامل، جيربوكس، باب سيارة (&gt; 25 كغ)</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="mt-6">
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full min-w-[600px] text-sm text-center">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                            <tr>
                                <th className="p-3 text-right font-semibold">المدينة</th>
                                {sizeLabels.map(s => <th key={s.key} className="p-3 font-semibold">{s.label}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-darkcard">
                            {prices.map(({ city, ...tiers }) => (
                                <tr key={city} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-2 text-right font-semibold text-slate-700 dark:text-slate-300">{city}</td>
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
                                                    className="w-full text-center rounded-lg border-slate-200 bg-slate-50 pl-6 pr-2 py-1.5 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900/50 text-xs font-medium dark:text-slate-200 transition-shadow outline-none"
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

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button type="submit" size="lg">
                        حفظ التغييرات
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default ShippingSettingsView;