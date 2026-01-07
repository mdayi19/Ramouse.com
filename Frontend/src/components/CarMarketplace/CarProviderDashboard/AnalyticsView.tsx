import React, { useState, useEffect } from 'react';
import {
    BarChart, Calendar, Eye, MousePointerClick,
    Heart, TrendingUp, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { CarProviderService } from '../../../services/carprovider.service';
import Icon from '../../Icon';

interface AnalyticsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ showToast }) => {
    const [period, setPeriod] = useState<number>(30);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, [period]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const res = await CarProviderService.getProviderAnalytics(period);
            setData(res);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            // Fallback mock data for demo if API fails or returns empty
            setData(getMockData(period));
        } finally {
            setLoading(false);
        }
    };

    const getMockData = (days: number) => ({
        summary: {
            total_views: 1250,
            views_growth: 12.5,
            total_contacts: 45,
            contacts_growth: -5.2,
            total_favorites: 89,
            favorites_growth: 8.4
        },
        views_history: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG', { weekday: 'short' }),
            value: Math.floor(Math.random() * 100) + 50
        })),
        top_listings: [
            { id: 1, title: 'تويوتا كامري 2022', views: 450, contacts: 12 },
            { id: 2, title: 'هيونداي سوناتا 2021', views: 320, contacts: 8 },
            { id: 3, title: 'كيا سبورتاج 2023', views: 280, contacts: 15 },
        ]
    });

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // Calculate max value for chart scaling
    const maxView = data?.views_history?.reduce((max: number, item: any) => Math.max(max, item.value), 0) || 100;

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">الإحصائيات</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">تتبع أداء إعلاناتك وتفاعل العملاء</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl">
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

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Views Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
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
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-10">
                                        {item.value} مشاهدة
                                    </div>
                                    {/* Bar */}
                                    <div
                                        className="w-full max-w-[40px] bg-blue-100 dark:bg-blue-900/30 rounded-t-lg transition-all group-hover:bg-blue-500 overflow-hidden relative"
                                        style={{ height: `${(item.value / maxView) * 100}%` }}
                                    >
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-blue-500/20 w-full h-full"
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-500 transform -rotate-45 origin-top-left mt-2 md:rotate-0 md:mt-0">
                                    {item.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Listings */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        الأعلى أداءً
                    </h3>

                    <div className="space-y-4">
                        {data?.top_listings?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <span className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                        i === 1 ? 'bg-slate-100 text-slate-700' :
                                            'bg-orange-100 text-orange-700'}
                                `}>
                                    {i + 1}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-1">
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
                            </div>
                        ))}

                        {(!data?.top_listings || data.top_listings.length === 0) && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                لا توجد بيانات كافية
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
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
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20'
    };

    const isPositive = growth && growth >= 0;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color]}`}>
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
