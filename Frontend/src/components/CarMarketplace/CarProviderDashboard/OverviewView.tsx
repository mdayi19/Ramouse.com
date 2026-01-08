import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Eye, Heart, TrendingUp, Plus, Wallet,
    ClipboardList, ChevronLeft, ArrowRight, ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';
import { useRealtime, useWalletUpdates } from '../../../hooks/useRealtime';

interface OverviewViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ provider, showToast }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [recentListings, setRecentListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(provider.wallet_balance || 0);

    const { listenToPrivateChannel } = useRealtime();

    // Fetch Initial Data
    const loadData = async () => {
        try {
            const [statsRes, analyticsRes, listingsRes] = await Promise.all([
                CarProviderService.getProviderStats(),
                CarProviderService.getProviderAnalytics(7),
                CarProviderService.getMyListings()
            ]);

            setStats(statsRes.stats);
            // Sync balance with fetched stats if available
            if (statsRes.stats?.wallet_balance !== undefined) {
                setBalance(statsRes.stats.wallet_balance);
            }
            setAnalyticsData(analyticsRes);
            setRecentListings((listingsRes.listings || []).slice(0, 5));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Real-time Updates
    useEffect(() => {
        if (!provider.user_id) return;

        // Listen for order/listing changes
        const stopListeningUser = listenToPrivateChannel(`user.${provider.user_id}`, '.stats.updated', () => {
            loadData();
        });

        return () => {
            stopListeningUser();
        };
    }, [provider.id, provider.user_id, listenToPrivateChannel]);

    // Wallet Real-time Updates
    useWalletUpdates(provider.user_id, (data) => {
        console.log('💰 Wallet update received in Overview:', data);
        if (data.new_balance !== undefined) {
            setBalance(data.new_balance);
        } else if (data.wallet_balance !== undefined) {
            // Handle alternative payload format
            setBalance(data.wallet_balance);
        } else {
            // Fallback: reload all data to be safe
            loadData();
        }
    }, showToast);


    // Animation Variants
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
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">نظرة عامة</h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">مرحباً {provider.name}، إليك ملخص نشاطك</p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/car-provider-dashboard/listings')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>إضافة سيارة جديدة</span>
                </motion.button>
            </motion.div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardMetricCard
                    title="السيارات النشطة"
                    value={stats?.total_listings || 0}
                    // For listings, 'trend' might not be as relevant daily, so we can omit or show generic
                    icon={Car}
                    color="blue"
                    delay={0.1}
                />
                <DashboardMetricCard
                    title="المشاهدات (7 أيام)"
                    value={analyticsData?.summary?.total_views || stats?.total_views || 0}
                    trend={analyticsData?.summary?.views_growth}
                    icon={Eye}
                    color="purple"
                    delay={0.2}
                />
                <DashboardMetricCard
                    title="نقرات الاتصال (7 أيام)"
                    value={analyticsData?.summary?.total_contacts || 0}
                    trend={analyticsData?.summary?.contacts_growth}
                    icon={ClipboardList}
                    color="green"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (Recent Listings + Mini Chart) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Views Chart Mini Section */}
                    {analyticsData?.views_history && (
                        <motion.div
                            variants={itemVariants}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    نشاط المشاهدات
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">آخر 7 أيام</span>
                            </div>

                            <div className="h-40 flex items-end justify-between gap-2 px-2">
                                {analyticsData.views_history.map((item: any, i: number) => {
                                    const max = Math.max(...analyticsData.views_history.map((d: any) => d.value), 1);
                                    const height = (item.value / max) * 100;
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                                            <div className="w-full relative h-32 flex items-end justify-center">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                                    className="w-full max-w-[24px] bg-blue-100 dark:bg-blue-900/40 rounded-t-md group-hover:bg-blue-500 transition-colors relative"
                                                >
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                                        {item.value}
                                                    </div>
                                                </motion.div>
                                            </div>
                                            <span className="text-[10px] text-slate-400">{item.date}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Recent Listings */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Car className="w-5 h-5 text-blue-500" />
                                أحدث السيارات المضافة
                            </h3>
                            <button
                                onClick={() => navigate('/car-provider-dashboard/listings')}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
                            >
                                عرض الكل
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-[-2px] transition-transform rtl:rotate-180" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentListings.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 dark:text-slate-400">لا توجد سيارات مضافة حديثاً</p>
                                </div>
                            ) : (
                                recentListings.map((listing, idx) => (
                                    <motion.div
                                        key={listing.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors border border-slate-100 dark:border-slate-700/50 group cursor-pointer"
                                        onClick={() => navigate(`/car-listings/listing/${listing.slug || listing.id}`)}
                                    >
                                        <div className="h-16 w-24 flex-shrink-0 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                                            <img
                                                src={listing.photos?.[0] || '/placeholder-car.jpg'}
                                                alt={listing.title}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="mr-4 flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{listing.title}</h4>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                <span>{listing.year}</span>
                                                <span>•</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {Number(listing.price).toLocaleString()} ل.س
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${listing.is_hidden
                                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {listing.is_hidden ? 'مخفي' : 'نشط'}
                                            </span>
                                            <span className="flex items-center text-xs text-slate-400 gap-1">
                                                <Eye className="w-3 h-3" />
                                                {listing.views_count}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar Column */}
                <motion.div variants={itemVariants} className="space-y-6">
                    {/* Enhanced Wallet Card */}
                    <div className="relative group overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
                        {/* Abstract Background Shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl transition-transform group-hover:scale-110 duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl transition-transform group-hover:scale-110 duration-700"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                    <Wallet className="w-6 h-6 text-white" />
                                </div>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                    متصل
                                </span>
                            </div>

                            <div className="mb-8">
                                <p className="text-blue-100 text-sm mb-2 font-medium opacity-80">الرصيد الحالي</p>
                                <h3 className="text-4xl font-bold tracking-tight">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={balance}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                        >
                                            {balance?.toLocaleString() || 0}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-xl font-medium opacity-70 mr-2">ل.س</span>
                                </h3>
                            </div>

                            <button
                                onClick={() => navigate('/car-provider-dashboard/wallet')}
                                className="w-full py-4 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg shadow-black/5 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                شحن المحفظة
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider text-opacity-70">
                            وصول سريع
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/car-provider-dashboard/orders')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 rounded-lg group-hover:scale-110 transition-transform">
                                        <ClipboardList className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">طلباتي</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                            </button>

                            <button
                                onClick={() => navigate('/car-provider-dashboard/store')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 transition-all hover:shadow-md group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">متجري</span>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const DashboardMetricCard: React.FC<{
    title: string;
    value: number;
    trend?: number;
    icon: any;
    color: 'blue' | 'green' | 'red' | 'purple';
    delay?: number;
}> = ({ title, value, trend, icon: Icon, color, delay = 0 }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/20',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/20',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'
    };

    const isPositive = trend && trend >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all hover:-translate-y-1"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colors[color]} transition-transform hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                        : 'text-red-500 bg-red-100 dark:bg-red-900/20'
                        }`}>
                        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1 truncate">
                {title}
            </h3>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {value.toLocaleString()}
            </p>
        </motion.div>
    );
};
