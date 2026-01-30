import React, { useState, useEffect } from 'react';
import {
    Cpu, MemoryStick, HardDrive, Clock, Code, Layers, Settings,
    Database, ListTodo, Users, ShoppingCart, Building, Wrench,
    Truck, Package, Bell, Smartphone, RefreshCw, AlertCircle,
    CheckCircle, XCircle, Activity, TrendingUp, Server
} from 'lucide-react';

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

const ProgressBar: React.FC<{ percent: number; label?: string }> = ({ percent, label }) => (
    <div className="w-full">
        {label && <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{percent.toFixed(1)}%</span>
        </div>}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
                className={`h-3 rounded-full transition-all duration-700 ease-out ${percent > 90
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : percent > 70
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-500 to-green-500'
                    }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
            />
        </div>
    </div>
);

const ServerStatusView: React.FC<ServerStatusViewProps> = ({ showToast }) => {
    const [status, setStatus] = useState<ServerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStatus = async (isManualRefresh = false) => {
        if (isManualRefresh) setIsRefreshing(true);

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

            if (isManualRefresh) {
                showToast('تم تحديث حالة الخادم', 'success');
            }
        } catch (error) {
            console.error('Error fetching server status:', error);
            showToast('فشل تحميل حالة الخادم', 'error');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(() => fetchStatus(), 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">جاري تحميل حالة الخادم...</p>
                </div>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="text-center py-20">
                <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">فشل تحميل حالة الخادم</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">تعذر الاتصال بالخادم</p>
                <button
                    onClick={() => fetchStatus(true)}
                    className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-xl">
                            <Server className="w-8 h-8 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">حالة الخادم</h1>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Activity className="w-4 h-4" />
                                <span>آخر تحديث: {lastUpdate?.toLocaleTimeString('ar-SY') || '-'}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchStatus(true)}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
                    </button>
                </div>
            </div>

            {/* System Resources */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                <Cpu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">المعالج</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{status.cpu.cores} أنوية</p>
                            </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ProgressBar percent={status.cpu.usage_percent} label="الاستخدام" />
                    <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-blue-200 dark:border-blue-800">
                        <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">1 دقيقة</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.cpu.load_1min}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">5 دقائق</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.cpu.load_5min}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">15 دقيقة</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.cpu.load_15min}</p>
                        </div>
                    </div>
                </div>

                {/* Memory */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                <MemoryStick className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">الذاكرة</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{status.memory.total_formatted} إجمالي</p>
                            </div>
                        </div>
                        <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ProgressBar percent={status.memory.usage_percent} label="الاستخدام" />
                    <div className="mt-4 flex justify-between text-sm pt-4 border-t border-purple-200 dark:border-purple-800">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مستخدم</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.memory.used_formatted}</p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">متاح</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{status.memory.free_formatted}</p>
                        </div>
                    </div>
                </div>

                {/* Disk */}
                <div className="group relative p-6 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                                <HardDrive className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">التخزين</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{status.disk.total_formatted} إجمالي</p>
                            </div>
                        </div>
                        <Server className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <ProgressBar percent={status.disk.usage_percent} label="الاستخدام" />
                    <div className="mt-4 flex justify-between text-sm pt-4 border-t border-orange-200 dark:border-orange-800">
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">مستخدم</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.disk.used_formatted}</p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">متاح</p>
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">{status.disk.free_formatted}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Info Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">وقت التشغيل</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.uptime.formatted}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-sky-100 dark:bg-sky-900/30 rounded-lg">
                            <Code className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">PHP</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.php.version}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Layers className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Laravel</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.laravel.version}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">البيئة</p>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{status.laravel.environment}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database & Queue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <Database className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100">قاعدة البيانات</h3>
                                <p className="text-xs text-slate-600 dark:text-slate-400">{status.database.driver} - {status.database.database}</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.database.connected
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                            {status.database.connected ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {status.database.connected ? 'متصل' : 'غير متصل'}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">عدد الجداول</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status.database.table_count}</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الحجم</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status.database.size_formatted}</p>
                        </div>
                    </div>
                </div>

                {/* Queue & Cache */}
                <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-500/10 rounded-xl">
                            <ListTodo className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-slate-100">الطوابير والتخزين</h3>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Queue: {status.queue.driver} | Cache: {status.cache.driver}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">معلقة</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{status.queue.pending_jobs}</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">فاشلة</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">{status.queue.failed_jobs}</p>
                        </div>
                        <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">الكاش</p>
                            <p className={`text-xl font-bold ${status.cache.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {status.cache.connected ? '✓' : '✗'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Statistics */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    إحصائيات التطبيق
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { title: 'المستخدمين', value: status.app.users, icon: Users, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
                        { title: 'الطلبات', value: status.app.orders, icon: ShoppingCart, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
                        { title: 'المزودين', value: status.app.providers, icon: Building, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
                        { title: 'الفنيين', value: status.app.technicians, icon: Wrench, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
                        { title: 'السطحات', value: status.app.tow_trucks, icon: Truck, color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
                        { title: 'المنتجات', value: status.app.products, icon: Package, color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
                        { title: 'الإشعارات', value: status.app.notifications, icon: Bell, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' },
                        { title: 'اشتراكات الدفع', value: status.app.push_subscriptions, icon: Smartphone, color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
                    ].map((stat, index) => (
                        <div key={index} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.title}</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PHP Configuration */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Code className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    إعدادات PHP
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">حد الذاكرة</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{status.php.memory_limit}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">وقت التنفيذ الأقصى</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{status.php.max_execution_time}s</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">حد رفع الملفات</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{status.php.upload_max_filesize}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">حد POST</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{status.php.post_max_size}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServerStatusView;
