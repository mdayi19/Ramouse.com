import React, { useMemo, useState, useEffect } from 'react';
import { Car, Check, Eye, BarChart3, TrendingUp, ArrowUp, ArrowDown, Share2, Phone, Download, Activity, Image as ImageIcon, Users, MessageSquare, Heart, ChevronLeft, ChevronRight, AlertCircle, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { Stats, Listing } from './types';
import { getImageUrl } from '../../../utils/helpers';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

interface Props {
    stats: Stats | null;
    computedStats: {
        total: number;
        active: number;
        views: number;
        sale: number;
        rent: number;
    };
    loading: boolean;
    listings: Listing[];
}

export const MyCarListingsAnalytics: React.FC<Props> = ({ stats, computedStats, loading: initialLoading, listings: allListings }) => {
    const [period, setPeriod] = useState<number>(30); // Mock period for UI consistency

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);
    const [tableLoading, setTableLoading] = useState(false);

    // Calculate Top Performing Listings (based on all listings)
    const topListings = useMemo(() => {
        return [...allListings]
            .sort((a, b) => b.views_count - a.views_count)
            .slice(0, 5);
    }, [allListings]);

    // Mock calculations for metrics to match AnalyticsView style
    const averageViews = computedStats.total > 0 ? Math.round(computedStats.views / computedStats.total) : 0;

    // Mock growth data (since we don't have historical data in standard user stats yet)
    const growth = {
        views: 12,
        listings: 5,
        active: 0
    };

    // Client-side pagination logic
    const paginatedListings = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        return allListings.slice(start, end);
    }, [currentPage, perPage, allListings]);

    const totalPages = Math.ceil(allListings.length / perPage);

    // Reset page when total listings change significantly
    useEffect(() => {
        setCurrentPage(1);
    }, [allListings.length]);

    // Simulate loading for table transitions (optional, adds polish)
    useEffect(() => {
        setTableLoading(true);
        const timer = setTimeout(() => setTableLoading(false), 300);
        return () => clearTimeout(timer);
    }, [currentPage]);

    if (initialLoading) {
        return <AnalyticsSkeleton />;
    }

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
                        تحليل الأداء
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        ملخص نشاط إعلاناتك وتفاعل المشترين
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed rounded-xl font-medium transition-all"
                        disabled
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">تصدير CSV</span>
                    </button>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    {[
                        { label: '30 يوم', value: 30 },
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
                    title="إجمالي المشاهدات"
                    value={computedStats.views}
                    growth={growth.views}
                    icon={Eye}
                    color="blue"
                />
                <MetricCard
                    title="إجمالي الإعلانات"
                    value={computedStats.total}
                    growth={growth.listings}
                    icon={Car}
                    color="purple"
                />
                <MetricCard
                    title="الإعلانات النشطة"
                    value={computedStats.active}
                    growth={null}
                    icon={Check}
                    color="green"
                />
                <MetricCard
                    title="متوسط المشاهدات"
                    value={averageViews}
                    growth={null}
                    icon={Activity}
                    color="red"
                />
            </motion.div>

            {/* Top Listings */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    الإعلانات الأكثر رواجاً
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {topListings.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className="group flex flex-col gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600 relative overflow-hidden"
                        >
                            {/* Ranking Badge */}
                            <div className={`
                                absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10
                                ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    i === 1 ? 'bg-slate-200 text-slate-700' :
                                        i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}
                            `}>
                                {i + 1}
                            </div>

                            {/* Thumbnail */}
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                <img
                                    src={getImageUrl(item.photos?.[0]) || '/placeholder-car.jpg'}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> {item.views_count}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors text-right">
                                    {item.title}
                                </h4>
                                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                                    <span>{item.model}</span>
                                    <span>{item.year}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {topListings.length === 0 && (
                        <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                            لا توجد بيانات كافية
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Detailed Listings Table */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">تفاصيل أداء الإعلانات</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            جدول تفصيلي لجميع التفاعلات مع إعلاناتك
                        </p>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">
                        {allListings.length} إعلان
                    </div>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">الإعلان</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> المشاهدات</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Users className="w-3 h-3" /> زوار فريدون</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> اتصال</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> واتساب</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> مفضلة</span>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                                    <span className="flex items-center justify-center gap-1"><Share2 className="w-3 h-3" /> مشاركة</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {tableLoading ? (
                                // Table Skeleton
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-48"></div></td>
                                        {[...Array(6)].map((_, j) => (
                                            <td key={j} className="px-6 py-4 text-center"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-12 mx-auto"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginatedListings.length > 0 ? (
                                paginatedListings.map((item) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative">
                                                    <img
                                                        src={getImageUrl(item.photos?.[0]) || '/placeholder-car.jpg'}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">
                                                        {item.model} • {item.year}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                            {item.views_count}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-600 dark:text-slate-400">
                                            {item.unique_visitors || 0}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.contact_phone_count || 0) > 0 ? "success" : "secondary"} className="font-bold">
                                                {item.contact_phone_count || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.contact_whatsapp_count || 0) > 0 ? "success" : "secondary"} className="font-bold">
                                                {item.contact_whatsapp_count || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant={(item.favorites_count || 0) > 0 ? "destructive" : "secondary"} className="font-bold">
                                                {item.favorites_count || 0}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {item.shares_count || 0}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Inbox className="w-12 h-12 text-slate-300" />
                                            <span>لا توجد بيانات متاحة للعرض</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50">
                    {tableLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                    <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                                </div>
                            </div>
                        ))
                    ) : paginatedListings.length > 0 ? (
                        paginatedListings.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div className="flex gap-4 mb-4">
                                    <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-100 dark:border-slate-700">
                                        <img
                                            src={getImageUrl(item.photos?.[0]) || '/placeholder-car.jpg'}
                                            alt={item.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-base line-clamp-2 mb-1">{item.title}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {item.model} • {item.year}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> المشاهدات
                                        </span>
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{item.views_count}</span>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
                                            <Users className="w-3 h-3" /> زوار فريدون
                                        </span>
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{item.unique_visitors || 0}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">اتصال</span>
                                        <Badge variant={(item.contact_phone_count || 0) > 0 ? "success" : "secondary"} className="h-6">
                                            <Phone className="w-3 h-3 ml-1" />
                                            {item.contact_phone_count || 0}
                                        </Badge>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">واتساب</span>
                                        <Badge variant={(item.contact_whatsapp_count || 0) > 0 ? "success" : "secondary"} className="h-6">
                                            <MessageSquare className="w-3 h-3 ml-1" />
                                            {item.contact_whatsapp_count || 0}
                                        </Badge>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100 dark:bg-slate-700"></div>
                                    <div className="flex flex-col items-center flex-1">
                                        <span className="text-[10px] text-slate-400 mb-1">مفضلة</span>
                                        <Badge variant={(item.favorites_count || 0) > 0 ? "destructive" : "secondary"} className="h-6">
                                            <Heart className="w-3 h-3 ml-1" />
                                            {item.favorites_count || 0}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Inbox className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>لا توجد بيانات متاحة للعرض</p>
                        </div>
                    )}
                </div>

                {/* Content Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>

                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            صفحة {currentPage} من {totalPages}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// --- Sub Components ---

const AnalyticsSkeleton = () => (
    <div className="space-y-6 pb-20 animate-pulse">
        <div className="flex justify-between items-center h-16">
            <div className="space-y-2">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
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

const MetricCard: React.FC<{
    title: string;
    value: number;
    growth?: number | null;
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
            className="bg-white dark:bg-slate-800 rounded-2xl p-3 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${theme.bg}`}></div>
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-xl ${theme.light} ${theme.dark}`}>
                    <Icon className="w-4 h-4" />
                </div>
                {growth !== null && growth !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-1 rounded-lg border ${isPositive
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                        }`}>
                        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(growth)}%
                    </div>
                )}
            </div>

            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                {title}
            </h3>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {value?.toLocaleString() || 0}
            </p>
        </motion.div>
    );
};
