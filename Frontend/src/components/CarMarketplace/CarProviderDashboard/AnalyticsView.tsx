import React, { useState, useEffect } from 'react';
import {
    BarChart, Calendar, Eye, MousePointerClick,
    Heart, TrendingUp, ArrowUp, ArrowDown, Activity, RefreshCw, Share2, Download,
    Image as ImageIcon, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import Icon from '../../Icon';
import { getImageUrl } from '../../../utils/helpers';
import { AnalyticsListingsTable } from './AnalyticsListingsTable';

interface AnalyticsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AnalyticsSkeleton = () => (
    <div className="space-y-6 pb-20 animate-pulse">
        <div className="flex justify-between items-center h-16">
            <div className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
            <div className="lg:col-span-2 h-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            <div className="h-full bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
        </div>
    </div>
);

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

            const mappedData = {
                summary: {
                    total_views: res.analytics?.total_events?.view || 0,
                    views_growth: res.analytics?.growth?.views || 0,
                    total_contacts: (res.analytics?.total_events?.contact_phone || 0) +
                        (res.analytics?.total_events?.contact_whatsapp || 0),
                    contacts_growth: res.analytics?.growth?.contacts || 0,
                    total_favorites: res.analytics?.total_favorites || 0,
                    favorites_growth: res.analytics?.growth?.favorites || 0,
                    total_shares: res.analytics?.total_events?.share || 0,
                    shares_growth: res.analytics?.growth?.shares || 0
                },
                events_breakdown: res.analytics?.events_breakdown || [],
                conversion_rates: res.analytics?.conversion_rates || { view_to_contact: 0, view_to_favorite: 0 },
                listings_by_type: res.analytics?.listings_by_type || { sale: 0, rent: 0 },
                views_history: res.analytics?.views_history || [],
                top_listings: res.analytics?.top_performing_listings || []
            };

            setData(mappedData);
        } catch (error: any) {
            console.error('Failed to load analytics:', error);
            showToast('فشل تحميل الإحصائيات', 'error');
            setData(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading && !data) return <AnalyticsSkeleton />;

    const maxView = data?.views_history?.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 100;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-20"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-1">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300">
                        الإحصائيات
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        تحليل أداء إعلاناتك خلال آخر {period} يوم
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleExport}
                        disabled={exporting || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                        <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
                        <span className="hidden sm:inline">تصدير CSV</span>
                    </motion.button>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    {[
                        { label: '7 أيام', value: 7 },
                        { label: '30 يوم', value: 30 },
                        { label: '90 يوم', value: 90 }
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === opt.value
                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="المشاهدات"
                    value={data?.summary?.total_views}
                    growth={data?.summary?.views_growth}
                    icon={Eye}
                    color="blue"
                />
                <MetricCard
                    title="الاتصالات"
                    value={data?.summary?.total_contacts}
                    growth={data?.summary?.contacts_growth}
                    icon={Phone}
                    color="green"
                />
                <MetricCard
                    title="المفضلة"
                    value={data?.summary?.total_favorites}
                    growth={data?.summary?.favorites_growth}
                    icon={Heart}
                    color="red"
                />
                <MetricCard
                    title="المشاركات"
                    value={data?.summary?.total_shares}
                    growth={data?.summary?.shares_growth}
                    icon={Share2}
                    color="purple"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Views Trend Chart */}
                <motion.div
                    variants={itemVariants}
                    className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-50"></div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500" />
                                نشاط المشاهدات اليومي
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">توزيع المشاهدات على الأيام</p>
                        </div>
                    </div>

                    <div className="h-72 flex items-end justify-between gap-1 sm:gap-2 px-2">
                        {data?.views_history?.map((item: any, i: number) => {
                            const heightPercentage = (item.value / maxView) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar relative h-full justify-end">
                                    <div className="absolute -top-12 opacity-0 group-hover/bar:opacity-100 transition-all bg-slate-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl z-20 whitespace-nowrap -translate-y-2 group-hover/bar:translate-y-0 pointer-events-none">
                                        <span className="font-bold">{item.value}</span> مشاهدة
                                        <div className="text-[10px] text-slate-300 mt-0.5">{item.date}</div>
                                        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                    </div>

                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(heightPercentage, 2)}%` }} // Min height 2%
                                        transition={{ duration: 0.6, delay: i * 0.03, type: 'spring' }}
                                        className={`w-full max-w-[40px] rounded-t-lg relative overflow-hidden transition-all duration-300
                                            ${i === data.views_history.length - 1 ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-400 dark:hover:bg-blue-500'}
                                        `}
                                    >
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black/5 to-transparent"></div>
                                    </motion.div>

                                    <span className="text-[10px] sm:text-xs text-slate-400 font-medium rotate-0 group-hover/bar:text-blue-500 transition-colors">
                                        {item.date.split(' ')[0]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Top Listings with Images */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        الإعلانات الأكثر رواجاً
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1 custom-scrollbar">
                        {data?.top_listings?.map((item: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="group flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600"
                            >
                                {/* Ranking Badge */}
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        i === 1 ? 'bg-slate-200 text-slate-700' :
                                            i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}
                                `}>
                                    {i + 1}
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                    {item.image ? (
                                        <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                                            <Eye className="w-3 h-3" /> {item.views}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {Number(item.price).toLocaleString()} $
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Insights Row */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold mb-6 flex items-center gap-2 dark:text-white">
                        <BarChart className="w-5 h-5 text-indigo-500" />
                        تفاعل المستخدمين
                    </h3>
                    <div className="space-y-4">
                        {data?.events_breakdown?.map((event: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }}></div>
                                        {event.name}
                                    </span>
                                    <span className="font-bold dark:text-white">{event.value}</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(event.value / Math.max(...data.events_breakdown.map((e: any) => e.value), 1)) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: event.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold mb-6 flex items-center gap-2 dark:text-white">
                        <RefreshCw className="w-5 h-5 text-teal-500" />
                        جودة التحويل
                    </h3>
                    <div className="grid grid-cols-2 gap-4 h-full content-center">
                        <div className="relative group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/50 dark:from-slate-800 dark:to-emerald-900/20 border border-green-100 dark:border-green-900/30 flex flex-col items-center justify-center text-center">
                            <div className="text-3xl font-extrabold text-green-600 dark:text-green-400 mb-1">
                                {data?.conversion_rates?.view_to_contact}%
                            </div>
                            <div className="text-sm font-medium text-green-800 dark:text-green-300">مشاهدة ← اتصال</div>
                        </div>
                        <div className="relative group p-6 rounded-2xl bg-gradient-to-br from-red-50 to-pink-100/50 dark:from-slate-800 dark:to-pink-900/20 border border-red-100 dark:border-red-900/30 flex flex-col items-center justify-center text-center">
                            <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mb-1">
                                {data?.conversion_rates?.view_to_favorite}%
                            </div>
                            <div className="text-sm font-medium text-red-800 dark:text-red-300">مشاهدة ← مفضلة</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Detailed Listings Table */}
            <motion.div variants={itemVariants}>
                <AnalyticsListingsTable days={period} />
            </motion.div>
        </motion.div>
    );
};

const AreaChart = ({ data, color }: { data: any[], color: string }) => {
    const max = Math.max(...data.map(d => d.value), 1);

    // Generate optimized points
    // We'll use a simple polyline strategy effectively as it handles responsiveness well with preserveAspectRatio="none"
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (d.value / max) * 100;
        return `${x},${y}`;
    });

    const areaPath = `M 0,100 ${points.map(p => `L ${p}`).join(' ')} L 100,100 Z`;
    const linePath = `M ${points[0]} ${points.slice(1).map(p => `L ${p}`).join(' ')}`;

    return (
        <div className="relative w-full h-full group/chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.8" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <motion.path
                    d={areaPath}
                    fill="url(#chartGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                />

                {/* Stroke Line */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                />
            </svg>

            {/* Interactive Overlay & Tooltips */}
            <div className="absolute inset-0 flex items-end justify-between hover:cursor-crosshair">
                {data.map((item, i) => (
                    <div key={i} className="flex-1 h-full relative group/point flex flex-col justify-end items-center">
                        {/* Hover Indicator Line */}
                        <div className="absolute top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 opacity-0 group-hover/point:opacity-100 transition-opacity border-dashed border-l border-slate-300"></div>

                        {/* Point Dot on the line */}
                        <div
                            className="absolute w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full opacity-0 group-hover/point:opacity-100 transition-all shadow-lg z-10"
                            style={{
                                bottom: `${(item.value / max) * 100}%`,
                                transform: 'translateY(50%)'
                            }}
                        ></div>

                        {/* Tooltip */}
                        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 opacity-0 group-hover/point:opacity-100 transition-all z-20 pointer-events-none min-w-[100px]">
                            <div className="bg-slate-900/90 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-xl shadow-xl border border-slate-700/50 text-center">
                                <div className="font-bold text-lg leading-none mb-1">{item.value}</div>
                                <div className="text-[10px] text-slate-400 font-medium">مشاهدة • {item.date}</div>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900/90 rotate-45"></div>
                            </div>
                        </div>

                        {/* X-Axis Label (only show some to avoid clutter?) 
                             Actually we hide them and only show on hover or specific points. 
                             Or lets scatter them. 
                             For now, only show first, last, and middle? 
                         */}
                        <span className={`text-[10px] text-slate-400 mt-2 font-medium transition-colors group-hover/point:text-blue-500
                            ${i % Math.ceil(data.length / 5) === 0 ? 'opacity-100' : 'opacity-0 lg:opacity-100'}
                         `}>
                            {item.date.split(' ')[0]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

};

const MetricCard: React.FC<{
    title: string;
    value: number;
    growth?: number;
    icon: any;
    color: 'blue' | 'green' | 'red' | 'purple';
}> = ({ title, value, growth, icon: Icon, color }) => {
    const themes = {
        blue: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600', dark: 'dark:bg-blue-900/20 dark:text-blue-400' },
        green: { bg: 'from-green-500 to-green-600', light: 'bg-green-50 text-green-600', dark: 'dark:bg-green-900/20 dark:text-green-400' },
        red: { bg: 'from-red-500 to-red-600', light: 'bg-red-50 text-red-600', dark: 'dark:bg-red-900/20 dark:text-red-400' },
        purple: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50 text-purple-600', dark: 'dark:bg-purple-900/20 dark:text-purple-400' }
    };

    const isPositive = (growth || 0) >= 0;
    const theme = themes[color];

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${theme.bg}`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${theme.light} ${theme.dark}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {growth !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg border ${isPositive
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                        }`}>
                        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>

            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                {title}
            </h3>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {value?.toLocaleString() || 0}
            </p>
        </motion.div>
    );
};
