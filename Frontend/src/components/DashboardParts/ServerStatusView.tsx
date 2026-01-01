import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

interface ServerStatus {
    cpu: {
        load_1min: number;
        load_5min: number;
        load_15min: number;
        cores: number;
        usage_percent: number;
    };
    memory: {
        total: number;
        used: number;
        free: number;
        total_formatted: string;
        used_formatted: string;
        free_formatted: string;
        usage_percent: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
        total_formatted: string;
        used_formatted: string;
        free_formatted: string;
        usage_percent: number;
    };
    uptime: {
        seconds: number;
        formatted: string;
        boot_time: string;
    };
    php: {
        version: string;
        memory_limit: string;
        max_execution_time: string;
        upload_max_filesize: string;
        post_max_size: string;
    };
    laravel: {
        version: string;
        environment: string;
        debug_mode: boolean;
        timezone: string;
        locale: string;
    };
    database: {
        connected: boolean;
        driver: string;
        database: string;
        table_count: number;
        size: number;
        size_formatted: string;
    };
    queue: {
        driver: string;
        pending_jobs: number;
        failed_jobs: number;
    };
    cache: {
        driver: string;
        connected: boolean;
    };
    app: {
        users: number;
        orders: number;
        providers: number;
        technicians: number;
        tow_trucks: number;
        products: number;
        notifications: number;
        push_subscriptions: number;
    };
    timestamp: string;
}

