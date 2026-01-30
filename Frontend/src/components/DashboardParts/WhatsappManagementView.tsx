import React, { useState, useEffect } from 'react';
import { Settings, MessagingAPI } from '../../types';
import Modal from '../Modal';
import { ViewHeader, EditIcon, DeleteIcon, Icon } from './Shared';
import { AdminService } from '../../services/admin.service';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface WhatsappManagementViewProps {
    settings: Settings;
    onSave: (s: Partial<Settings>) => void;
}

// Reusable modal for adding/editing APIs
const ApiFormModal: React.FC<{
    api: MessagingAPI | null;
    apiType: 'verification' | 'notification';
    onSave: (api: MessagingAPI, type: 'verification' | 'notification') => void;
    onClose: () => void;
}> = ({ api, apiType, onSave, onClose }) => {
    const [formData, setFormData] = useState<Omit<MessagingAPI, 'id' | 'isActive'>>({
        name: '', apiUrl: '', appKey: '', authKey: ''
    });
    const isEditing = !!api;

    useEffect(() => {
        if (api) {
            setFormData({ name: api.name, apiUrl: api.apiUrl, appKey: api.appKey, authKey: api.authKey });
        } else {
            setFormData({ name: '', apiUrl: '', appKey: '', authKey: '' });
        }
    }, [api]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const apiToSave: MessagingAPI = {
            id: api?.id || `api-${Date.now()}`,
            isActive: api?.isActive ?? true,
            ...formData
        };
        onSave(apiToSave, apiType);
    };

    return (
        <Modal title={isEditing ? 'تعديل API' : 'إضافة API جديد'} onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="اسم مميز للـ API"
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="bg-slate-50 dark:bg-slate-900/50"
                />
                <Input
                    label="API URL"
                    type="url"
                    id="apiUrl"
                    name="apiUrl"
                    value={formData.apiUrl}
                    onChange={handleChange}
                    className="text-left bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                    dir="ltr"
                    required
                />
                <Input
                    label="App Key"
                    type="text"
                    id="appKey"
                    name="appKey"
                    value={formData.appKey}
                    onChange={handleChange}
                    className="text-left bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                    dir="ltr"
                    required
                />
                <Input
                    label="Auth Key"
                    type="text"
                    id="authKey"
                    name="authKey"
                    value={formData.authKey}
                    onChange={handleChange}
                    className="text-left bg-slate-50 dark:bg-slate-900/50 font-mono text-sm"
                    dir="ltr"
                    required
                />
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <Button onClick={onClose} variant="ghost" type="button">
                        إلغاء
                    </Button>
                    <Button type="submit" variant="primary">
                        حفظ
                    </Button>
                </div>
            </form>
        </Modal>
    );
};


