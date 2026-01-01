import React, { useState, useEffect } from 'react';
import { ViewHeader } from './Shared';
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

    const getLevelColor = (level: string) => {
        if (level.includes('ERROR') || level.includes('CRITICAL')) {
            return 'text-red-600 dark:text-red-400';
        }
        if (level.includes('WARNING')) {
            return 'text-yellow-600 dark:text-yellow-400';
        }
        if (level.includes('INFO')) {
            return 'text-blue-600 dark:text-blue-400';
        }
        return 'text-slate-600 dark:text-slate-400';
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
            <ViewHeader
                title="إدارة المجدول"
                subtitle="مراقبة وإدارة المهام المجدولة التلقائية"
            />

            {/* Tabs */}
            <Card className="p-4">
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'overview' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('overview')}
                        className="flex-1"
                    >
                        <Icon name="LayoutDashboard" className="w-4 h-4 ml-2" />
                        نظرة عامة
                    </Button>
                    <Button
                        variant={activeTab === 'tasks' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('tasks')}
                        className="flex-1"
                    >
                        <Icon name="Clock" className="w-4 h-4 ml-2" />
                        المهام المجدولة
                    </Button>
                    <Button
                        variant={activeTab === 'logs' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('logs')}
                        className="flex-1"
                    >
                        <Icon name="FileText" className="w-4 h-4 ml-2" />
                        السجلات
                    </Button>
                </div>
            </Card>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Health Status */}
                    <Card className={`p-6 border-2 ${health?.healthy ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${health?.healthy ? 'bg-green-500' : 'bg-red-500'}`}>
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
                            <Button onClick={fetchAllData} size="sm" variant="ghost">
                                <Icon name="RefreshCw" className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>

                    {/* Statistics Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {stats.total_tasks}
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    إجمالي المهام
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {stats.successful_runs_today}
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    تنفيذات ناجحة اليوم
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {stats.failed_runs_today}
                                </div>
                                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    تنفيذات فاشلة اليوم
                                </div>
                            </Card>

                            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    {stats.uptime_percentage}%
                                </div>
                                <div className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                                    معدل النجاح
                                </div>
                            </Card>
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
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
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
                                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                    {task.human_readable}
                                                </span>
                                                {task.without_overlapping && (
                                                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                        بدون تداخل
                                                    </span>
                                                )}
                                                {task.run_in_background && (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                        في الخلفية
                                                    </span>
                                                )}
                                                {task.next_run && (
                                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                                                        التشغيل القادم: {new Date(task.next_run).toLocaleString('ar-EG')}
                                                    </span>
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
                                            <span className={`font-bold flex-shrink-0 ${getLevelColor(log.level)}`}>
                                                {log.level}
                                            </span>
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
