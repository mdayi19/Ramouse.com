import React from 'react';
import { TrendingUp, Eye, Heart, Phone, Share2, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListingAnalytics {
    listingId: number;
    views: number;
    favorites: number;
    contacts: number;
    shares: number;
    viewsTrend: number; // percentage change
    conversionRate: number; // clicks to contacts ratio
}

interface AnalyticsCardProps {
    analytics: ListingAnalytics;
    className?: string;
}

/**
 * Analytics card showing listing performance metrics
 * Displays views, favorites, contacts with trend indicators
 * @param analytics - Listing analytics data
 */
export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ analytics, className }) => {
    const metrics = [
        {
            icon: Eye,
            label: 'المشاهدات',
            value: analytics.views,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            icon: Heart,
            label: 'المفضلة',
            value: analytics.favorites,
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            icon: Phone,
            label: 'جهات الاتصال',
            value: analytics.contacts,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            icon: Share2,
            label: 'المشاركات',
            value: analytics.shares,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        }
    ];

    const formatTrend = (trend: number) => {
        const sign = trend >= 0 ? '+' : '';
        return `${sign}${trend}%`;
    };

    return (
        <div className={className}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className={`w-10 h-10 rounded-lg ${metric.bg} flex items-center justify-center`}>
                                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                            </div>
                            {index === 0 && analytics.viewsTrend !== 0 && (
                                <div className={`flex items-center text-xs font-medium ${analytics.viewsTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <TrendingUp className={`w-3 h-3 ml-1 ${analytics.viewsTrend < 0 ? 'rotate-180' : ''}`} />
                                    {formatTrend(analytics.viewsTrend)}
                                </div>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {metric.value.toLocaleString('ar-SY')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {metric.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Conversion Rate */}
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            معدل التحويل
                        </span>
                    </div>
                    <span className="text-2xl font-bold text-primary">
                        {analytics.conversionRate.toFixed(1)}%
                    </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    نسبة المشاهدات التي تحولت إلى جهات اتصال
                </p>
            </div>
        </div>
    );
};

export default AnalyticsCard;
