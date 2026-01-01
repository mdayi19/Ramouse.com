
import React, { useState, useEffect } from 'react';
import {
    Server, Database, FileText, Trash2, Settings, Shield,
    RotateCcw, HardDrive, AlertTriangle, File, Folder, Download,
} from 'lucide-react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import FileManager from './FileManager';
import Modal from '../Modal'; // Assuming generic Modal exists

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

    // Confirmation Modal State
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
            setFolders([]); // Ensure no crash
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

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await api.post('/admin/maintenance/settings', settings);
            showToast('تم حفظ الإعدادات بنجاح', 'success');
            fetchStats(); // Refresh to see effects
        } catch (error) {
            showToast('فشل حفظ الإعدادات', 'error');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[400px]" dir="rtl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500">جاري تحميل مركز الصيانة...</p>
        </div>
    );

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">مركز صيانة النظام</h1>
                    <p className="text-sm text-gray-500">مراقبة صحة النظام، تنظيف سلة المهملات، وتكوين سياسات الاحتفاظ.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open('/api/admin/maintenance/backup', '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> نسخ احتياطي لقاعدة البيانات
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{error}</span>
                    <button onClick={fetchStats} className="text-sm underline hover:text-red-900 mr-auto">إعادة المحاولة</button>
                </div>
            )}

            {/* Health Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">حالة الجدولة</p>
                            <h3 className={`text-xl font-bold mt-2 ${stats?.scheduler_running ? 'text-green-600' : 'text-red-600'}`}>
                                {stats?.scheduler_running ? 'يعمل' : 'متوقف'}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">آخر تشغيل: {stats?.last_scheduler_run ? format(new Date(stats.last_scheduler_run), 'HH:mm:ss') : 'أبداً'}</p>
                        </div>
                        <div className={`p-2 rounded-lg ${stats?.scheduler_running ? 'bg-green-100' : 'bg-red-100'}`}>
                            <RotateCcw className={`w-5 h-5 ${stats?.scheduler_running ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">سجلات النظام</p>
                            <h3 className="text-xl font-bold mt-2 text-gray-900">{stats?.log_size}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-100">
                            <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <button onClick={() => handleAction('clean_logs', 'هل تريد مسح سجلات النظام؟')} className="text-xs text-blue-500 mt-3 font-medium hover:text-blue-700 transition-colors">مسح السجلات</button>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">سلة المهملات</p>
                            <h3 className="text-xl font-bold mt-2 text-gray-900">{stats?.trash_size}</h3>
                            <p className="text-xs text-gray-400">{stats?.trash_count} ملفات</p>
                        </div>
                        <div className="p-2 rounded-lg bg-orange-100">
                            <Trash2 className="w-5 h-5 text-orange-600" />
                        </div>
                    </div>
                    <button onClick={() => handleAction('empty_trash', 'إفراغ سلة المهملات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')} className="text-xs text-red-500 mt-3 font-medium hover:text-red-700 transition-colors">إفراغ سلة المهملات</button>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">بيانات قديمة</p>
                            <div className="mt-2 space-y-0.5">
                                <p className="text-sm font-medium text-gray-700">{stats?.old_notifications} إشعارات</p>
                                <p className="text-sm font-medium text-gray-700">{stats?.old_quotes} عروض أسعار</p>
                            </div>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Database className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <button onClick={() => handleAction('run_all', 'تشغيل تحسين شامل للنظام؟')} className="text-xs text-green-600 mt-3 font-bold hover:text-green-800 transition-colors">تنظيف شامل</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        الملفات والمجلدات
                    </button>
                    <button onClick={() => setActiveTab('files')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'files' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        مدير الملفات
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        قواعد الاحتفاظ
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">استخدام التخزين ({folders.length} مجلدات)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 text-right">المجلد</th>
                                        <th className="px-6 py-3 text-right">الملفات</th>
                                        <th className="px-6 py-3 text-right">الحجم</th>
                                        <th className="px-6 py-3 text-right">سياسة الاحتفاظ</th>
                                        <th className="px-6 py-3 text-right">تنظيف تلقائي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {folders.map((folder) => (
                                        <tr key={folder.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                <Folder className="w-4 h-4 text-blue-400" />
                                                {folder.name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{folder.count}</td>
                                            <td className="px-6 py-4 text-gray-500">{folder.size}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-16 border rounded-lg px-2 py-1 text-center bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                                        value={settings[`folder_policy_${folder.name}`] || 0}
                                                        onChange={(e) => setSettings({ ...settings, [`folder_policy_${folder.name}`]: parseInt(e.target.value) })}
                                                    />
                                                    <span className="text-xs text-gray-500">أيام (0=احتفاظ دائم)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={!!settings[`folder_policy_${folder.name}_enabled`]}
                                                        onChange={(e) => setSettings({ ...settings, [`folder_policy_${folder.name}_enabled`]: e.target.checked })}
                                                    />
                                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={processing}
                                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                حفظ السياسات
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'files' && (
                    <FileManager onDelete={fetchStats} showToast={showToast} />
                )}

                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b">
                                <Shield className="w-5 h-5 text-blue-500" />
                                قواعد الاحتفاظ العامة
                            </h3>
                            <form onSubmit={handleSaveSettings} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">حذف الإشعارات القديمة (أيام)</label>
                                    <input
                                        type="number"
                                        value={settings.retention_notifications || 30}
                                        onChange={(e) => setSettings({ ...settings, retention_notifications: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">حذف السجلات القديمة (أيام)</label>
                                    <input
                                        type="number"
                                        value={settings.retention_logs || 7}
                                        onChange={(e) => setSettings({ ...settings, retention_logs: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">إفراغ سلة المهملات (أيام)</label>
                                    <input
                                        type="number"
                                        value={settings.retention_trash || 30}
                                        onChange={(e) => setSettings({ ...settings, retention_trash: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">حذف عروض الأسعار القديمة (أيام)</label>
                                    <div className="text-xs text-gray-500 mb-1">مرتبط بالطلبات المكتملة/الملغاة</div>
                                    <input
                                        type="number"
                                        value={settings.retention_quotes || 90}
                                        onChange={(e) => setSettings({ ...settings, retention_quotes: parseInt(e.target.value) })}
                                        className="w-full border rounded-lg px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                                    />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" disabled={processing} className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                                        حفظ القواعد العامة
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    القائمة المحمية (الذهبية)
                                </h3>
                                <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-700 mb-3 border border-yellow-100">
                                    أرقام الطلبات المدرجة هنا لن يتم حذفها أبداً المجلد، بغض النظر عن عمرها.
                                </div>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 h-24 font-mono text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-yellow-100 transition-all outline-none resize-none"
                                    placeholder="ORD-2024-001, ORD-2024-999"
                                    value={settings.protected_order_ids || ''}
                                    onChange={(e) => setSettings({ ...settings, protected_order_ids: e.target.value })}
                                ></textarea>
                                <div className="mt-3 text-right">
                                    <button onClick={handleSaveSettings} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-sm">حفظ القائمة</button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <File className="w-5 h-5 text-purple-500" />
                                    أنواع الملفات المستهدفة
                                </h3>
                                <p className="text-sm text-gray-500 mb-3">حذف الملفات بهذه الامتدادات فقط (مثال: jpg, png, mp3). اتركه فارغاً لاستهداف جميع الملفات.</p>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg px-3 py-2 font-mono text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                                    placeholder="jpg, png, mp4"
                                    value={settings.target_file_extensions || ''}
                                    onChange={(e) => setSettings({ ...settings, target_file_extensions: e.target.value })}
                                />
                                <div className="mt-3 text-right">
                                    <button onClick={handleSaveSettings} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors shadow-sm">حفظ الامتدادات</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modal */}
            {confirmModal && (
                <Modal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(null)}
                    title={confirmModal.title}
                >
                    <div className="p-4" dir="rtl">
                        <p className="text-gray-700 mb-6 font-medium text-lg">{confirmModal.message}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-5 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MaintenanceView;
