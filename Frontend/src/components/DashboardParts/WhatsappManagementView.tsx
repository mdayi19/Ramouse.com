import React, { useState, useEffect } from 'react';
import { Settings, MessagingAPI } from '../../types';
import Modal from '../Modal';
import { ViewHeader, EditIcon, DeleteIcon, Icon } from './Shared';
import { AdminService } from '../../services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
                <div>
                    <Input
                        label="اسم مميز للـ API"
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <Input
                        label="API URL"
                        type="url"
                        id="apiUrl"
                        name="apiUrl"
                        value={formData.apiUrl}
                        onChange={handleChange}
                        className="text-left"
                        dir="ltr"
                        required
                    />
                </div>
                <div>
                    <Input
                        label="App Key"
                        type="text"
                        id="appKey"
                        name="appKey"
                        value={formData.appKey}
                        onChange={handleChange}
                        className="text-left"
                        dir="ltr"
                        required
                    />
                </div>
                <div>
                    <Input
                        label="Auth Key"
                        type="text"
                        id="authKey"
                        name="authKey"
                        value={formData.authKey}
                        onChange={handleChange}
                        className="text-left"
                        dir="ltr"
                        required
                    />
                </div>
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
        if (apis.some(a => a.id === apiToSave.id)) { // Editing
            updatedApis = apis.map(a => a.id === apiToSave.id ? apiToSave : a);
        } else { // Adding
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
    }> = ({ title, description, type, apis }) => (
        <Card className="bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                <Button size="sm" onClick={() => handleOpenModal(null, type)} className="gap-1">
                    <Icon name="Plus" className="w-4 h-4" /> إضافة
                </Button>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{description}</p>
                <div className="space-y-3">
                    {apis.map(api => (
                        <Card key={api.id} className="border bg-white dark:bg-darkcard dark:border-slate-600 shadow-sm">
                            <CardContent className="p-3 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-slate-200">{api.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono" dir="ltr">{api.apiUrl}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <label className="relative inline-flex items-center cursor-pointer" title={api.isActive ? 'مفعل' : 'معطل'}>
                                        <input type="checkbox" checked={api.isActive} onChange={() => handleToggleActive(api.id, type)} className="sr-only peer" />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                    <Button size="icon" variant="ghost" onClick={() => handleOpenModal(api, type)} className="text-blue-600 hover:text-blue-800 h-8 w-8" title="تعديل">
                                        <EditIcon className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteApi(api.id, type)} className="text-red-600 hover:text-red-800 h-8 w-8" title="حذف">
                                        <DeleteIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {apis.length === 0 && <p className="text-sm text-center text-slate-500 py-4">لا توجد واجهات API مضافة.</p>}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card className="p-6">
            <ViewHeader title="إدارة WhatsApp" subtitle="إضافة وتعديل واجهات برمجة التطبيقات المستخدمة لإرسال رسائل التحقق والإشعارات." />

            <Card className={cn(
                "mb-6 border-2 transition-colors",
                settings.whatsappNotificationsActive
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            )}>
                <CardContent className="p-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold">الحالة العامة لرسائل WhatsApp</h3>
                        <p className={cn(
                            "font-semibold text-lg",
                            settings.whatsappNotificationsActive ? 'text-green-600' : 'text-red-600'
                        )}>
                            {settings.whatsappNotificationsActive ? 'مفعل' : 'متوقف'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            هذا المفتاح يتحكم بجميع رسائل الواتساب الصادرة من النظام.
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.whatsappNotificationsActive} onChange={handleGlobalToggle} className="sr-only peer" />
                        <div className={cn(
                            "w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-6 after:w-6 after:transition-all",
                            settings.whatsappNotificationsActive ? 'peer-checked:bg-green-600' : 'peer-checked:bg-slate-500'
                        )}></div>
                    </label>
                </CardContent>
            </Card>

            {/* Environment Fallback Indicator */}
            {settings.whatsapp_env_status?.has_env_keys && (
                (!settings.verificationApis?.length && !settings.notificationApis?.length) ||
                (!settings.verificationApis?.some(a => a.isActive) && !settings.notificationApis?.some(a => a.isActive))
            ) && (
                    <Card className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                        <CardContent className="p-4 flex items-start gap-3">
                            <Icon name="Info" className="w-6 h-6 flex-shrink-0 text-blue-600" />
                            <div>
                                <h4 className="font-bold text-blue-800 dark:text-blue-300">يعمل النظام بوضع البيئة (Environment Mode)</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                    لا توجد حالياً أي واجهات API مفعلة في قاعدة البيانات. يستخدم النظام إعدادات البيئة الاحتياطية (env) للإرسال.
                                </p>
                                <div className="mt-2 text-xs font-mono bg-white/50 dark:bg-black/30 p-2 rounded inline-block text-blue-900 dark:text-blue-200">
                                    App Key: {settings.whatsapp_env_status.env_app_key_preview}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ApiList
                    title="واجهات التحقق (OTP)"
                    description="تُستخدم هذه الواجهات لإرسال رموز التحقق للمستخدمين الجدد."
                    type="verification"
                    apis={settings.verificationApis || []}
                />
                <ApiList
                    title="واجهات الإشعارات"
                    description="تُستخدم هذه الواجهات لإرسال جميع الإشعارات الأخرى."
                    type="notification"
                    apis={settings.notificationApis || []}
                />
            </div>

            <Card className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 shadow-none">
                <CardContent className="p-4 flex items-start gap-3">
                    <Icon name="Info" className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>ملاحظة:</strong> يستخدم النظام هذه الواجهات بترتيب دوري (Round-robin) مع تجاوز الفاشلة منها. سيتم استخدام الواجهة المفعلة التالية في القائمة في حال فشل الإرسال من الواجهة الحالية.
                    </p>
                </CardContent>
            </Card>

            <Card className="mt-6 bg-slate-50 dark:bg-darkbg border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">اختبار الإرسال</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <Input
                                label="رقم الهاتف (مع الرمز الدولي)"
                                value={testPhone}
                                onChange={e => setTestPhone(e.target.value)}
                                placeholder="+963..."
                                dir="ltr"
                            />
                        </div>
                        <div className="flex-[2] w-full">
                            <Input
                                label="الرسالة"
                                value={testMessage}
                                onChange={e => setTestMessage(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleSendTest}
                            disabled={sendingTest}
                            isLoading={sendingTest}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold whitespace-nowrap"
                        >
                            إرسال تجريبي
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isModalOpen && editingApi && (
                <ApiFormModal
                    api={editingApi.api}
                    apiType={editingApi.type}
                    onSave={handleSaveApi}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </Card>
    );
};

export default WhatsappManagementView;
