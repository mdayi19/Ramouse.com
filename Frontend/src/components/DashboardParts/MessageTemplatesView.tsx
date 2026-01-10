import React, { useState, useEffect } from 'react';
import { Settings, NotificationType, MessageTemplate } from '../../types';
import { ViewHeader } from './Shared';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';

interface MessageTemplatesViewProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

type TemplateDefinition = {
    type: NotificationType;
    label: string;
    placeholders: string[];
};

const customerTemplates: TemplateDefinition[] = [
    { type: 'FIRST_QUOTE_RECEIVED', label: 'استلام عرض سعر جديد', placeholders: ['{orderNumber}'] },
    { type: 'ORDER_STATUS_CHANGED', label: 'تغير حالة الطلب', placeholders: ['{orderNumber}', '{status}'] },
    { type: 'PAYMENT_REJECTED', label: 'رفض إيصال الدفع', placeholders: ['{orderNumber}', '{reason}'] },
    { type: 'NEW_ANNOUNCEMENT_CUSTOMER', label: 'إعلان جديد للعملاء', placeholders: ['{appName}', '{title}'] },
    { type: 'QUOTE_EXPIRING_SOON', label: 'عرض سعر على وشك الانتهاء', placeholders: ['{orderNumber}'] },
    { type: 'STALE_ORDER_CUSTOMER', label: 'تذكير بطلب قديم', placeholders: ['{orderNumber}'] },
];

const providerTemplates: TemplateDefinition[] = [
    { type: 'NEW_ORDER_FOR_PROVIDER', label: 'استلام طلب جديد', placeholders: ['{brand}', '{model}', '{year}', '{category}', '{orderNumber}'] },
    { type: 'QUOTE_VIEWED_BY_CUSTOMER', label: 'مشاهدة العرض من قبل العميل', placeholders: ['{orderNumber}'] },
    { type: 'OFFER_ACCEPTED_PROVIDER_WIN', label: 'الفوز بعرض سعر', placeholders: ['{orderNumber}'] },
    { type: 'OFFER_ACCEPTED_PROVIDER_LOSS', label: 'خسارة عرض سعر', placeholders: ['{orderNumber}'] },
    { type: 'ORDER_CANCELLED', label: 'إلغاء طلب مقدم عليه', placeholders: ['{orderNumber}'] },
    { type: 'WITHDRAWAL_REQUEST_CONFIRMATION', label: 'تأكيد استلام طلب السحب', placeholders: ['{amount}'] },
    { type: 'WITHDRAWAL_PROCESSED_APPROVED', label: 'الموافقة على طلب السحب', placeholders: ['{amount}'] },
    { type: 'WITHDRAWAL_PROCESSED_REJECTED', label: 'رفض طلب السحب', placeholders: ['{reason}'] },
    { type: 'FUNDS_DEPOSITED', label: 'إيداع رصيد في المحفظة', placeholders: ['{amount}', '{description}'] },
    { type: 'NEW_ANNOUNCEMENT_PROVIDER', label: 'إعلان جديد للمزودين', placeholders: ['{appName}', '{title}'] },
    { type: 'PROVIDER_INACTIVITY_WARNING', label: 'تحذير عدم النشاط', placeholders: ['{appName}'] },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'] },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'] },
];

const technicianTemplates: TemplateDefinition[] = [
    { type: 'TECHNICIAN_VERIFIED', label: 'توثيق حساب فني', placeholders: ['{technicianName}', '{appName}'] },
    { type: 'NEW_ANNOUNCEMENT_TECHNICIAN', label: 'إعلان جديد للفنيين', placeholders: ['{appName}', '{title}'] },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'] },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'] },
];

const towTruckTemplates: TemplateDefinition[] = [
    { type: 'TOW_TRUCK_VERIFIED', label: 'توثيق حساب سائق سطحة', placeholders: ['{towTruckName}', '{appName}'] },
    { type: 'NEW_ANNOUNCEMENT_TOW_TRUCK', label: 'إعلان جديد لسائقي السطحات', placeholders: ['{appName}', '{title}'] },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'] },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'] },
];

const carProviderTemplates: TemplateDefinition[] = [
    { type: 'CAR_PROVIDER_VERIFIED', label: 'توثيق حساب معرض سيارات', placeholders: ['{carProviderName}', '{appName}'] },
    { type: 'NEW_ANNOUNCEMENT_CAR_PROVIDER', label: 'إعلان جديد لمعارض السيارات', placeholders: ['{appName}', '{title}'] },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'] },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'] },
];