interface ServerStatusViewProps {
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    subtitle?: string;
}> = ({ title, value, icon, color = 'primary', subtitle }) => (
    <div className="bg-white dark:bg-darkcard rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
                <Icon name={icon} className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{value}</p>
                {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
        </div>
    </div>
);

const ProgressBar: React.FC<{ percent: number; color?: string; label?: string }> = ({ percent, color = 'primary', label }) => (
    <div className="w-full">
        {label && <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{percent}%</span>
        </div>}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
                className={`h-2.5 rounded-full transition-all duration-500 ${percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
            />
        </div>
    </div>
);

const ServerStatusView: React.FC<ServerStatusViewProps> = ({ showToast }) => {
    const [status, setStatus] = useState<ServerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStatus = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/admin/server-status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch server status');

            const data = await response.json();
            setStatus(data.data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error fetching server status:', error);
            showToast('فشل تحميل حالة الخادم', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Icon name="Loader" className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="text-center py-12">
                <Icon name="AlertCircle" className="w-12 h-12 mx-auto text-red-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">فشل تحميل حالة الخادم</p>
                <button onClick={fetchStatus} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">حالة الخادم</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        آخر تحديث: {lastUpdate?.toLocaleTimeString('ar-SY') || '-'}
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    <Icon name="RefreshCw" className="w-4 h-4" />
                    تحديث
                </button>
            </div>

            {/* System Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CPU */}
                <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon name="Cpu" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">المعالج (CPU)</h3>
                            <p className="text-xs text-gray-500">{status.cpu.cores} أنوية</p>
                        </div>
                    </div>
                    <ProgressBar percent={status.cpu.usage_percent} label="الاستخدام" />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                            <p className="text-gray-500">1 دقيقة</p>
                            <p className="font-medium">{status.cpu.load_1min}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">5 دقائق</p>
                            <p className="font-medium">{status.cpu.load_5min}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">15 دقيقة</p>
                            <p className="font-medium">{status.cpu.load_15min}</p>
                        </div>
                    </div>
                </div>

                {/* Memory */}
                <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Icon name="MemoryStick" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">الذاكرة (RAM)</h3>
                            <p className="text-xs text-gray-500">{status.memory.total_formatted} إجمالي</p>
                        </div>
                    </div>
                    <ProgressBar percent={status.memory.usage_percent} label="الاستخدام" />
                    <div className="mt-3 flex justify-between text-xs">
                        <span className="text-gray-500">مستخدم: <span className="font-medium text-gray-700 dark:text-gray-300">{status.memory.used_formatted}</span></span>
                        <span className="text-gray-500">متاح: <span className="font-medium text-green-600">{status.memory.free_formatted}</span></span>
                    </div>
                </div>

                {/* Disk */}
                <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Icon name="HardDrive" className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">التخزين</h3>
                            <p className="text-xs text-gray-500">{status.disk.total_formatted} إجمالي</p>
                        </div>
                    </div>
                    <ProgressBar percent={status.disk.usage_percent} label="الاستخدام" />
                    <div className="mt-3 flex justify-between text-xs">
                        <span className="text-gray-500">مستخدم: <span className="font-medium text-gray-700 dark:text-gray-300">{status.disk.used_formatted}</span></span>
                        <span className="text-gray-500">متاح: <span className="font-medium text-green-600">{status.disk.free_formatted}</span></span>
                    </div>
                </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard title="وقت التشغيل" value={status.uptime.formatted} icon="Clock" color="green" />
                <StatCard title="PHP" value={status.php.version} icon="Code" color="blue" />
                <StatCard title="Laravel" value={status.laravel.version} icon="Layers" color="red" />
                <StatCard title="البيئة" value={status.laravel.environment} icon="Settings" color="purple" />
            </div>

            {/* Database & Queue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Database */}
                <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <Icon name="Database" className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">قاعدة البيانات</h3>
                            <p className="text-xs text-gray-500">{status.database.driver} - {status.database.database}</p>
                        </div>
                        <div className={`mr-auto px-2 py-1 rounded-full text-xs font-medium ${status.database.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status.database.connected ? 'متصل' : 'غير متصل'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">عدد الجداول</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{status.database.table_count}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">الحجم</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{status.database.size_formatted}</p>
                        </div>
                    </div>
                </div>

                {/* Queue & Cache */}
                <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Icon name="ListTodo" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">قائمة المهام والتخزين المؤقت</h3>
                            <p className="text-xs text-gray-500">Queue: {status.queue.driver} | Cache: {status.cache.driver}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">مهام معلقة</p>
                            <p className="font-semibold text-yellow-600">{status.queue.pending_jobs}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">مهام فاشلة</p>
                            <p className="font-semibold text-red-600">{status.queue.failed_jobs}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">التخزين المؤقت</p>
                            <p className={`font-semibold ${status.cache.connected ? 'text-green-600' : 'text-red-600'}`}>
                                {status.cache.connected ? 'متصل' : 'غير متصل'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Statistics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">إحصائيات التطبيق</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard title="المستخدمين" value={status.app.users} icon="Users" color="blue" />
                    <StatCard title="الطلبات" value={status.app.orders} icon="ShoppingCart" color="green" />
                    <StatCard title="المزودين" value={status.app.providers} icon="Building" color="purple" />
                    <StatCard title="الفنيين" value={status.app.technicians} icon="Wrench" color="orange" />
                    <StatCard title="السطحات" value={status.app.tow_trucks} icon="Truck" color="red" />
                    <StatCard title="المنتجات" value={status.app.products} icon="Package" color="indigo" />
                    <StatCard title="الإشعارات" value={status.app.notifications} icon="Bell" color="yellow" />
                    <StatCard title="اشتراكات الدفع" value={status.app.push_subscriptions} icon="Smartphone" color="pink" />
                </div>
            </div>

            {/* PHP Configuration */}
            <div className="bg-white dark:bg-darkcard rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">إعدادات PHP</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-500">حد الذاكرة</p>
                        <p className="font-medium text-gray-800 dark:text-white">{status.php.memory_limit}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">وقت التنفيذ الأقصى</p>
                        <p className="font-medium text-gray-800 dark:text-white">{status.php.max_execution_time}s</p>
                    </div>
                    <div>
                        <p className="text-gray-500">حد رفع الملفات</p>
                        <p className="font-medium text-gray-800 dark:text-white">{status.php.upload_max_filesize}</p>
                    </div>
                    <div>
                        <p className="text-gray-500">حد POST</p>
                        <p className="font-medium text-gray-800 dark:text-white">{status.php.post_max_size}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerStatusView;
