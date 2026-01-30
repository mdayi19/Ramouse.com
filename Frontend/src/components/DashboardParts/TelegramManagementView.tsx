import React, { useState, useEffect } from 'react';
import { Category, Settings } from '../../types';
import { ViewHeader, Icon } from './Shared';
import { AdminService } from '../../services/admin.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface TelegramManagementViewProps {
    carCategories: Category[];
    updateCarCategories: (categories: Category[]) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    sendTelegramNotification: (botToken: string, channelId: string, message: string, media?: { images: File[], video?: File | null, voiceNote?: Blob | null }) => Promise<void>;
    settings: Settings;
}

const TelegramManagementView: React.FC<TelegramManagementViewProps> = ({ carCategories, updateCarCategories, showToast, sendTelegramNotification, settings }) => {
    const [localCategories, setLocalCategories] = useState(carCategories);
    const [testMessage, setTestMessage] = useState('رسالة اختبار من نظام راموسة!');
    const [isLoading, setIsLoading] = useState(false);
    const [testingCategory, setTestingCategory] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        setLocalCategories(carCategories);
    }, [carCategories]);

    const handleChange = (id: string, field: keyof Category, value: string | boolean) => {
        setLocalCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const savePromises = localCategories.map(cat => AdminService.saveCategory(cat));
            const savedCategories = await Promise.all(savePromises);
            updateCarCategories(savedCategories);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
            showToast('تم حفظ إعدادات تيليجرام بنجاح في قاعدة البيانات.', 'success');
        } catch (error) {
            console.error('Failed to save Telegram settings:', error);
            showToast('فشل في حفظ الإعدادات. حاول مرة أخرى.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendTest = async (category: Category) => {
        if (!category.telegramBotToken || !category.telegramChannelId) {
            showToast('الرجاء إدخال Bot Token و Channel ID أولاً.', 'error');
            return;
        }

        setTestingCategory(category.id);
        try {
            const escapedMessage = testMessage.replace(/[_*[\]()~`>#+ \-=|{}.!]/g, '\\$&');
            await sendTelegramNotification(category.telegramBotToken, category.telegramChannelId, escapedMessage);
            showToast(`✅ تم إرسال رسالة اختبار إلى قناة ${category.name} بنجاح!`, 'success');
        } catch (error) {
            console.error('Telegram test failed:', error);
            showToast(`❌ فشل في إرسال الرسالة. تحقق من Bot Token و Channel ID.`, 'error');
        } finally {
            setTestingCategory(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center shadow-lg">
                            <Icon name="Send" className="w-7 h-7 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <ViewHeader title="📱 إدارة Telegram" subtitle="ربط فئات السيارات بقنوات تيليجرام لنشر الطلبات الجديدة تلقائياً." />
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

            {/* Info Banner */}
            <Card className="overflow-hidden backdrop-blur-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
                <div className="p-5 flex items-start gap-3">
                    <Icon name="Info" className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>ملاحظة:</strong> الإعدادات سيتم حفظها في قاعدة البيانات. عند إضافة طلب جديد، سيتم إرسال إشعار تلقائياً إلى القناة المحددة.
                    </p>
                </div>
            </Card>

            {/* Categories */}
            <div className="space-y-4">
                {localCategories.map((cat, index) => (
                    <Card
                        key={cat.id}
                        className="group backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 40}ms` }}
                    >
                        <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{cat.flag}</span>
                                    <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                                </div>
                                {cat.telegramNotificationsEnabled && (
                                    <Badge className="bg-white/20 text-white border-white/30">
                                        <Icon name="Check" className="w-3.5 h-3.5 ml-1" />
                                        مفعل
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <Input
                                    label="Telegram Bot Token"
                                    type="text"
                                    value={cat.telegramBotToken || ''}
                                    onChange={e => handleChange(cat.id, 'telegramBotToken', e.target.value)}
                                    className="font-mono text-sm bg-slate-50 dark:bg-slate-900/50"
                                    dir="ltr"
                                    placeholder="1234567890:ABCdefGhIJKlmNOPQrsTUVwxyZ"
                                />
                            </div>
                            <div>
                                <Input
                                    label="Telegram Channel ID"
                                    type="text"
                                    value={cat.telegramChannelId || ''}
                                    onChange={e => handleChange(cat.id, 'telegramChannelId', e.target.value)}
                                    className="font-mono text-sm bg-slate-50 dark:bg-slate-900/50"
                                    dir="ltr"
                                    placeholder="@channel_username or -100123456789"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={cat.telegramNotificationsEnabled ?? false}
                                            onChange={e => handleChange(cat.id, 'telegramNotificationsEnabled', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-sky-500 peer-checked:to-blue-500"></div>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تفعيل الإشعارات لهذه الفئة</span>
                                </label>
                                <Button
                                    size="sm"
                                    onClick={() => handleSendTest(cat)}
                                    disabled={testingCategory === cat.id}
                                    isLoading={testingCategory === cat.id}
                                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white"
                                >
                                    {testingCategory !== cat.id && <Icon name="Send" className="w-3.5 h-3.5 ml-1.5" />}
                                    إرسال اختبار
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Save Button */}
            <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="px-8 py-3 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent ml-2"></div>
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Icon name="Save" className="w-4 h-4 ml-2" />
                                حفظ كل التغييرات
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
export default TelegramManagementView;
