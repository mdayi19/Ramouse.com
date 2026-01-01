import React, { useState, useEffect } from 'react';
import { Customer, NotificationSettings, NotificationType, Settings } from '../types';
import NotificationSettingsForm from './NotificationSettingsForm';
import Icon from './Icon';
import { AuthService } from '../services/auth.service';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';

interface CustomerSettingsProps {
    userPhone: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onUpdateCustomer: (updatedData: Partial<Customer>, newPassword?: string) => Promise<void>;
    settings: Settings;
    onLogout: () => void;
}

const customerNotificationTypes: { type: NotificationType, label: string }[] = [
    { type: 'FIRST_QUOTE_RECEIVED', label: "استلام أول عرض سعر" },
    { type: 'QUOTE_EXPIRING_SOON', label: "عرض سعر على وشك الانتهاء" },
    { type: 'ORDER_STATUS_CHANGED', label: "تغير حالة الطلب" },
    { type: 'STALE_ORDER_CUSTOMER', label: "تذكير بطلب قديم" },
    { type: 'NEW_ANNOUNCEMENT_CUSTOMER', label: "إعلان جديد" },
];

const CustomerSettings: React.FC<CustomerSettingsProps> = ({ userPhone, showToast, onUpdateCustomer, settings, onLogout }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [notificationSettings, setNotificationSettings] = useState<Partial<NotificationSettings>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const user = await AuthService.getProfile();
                if (user) {
                    setName(user.name || '');
                    setAddress(user.address || '');
                    setNotificationSettings(user.notificationSettings || {});
                }
            } catch (error) {
                console.error('Failed to fetch profile:', error);
                const allCustomersRaw = localStorage.getItem('all_customers');
                if (allCustomersRaw) {
                    const allCustomers: Customer[] = JSON.parse(allCustomersRaw);
                    const currentUser = allCustomers.find(c => c.id === userPhone);
                    if (currentUser) {
                        setName(currentUser.name || '');
                        setAddress(currentUser.address || '');
                        setNotificationSettings(currentUser.notificationSettings || {});
                    }
                }
            }
        };
        fetchProfile();
    }, [userPhone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        let newPassword: string | undefined = undefined;

        if (password) {
            if (password.length < 6) {
                showToast('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.', 'error');
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

        const updatedData: Partial<Customer> = { name, address, notificationSettings };
        await onUpdateCustomer(updatedData, newPassword);

        // Clear password fields after successful save
        setPassword('');
        setConfirmPassword('');
        setIsSaving(false);
    };

    return (
        <Card className="p-4 sm:p-8 bg-white dark:bg-darkcard rounded-xl shadow-lg animate-fade-in w-full h-full border-none">
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">إعدادات الحساب</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">إدارة معلوماتك الشخصية وتفضيلات الإشعارات.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
                <div>
                    <Input
                        label="الاسم الكامل"
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="اسمك الذي سيظهر للمزودين"
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">عنوان التوصيل الافتراضي</label>
                    <textarea
                        id="address"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground"
                        placeholder="مثال: دمشق - المزة - جانب حديقة الطلائع"
                    />
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">إعدادات الإشعارات</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">اختر إشعارات الرسائل التي ترغب باستلامها.</p>
                    <div className="mt-4">
                        <NotificationSettingsForm
                            availableNotifications={customerNotificationTypes}
                            userSettings={notificationSettings}
                            globalSettings={settings.notificationSettings}
                            onSettingsChange={setNotificationSettings}
                        />
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">تغيير كلمة المرور</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">اتركه فارغاً لعدم التغيير. يجب أن تكون كلمة المرور 6 أحرف على الأقل.</p>
                </div>
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

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        isLoading={isSaving}
                        disabled={isSaving}
                        className="px-6"
                    >
                        حفظ التغييرات
                    </Button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"><Icon name="LogOut" /> تسجيل الخروج</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الخروج من حسابك الحالي على هذا الجهاز.</p>
                    <Button type="button" onClick={onLogout} variant="danger" className="mt-4 px-6">
                        تسجيل الخروج
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default CustomerSettings;