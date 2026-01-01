import React, { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { ViewHeader } from './Shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface SettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings);

    useEffect(() => {
        setFormState(settings);
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Card className="p-6">
            <ViewHeader title="الإعدادات العامة" subtitle="إدارة الإعدادات العامة والشعارات والروابط." />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">شعار التطبيق</label>
                        <div className="flex items-center gap-4">
                            {formState.logoUrl && <img src={formState.logoUrl} alt="Logo Preview" className="h-16 w-auto object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1" />}
                            <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary dark:file:bg-primary-900/50 dark:file:text-primary-300 hover:file:bg-primary-100" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Input
                            label="اسم التطبيق"
                            id="appName"
                            name="appName"
                            value={formState.appName}
                            onChange={(e) => handleChange(e as any)}
                            required
                        />
                        <div>
                            <Input
                                label="النطاق الرئيسي (Domain)"
                                id="mainDomain"
                                name="mainDomain"
                                value={formState.mainDomain || ''}
                                onChange={(e) => handleChange(e as any)}
                                dir="ltr"
                                placeholder="ramouse.app"
                                required
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">يستخدم لتوليد روابط QR Code. أدخل النطاق بدون https://</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-400 mb-2 border-b pb-1">روابط التواصل الاجتماعي</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Input
                            label="فيسبوك"
                            type="url"
                            id="facebookUrl"
                            name="facebookUrl"
                            value={formState.facebookUrl}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://facebook.com/..."
                            dir="ltr"
                        />
                        <Input
                            label="انستغرام"
                            type="url"
                            id="instagramUrl"
                            name="instagramUrl"
                            value={formState.instagramUrl}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://instagram.com/..."
                            dir="ltr"
                        />
                        <Input
                            label="تويتر (X)"
                            type="url"
                            id="twitterUrl"
                            name="twitterUrl"
                            value={formState.twitterUrl}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://x.com/..."
                            dir="ltr"
                        />
                        <Input
                            label="لينكد إن"
                            type="url"
                            id="linkedinUrl"
                            name="linkedinUrl"
                            value={formState.linkedinUrl || ''}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://linkedin.com/..."
                            dir="ltr"
                        />
                        <Input
                            label="يوتيوب"
                            type="url"
                            id="youtubeUrl"
                            name="youtubeUrl"
                            value={formState.youtubeUrl || ''}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://youtube.com/..."
                            dir="ltr"
                        />
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-400 mb-2 border-b pb-1">روابط التواصل السريع</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Input
                            label="واتساب"
                            type="url"
                            id="whatsappUrl"
                            name="whatsappUrl"
                            value={formState.whatsappUrl}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://wa.me/..."
                            dir="ltr"
                        />
                        <Input
                            label="تيلغرام"
                            type="url"
                            id="telegramUrl"
                            name="telegramUrl"
                            value={formState.telegramUrl}
                            onChange={(e) => handleChange(e as any)}
                            placeholder="https://t.me/..."
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="submit">
                        حفظ الإعدادات
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default SettingsView;