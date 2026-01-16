import React, { useState, useEffect } from 'react';
import { CarProviderService } from '../../services/carprovider.service';
import { TrendingUp, Eye, Heart, Share2, MousePointerClick } from 'lucide-react';
import Icon from '../Icon';

interface AnalyticsViewProps {
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ showToast }) => {
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(30);
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        loadAnalytics();
    }, [days]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const response = await CarProviderService.getProviderAnalytics(days);
            setAnalytics(response.analytics);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            showToast('فشل تحميل التحليلات', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Icon name="Loader" className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-20">
                <TrendingUp className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                    لا توجد بيانات
                </h3>
            </div>
        );
    }

    const totalViews = analytics.total_events?.view || 0;
    const totalVisitors = analytics.unique_visitors || 0;
    const totalPhoneClicks = analytics.total_events?.contact_phone || 0;
    const totalFavorites = analytics.total_favorites || 0;

    const viewsHistory = analytics.views_history || [];

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    التحليلات المتقدمة
                </h3>
                <div className="flex gap-2">
                    {[7, 30, 90].map(period => (
                        <button
                            key={period}
                            onClick={() => setDays(period)}
                            className={`px-4 py-2 rounded-lg transition-colors ${days === period
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {period} يوم
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                    title="إجمالي المشاهدات"
                    value={totalViews}
                    icon={Eye}
                    color="blue"
                />
                <MetricCard
                    title="الزوار الفريدون"
                    value={totalVisitors}
                    icon={TrendingUp}
                    color="green"
                />
                <MetricCard
                    title="نقرات الهاتف"
                    value={totalPhoneClicks}
                    icon={MousePointerClick}
                    color="purple"
                />
                <MetricCard
                    title="الإعجابات"
                    value={totalFavorites}
                    icon={Heart}
                    color="red"
                />
            </div>

            {/* Daily Trend Chart (Simplified) */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    سجل المشاهدات اليومي
                </h4>
                {viewsHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <th className="px-4 py-2 text-right">التاريخ</th>
                                    <th className="px-4 py-2 text-right">المشاهدات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {viewsHistory.map((day: any, index: number) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2">{day.date}</td>
                                        <td className="px-4 py-2">{day.value || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">
                        لا توجد بيانات للفترة المحددة
                    </p>
                )}
            </div>

            {/* Per-Listing Performance */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    أداء الإعلانات
                </h4>
                {analytics.top_performing_listings && analytics.top_performing_listings.length > 0 ? (
                    <div className="space-y-3">
                        {analytics.top_performing_listings.map((listing: any) => (
                            <div
                                key={listing.id}
                                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
                            >
                                <div className="flex-1">
                                    <h5 className="font-bold text-slate-900 dark:text-white">
                                        {listing.title}
                                    </h5>
                                    <p className="text-sm text-slate-500">
                                        {listing.price.toLocaleString()} $ • {listing.listing_type === 'sale' ? 'بيع' : 'إيجار'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <Eye className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                                        <span className="font-bold">{listing.views}</span>
                                    </div>
                                    <div className="text-center">
                                        <MousePointerClick className="w-4 h-4 mx-auto mb-1 text-green-500" />
                                        <span className="font-bold">{listing.contacts || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-center py-8">
                        لا توجد إعلانات بعد
                    </p>
                )}
            </div>
        </div>
    );
};

// Metric Card Component
const MetricCard: React.FC<{
    title: string;
    value: number;
    icon: any;
    color: 'blue' | 'green' | 'purple' | 'red';
}> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20',
        red: 'bg-red-100 text-red-600 dark:bg-red-900/20'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        {title}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {value.toLocaleString()}
                    </div>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};
