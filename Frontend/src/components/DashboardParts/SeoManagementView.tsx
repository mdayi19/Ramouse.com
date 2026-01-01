import React, { useState, useEffect } from 'react';
import { Settings, SeoSettings } from '../../types';
import { ViewHeader } from './Shared';
import ImageUpload from '../ImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../lib/utils';

// Helper
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const SeoManagementView: React.FC<{
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}> = ({ settings, onSave }) => {
    const [formState, setFormState] = useState(settings.seoSettings);

    // State for file uploads
    const [ogImageFile, setOgImageFile] = useState<File[]>([]);
    const [twitterImageFile, setTwitterImageFile] = useState<File[]>([]);

    useEffect(() => {
        setFormState(settings.seoSettings);
        // Reset files on settings load
        setOgImageFile([]);
        setTwitterImageFile([]);
    }, [settings.seoSettings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let updatedSettings = { ...formState };

        if (ogImageFile.length > 0) {
            updatedSettings.ogImage = await fileToBase64(ogImageFile[0]);
        }

        if (twitterImageFile.length > 0) {
            updatedSettings.twitterImage = await fileToBase64(twitterImageFile[0]);
        }

        onSave({ seoSettings: updatedSettings });
    };

    const InputField: React.FC<{ label: string; name: keyof SeoSettings; type?: string; desc?: string; dir?: 'ltr' | 'rtl' }> = ({ label, name, type = 'text', desc, dir }) => (
        <div>
            <Input
                label={label}
                type={type}
                id={name}
                name={name}
                value={formState[name] || ''}
                onChange={handleChange}
                dir={dir}
            />
            {desc && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
        </div>
    );

    const SelectField: React.FC<{ label: string; name: keyof SeoSettings; options: { value: string, label: string }[]; desc?: string }> = ({ label, name, options, desc }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</label>
            <select
                id={name}
                name={name}
                value={formState[name] || ''}
                onChange={handleChange}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {desc && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
        </div>
    );

    const TextareaField: React.FC<{ label?: string; name: keyof SeoSettings; rows?: number; desc?: string }> = ({ label, name, rows = 3, desc }) => (
        <div>
            <Textarea
                label={label}
                id={name}
                name={name}
                value={formState[name] || ''}
                onChange={handleChange}
                rows={rows}
            />
            {desc && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
        </div>
    );

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة SEO وبيانات المشاركة" subtitle="تعديل البيانات الوصفية التي تساعد محركات البحث ومنصات التواصل الاجتماعي على فهم موقعك." />
            <form onSubmit={handleSubmit} className="mt-6 space-y-8">
                <Card className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">الإعدادات العامة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InputField label="عنوان الصفحة (Title)" name="title" />
                        <TextareaField label="الوصف (Description)" name="description" />
                        <InputField label="الكلمات المفتاحية (Keywords)" name="keywords" desc="افصل بين الكلمات بفاصلة." />
                        <InputField label="الرابط الأساسي (Canonical URL)" name="canonicalUrl" dir="ltr" />
                        <InputField label="لون السمة (Theme Color)" name="themeColor" type="color" />
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Open Graph (فيسبوك، واتساب، الخ)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <InputField label="العنوان (og:title)" name="ogTitle" />
                            <TextareaField label="الوصف (og:description)" name="ogDescription" />
                            <InputField label="الرابط (og:url)" name="ogUrl" dir="ltr" />
                            <SelectField
                                label="النوع (og:type)"
                                name="ogType"
                                options={[
                                    { value: 'website', label: 'Website' },
                                    { value: 'article', label: 'Article' },
                                    { value: 'product', label: 'Product' },
                                    { value: 'profile', label: 'Profile' }
                                ]}
                            />
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">صورة المشاركة (og:image)</label>
                                {formState.ogImage && !ogImageFile.length && (
                                    <img src={formState.ogImage} alt="OG Preview" className="h-32 w-auto object-cover rounded-md mb-2 border dark:border-slate-600" />
                                )}
                                <ImageUpload files={ogImageFile} setFiles={setOgImageFile} maxFiles={1} />
                                <p className="text-xs text-slate-500 mt-1">يفضل أن تكون الأبعاد 1200×630 بكسل.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Twitter Card</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SelectField
                                label="نوع البطاقة (twitter:card)"
                                name="twitterCard"
                                options={[
                                    { value: 'summary_large_image', label: 'Summary Large Image' },
                                    { value: 'summary', label: 'Summary' },
                                    { value: 'app', label: 'App' },
                                    { value: 'player', label: 'Player' }
                                ]}
                            />
                            <InputField label="العنوان (twitter:title)" name="twitterTitle" />
                            <TextareaField label="الوصف (twitter:description)" name="twitterDescription" />
                            <InputField label="الرابط (twitter:url)" name="twitterUrl" dir="ltr" />
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">صورة تويتر (twitter:image)</label>
                                {formState.twitterImage && !twitterImageFile.length && (
                                    <img src={formState.twitterImage} alt="Twitter Preview" className="h-32 w-auto object-cover rounded-md mb-2 border dark:border-slate-600" />
                                )}
                                <ImageUpload files={twitterImageFile} setFiles={setTwitterImageFile} maxFiles={1} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">البيانات المنظمة (JSON-LD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TextareaField name="jsonLd" rows={12} desc="تساعد هذه البيانات محركات البحث على فهم محتوى صفحتك بشكل أفضل." />
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button type="submit" size="lg" className="px-8" variant="primary">
                        حفظ التغييرات
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default SeoManagementView;