const adminTemplates: TemplateDefinition[] = [
    { type: 'NEW_PROVIDER_REQUEST', label: 'طلب تسجيل مزود جديد', placeholders: ['{providerName}', '{phone}'] },
    { type: 'NEW_TECHNICIAN_REQUEST', label: 'طلب تسجيل فني جديد', placeholders: ['{technicianName}', '{phone}'] },
    { type: 'NEW_TOW_TRUCK_REQUEST', label: 'طلب تسجيل سائق سطحة جديد', placeholders: ['{towTruckName}', '{phone}'] },
    { type: 'NEW_CAR_PROVIDER_REQUEST', label: 'طلب تسجيل معرض سيارات جديد', placeholders: ['{carProviderName}', '{phone}'] },
    { type: 'WITHDRAWAL_REQUEST_ADMIN', label: 'طلب سحب جديد', placeholders: ['{providerName}', '{amount}'] },
];

const TemplateEditor: React.FC<{
    definition: TemplateDefinition;
    value: MessageTemplate;
    onChange: (value: MessageTemplate) => void;
    defaultTemplate?: string;
}> = ({ definition, value, onChange, defaultTemplate }) => {
    return (
        <Card className="p-4 bg-slate-50 dark:bg-slate-900/50 border dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
                <label htmlFor={definition.type} className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                    {definition.label}
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={value.enabled}
                        onChange={e => onChange({ ...value, enabled: e.target.checked })}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 
                        peer-checked:after:translate-x-full peer-checked:after:border-white 
                        after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                        after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 
                        after:transition-all dark:border-slate-600 peer-checked:bg-primary">
                    </div>
                </label>
            </div>
            <Textarea
                id={definition.type}
                value={value.template}
                onChange={e => onChange({ ...value, template: e.target.value })}
                rows={3}
                placeholder={defaultTemplate ? "اتركه فارغاً لاستخدام النص الافتراضي للنظام" : ""}
                className="bg-white dark:bg-slate-900"
            />

            {/* Show default if empty and default exists */}
            {!value.template && defaultTemplate && (
                <div className="mt-2 text-xs p-3 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <span className="font-bold block mb-1">النص الافتراضي (System Default):</span>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{defaultTemplate}</p>
                </div>
            )}

            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold block mb-2">المتغيرات المتاحة:</span>
                <div className="flex flex-wrap gap-2" dir="ltr">
                    {definition.placeholders.map(p => (
                        <Badge key={p} variant="secondary" className="font-mono text-xs dir-ltr">
                            {p}
                        </Badge>
                    ))}
                </div>
            </div>
        </Card>
    );
};


const MessageTemplatesView: React.FC<MessageTemplatesViewProps> = ({ settings, onSave }) => {
    const [templates, setTemplates] = useState(settings.messageTemplates || {});

    useEffect(() => {
        setTemplates(settings.messageTemplates || {});
    }, [settings]);

    const handleTemplateChange = (type: NotificationType, value: MessageTemplate) => {
        setTemplates(prev => ({ ...prev, [type]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            messageTemplates: templates,
        });
    };

    const getSystemDefault = (type: NotificationType): string | undefined => {
        if (!settings.default_message_templates) return undefined;
        // Map types to default keys
        const map: Record<string, string> = {
            'ORDER_STATUS_CHANGED': 'status_update',
            'NEW_ANNOUNCEMENT_CUSTOMER': 'new_announcement', // If you add this to lang file
            'NEW_ORDER_FOR_PROVIDER': 'new_order',
            'FIRST_QUOTE_RECEIVED': 'quote_received',
            'ORDER_COMPLETED_CUSTOMER': 'store_confirmation',
            // Add more mappings as you add them to the lang file
        };
        return settings.default_message_templates[map[type]] || settings.default_message_templates[type.toLowerCase()];
    };

    const TemplateGroup: React.FC<{ title: string, definitions: TemplateDefinition[] }> = ({ title, definitions }) => (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
            {definitions.map(def => (
                <TemplateEditor
                    key={def.type}
                    definition={def}
                    value={templates[def.type] || { template: '', enabled: true }}
                    onChange={(value) => handleTemplateChange(def.type, value)}
                    defaultTemplate={getSystemDefault(def.type)}
                />
            ))}
        </div>
    );

    return (
        <Card className="p-6">
            <ViewHeader title="قوالب رسائل WhatsApp" subtitle="تخصيص الرسائل التلقائية وتفعيلها أو تعطيلها." />

            <form onSubmit={handleSubmit} className="mt-6 space-y-8">

                <TemplateGroup title="رسائل العملاء" definitions={customerTemplates} />
                <TemplateGroup title="رسائل المزودين" definitions={providerTemplates} />
                <TemplateGroup title="رسائل الفنيين" definitions={technicianTemplates} />
                <TemplateGroup title="رسائل سائقي السطحات" definitions={towTruckTemplates} />
                <TemplateGroup title="رسائل معارض السيارات" definitions={carProviderTemplates} />
                <TemplateGroup title="رسائل المشرف (Admin)" definitions={adminTemplates} />

                <div className="flex justify-end pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
                    <Button type="submit" variant="primary" size="lg">
                        حفظ التغييرات
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default MessageTemplatesView;
