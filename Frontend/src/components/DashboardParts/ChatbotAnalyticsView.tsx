import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare, Users, Clock, AlertCircle, TrendingUp,
    ThumbsUp, ThumbsDown, Download, Calendar, BarChart3
} from 'lucide-react';
import { ChatbotAnalyticsService, ChatbotAnalytics } from '../../services/chatbot-analytics.service';

type Period = '7d' | '30d' | '90d' | 'all';

export const ChatbotAnalyticsView: React.FC = () => {
    const [analytics, setAnalytics] = useState<ChatbotAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('7d');
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await ChatbotAnalyticsService.getAnalytics(period);
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        try {
            await ChatbotAnalyticsService.exportCSV(period);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    const getPeriodLabel = (p: Period) => {
        return {
            '7d': 'آخر 7 أيام',
            '30d': 'آخر 30 يوم',
            '90d': 'آخر 90 يوم',
            'all': 'كل الوقت'
        }[p];
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400">جارٍ تحميل الإحصائيات...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return <div>Error loading analytics</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-3 sm:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                >
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 sm:gap-3">
                            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
                            تحليلات راموسة AI
                        </h1>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">إحصائيات الأداء والاستخدام</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        {/* Period Selector */}
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg p-1 shadow-sm overflow-x-auto">
                            {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap touch-target ${period === p
                                            ? 'bg-blue-500 text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {getPeriodLabel(p)}
                                </button>
                            ))}
                        </div>

                        {/* Export Button */}
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 touch-target text-sm sm:text-base"
                        >
                            <Download className="w-4 h-4" />
                            <span className="whitespace-nowrap">{exporting ? 'جارٍ التصدير...' : 'تصدير CSV'}</span>
                        </button>
                    </div>
                </motion.div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard
                        icon={<MessageSquare className="w-6 h-6" />}
                        label="إجمالي الرسائل"
                        value={analytics.overview.total_messages.toLocaleString()}
                        color="blue"
                    />
                    <StatCard
                        icon={<Users className="w-6 h-6" />}
                        label="المحادثات"
                        value={analytics.overview.total_conversations.toLocaleString()}
                        color="purple"
                    />
                    <StatCard
                        icon={<Users className="w-6 h-6" />}
                        label="المستخدمون"
                        value={analytics.overview.total_users.toLocaleString()}
                        color="green"
                    />
                    <StatCard
                        icon={<Clock className="w-6 h-6" />}
                        label="متوسط وقت الاستجابة"
                        value={`${analytics.overview.avg_response_time_ms}ms`}
                        color="orange"
                    />
                    <StatCard
                        icon={<AlertCircle className="w-6 h-6" />}
                        label="معدل الأخطاء"
                        value={`${analytics.overview.error_rate}%`}
                        color="red"
                    />
                </div>

                {/* Conversation & Performance Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Conversation Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                            إحصائيات المحادثات
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <span className="text-slate-700 dark:text-slate-300">متوسط الرسائل لكل محادثة</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {analytics.conversations.avg_messages_per_conversation}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Performance Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
                    >
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" />
                            الأداء (وقت الاستجابة)
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">P50</div>
                                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                    {analytics.performance.p50_ms}ms
                                </div>
                            </div>
                            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">P95</div>
                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                    {analytics.performance.p95_ms}ms
                                </div>
                            </div>
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">P99</div>
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                    {analytics.performance.p99_ms}ms
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feedback Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <ThumbsUp className="w-5 h-5 text-green-500" />
                        تقييمات المستخدمين
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">إجمالي التقييمات</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {analytics.feedback.total_feedback}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <ThumbsUp className="w-4 h-4" />
                                إيجابي
                            </div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {analytics.feedback.positive_count}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-center gap-1">
                                <ThumbsDown className="w-4 h-4" />
                                سلبي
                            </div>
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {analytics.feedback.negative_count}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">نسبة الرضا</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics.feedback.sentiment_ratio}%
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Popular Queries */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        أكثر الاستعلامات شيوعاً
                    </h3>
                    <div className="space-y-2">
                        {analytics.popular_queries.slice(0, 5).map((query, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 text-slate-700 dark:text-slate-300 truncate">
                                    {query.query}
                                </div>
                                <div className="flex-shrink-0 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                                    {query.count}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* User Engagement */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
                >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        تفاعل المستخدمين
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">مستخدمون جدد</div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {analytics.user_engagement.new_users}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">مستخدمون عائدون</div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {analytics.user_engagement.returning_users}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">رسائل الزوار</div>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {analytics.user_engagement.guest_messages}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">رسائل مسجلة</div>
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {analytics.user_engagement.authenticated_messages}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"
        >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white mb-3`}>
                {icon}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">{label}</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
        </motion.div>
    );
};
