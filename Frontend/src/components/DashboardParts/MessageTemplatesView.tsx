import React, { useState, useEffect } from 'react';
import { Settings, NotificationType, MessageTemplate } from '../../types';
import { ViewHeader, Icon } from './Shared';
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
    category: string;
};

const customerTemplates: TemplateDefinition[] = [
    { type: 'FIRST_QUOTE_RECEIVED', label: 'استلام عرض سعر جديد', placeholders: ['{orderNumber}'], category: 'customers' },
    { type: 'ORDER_STATUS_CHANGED', label: 'تغير حالة الطلب', placeholders: ['{orderNumber}', '{status}'], category: 'customers' },
    { type: 'PAYMENT_REJECTED', label: 'رفض إيصال الدفع', placeholders: ['{orderNumber}', '{reason}'], category: 'customers' },
    { type: 'NEW_ANNOUNCEMENT_CUSTOMER', label: 'إعلان جديد للعملاء', placeholders: ['{appName}', '{title}'], category: 'customers' },
    { type: 'QUOTE_EXPIRING_SOON', label: 'عرض سعر على وشك الانتهاء', placeholders: ['{orderNumber}'], category: 'customers' },
    { type: 'STALE_ORDER_CUSTOMER', label: 'تذكير بطلب قديم', placeholders: ['{orderNumber}'], category: 'customers' },
];

const providerTemplates: TemplateDefinition[] = [
    { type: 'NEW_ORDER_FOR_PROVIDER', label: 'استلام طلب جديد', placeholders: ['{brand}', '{model}', '{year}', '{category}', '{orderNumber}'], category: 'providers' },
    { type: 'QUOTE_VIEWED_BY_CUSTOMER', label: 'مشاهدة العرض من قبل العميل', placeholders: ['{orderNumber}'], category: 'providers' },
    { type: 'OFFER_ACCEPTED_PROVIDER_WIN', label: 'الفوز بعرض سعر', placeholders: ['{orderNumber}'], category: 'providers' },
    { type: 'OFFER_ACCEPTED_PROVIDER_LOSS', label: 'خسارة عرض سعر', placeholders: ['{orderNumber}'], category: 'providers' },
    { type: 'ORDER_CANCELLED', label: 'إلغاء طلب مقدم عليه', placeholders: ['{orderNumber}'], category: 'providers' },
    { type: 'WITHDRAWAL_REQUEST_CONFIRMATION', label: 'تأكيد استلام طلب السحب', placeholders: ['{amount}'], category: 'providers' },
    { type: 'WITHDRAWAL_PROCESSED_APPROVED', label: 'الموافقة على طلب السحب', placeholders: ['{amount}'], category: 'providers' },
    { type: 'WITHDRAWAL_PROCESSED_REJECTED', label: 'رفض طلب السحب', placeholders: ['{reason}'], category: 'providers' },
    { type: 'FUNDS_DEPOSITED', label: 'إيداع رصيد في المحفظة', placeholders: ['{amount}', '{description}'], category: 'providers' },
    { type: 'NEW_ANNOUNCEMENT_PROVIDER', label: 'إعلان جديد للمزودين', placeholders: ['{appName}', '{title}'], category: 'providers' },
    { type: 'PROVIDER_INACTIVITY_WARNING', label: 'تحذير عدم النشاط', placeholders: ['{appName}'], category: 'providers' },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'], category: 'providers' },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'], category: 'providers' },
];

const technicianTemplates: TemplateDefinition[] = [
    { type: 'TECHNICIAN_VERIFIED', label: 'توثيق حساب فني', placeholders: ['{technicianName}', '{appName}'], category: 'technicians' },
    { type: 'NEW_ANNOUNCEMENT_TECHNICIAN', label: 'إعلان جديد للفنيين', placeholders: ['{appName}', '{title}'], category: 'technicians' },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'], category: 'technicians' },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'], category: 'technicians' },
];

const towTruckTemplates: TemplateDefinition[] = [
    { type: 'TOW_TRUCK_VERIFIED', label: 'توثيق حساب سائق سطحة', placeholders: ['{towTruckName}', '{appName}'], category: 'tow_trucks' },
    { type: 'NEW_ANNOUNCEMENT_TOW_TRUCK', label: 'إعلان جديد لسائقي السطحات', placeholders: ['{appName}', '{title}'], category: 'tow_trucks' },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'], category: 'tow_trucks' },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'], category: 'tow_trucks' },
];

