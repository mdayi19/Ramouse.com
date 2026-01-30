
import React, { useState, useEffect } from 'react';
import {
    Server, Database, FileText, Trash2, Settings, Shield,
    RotateCcw, HardDrive, AlertTriangle, File, Folder, Download,
    RefreshCw, CheckCircle, XCircle, Clock, TrendingUp
} from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import FileManager from './FileManager';
import Modal from '../Modal';

interface MaintenanceStats {
    log_size: string;
    log_size_bytes: number;
    old_notifications: number;
    old_quotes: number;
    trash_size: string;
    trash_count: number;
    scheduler_running: boolean;
    last_scheduler_run: string | null;
}

interface FolderStat {
    name: string;
    count: number;
    size: string;
    retention_days: number;
    auto_clean: boolean;
}

interface MaintenanceViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ showToast }) => {
    const [stats, setStats] = useState<MaintenanceStats | null>(null);
    const [folders, setFolders] = useState<FolderStat[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'settings'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

    const fetchStats = async () => {
        try {
            setError(null);
            const response = await api.get('/admin/maintenance/stats');
            if (response.data && response.data.success) {
                setStats(response.data.stats || null);
                setFolders(response.data.folders || []);
                setSettings(response.data.settings || {});
            } else {
                throw new Error(response.data.message || 'تنسيق استجابة غير صالح');
            }
        } catch (err: any) {
            console.error('فشل جلب إحصائيات الصيانة', err);
            setError(err.response?.data?.message || err.message || 'فشل تحميل البيانات');
            setFolders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleAction = (action: string, confirmMsg?: string) => {
        const executeAction = async () => {
            setProcessing(true);
            try {
                const res = await api.post('/admin/maintenance/action', { action });
                showToast(res.data.message, 'success');
                fetchStats();
            } catch (error) {
                showToast('فشل الإجراء', 'error');
            } finally {
                setProcessing(false);
                setConfirmModal(null);
            }
        };

        if (confirmMsg) {
            setConfirmModal({
                isOpen: true,
                title: 'تأكيد الإجراء',
                message: confirmMsg,
                onConfirm: executeAction
            });
        } else {
            executeAction();
        }
    };

    const handleSaveSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setProcessing(true);
        try {
            await api.post('/admin/maintenance/settings', settings);
            showToast('تم حفظ الإعدادات بنجاح', 'success');
            fetchStats();
        } catch (error) {
            showToast('فشل حفظ الإعدادات', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-600 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">جاري تحميل مركز الصيانة...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">مركز صيانة النظام</h1>
                    <p className="text-slate-600 dark:text-slate-400">مراقبة صحة النظام، تنظيف البيانات، وإدارة سياسات الاحتفاظ.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                setProcessing(true);
                                const response = await api.get('/admin/maintenance/backup', {
                                    responseType: 'blob'
                                });

                                // Create download link
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `ramouse-backup-${new Date().toISOString().split('T')[0]}.sql`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);

                                showToast('تم تنزيل النسخة الاحتياطية بنجاح', 'success');
                            } catch (error: any) {
                                console.error('Backup error:', error);
                                showToast(error.response?.data?.message || 'فشل تنزيل النسخة الاحتياطية', 'error');
                            } finally {
                                setProcessing(false);
                            }
                        }}
                        disabled={processing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {processing ? 'جاري التحميل...' : 'نسخ احتياطي'}
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-red-800 dark:text-red-200">حدث خطأ</p>
                        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                        إعادة المحاولة
                    </button>
                </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Scheduler Status */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                            <RotateCcw className={`w-6 h-6 ${stats?.scheduler_running ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                        </div>
                        {stats?.scheduler_running ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">حالة الجدولة</p>
                    <h3 className={`text-2xl font-bold mb-1 ${stats?.scheduler_running ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stats?.scheduler_running ? 'يعمل' : 'متوقف'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3" />
                        {stats?.last_scheduler_run ? format(new Date(stats.last_scheduler_run), 'HH:mm:ss') : 'أبداً'}
                    </div>
                </div>

                {/* System Logs */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                            <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">سجلات النظام</p>
                    <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">{stats?.log_size}</h3>
                    <button
                        onClick={() => handleAction('clean_logs', 'هل تريد مسح سجلات النظام؟')}
                        disabled={processing}
                        className="text-xs text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                        مسح السجلات →
                    </button>
                </div>

                {/* Trash */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                            <Trash2 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="px-2 py-1 bg-orange-200 dark:bg-orange-900/40 rounded-full">
                            <span className="text-xs font-bold text-orange-700 dark:text-orange-300">{stats?.trash_count}</span>
                        </div>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">سلة المهملات</p>
                    <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">{stats?.trash_size}</h3>
                    <button
                        onClick={() => handleAction('empty_trash', 'إفراغ سلة المهملات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')}
                        disabled={processing}
                        className="text-xs text-red-600 dark:text-red-400 font-semibold hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                        إفراغ السلة →
                    </button>
                </div>

                {/* Old Data */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">بيانات قديمة</p>
                    <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">إشعارات</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.old_notifications}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400">عروض أسعار</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">{stats?.old_quotes}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => handleAction('run_all', 'تشغيل تحسين شامل للنظام؟')}
                        disabled={processing}
                        className="text-xs text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    >
                        تنظيف شامل →
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <nav className="flex gap-1 p-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'overview'
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <Folder className="w-4 h-4 inline-block ml-2" />
                            الملفات والمجلدات
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'files'
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <HardDrive className="w-4 h-4 inline-block ml-2" />
                            مدير الملفات
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'settings'
                                ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            <Settings className="w-4 h-4 inline-block ml-2" />
                            قواعد الاحتفاظ
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">استخدام التخزين</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{folders.length} مجلدات مُراقبة</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">المجلد</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">الملفات</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">الحجم</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">سياسة الاحتفاظ</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">تنظيف تلقائي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {folders.map((folder) => (
                                            <tr key={folder.name} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                                                            <Folder className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                                                        </div>
                                                        <span className="font-medium text-slate-900 dark:text-slate-100">{folder.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{folder.count}</td>
                                                <td className="py-4 px-4">
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300">
                                                        {folder.size}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            className="w-20 px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm text-center focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                                            value={settings[`folder_policy_${folder.name}`] || 0}
                                                            onChange={(e) => setSettings({ ...settings, [`folder_policy_${folder.name}`]: parseInt(e.target.value) })}
                                                        />
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">أيام</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={!!settings[`folder_policy_${folder.name}_enabled`]}
                                                            onChange={(e) => setSettings({ ...settings, [`folder_policy_${folder.name}_enabled`]: e.target.checked })}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                                                    </label>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => handleSaveSettings()}
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                                >
                                    {processing ? 'جاري الحفظ...' : 'حفظ السياسات'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'files' && (
                        <FileManager onDelete={fetchStats} showToast={showToast} />
                    )}

                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* General Retention Rules */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                                    <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                                        <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">قواعد الاحتفاظ العامة</h3>
                                </div>
                                <form onSubmit={handleSaveSettings} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            حذف الإشعارات القديمة
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={settings.retention_notifications || 30}
                                                onChange={(e) => setSettings({ ...settings, retention_notifications: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">أيام</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            حذف السجلات القديمة
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={settings.retention_logs || 7}
                                                onChange={(e) => setSettings({ ...settings, retention_logs: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">أيام</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            إفراغ سلة المهملات
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={settings.retention_trash || 30}
                                                onChange={(e) => setSettings({ ...settings, retention_trash: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">أيام</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                            حذف عروض الأسعار القديمة
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">مرتبط بالطلبات المكتملة/الملغاة</p>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={settings.retention_quotes || 90}
                                                onChange={(e) => setSettings({ ...settings, retention_quotes: parseInt(e.target.value) })}
                                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">أيام</span>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg disabled:opacity-50"
                                    >
                                        {processing ? 'جاري الحفظ...' : 'حفظ القواعد العامة'}
                                    </button>
                                </form>
                            </div>

                            {/* Protected Orders & File Extensions */}
                            <div className="space-y-6">
                                {/* Protected Orders */}
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-amber-200 dark:bg-amber-900/40 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">القائمة المحمية</h3>
                                    </div>
                                    <div className="bg-amber-100 dark:bg-amber-900/20 p-3 rounded-lg text-sm text-amber-800 dark:text-amber-200 mb-4 border border-amber-200 dark:border-amber-700">
                                        أرقام الطلبات المدرجة هنا لن يتم حذفها أبداً، بغض النظر عن عمرها.
                                    </div>
                                    <textarea
                                        className="w-full px-4 py-3 border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 rounded-lg h-24 font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder="ORD-2024-001, ORD-2024-999"
                                        value={settings.protected_order_ids || ''}
                                        onChange={(e) => setSettings({ ...settings, protected_order_ids: e.target.value })}
                                    ></textarea>
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleSaveSettings()}
                                            disabled={processing}
                                            className="w-full px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                                        >
                                            حفظ القائمة المحمية
                                        </button>
                                    </div>
                                </div>

                                {/* File Extensions */}
                                <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-purple-200 dark:bg-purple-900/40 rounded-lg">
                                            <File className="w-5 h-5 text-purple-700 dark:text-purple-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">أنواع الملفات المستهدفة</h3>
                                    </div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
                                        حذف الملفات بهذه الامتدادات فقط. اتركه فارغاً لاستهداف جميع الملفات.
                                    </p>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                        placeholder="jpg, png, mp4, pdf"
                                        value={settings.target_file_extensions || ''}
                                        onChange={(e) => setSettings({ ...settings, target_file_extensions: e.target.value })}
                                    />
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleSaveSettings()}
                                            disabled={processing}
                                            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                                        >
                                            حفظ الامتدادات
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <Modal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(null)}
                    title={confirmModal.title}
                >
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">تأكيد الإجراء</p>
                                <p className="text-slate-600 dark:text-slate-400">{confirmModal.message}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-6 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                disabled={processing}
                                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                {processing ? 'جاري التنفيذ...' : 'تأكيد'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MaintenanceView;
