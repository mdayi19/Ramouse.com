import React, { useState, useEffect } from 'react';
import { Settings } from '../../types';
import { ViewHeader, Icon } from './Shared';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface SettingsViewProps {
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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

    const socialPlatforms = [
        { name: 'facebookUrl', label: 'فيسبوك', icon: 'Facebook', placeholder: 'https://facebook.com/...', color: 'from-blue-600 to-blue-500' },
        { name: 'instagramUrl', label: 'انستغرام', icon: 'Instagram', placeholder: 'https://instagram.com/...', color: 'from-pink-600 to-purple-500' },
        { name: 'twitterUrl', label: 'تويتر (X)', icon: 'Twitter', placeholder: 'https://x.com/...', color: 'from-slate-900 to-slate-700' },
        { name: 'linkedinUrl', label: 'لينكد إن', icon: 'Linkedin', placeholder: 'https://linkedin.com/...', color: 'from-blue-700 to-blue-600' },
        { name: 'youtubeUrl', label: 'يوتيوب', icon: 'Youtube', placeholder: 'https://youtube.com/...', color: 'from-red-600 to-red-500' },
    ];

    const messagingPlatforms = [
        { name: 'whatsappUrl', label: 'واتساب', icon: 'MessageCircle', placeholder: 'https://wa.me/...', color: 'from-green-600 to-emerald-500' },
        { name: 'telegramUrl', label: 'تيلغرام', icon: 'Send', placeholder: 'https://t.me/...', color: 'from-blue-500 to-cyan-500' },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-dark card/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center shadow-lg">
                            <Icon name="Settings" className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <ViewHeader title="⚙️ الإعدادات العامة" subtitle="إدارة الإعدادات العامة والشعارات والروابط." />
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
                {/* App Identity */}
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="Smartphone" className="w-5 h-5" />
                            </div>
                            هوية التطبيق
                        </h3>
                        <p className="text-indigo-100 text-sm mt-2">الشعار واسم التطبيق</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                    <Icon name="Image" className="w-4 h-4 inline ml-1" />
                                    شعار التطبيق
                                </label>
                                <div className="flex items-center gap-4">
                                    {formState.logoUrl && (
                                        <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 p-2 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                                            <img
                                                src={formState.logoUrl}
                                                alt="Logo"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Input
                                    label="اسم التطبيق"
                                    id="appName"
                                    name="appName"
                                    value={formState.appName}
                                    onChange={(e) => handleChange(e as any)}
                                    required
                                    className="bg-slate-50 dark:bg-slate-900/50"
                                    placeholder="راموسة"
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
                                        className="bg-slate-50 dark:bg-slate-900/50"
                                    />
                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                                        <Icon name="Info" className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        يستخدم لتوليد روابط QR Code. أدخل النطاق بدون https://
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Social Media */}
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="Share2" className="w-5 h-5" />
                            </div>
                            روابط التواصل الاجتماعي
                        </h3>
                        <p className="text-pink-100 text-sm mt-2">حساباتك على منصات التواصل</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {socialPlatforms.map((platform) => (
                                <div key={platform.name}>
                                    <label htmlFor={platform.name} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-sm`}>
                                            <Icon name={platform.icon as any} className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        {platform.label}
                                    </label>
                                    <Input
                                        type="url"
                                        id={platform.name}
                                        name={platform.name}
                                        value={formState[platform.name as keyof Settings] as string || ''}
                                        onChange={(e) => handleChange(e as any)}
                                        placeholder={platform.placeholder}
                                        dir="ltr"
                                        className="bg-slate-50 dark:bg-slate-900/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Messaging Platforms */}
                <Card className="overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-5">
                        <h3 className="flex items-center gap-3 font-bold text-lg text-white">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Icon name="MessageSquare" className="w-5 h-5" />
                            </div>
                            روابط التواصل السريع
                        </h3>
                        <p className="text-green-100 text-sm mt-2">المراسلة الفورية</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {messagingPlatforms.map((platform) => (
                                <div key={platform.name}>
                                    <label htmlFor={platform.name} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-sm`}>
                                            <Icon name={platform.icon as any} className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        {platform.label}
                                    </label>
                                    <Input
                                        type="url"
                                        id={platform.name}
                                        name={platform.name}
                                        value={formState[platform.name as keyof Settings] as string || ''}
                                        onChange={(e) => handleChange(e as any)}
                                        placeholder={platform.placeholder}
                                        dir="ltr"
                                        className="bg-slate-50 dark:bg-slate-900/50"
                                    />
                                </div>
                            ))}
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
                                    حفظ الإعدادات
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default SettingsView;