const carProviderTemplates: TemplateDefinition[] = [
    { type: 'CAR_PROVIDER_VERIFIED', label: 'توثيق حساب معرض سيارات', placeholders: ['{carProviderName}', '{appName}'], category: 'car_providers' },
    { type: 'NEW_ANNOUNCEMENT_CAR_PROVIDER', label: 'إعلان جديد لمعارض السيارات', placeholders: ['{appName}', '{title}'], category: 'car_providers' },
    { type: 'FLASH_PRODUCT_REQUEST_APPROVED', label: 'الموافقة على طلب العرض الفوري', placeholders: ['{productName}'], category: 'car_providers' },
    { type: 'FLASH_PRODUCT_REQUEST_REJECTED', label: 'رفض طلب العرض الفوري', placeholders: ['{productName}', '{reason}'], category: 'car_providers' },
];

const adminTemplates: TemplateDefinition[] = [
    { type: 'NEW_PROVIDER_REQUEST', label: 'طلب تسجيل مزود جديد', placeholders: ['{providerName}', '{phone}'], category: 'admin' },
    { type: 'NEW_TECHNICIAN_REQUEST', label: 'طلب تسجيل فني جديد', placeholders: ['{technicianName}', '{phone}'], category: 'admin' },
    { type: 'NEW_TOW_TRUCK_REQUEST', label: 'طلب تسجيل سائق سطحة جديد', placeholders: ['{towTruckName}', '{phone}'], category: 'admin' },
    { type: 'NEW_CAR_PROVIDER_REQUEST', label: 'طلب تسجيل معرض سيارات جديد', placeholders: ['{carProviderName}', '{phone}'], category: 'admin' },
    { type: 'WITHDRAWAL_REQUEST_ADMIN', label: 'طلب سحب جديد', placeholders: ['{providerName}', '{amount}'], category: 'admin' },
];