const WhatsappManagementView: React.FC<WhatsappManagementViewProps> = ({ settings, onSave }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApi, setEditingApi] = useState<{ api: MessagingAPI | null; type: 'verification' | 'notification' } | null>(null);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Test message from Ramouse');
    const [sendingTest, setSendingTest] = useState(false);

    const handleSendTest = async () => {
        if (!testPhone) return alert('الرجاء إدخال رقم الهاتف');
        setSendingTest(true);
        try {
            await AdminService.testWhatsapp(testPhone, testMessage);
            alert('تم إرسال الرسالة بنجاح!');
        } catch (e) {
            console.error(e);
            alert('فشل الإرسال. تأكد من الإعدادات.');
        } finally {
            setSendingTest(false);
        }
    };

    const handleOpenModal = (api: MessagingAPI | null, type: 'verification' | 'notification') => {
        setEditingApi({ api, type });
        setIsModalOpen(true);
    };

    const handleSaveApi = (apiToSave: MessagingAPI, type: 'verification' | 'notification') => {
        const key = type === 'verification' ? 'verificationApis' : 'notificationApis';
        const apis = settings[key] || [];

        let updatedApis: MessagingAPI[];
        if (apis.some(a => a.id === apiToSave.id)) {
            updatedApis = apis.map(a => a.id === apiToSave.id ? apiToSave : a);
        } else {
            updatedApis = [...apis, apiToSave];
        }
        onSave({ [key]: updatedApis });
        setIsModalOpen(false);
    };

    const handleDeleteApi = (apiId: string, type: 'verification' | 'notification') => {
        if (window.confirm('هل أنت متأكد من حذف هذا الـ API؟')) {
            const key = type === 'verification' ? 'verificationApis' : 'notificationApis';
            const apis = settings[key] || [];
            const updatedApis = apis.filter(a => a.id !== apiId);
            onSave({ [key]: updatedApis });
        }
    };

    const handleToggleActive = (apiId: string, type: 'verification' | 'notification') => {
        const key = type === 'verification' ? 'verificationApis' : 'notificationApis';
        const apis = settings[key] || [];
        const updatedApis = apis.map(a => a.id === apiId ? { ...a, isActive: !a.isActive } : a);
        onSave({ [key]: updatedApis });
    };

    const handleGlobalToggle = () => {
        onSave({ whatsappNotificationsActive: !settings.whatsappNotificationsActive });
    };

    const ApiList: React.FC<{
        title: string;
        description: string;
        type: 'verification' | 'notification';
        apis: MessagingAPI[];
        color: string;
        icon: string;
    }> = ({ title, description, type, apis, color, icon }) => (
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
            <div className={`bg-gradient-to-r ${color} p-5 rounded-t-xl`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Icon name={icon as any} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{title}</h3>
                            <p className="text-sm text-white/80">{description}</p>
                        </div>
                    </div>
                    <Button size="sm" onClick={() => handleOpenModal(null, type)} className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        <Icon name="Plus" className="w-4 h-4 ml-1" /> إضافة
                    </Button>
                </div>
            </div>
            <div className="p-5">
                <div className="space-y-3">
                    {apis.map((api, index) => (
                        <Card
                            key={api.id}
                            className="border bg-slate-50 dark:bg-slate-900/50 dark:border-slate-700 shadow-sm hover:shadow-md transition-all animate-fade-in"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="p-4 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{api.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1" dir="ltr">{api.apiUrl}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="relative inline-flex items-center cursor-pointer" title={api.isActive ? 'مفعل' : 'معطل'}>
                                        <input type="checkbox" checked={api.isActive} onChange={() => handleToggleActive(api.id, type)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500"></div>
                                    </label>
                                    <Button size="icon" variant="ghost" onClick={() => handleOpenModal(api, type)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 h-8 w-8" title="تعديل">
                                        <EditIcon className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteApi(api.id, type)} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8" title="حذف">
                                        <DeleteIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {apis.length === 0 && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                <Icon name="Package" className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-sm text-slate-500">لا توجد واجهات API مضافة</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-darkcard/90 dark:to-slate-900/90 border-none shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shadow-lg">
                        <Icon name="MessageCircle" className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <ViewHeader title="💬 إدارة WhatsApp" subtitle="إضافة وتعديل واجهات برمجة التطبيقات المستخدمة لإرسال رسائل التحقق والإشعارات." />
                    </div>
                </div>
            </Card>

            {/* Global Status */}
            <Card className={cn(
                "backdrop-blur-xl border-2 transition-all shadow-lg",
                settings.whatsappNotificationsActive
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
                    : 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20'
            )}>
                <div className="p-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-md",
                            settings.whatsappNotificationsActive
                                ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                : 'bg-gradient-to-br from-red-500 to-rose-500'
                        )}>
                            <Icon name={settings.whatsappNotificationsActive ? "Check" : "X"} className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">الحالة العامة لرسائل WhatsApp</h3>
                            <p className={cn(
                                "font-semibold text-lg",
                                settings.whatsappNotificationsActive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                            )}>
                                {settings.whatsappNotificationsActive ? '✓ مفعل' : '✗ متوقف'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                هذا المفتاح يتحكم بجميع رسائل الواتساب الصادرة من النظام
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.whatsappNotificationsActive} onChange={handleGlobalToggle} className="sr-only peer" />
                        <div className={cn(
                            "w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all",
                            settings.whatsappNotificationsActive ? 'peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500' : 'peer-checked:bg-slate-500'
                        )}></div>
                    </label>
                </div>
            </Card>

            {/* Environment Fallback Indicator */}
            {settings.whatsapp_env_status?.has_env_keys && (
                (!settings.verificationApis?.length && !settings.notificationApis?.length) ||
                (!settings.verificationApis?.some(a => a.isActive) && !settings.notificationApis?.some(a => a.isActive))
            ) && (
                    <Card className="backdrop-blur-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
                        <div className="p-5 flex items-start gap-3">
                            <Icon name="Info" className="w-6 h-6 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                            <div>
                                <h4 className="font-bold text-blue-800 dark:text-blue-300">يعمل النظام بوضع البيئة (Environment Mode)</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                    لا توجد حالياً أي واجهات API مفعلة في قاعدة البيانات. يستخدم النظام إعدادات البيئة الاحتياطية (env) للإرسال.
                                </p>
                                <div className="mt-2 text-xs font-mono bg-white/50 dark:bg-black/30 p-2 rounded inline-block text-blue-900 dark:text-blue-200">
                                    App Key: {settings.whatsapp_env_status.env_app_key_preview}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

            {/* API Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ApiList
                    title="واجهات التحقق (OTP)"
                    description="إرسال رموز التحقق للمستخدمين"
                    type="verification"
                    apis={settings.verificationApis || []}
                    color="from-purple-500 to-pink-500"
                    icon="Shield"
                />
                <ApiList
                    title="واجهات الإشعارات"
                    description="إرسال جميع الإشعارات الأخرى"
                    type="notification"
                    apis={settings.notificationApis || []}
                    color="from-blue-500 to-cyan-500"
                    icon="Bell"
                />
            </div>

            {/* Info Note */}
            <Card className="backdrop-blur-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800 shadow-lg">
                <div className="p-5 flex items-start gap-3">
                    <Icon name="Lightbulb" className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>ملاحظة:</strong> يستخدم النظام هذه الواجهات بترتيب دوري (Round-robin) مع تجاوز الفاشلة منها. سيتم استخدام الواجهة المفعلة التالية في القائمة في حال فشل الإرسال من الواجهة الحالية.
                    </p>
                </div>
            </Card>

            {/* Test Section */}
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-5 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Icon name="Send" className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">اختبار الإرسال</h3>
                            <p className="text-sm text-emerald-100">إرسال رسالة تجريبية للتأكد من الإعدادات</p>
                        </div>
                    </div>
                </div>
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="رقم الهاتف (مع الرمز الدولي)"
                                value={testPhone}
                                onChange={e => setTestPhone(e.target.value)}
                                placeholder="+963..."
                                dir="ltr"
                                className="bg-slate-50 dark:bg-slate-900/50"
                            />
                        </div>
                        <div className="flex-[2] w-full">
                            <Input
                                label="الرسالة"
                                value={testMessage}
                                onChange={e => setTestMessage(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900/50"
                            />
                        </div>
                        <Button
                            onClick={handleSendTest}
                            disabled={sendingTest}
                            isLoading={sendingTest}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold whitespace-nowrap shadow-lg shadow-emerald-500/20"
                        >
                            <Icon name="Send" className="w-4 h-4 ml-1.5" />
                            إرسال تجريبي
                        </Button>
                    </div>
                </div>
            </Card>

            {isModalOpen && editingApi && (
                <ApiFormModal
                    api={editingApi.api}
                    apiType={editingApi.type}
                    onSave={handleSaveApi}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default WhatsappManagementView;
