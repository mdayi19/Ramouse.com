
import React, { useState, useEffect } from 'react';
import { TowTruck, NotificationSettings, NotificationType, Settings } from '../../types';
import NotificationSettingsForm from '../NotificationSettingsForm';
import Icon from '../Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface SettingsViewProps {
    towTruck: TowTruck;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    updateTowTruckData: (truckId: string, updatedData: Partial<TowTruck>, newPassword?: string) => Promise<void>;
    settings: Settings;
    onLogout: () => void;
}

const towTruckNotificationTypes: { type: NotificationType, label: string }[] = [
    { type: 'TOW_TRUCK_VERIFIED', label: "توثيق الحساب" },
    { type: 'NEW_ANNOUNCEMENT_TOW_TRUCK', label: "إعلان جديد" },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: "الموافقة على طلب عرض فوري" },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: "رفض طلب عرض فوري" },
];

const SettingsView: React.FC<SettingsViewProps> = ({ towTruck, showToast, updateTowTruckData, settings, onLogout }) => {
    const [notificationSettings, setNotificationSettings] = useState<Partial<NotificationSettings>>({});
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setNotificationSettings(towTruck.notificationSettings || {});
    }, [towTruck]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        let newPassword: string | undefined = undefined;

        if (password) {
            if (password.length < 6) {
                showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'error');
                setIsSaving(false);
                return;
            }
            if (password !== confirmPassword) {
                showToast('كلمتا المرور غير متطابقتين.', 'error');
                setIsSaving(false);
                return;
            }
            newPassword = password;
        }

        const updatedData: Partial<TowTruck> = { notificationSettings };
        await updateTowTruckData(towTruck.id, updatedData, newPassword);

        setPassword('');
        setConfirmPassword('');
        setIsSaving(false);
        showToast('تم حفظ التغييرات بنجاح.', 'success');
    };



    return (
        <div className="p-4 sm:p-8">
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">الإعدادات</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة تفضيلات الإشعارات وأمان الحساب.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
                <Card className="p-6 shadow-md border-none">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
                        <Icon name="Bell" className="w-5 h-5" />
                        إعدادات الإشعارات
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">اختر إشعارات الرسائل التي ترغب باستلامها.</p>
                    <NotificationSettingsForm
                        availableNotifications={towTruckNotificationTypes}
                        userSettings={notificationSettings}
                        globalSettings={settings.notificationSettings}
                        onSettingsChange={setNotificationSettings}
                    />
                </Card>

                <Card className="p-6 shadow-md border-none">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-slate-800 dark:text-slate-200">
                        <Icon name="Lock" className="w-5 h-5" />
                        الأمان وتغيير كلمة المرور
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">اتركه فارغاً لعدم التغيير.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Input
                                label="كلمة المرور الجديدة"
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <Input
                                label="تأكيد كلمة المرور"
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                dir="ltr"
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isLoading={isSaving}
                        disabled={isSaving}
                        className="px-6 font-bold"
                    >
                        حفظ التغييرات
                    </Button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"><Icon name="LogOut" /> تسجيل الخروج</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الخروج من حسابك الحالي على هذا الجهاز.</p>
                    <Button type="button" onClick={onLogout} variant="danger" className="mt-4 px-6 font-bold">
                        تسجيل الخروج
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SettingsView;
