import React, { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { ViewHeader } from './Shared';
import Icon from '../Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface CeoSettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
}

const CeoSettingsView: React.FC<CeoSettingsViewProps> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings);

    useEffect(() => {
        setFormState(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary";

    return (
        <Card className="p-6">
            <ViewHeader title="إعدادات المدير والشركة" subtitle="إدارة معلومات الشركة العامة ورسالة المدير التي تظهر في تذييل الصفحة." />

            <form onSubmit={handleSubmit} className="mt-6">
                <div className="space-y-8">
                    {/* CEO Message Card */}
                    <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                        <h3 className="flex items-center gap-3 font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4">
                            <Icon name="User" />
                            رسالة المدير التنفيذي (CEO)
                        </h3>
                        <div className="space-y-4">
                            <Input
                                label="اسم المدير"
                                id="ceoName"
                                name="ceoName"
                                value={formState.ceoName}
                                onChange={(e) => handleChange(e as any)}
                            />
                            <div>
                                <label htmlFor="ceoMessage" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الرسالة</label>
                                <textarea
                                    id="ceoMessage"
                                    name="ceoMessage"
                                    value={formState.ceoMessage}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ستظهر هذه الرسالة في تذييل (Footer) الموقع.</p>
                            </div>
                        </div>
                    </Card>

                    {/* Company Info Card */}
                    <Card className="p-6 bg-slate-50 dark:bg-darkbg border border-slate-200 dark:border-slate-700 shadow-none">
                        <h3 className="flex items-center gap-3 font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4">
                            <Icon name="Building2" className="w-6 h-6" />
                            معلومات الشركة العامة
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="العنوان"
                                    id="companyAddress"
                                    name="companyAddress"
                                    value={formState.companyAddress}
                                    onChange={(e) => handleChange(e as any)}
                                />
                            </div>
                            <Input
                                label="الهاتف"
                                id="companyPhone"
                                name="companyPhone"
                                value={formState.companyPhone}
                                onChange={(e) => handleChange(e as any)}
                                className="text-left"
                                dir="ltr"
                            />
                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                id="companyEmail"
                                name="companyEmail"
                                value={formState.companyEmail}
                                onChange={(e) => handleChange(e as any)}
                                className="text-left"
                                dir="ltr"
                            />
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
                    <Button type="submit" className="px-8 py-2.5 shadow-sm">
                        حفظ التغييرات
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default CeoSettingsView;