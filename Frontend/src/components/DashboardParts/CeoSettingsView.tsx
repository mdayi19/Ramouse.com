import React, { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { ViewHeader, Icon } from './Shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface CeoSettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
}

const CeoSettingsView: React.FC<CeoSettingsViewProps> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setFormState(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave(formState);
        setShowSuccess(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20  to-blue-500/20 flex items-center justify-center shadow-lg">
                            <Icon name="Crown" className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <ViewHeader title="👑 إعدادات المدير والشركة" subtitle="إدارة معلومات الشركة ورسالة المدير التي تظهر في الموقع." />
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

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* CEO Message Card */}
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="User" className="w-5 h-5" />
                            </div>
                            رسالة المدير التنفيذي (CEO)
                        </h3>
                        <p className="text-blue-100 text-sm mt-2">الرسالة التي ستظهر في تذييل (Footer) الموقع</p>
                    </div>
                    <div className="p-6 space-y-5">
                        <Input
                            label="اسم المدير"
                            id="ceoName"
                            name="ceoName"
                            value={formState.ceoName}
                            onChange={(e) => handleChange(e as any)}
                            className="bg-slate-50 dark:bg-slate-900/50"
                            placeholder="مثال: أحمد الشامي"
                        />
                        <div>
                            <label htmlFor="ceoMessage" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                الرسالة
                            </label>
                            <textarea
                                id="ceoMessage"
                                name="ceoMessage"
                                value={formState.ceoMessage}
                                onChange={handleChange}
                                rows={4}
                                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="اكتب رسالة ملهمة تعبر عن رؤية الشركة..."
                            />
                            <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
                                <Icon name="Info" className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span>ستظهر هذه الرسالة في تذييل جميع صفحات الموقع</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Company Info Card */}
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="Building2" className="w-5 h-5" />
                            </div>
                            معلومات الشركة العامة
                        </h3>
                        <p className="text-emerald-100 text-sm mt-2">بيانات الاتصال التي تظهر للعملاء</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    label="عنوان الشركة"
                                    id="companyAddress"
                                    name="companyAddress"
                                    value={formState.companyAddress}
                                    onChange={(e) => handleChange(e as any)}
                                    className="bg-slate-50 dark:bg-slate-900/50"
                                    placeholder="مثال: دمشق، المزة، شارع بغداد"
                                />
                            </div>
                            <div>
                                <Input
                                    label="هاتف المواقع"
                                    id="companyPhone"
                                    name="companyPhone"
                                    value={formState.companyPhone}
                                    onChange={(e) => handleChange(e as any)}
                                    className="text-left bg-slate-50 dark:bg-slate-900/50"
                                    dir="ltr"
                                    placeholder="+963 XXX XXX XXX"
                                />
                            </div>
                            <div>
                                <Input
                                    label="البريد الإلكتروني"
                                    type="email"
                                    id="companyEmail"
                                    name="companyEmail"
                                    value={formState.companyEmail}
                                    onChange={(e) => handleChange(e as any)}
                                    className="text-left bg-slate-50 dark:bg-slate-900/50"
                                    dir="ltr"
                                    placeholder="info@ramouse.com"
                                />
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-gradient-to-r from-amber-50  to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <Icon name="Shield" className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-700 dark:text-amber-300">
                                    <strong>ملاحظة:</strong> هذه المعلومات عامة وسيتم عرضها للجميع في صفحة "اتصل بنا" وتذييل الموقع.
                                </div>
                            </div>
                        </div>
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
                                    حفظ التغييرات
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default CeoSettingsView;