const TemplateEditor: React.FC<{
    definition: TemplateDefinition;
    value: MessageTemplate;
    onChange: (value: MessageTemplate) => void;
    defaultTemplate?: string;
}> = ({ definition, value, onChange, defaultTemplate }) => {
    return (
        <Card className="group overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-md hover:shadow-lg transition-all duration-300">
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <label htmlFor={definition.type} className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                            {definition.label}
                        </label>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                            type="checkbox"
                            checked={value.enabled}
                            onChange={e => onChange({ ...value, enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 
                            peer-checked:after:translate-x-full peer-checked:after:border-white 
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                            after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 
                            after:transition-all dark:border-slate-600 peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-blue-500">
                        </div>
                    </label>
                </div>
                <Textarea
                    id={definition.type}
                    value={value.template}
                    onChange={e => onChange({ ...value, template: e.target.value })}
                    rows={3}
                    placeholder={defaultTemplate ? "اتركه فارغاً لاستخدام النص الافتراضي للنظام" : ""}
                    className="bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                />

                {/* Show default if empty and default exists */}
                {!value.template && defaultTemplate && (
                    <div className="mt-3 text-xs p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <span className="font-bold block mb-1.5 text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <Icon name="Code" className="w-3.5 h-3.5" />
                            النص الافتراضي:
                        </span>
                        <p className="text-blue-600 dark:text-blue-400" style={{ whiteSpace: 'pre-wrap' }}>{defaultTemplate}</p>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-2 flex items-center gap-1.5">
                        <Icon name="Braces" className="w-3.5 h-3.5" />
                        المتغيرات المتاحة:
                    </span>
                    <div className="flex flex-wrap gap-2" dir="ltr">
                        {definition.placeholders.map(p => (
                            <Badge key={p} variant="secondary" className="font-mono text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                                {p}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

const MessageTemplatesView: React.FC<MessageTemplatesViewProps> = ({ settings, onSave }) => {
    const [templates, setTemplates] = useState(settings.messageTemplates || {});
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('customers');

    useEffect(() => {
        setTemplates(settings.messageTemplates || {});
    }, [settings]);

    const handleTemplateChange = (type: NotificationType, value: MessageTemplate) => {
        setTemplates(prev => ({ ...prev, [type]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ messageTemplates: templates });
        setShowSuccess(true);
        setTimeout(() => {
            setIsSaving(false);
            setShowSuccess(false);
        }, 2000);
    };

    const getSystemDefault = (type: NotificationType): string | undefined => {
        if (!settings.default_message_templates) return undefined;
        const map: Record<string, string> = {
            'ORDER_STATUS_CHANGED': 'status_update',
            'NEW_ANNOUNCEMENT_CUSTOMER': 'new_announcement',
            'NEW_ORDER_FOR_PROVIDER': 'new_order',
            'FIRST_QUOTE_RECEIVED': 'quote_received',
            'ORDER_COMPLETED_CUSTOMER': 'store_confirmation',
        };
        return settings.default_message_templates[map[type]] || settings.default_message_templates[type.toLowerCase()];
    };

    const templateGroups = [
        { id: 'customers', title: 'رسائل العملاء', icon: 'Users', templates: customerTemplates, color: 'from-blue-500 to-indigo-500' },
        { id: 'providers', title: 'رسائل المزودين', icon: 'Package', templates: providerTemplates, color: 'from-emerald-500 to-teal-500' },
        { id: 'technicians', title: 'رسائل الفنيين', icon: 'Wrench', templates: technicianTemplates, color: 'from-purple-500 to-pink-500' },
        { id: 'tow_trucks', title: 'رسائل سائقي السطحات', icon: 'Truck', templates: towTruckTemplates, color: 'from-amber-500 to-orange-500' },
        { id: 'car_providers', title: 'رسائل معارض السيارات', icon: 'Car', templates: carProviderTemplates, color: 'from-rose-500 to-red-500' },
        { id: 'admin', title: 'رسائل المشرف', icon: 'Shield', templates: adminTemplates, color: 'from-slate-500 to-gray-500' },
    ];

    const activeGroup = templateGroups.find(g => g.id === activeCategory);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Card */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shadow-lg">
                            <Icon name="MessageSquare" className="w-7 h-7 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <ViewHeader title="💬 قوالب رسائl WhatsApp" subtitle="تخصيص الرسائل التلقائية وتفعيلها أو تعطيلها." />
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
                {/* Category Tabs */}
                <Card className="p-5 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {templateGroups.map((group) => (
                            <button
                                key={group.id}
                                type="button"
                                onClick={() => setActiveCategory(group.id)}
                                className={`
                                    group relative p-4 rounded-xl border-2 transition-all duration-300
                                    ${activeCategory === group.id
                                        ? 'border-primary bg-gradient-to-br from-primary/10 to-blue-500/10 shadow-md'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                <div className={`
                                    w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 transition-all duration-300
                                    ${activeCategory === group.id
                                        ? `bg-gradient-to-br ${group.color} text-white shadow-lg`
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:scale-110'
                                    }
                                `}>
                                    <Icon name={group.icon as any} className="w-5 h-5" />
                                </div>
                                <div className={`text-xs font-medium text-center ${activeCategory === group.id ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {group.title}
                                </div>
                                <div className={`text-[10px] text-center mt-1 ${activeCategory === group.id ? 'text-primary/70' : 'text-slate-500'}`}>
                                    {group.templates.length} قالب
                                </div>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* Templates Grid */}
                {activeGroup && (
                    <div className="space-y-4">
                        <div className={`p-1 rounded-2xl bg-gradient-to-r ${activeGroup.color}`}>
                            <div className="bg-white dark:bg-darkcard rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeGroup.color} text-white flex items-center justify-center shadow-lg`}>
                                        <Icon name={activeGroup.icon as any} className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{activeGroup.title}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">{activeGroup.templates.length} قالب رسالة</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {activeGroup.templates.map(def => (
                                <TemplateEditor
                                    key={def.type}
                                    definition={def}
                                    value={templates[def.type] || { template: '', enabled: true }}
                                    onChange={(value) => handleTemplateChange(def.type, value)}
                                    defaultTemplate={getSystemDefault(def.type)}
                                />
                            ))}
                        </div>
                    </div>
                )}

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
                                    حفظ جميع التغييرات
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
};

export default MessageTemplatesView;
