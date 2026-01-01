import React, { useState } from 'react';
import { Provider, Settings, ProviderPaymentInfo, NotificationSettings, NotificationType } from '../../types';
import { ViewHeader } from '../DashboardParts/Shared';
import Icon from '../Icon';
import NotificationSettingsForm from '../NotificationSettingsForm';
import EmptyState from '../EmptyState';
import PaymentInfoFormModal from './PaymentInfoFormModal';

interface ProviderSettingsViewProps {
    provider: Provider;
    settings: Settings;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onUpdateProvider: (updatedData: Partial<Provider>) => void;
    onLogout: () => void;
}

const providerNotificationTypes: { type: NotificationType; label: string }[] = [
    { type: 'NEW_ORDER_FOR_PROVIDER', label: 'استلام طلب جديد' },
    { type: 'QUOTE_VIEWED_BY_CUSTOMER', label: 'مشاهدة العرض من قبل العميل' },
    { type: 'OFFER_ACCEPTED_PROVIDER_WIN', label: 'الفوز بعرض سعر' },
    { type: 'OFFER_ACCEPTED_PROVIDER_LOSS', label: 'خسارة عرض سعر' },
    { type: 'ORDER_CANCELLED', label: 'إلغاء طلب قدمت عرضًا له' },
    { type: 'WITHDRAWAL_REQUEST_CONFIRMATION', label: 'تأكيد استلام طلب السحب' },
    { type: 'WITHDRAWAL_PROCESSED_APPROVED', label: 'الموافقة على طلب السحب' },
    { type: 'WITHDRAWAL_PROCESSED_REJECTED', label: 'رفض طلب السحب' },
    { type: 'FUNDS_DEPOSITED', label: 'إيداع رصيد في المحفظة' },
    { type: 'PROVIDER_INACTIVITY_WARNING', label: 'تحذير عدم النشاط' },
    { type: 'NEW_ANNOUNCEMENT_PROVIDER', label: 'إعلان جديد' },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب عرض فوري' },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب عرض فوري' },
];

const ProviderSettingsView: React.FC<ProviderSettingsViewProps> = ({ provider, settings, showToast, onUpdateProvider, onLogout }) => {
    const [name, setName] = useState(provider.name);
    const [paymentInfo, setPaymentInfo] = useState<ProviderPaymentInfo[]>(provider.paymentInfo || []);
    const [notificationSettings, setNotificationSettings] = useState<Partial<NotificationSettings>>(provider.notificationSettings || {});
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingInfo, setEditingInfo] = useState<ProviderPaymentInfo | null>(null);

    const handleSave = () => {
        onUpdateProvider({ name, paymentInfo, notificationSettings });
    };

    const handleSavePaymentInfo = (infoToSave: ProviderPaymentInfo) => {
        let updatedInfo: ProviderPaymentInfo[];
        if (paymentInfo.some(pi => pi.methodId === infoToSave.methodId)) {
            updatedInfo = paymentInfo.map(pi => pi.methodId === infoToSave.methodId ? infoToSave : pi);
        } else {
            updatedInfo = [...paymentInfo, infoToSave];
        }
        setPaymentInfo(updatedInfo);
        setIsPaymentModalOpen(false);

        // Save to API immediately
        onUpdateProvider({ paymentInfo: updatedInfo });
    };

    const handleDeletePaymentInfo = (methodId: string) => {
        if (window.confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
            const updatedInfo = paymentInfo.filter(pi => pi.methodId !== methodId);
            if (updatedInfo.some(pi => pi.isPrimary) === false && updatedInfo.length > 0) {
                updatedInfo[0].isPrimary = true;
            }
            setPaymentInfo(updatedInfo);

            // Save to API immediately
            onUpdateProvider({ paymentInfo: updatedInfo });
        }
    };

    const setAsPrimaryPayment = (methodId: string) => {
        const updatedInfo = paymentInfo.map(pi => ({ ...pi, isPrimary: pi.methodId === methodId }));
        setPaymentInfo(updatedInfo);

        // Save to API immediately
        onUpdateProvider({ paymentInfo: updatedInfo });
    }

    const inputClasses = "mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm";

    return (
        <div className="p-4 sm:p-6">
            <ViewHeader title="إعدادات الحساب" subtitle="إدارة معلوماتك الشخصية، طرق الدفع وتفضيلات الإشعارات." />
            <div className="space-y-8 max-w-3xl mx-auto">
                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <label className="block text-lg font-bold text-slate-800 dark:text-slate-200">اسم الورشة / المحل</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className={`${inputClasses} mt-2`} />
                </div>

                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">طرق استلام الدفعات</h3><button onClick={() => { setEditingInfo(null); setIsPaymentModalOpen(true); }} className="bg-primary text-white font-bold px-4 py-1.5 rounded-lg text-sm">+ إضافة</button></div>
                    {paymentInfo.length > 0 ? (
                        <div className="space-y-3">
                            {paymentInfo.map(info => (
                                <div key={info.methodId} className="p-4 border rounded-lg flex justify-between items-start dark:border-slate-700 bg-slate-50 dark:bg-darkbg">
                                    <div>
                                        <h4 className="font-semibold">{info.methodName} {info.isPrimary && <span className="text-xs text-green-600">(أساسي)</span>}</h4>
                                        <p className="text-sm text-slate-500 whitespace-pre-wrap">{info.details}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!info.isPrimary && <button onClick={() => setAsPrimaryPayment(info.methodId)} className="text-xs font-semibold text-primary hover:underline">جعله أساسياً</button>}
                                        <button onClick={() => { setEditingInfo(info); setIsPaymentModalOpen(true); }} className="text-blue-500"><Icon name="Edit" /></button>
                                        <button onClick={() => handleDeletePaymentInfo(info.methodId)} className="text-red-500"><Icon name="Trash2" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="لم تقم بإضافة أي طرق دفع بعد." />
                    )}
                </div>

                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">إعدادات الإشعارات</h3>
                    <p className="text-xs text-slate-500 mb-4">اختر إشعارات الرسائل التي ترغب باستلامها.</p>
                    <NotificationSettingsForm
                        availableNotifications={providerNotificationTypes}
                        userSettings={notificationSettings}
                        globalSettings={settings.notificationSettings}
                        onSettingsChange={setNotificationSettings}
                    />
                </div>

                <div className="flex justify-end pt-4 border-t dark:border-slate-700">
                    <button onClick={handleSave} className="bg-primary text-white font-bold px-8 py-2.5 rounded-lg">حفظ كل التغييرات</button>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2"><Icon name="LogOut" /> تسجيل الخروج</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">الخروج من حسابك الحالي على هذا الجهاز.</p>
                    <button type="button" onClick={onLogout} className="mt-4 bg-red-100 text-red-700 font-bold px-6 py-2 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900">
                        تسجيل الخروج
                    </button>
                </div>
            </div>
            {isPaymentModalOpen && <PaymentInfoFormModal paymentInfo={editingInfo} existingMethods={paymentInfo} systemMethods={settings.paymentMethods} onSave={handleSavePaymentInfo} onClose={() => setIsPaymentModalOpen(false)} />}
        </div>
    );
};

export default ProviderSettingsView;