import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car, Eye, Heart, TrendingUp, Plus, Wallet,
    ClipboardList, ChevronLeft, ArrowRight, ArrowUp, ArrowDown, Activity, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarProviderService } from '../../../services/carprovider.service';
import { CarProvider } from '../../../types';
import { useRealtime, useWalletUpdates } from '../../../hooks/useRealtime';
import { MarketplaceQuickAccess } from '../../DashboardParts/Shared';

interface OverviewViewProps {
    provider: CarProvider;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ provider, showToast }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [recentListings, setRecentListings] = useState<any[]>([]);
    const [sponsoredListings, setSponsoredListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [balance, setBalance] = useState(provider.wallet_balance || 0);

    const { listenToPrivateChannel } = useRealtime();

    // Fetch Initial Data
    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

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
            const allListings = listingsRes.listings || [];
            setRecentListings(allListings.slice(0, 5));
            const sponsored = allListings.filter((listing: any) => listing.is_sponsored && !listing.is_hidden);
            setSponsoredListings(sponsored.slice(0, 4));

            if (isRefresh) {
                showToast('تم تحديث البيانات بنجاح', 'success');
            }
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.message || 'فشل تحميل البيانات';
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
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

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'صباح الخير ☀️';
        if (hour < 18) return 'مساء الخير 🌤️';
        return 'مساء الخير 🌙';
    };

    // Quick Action Button Component
    const QuickActionBtn: React.FC<{ onClick: () => void, emoji: string, label: string, bgColor: string }> = ({ onClick, emoji, label, bgColor }) => (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-3 sm:p-4 h-auto shadow-sm hover:shadow-md w-full min-h-[90px] sm:min-h-[110px] border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform rounded-2xl bg-white dark:bg-slate-800`}
        >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 ${bgColor} text-2xl sm:text-3xl shadow-sm`}>
                {emoji}
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-1">{label}</span>
        </motion.button>
    );

    return (
        <div className="w-full h-full animate-fade-in">
            {/* Mobile Header - Sticky */}
            <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-900/90 backdrop-blur-md px-4 pt-4 pb-4 sm:hidden border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">{getGreeting()}</p>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {provider.name?.split(' ')[0] || 'يا هلا'} 👋
                        </h2>
                    </div>
                    <button
                        onClick={() => navigate('/car-provider-dashboard/settings')}
                        className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <span className="text-xl">⚙️</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8 -mt-2 sm:mt-0">
                {/* Desktop Welcome Header */}
                <div className="hidden sm:block mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black mb-2">أهلاً بك، {provider.name?.split(' ')[0] || 'عميلنا العزيز'}! 👋</h2>
                            <p className="text-white/90 text-lg font-medium max-w-xl">جاهزون لإدارة سياراتك وطلباتك اليوم. ماذا تريد أن تفعل؟</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => loadData(true)}
                                disabled={refreshing}
                                className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50 border border-white/20"
                                title="تحديث البيانات"
                            >
                                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/car-provider-dashboard/listings')}
                                className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-xl transition-all font-bold shadow-lg hover:bg-blue-50"
                            >
                                <Plus className="w-5 h-5" />
                                <span>إضافة سيارة جديدة</span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Mobile Content Container */}
                <div className="bg-slate-50 dark:bg-slate-900 sm:bg-transparent rounded-t-3xl sm:rounded-none pt-4 sm:pt-0">

                    {/* Primary CTA - Add New Car (Mobile Only) */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/car-provider-dashboard/listings')}
                        className="sm:hidden w-full mb-8 flex items-center justify-between gap-4 bg-slate-900 dark:bg-black text-white p-5 rounded-[2rem] shadow-xl shadow-slate-900/20 border-4 border-white dark:border-slate-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30 animate-pulse">
                                <span className="text-2xl">➕</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-xl block mb-1">إضافة سيارة جديدة</span>
                                <span className="text-sm text-slate-300 font-medium">زِد من عروضك في السوق</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <ChevronLeft className="w-6 h-6 text-white rtl:rotate-180" />
                        </div>
                    </motion.button>

                    {/* Compact Wallet Card - Mobile Only */}
                    <div className="lg:hidden mb-6 relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-lg">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                                    <Wallet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs mb-0.5 opacity-80">الرصيد الحالي</p>
                                    <h3 className="text-2xl font-bold tracking-tight">
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={balance}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                            >
                                                {balance?.toLocaleString() || 0}
                                            </motion.span>
                                        </AnimatePresence>
                                        <span className="text-sm font-medium opacity-70 mr-1">ل.س</span>
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/car-provider-dashboard/wallet')}
                                className="px-4 py-2 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 flex items-center gap-1.5 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                شحن
                            </button>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 mb-6 px-1">
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/listings')} emoji="🚗" label="سياراتي" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/orders')} emoji="📦" label="الطلبات" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/wallet')} emoji="💰" label="المحفظة" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/analytics')} emoji="📊" label="التحليلات" bgColor="bg-purple-100 dark:bg-purple-900/30" />
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/settings')} emoji="⚙️" label="الإعدادات" bgColor="bg-slate-100 dark:bg-slate-700/30" />
                        <QuickActionBtn onClick={() => navigate('/car-provider-dashboard/store')} emoji="🛍️" label="المتجر" bgColor="bg-pink-100 dark:bg-pink-900/30" />
                    </div>

                    {/* Sponsored Cars CTA */}
                    {sponsoredListings.length > 0 && (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/car-provider-dashboard/sponsorManagement')}
                            className="mb-6 cursor-pointer"
                        >
                            <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                            <span className="text-3xl animate-pulse">⭐</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl mb-1">لديك {sponsoredListings.length} سيارات مميزة</h3>
                                            <p className="text-sm text-white/90 font-medium">انقر لإدارة السيارات المميزة وتعزيز مبيعاتك</p>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <ChevronLeft className="w-6 h-6 text-white rtl:rotate-180" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Marketplace Quick Access */}
                    <MarketplaceQuickAccess onNavigate={(view) => window.location.href = `/${view}`} />

                    {/* Public Services Section */}
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 px-1 flex items-center gap-2">
                            <span>🌟</span>
                            خدمات عامة
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => window.location.href = '/technicians'}
                                className="relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-700"
                            >
                                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                                        <span className="text-2xl">👨‍🔧</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg mb-1">دليل الفنيين</h4>
                                        <p className="text-sm opacity-90 font-medium">ابحث عن سباك أو كهربائي</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => window.location.href = '/tow-trucks'}
                                className="relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-700"
                            >
                                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                                        <span className="text-2xl">🚚</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg mb-1">دليل السطحات</h4>
                                        <p className="text-sm opacity-90 font-medium">خدمات سحب السيارات</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => window.location.href = '/blog'}
                                className="relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-rose-500 to-rose-700"
                            >
                                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                                        <span className="text-2xl">📰</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg mb-1">المدونة</h4>
                                        <p className="text-sm opacity-90 font-medium">نصائح ومقالات</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => window.location.href = '/contact'}
                                className="relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-slate-600 to-slate-800"
                            >
                                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                                        <span className="text-2xl">📞</span>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg mb-1">تواصل معنا</h4>
                                        <p className="text-sm opacity-90 font-medium">نحن هنا لمساعدتك</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>


                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3 mb-6"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-red-900 dark:text-red-200 font-medium">حدث خطأ</p>
                                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => loadData(true)}
                                className="mr-auto text-sm text-red-600 dark:text-red-400 hover:underline"
                            >
                                إعادة المحاولة
                            </button>
                        </motion.div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div className="space-y-6">
                            {/* Stats Grid Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                        </div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
                                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Enhanced Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <DashboardMetricCard
                                    title="السيارات النشطة"
                                    value={stats?.total_listings || 0}
                                    icon={Car}
                                    color="blue"
                                    delay={0.1}
                                />
                                <DashboardMetricCard
                                    title="المشاهدات (7 أيام)"
                                    value={analyticsData?.analytics?.total_events?.view || stats?.total_views || 0}
                                    icon={Eye}
                                    color="purple"
                                    delay={0.2}
                                />
                                <DashboardMetricCard
                                    title="نقرات الاتصال (7 أيام)"
                                    value={(analyticsData?.analytics?.total_events?.contact_phone || 0) + (analyticsData?.analytics?.total_events?.contact_whatsapp || 0)}
                                    icon={ClipboardList}
                                    color="green"
                                    delay={0.3}
                                />
                                <DashboardMetricCard
                                    title="الإعجابات"
                                    value={analyticsData?.analytics?.total_favorites || 0}
                                    icon={Heart}
                                    color="red"
                                    delay={0.4}
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Content Area (Recent Listings + Mini Chart) */}
                                <div className="lg:col-span-2 space-y-6">

                                    {/* Views Chart Mini Section */}
                                    {analyticsData?.views_history && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
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


                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
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
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                    {/* Enhanced Wallet Card - Desktop Only */}
                                    <div className="hidden lg:block relative group overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20">
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

                                </motion.div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
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
