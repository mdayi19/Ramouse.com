import React, { useState, useEffect } from 'react';
import {
    BarChart, Calendar, Eye, MousePointerClick,
    Heart, TrendingUp, ArrowUp, ArrowDown, Activity, RefreshCw, Share2, Phone, MessageCircle, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import Icon from '../../Icon';

interface AnalyticsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ showToast }) => {
    const [period, setPeriod] = useState<number>(30);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState<any>(null);

    const handleExport = async () => {
        setExporting(true);
        try {
            await CarProviderService.exportAnalytics(period, 'csv');
            showToast('تم تصدير التقرير بنجاح', 'success');
        } catch (error: any) {
            console.error('Export failed:', error);
            showToast('فشل تصدير التقرير', 'error');
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const res = await CarProviderService.getProviderAnalytics(period);

            // Map the backend response to the format expected by the component
            const mappedData = {
                summary: {
                    total_views: res.analytics?.total_events?.view || 0,
                    views_growth: res.analytics?.growth?.views || 0,
                    total_contacts: (res.analytics?.total_events?.contact_phone || 0) +
                        (res.analytics?.total_events?.contact_whatsapp || 0),
                    contacts_growth: res.analytics?.growth?.contacts || 0,
                    total_favorites: res.analytics?.total_favorites || 0,
                    favorites_growth: res.analytics?.growth?.favorites || 0
                },
                events_breakdown: res.analytics?.events_breakdown || [
                    { name: 'مشاهدات', name_en: 'Views', value: 0, color: '#3b82f6' },
                    { name: 'اتصال هاتف', name_en: 'Phone Calls', value: 0, color: '#22c55e' },
                    { name: 'واتساب', name_en: 'WhatsApp', value: 0, color: '#25d366' },
                    { name: 'مفضلة', name_en: 'Favorites', value: 0, color: '#ef4444' },
                    { name: 'مشاركة', name_en: 'Shares', value: 0, color: '#8b5cf6' },
                ],
                conversion_rates: res.analytics?.conversion_rates || { view_to_contact: 0, view_to_favorite: 0 },
                listings_by_type: res.analytics?.listings_by_type || { sale: 0, rent: 0 },
                views_history: res.analytics?.views_history || [],
                top_listings: res.analytics?.top_performing_listings || []
            };

            setData(mappedData);
        } catch (error: any) {
            console.error('Failed to load analytics:', error);
            showToast(error.response?.data?.message || 'فشل تحميل الإحصائيات', 'error');
            // Set empty data structure instead of mock data
            setData({
                summary: { total_views: 0, views_growth: 0, total_contacts: 0, contacts_growth: 0, total_favorites: 0, favorites_growth: 0 },
                events_breakdown: [],
                conversion_rates: { view_to_contact: 0, view_to_favorite: 0 },
                listings_by_type: { sale: 0, rent: 0 },
                views_history: [],
                top_listings: []
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // Calculate max value for chart scaling
    const maxView = data?.views_history?.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 100;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-20"
        >
            {/* Header & Controls */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">الإحصائيات</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">تتبع أداء إعلاناتك وتفاعل العملاء</p>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleExport}
                        disabled={exporting || loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all disabled:opacity-50 shadow-sm"
                        title="تصدير التقرير"
                    >
                        <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                        <span className="text-sm font-medium hidden sm:inline">تصدير</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => loadAnalytics()}
                        disabled={loading || refreshing}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl transition-all disabled:opacity-50"
                        title="تحديث البيانات"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading || refreshing ? 'animate-spin' : ''}`} />
                    </motion.button>

                    <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl w-fit">
                        {[
                            { label: '7 أيام', value: 7 },
                            { label: '30 يوم', value: 30 },
                            { label: '90 يوم', value: 90 }
                        ].map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === opt.value
                                    ? 'bg-white dark:bg-slate-600 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Key Metrics Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="الظهور والمشاهدات"
                    value={data?.summary?.total_views || 0}
                    growth={data?.summary?.views_growth}
                    icon={Eye}
                    color="blue"
                />
                <MetricCard
                    title="نقرات الاتصال"
                    value={data?.summary?.total_contacts || 0}
                    growth={data?.summary?.contacts_growth}
                    icon={MousePointerClick}
                    color="green"
                />
                <MetricCard
                    title="المفضلة"
                    value={data?.summary?.total_favorites || 0}
                    growth={data?.summary?.favorites_growth}
                    icon={Heart}
                    color="red"
                />
            </motion.div>

            {/* Conversion Rates & Events Breakdown */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conversion Rates */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        معدلات التحويل
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                            <div className="relative inline-flex items-center justify-center w-20 h-20">
                                <svg className="w-20 h-20 transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" stroke="#e2e8f0" strokeWidth="6" fill="none" className="dark:stroke-slate-700" />
                                    <circle
                                        cx="40" cy="40" r="35"
                                        stroke="#22c55e"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${(data?.conversion_rates?.view_to_contact || 0) * 2.2} 220`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-lg font-bold text-green-600">{data?.conversion_rates?.view_to_contact || 0}%</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">مشاهدة → اتصال</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl">
                            <div className="relative inline-flex items-center justify-center w-20 h-20">
                                <svg className="w-20 h-20 transform -rotate-90">
                                    <circle cx="40" cy="40" r="35" stroke="#e2e8f0" strokeWidth="6" fill="none" className="dark:stroke-slate-700" />
                                    <circle
                                        cx="40" cy="40" r="35"
                                        stroke="#ef4444"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray={`${(data?.conversion_rates?.view_to_favorite || 0) * 2.2} 220`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-lg font-bold text-red-600">{data?.conversion_rates?.view_to_favorite || 0}%</span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">مشاهدة → مفضلة</p>
                        </div>
                    </div>
                </div>

                {/* Events Breakdown */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart className="w-5 h-5 text-blue-500" />
                        توزيع الأحداث
                    </h3>
                    <div className="space-y-3">
                        {data?.events_breakdown?.map((event: any, i: number) => {
                            const maxValue = Math.max(...(data?.events_breakdown?.map((e: any) => e.value) || [1]));
                            const percentage = maxValue > 0 ? (event.value / maxValue) * 100 : 0;
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-20 text-xs text-slate-600 dark:text-slate-400 text-right">{event.name}</span>
                                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 0.5, delay: i * 0.1 }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: event.color }}
                                        />
                                    </div>
                                    <span className="w-12 text-sm font-bold text-slate-900 dark:text-white text-left">{event.value}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Views Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            تحليل المشاهدات
                        </h3>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-2">
                        {data?.views_history?.map((item: any, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="relative w-full flex justify-center">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                        {item.value} مشاهدة
                                    </div>
                                    {/* Bar */}
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(item.value / maxView) * 100}%` }}
                                        transition={{ duration: 0.5, delay: i * 0.05 }}
                                        className="w-full max-w-[40px] bg-blue-100 dark:bg-blue-900/30 rounded-t-lg transition-colors group-hover:bg-blue-500 overflow-hidden relative"
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-blue-500/20 w-full h-full"
                                        ></div>
                                    </motion.div>
                                </div>
                                <span className="text-xs text-slate-500 transform -rotate-45 origin-top-left mt-2 md:rotate-0 md:mt-0 font-medium">
                                    {item.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Listings */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        الأعلى أداءً
                    </h3>

                    <div className="space-y-4">
                        {data?.top_listings?.map((item: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                            >
                                <span className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        i === 1 ? 'bg-slate-100 text-slate-700' :
                                            'bg-orange-100 text-orange-700'}
                                `}>
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> {item.views}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MousePointerClick className="w-3 h-3" /> {item.contacts}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {(!data?.top_listings || data.top_listings.length === 0) && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                لا توجد بيانات كافية
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// Helper Component for Metrics
const MetricCard: React.FC<{
    title: string;
    value: number;
    growth?: number;
    icon: any;
    color: 'blue' | 'green' | 'red';
}> = ({ title, value, growth, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20 group-hover:bg-green-100 dark:group-hover:bg-green-900/30',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
    };

    const isPositive = growth && growth >= 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl transition-colors ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                        : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                        }`}>
                        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>

            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                {title}
            </h3>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {value.toLocaleString()}
            </p>
        </div>
    );
};
