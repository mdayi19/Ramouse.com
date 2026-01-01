
import React, { useState } from 'react';
import { Settings, NotificationSettings, NotificationType } from '../../types';
import { ViewHeader } from './Shared';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface NotificationSettingsEditorProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

const NotificationSettingsEditor: React.FC<NotificationSettingsEditorProps> = ({ settings, onSave }) => {
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>(settings.notificationSettings);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setNotifSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ notificationSettings: notifSettings });
    };

    const notificationLabels: Record<NotificationType, string> = {
        FIRST_QUOTE_RECEIVED: "استلام أول عرض سعر",
        QUOTE_EXPIRING_SOON: "عرض سعر على وشك الانتهاء",
        ORDER_STATUS_CHANGED: "تغير حالة الطلب",
        STALE_ORDER_CUSTOMER: "تذكير بطلب قديم",
        NEW_ANNOUNCEMENT_CUSTOMER: "إعلان جديد للعملاء",
        PAYMENT_REJECTED: "تم رفض الدفع",
        NEW_ORDER_FOR_PROVIDER: "طلب جديد للمزود",
        QUOTE_VIEWED_BY_CUSTOMER: "عرض السعر تمت مشاهدته",
        OFFER_ACCEPTED_PROVIDER_WIN: "تم قبول عرض السعر (فوز)",
        OFFER_ACCEPTED_PROVIDER_LOSS: "تم اختيار عرض آخر (خسارة)",
        ORDER_CANCELLED: "تم إلغاء طلب",
        WITHDRAWAL_REQUEST_CONFIRMATION: "تأكيد طلب السحب",
        WITHDRAWAL_PROCESSED_APPROVED: "تمت الموافقة على السحب",
        WITHDRAWAL_PROCESSED_REJECTED: "تم رفض السحب",
        FUNDS_DEPOSITED: "تم إيداع أموال",
        PROVIDER_INACTIVITY_WARNING: "تحذير عدم النشاط للمزود",
        NEW_ANNOUNCEMENT_PROVIDER: "إعلان جديد للمزودين",
        TECHNICIAN_VERIFIED: "تم توثيق حساب فني",
        NEW_ANNOUNCEMENT_TECHNICIAN: "إعلان جديد للفنيين",
        TOW_TRUCK_VERIFIED: "تم توثيق حساب سائق السطحة",
        NEW_ANNOUNCEMENT_TOW_TRUCK: "إعلان جديد لسائقي السطحات",
        FLASH_PRODUCT_REQUEST_APPROVED: "الموافقة على طلب عرض فوري",
        FLASH_PRODUCT_REQUEST_REJECTED: "رفض طلب عرض فوري",
        HIGH_VALUE_TRANSACTION: "معاملة ذات قيمة عالية",
        STALE_ORDER_ADMIN: "إشعار بطلب قديم",
        PROVIDER_INACTIVITY_ADMIN: "إشعار بعدم نشاط مزود",
        WITHDRAWAL_REQUEST_ADMIN: "طلب سحب جديد",
        NEW_PROVIDER_REQUEST: "طلب تسجيل مزود جديد",
        NEW_TECHNICIAN_REQUEST: "طلب تسجيل فني جديد",
        NEW_TOW_TRUCK_REQUEST: "طلب تسجيل سائق سطحة جديد",
        NEW_FLASH_PRODUCT_REQUEST: "طلب عرض فوري جديد",
        REFUND_PROCESSED: "تم استرداد مبلغ",
        MANUAL_DEPOSIT_PROCESSED: "تم إيداع رصيد يدويًا",
        // New Added Keys
        ORDER_CREATED_CUSTOMER: "تم إنشاء طلب جديد (عميل)",
        ORDER_CREATED_ADMIN: "تم إنشاء طلب جديد (إدارة)",
        ORDER_READY_FOR_PICKUP: "الطلب جاهز للاستلام",
        PROVIDER_RECEIVED_ORDER: "المزود استلم الطلب",
        ORDER_SHIPPED: "تم شحن الطلب",
        ORDER_OUT_FOR_DELIVERY: "الطلب قيد التوصيل",
        ORDER_DELIVERED: "تم توصيل الطلب",
        ORDER_COMPLETED_CUSTOMER: "تم اكتمال الطلب (عميل)",
        ORDER_COMPLETED_PROVIDER: "تم اكتمال الطلب (مزود)",
        ORDER_COMPLETED_ADMIN: "تم اكتمال الطلب (إدارة)",
        ORDER_CANCELLED_CUSTOMER: "إلغاء الطلب (عميل)",
        ORDER_CANCELLED_PROVIDER: "إلغاء الطلب (مزود)",
        ORDER_CANCELLED_ADMIN: "إلغاء الطلب (إدارة)",
        SHIPPING_NOTES_UPDATED: "تحديث ملاحظات الشحن",
        NEW_REVIEW_PROVIDER: "تقييم جديد للمزود",
        NEW_REVIEW_ADMIN: "تقييم جديد (إدارة)",
        PAYMENT_UPLOADED_ADMIN: "تم رفع إيصال الدفع (إدارة)",
        PAYMENT_REUPLOADED_ADMIN: "تم إعادة رفع إيصال الدفع (إدارة)",
        quote_received: "تم استلام عرض سعر",
        DEPOSIT_REQUEST: "طلب إيداع",
        WITHDRAWAL_REQUEST: "طلب سحب",
        new_store_order: "طلب متجر جديد"
    };

    const customerKeys: NotificationType[] = ['FIRST_QUOTE_RECEIVED', 'QUOTE_EXPIRING_SOON', 'ORDER_STATUS_CHANGED', 'STALE_ORDER_CUSTOMER', 'NEW_ANNOUNCEMENT_CUSTOMER', 'PAYMENT_REJECTED'];
    const providerKeys: NotificationType[] = ['NEW_ORDER_FOR_PROVIDER', 'QUOTE_VIEWED_BY_CUSTOMER', 'OFFER_ACCEPTED_PROVIDER_WIN', 'OFFER_ACCEPTED_PROVIDER_LOSS', 'ORDER_CANCELLED', 'WITHDRAWAL_REQUEST_CONFIRMATION', 'WITHDRAWAL_PROCESSED_APPROVED', 'WITHDRAWAL_PROCESSED_REJECTED', 'FUNDS_DEPOSITED', 'PROVIDER_INACTIVITY_WARNING', 'NEW_ANNOUNCEMENT_PROVIDER', 'REFUND_PROCESSED', 'MANUAL_DEPOSIT_PROCESSED'];
    const adminKeys: NotificationType[] = ['HIGH_VALUE_TRANSACTION', 'STALE_ORDER_ADMIN', 'PROVIDER_INACTIVITY_ADMIN', 'WITHDRAWAL_REQUEST_ADMIN', 'NEW_PROVIDER_REQUEST', 'NEW_TECHNICIAN_REQUEST', 'NEW_TOW_TRUCK_REQUEST', 'NEW_FLASH_PRODUCT_REQUEST'];
    const technicianKeys: NotificationType[] = ['TECHNICIAN_VERIFIED', 'NEW_ANNOUNCEMENT_TECHNICIAN'];
    const towTruckKeys: NotificationType[] = ['TOW_TRUCK_VERIFIED', 'NEW_ANNOUNCEMENT_TOW_TRUCK'];
    const storeKeys: NotificationType[] = ['FLASH_PRODUCT_REQUEST_APPROVED', 'FLASH_PRODUCT_REQUEST_REJECTED'];


    const CheckboxField: React.FC<{ name: NotificationType }> = ({ name }) => (
        <Checkbox
            name={name}
            checked={notifSettings[name]}
            onChange={handleChange}
            label={notificationLabels[name]}
            className="p-1"
        />
    );

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة الإشعارات" subtitle="تفعيل أو تعطيل إشعارات الرسائل التلقائية." />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات العملاء</legend>
                        <div className="space-y-3">
                            {customerKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات المزودين</legend>
                        <div className="space-y-3">
                            {providerKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات الفنيين</legend>
                        <div className="space-y-3">
                            {technicianKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات سائقي السطحات</legend>
                        <div className="space-y-3">
                            {towTruckKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات المتجر والعروض</legend>
                        <div className="space-y-3">
                            {storeKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>

                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50">
                        <legend className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 w-full">إشعارات الإدارة</legend>
                        <div className="space-y-3">
                            {adminKeys.map(k => <CheckboxField key={k} name={k} />)}
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Button type="submit" size="lg">حفظ التغييرات</Button>
                </div>
            </form>
        </Card>
    );
};

export default NotificationSettingsEditor;
