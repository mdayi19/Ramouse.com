import React, { useState, useEffect } from 'react';
import { ViewHeader, StatCard } from './Shared';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Icon from '../Icon';
import { api } from '../../lib/api';

interface ScheduledTask {
    id: string;
    command: string;
    description: string;
    expression: string;
    human_readable: string;
    next_run: string;
    without_overlapping: boolean;
    run_in_background: boolean;
}

interface SchedulerHealth {
    healthy: boolean;
    message: string;
    last_run: string | null;
    minutes_since_last_run: number | null;
    server_time: string;
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
}

interface SchedulerStats {
    total_tasks: number;
    successful_runs_today: number;
    failed_runs_today: number;
    last_error: { message: string; timestamp: string } | null;
    uptime_percentage: number;
}

const SchedulerManagementView: React.FC<{
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ showToast }) => {
    const [tasks, setTasks] = useState<ScheduledTask[]>([]);
    const [health, setHealth] = useState<SchedulerHealth | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<SchedulerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState<string | null>(null);
    const [logFilter, setLogFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'logs'>('overview');

    useEffect(() => {
        fetchAllData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchAllData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAllData = async () => {
        try {
            const [tasksRes, healthRes, statsRes] = await Promise.all([
                api.get('/admin/scheduler'),
                api.get('/admin/scheduler/health'),
                api.get('/admin/scheduler/stats'),
            ]);

            setTasks(tasksRes.data.tasks || []);
            setHealth(healthRes.data);
            setStats(statsRes.data);
        } catch (error: any) {
            console.error('Failed to fetch scheduler data:', error);
            showToast('فشل في جلب بيانات المجدول', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await api.get('/admin/scheduler/logs', {
                params: { lines: 200, filter: logFilter },
            });
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            showToast('فشل في جلب السجلات', 'error');
        }
    };

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, logFilter]);

    const handleExecuteTask = async (command: string) => {
        if (!window.confirm(`هل أنت متأكد من تنفيذ الأمر: ${command}؟`)) {
            return;
        }

        setExecuting(command);
        try {
            const response = await api.post('/admin/scheduler/execute', { command });
            showToast(response.data.message || 'تم تنفيذ الأمر بنجاح', 'success');
            fetchAllData(); // Refresh data
        } catch (error: any) {
            console.error('Failed to execute task:', error);
            showToast(
                error.response?.data?.error || 'فشل في تنفيذ الأمر',
                'error'
            );
        } finally {
            setExecuting(null);
        }
    };

    const getLevelBadgeVariant = (level: string) => {
        if (level.includes('ERROR') || level.includes('CRITICAL')) {
            return 'destructive';
        }
        if (level.includes('WARNING')) {
            return 'warning';
        }
        if (level.includes('INFO')) {
            return 'info';
        }
        return 'secondary';
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 shadow-lg">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2">⏰ إدارة المجدول</h2>
                    <p className="text-white/90">Scheduler Management - مراقبة وإدارة المهام المجدولة التلقائية</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Gradient Tabs */}
            <Card className="p-2 backdrop-blur-xl bg-white/90 dark:bg-darkcard/90 border-slate-200 dark:border-slate-700 shadow-lg">
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 transition-all duration-300 ${activeTab === 'overview'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:from-indigo-600 hover:to-purple-600'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Icon name="LayoutDashboard" className="w-4 h-4 ml-2" />
                        نظرة عامة
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 transition-all duration-300 ${activeTab === 'tasks'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md hover:from-blue-600 hover:to-cyan-600'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Icon name="Clock" className="w-4 h-4 ml-2" />
                        المهام المجدولة
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setActiveTab('logs')}
                        className={`flex-1 transition-all duration-300 ${activeTab === 'logs'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Icon name="FileText" className="w-4 h-4 ml-2" />
                        السجلات
                    </Button>
                </div>
            </Card>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Health Status with Glassmorphism */}
                    <Card className={`p-6 backdrop-blur-xl border-2 shadow-xl animate-fade-in ${health?.healthy
                            ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/40'
                            : 'border-red-400 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/30 dark:to-rose-900/40'
                        }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${health?.healthy
                                        ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                                        : 'bg-gradient-to-br from-red-500 to-rose-500'
                                    }`}>
                                    <Icon name={health?.healthy ? 'CheckCircle' : 'AlertCircle'} className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${health?.healthy ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                                        {health?.healthy ? 'المجدول يعمل بشكل طبيعي' : 'تحذير: المجدول متوقف أو عالق'}
                                    </h3>
                                    <p className={`text-sm ${health?.healthy ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                        {health?.message}
                                    </p>
                                    {health?.last_run && (
                                        <p className="text-xs mt-1 opacity-75">
                                            آخر تشغيل: {new Date(health.last_run).toLocaleString('ar-EG')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button onClick={fetchAllData} size="sm" variant="ghost" className="hover:bg-white/50 dark:hover:bg-black/30">
                                <Icon name="RefreshCw" className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>

                    {/* Statistics Cards with Stagger */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
                                <StatCard
                                    title="إجمالي المهام"
                                    value={stats.total_tasks}
                                    icon={<Icon name="List" className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
                                    iconClassName="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30"
                                />
                            </div>

                            <div className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                                <StatCard
                                    title="تنفيذات ناجحة اليوم"
                                    value={stats.successful_runs_today}
                                    icon={<Icon name="CheckCircle" className="w-6 h-6 text-green-600 dark:text-green-400" />}
                                    iconClassName="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
                                />
                            </div>

                            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                                <StatCard
                                    title="تنفيذات فاشلة اليوم"
                                    value={stats.failed_runs_today}
                                    icon={<Icon name="XCircle" className="w-6 h-6 text-red-600 dark:text-red-400" />}
                                    iconClassName="bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30"
                                />
                            </div>

                            <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
                                <StatCard
                                    title="معدل النجاح"
                                    value={`${stats.uptime_percentage}%`}
                                    icon={<Icon name="Activity" className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                                    iconClassName="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30"
                                />
                            </div>
                        </div>
                    )}

                    {/* Last Error */}
                    {stats?.last_error && (
                        <Card className="p-4 border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
                            <div className="flex items-start gap-3">
                                <Icon name="AlertTriangle" className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-bold text-red-800 dark:text-red-200 mb-1">
                                        آخر خطأ:
                                    </div>
                                    <div className="text-sm text-red-700 dark:text-red-300 font-mono text-xs bg-red-100 dark:bg-red-900/40 p-2 rounded overflow-x-auto">
                                        {stats.last_error.message}
                                    </div>
                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                        {new Date(stats.last_error.timestamp).toLocaleString('ar-EG')}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
                <Card className="p-6">
                    <div className="space-y-4">
                        {tasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                لا توجد مهام مجدولة
                            </div>
                        ) : (
                            tasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    className="p-4 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none rounded-xl shadow-md hover:shadow-xl transition-all duration-300 animate-fade-in"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Icon name="Clock" className="w-4 h-4 text-primary" />
                                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                                    {task.command}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                    {task.description}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-2 text-xs">
                                                <Badge variant="info" className="px-2 py-1">
                                                    {task.human_readable}
                                                </Badge>
                                                {task.without_overlapping && (
                                                    <Badge variant="purple" className="px-2 py-1">
                                                        بدون تداخل
                                                    </Badge>
                                                )}
                                                {task.run_in_background && (
                                                    <Badge variant="success" className="px-2 py-1">
                                                        في الخلفية
                                                    </Badge>
                                                )}
                                                {task.next_run && (
                                                    <Badge variant="secondary" className="px-2 py-1">
                                                        التشغيل القادم: {new Date(task.next_run).toLocaleString('ar-EG')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => handleExecuteTask(task.command)}
                                            size="sm"
                                            variant="outline"
                                            disabled={executing === task.command}
                                            className="flex-shrink-0"
                                        >
                                            {executing === task.command ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2"></div>
                                                    جاري التنفيذ...
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="Play" className="w-4 h-4 ml-2" />
                                                    تنفيذ الآن
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <Card className="p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="تصفية السجلات (مثل: Scheduler, error, auction)..."
                                value={logFilter}
                                onChange={(e) => setLogFilter(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                            <Button onClick={fetchLogs} size="sm">
                                <Icon name="RefreshCw" className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="space-y-2 font-mono text-xs max-h-[600px] overflow-y-auto custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    لا توجد سجلات
                                </div>
                            ) : (
                                logs.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                {log.timestamp}
                                            </span>
                                            <Badge variant={getLevelBadgeVariant(log.level)} className="flex-shrink-0">
                                                {log.level}
                                            </Badge>
                                            <span className="text-slate-700 dark:text-slate-300 break-all">
                                                {log.message}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default SchedulerManagementView;
