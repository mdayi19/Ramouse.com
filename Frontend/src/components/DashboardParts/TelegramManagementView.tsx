import React, { useState, useEffect } from 'react';
import { Category, Settings } from '../../types';
import { ViewHeader } from './Shared';
import { AdminService } from '../../services/admin.service';
import { Card, CardContent, CardHeader } from '../ui/Card';
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

    useEffect(() => {
        setLocalCategories(carCategories);
    }, [carCategories]);

    const handleChange = (id: string, field: keyof Category, value: string | boolean) => {
        setLocalCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // Save each category to database
            const savePromises = localCategories.map(cat => AdminService.saveCategory(cat));
            const savedCategories = await Promise.all(savePromises);

            // Update local state with saved categories
            updateCarCategories(savedCategories);
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
            // Telegram's MarkdownV2 requires escaping special characters.
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
        <Card className="p-6">
            <ViewHeader title="إدارة Telegram" subtitle="ربط فئات السيارات بقنوات تيليجرام لنشر الطلبات الجديدة تلقائياً." />

            <Card className="mb-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-none">
                <CardContent className="p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        💡 <strong>ملاحظة:</strong> الإعدادات سيتم حفظها في قاعدة البيانات. عند إضافة طلب جديد، سيتم إرسال إشعار تلقائياً إلى القناة المحددة.
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {localCategories.map(cat => (
                    <Card key={cat.id} className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <span className="text-2xl">{cat.flag}</span>
                                {cat.name}
                            </div>
                            {cat.telegramNotificationsEnabled && (
                                <Badge variant="success">
                                    ✓ مفعل
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Input
                                    label="Telegram Bot Token"
                                    type="text"
                                    value={cat.telegramBotToken || ''}
                                    onChange={e => handleChange(cat.id, 'telegramBotToken', e.target.value)}
                                    className="font-mono text-sm"
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
                                    className="font-mono text-sm"
                                    dir="ltr"
                                    placeholder="@channel_username or -100123456789"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t dark:border-slate-600">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={cat.telegramNotificationsEnabled ?? false}
                                        onChange={e => handleChange(cat.id, 'telegramNotificationsEnabled', e.target.checked)}
                                        className="rounded text-primary w-4 h-4"
                                    />
                                    <span className="text-sm font-medium">تفعيل الإشعارات لهذه الفئة</span>
                                </label>
                                <Button
                                    size="sm"
                                    onClick={() => handleSendTest(cat)}
                                    disabled={testingCategory === cat.id}
                                    isLoading={testingCategory === cat.id}
                                >
                                    {!testingCategory && '📤 إرسال اختبار'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="flex justify-end pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    isLoading={isLoading}
                    variant="primary"
                    size="lg"
                    className="font-bold flex items-center gap-2"
                >
                    💾 حفظ كل التغييرات في قاعدة البيانات
                </Button>
            </div>
        </Card>
    );
};
export default TelegramManagementView;
