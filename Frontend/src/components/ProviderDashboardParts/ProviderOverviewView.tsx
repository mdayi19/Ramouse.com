import React, { useMemo } from 'react';
import { Provider, Order, Transaction } from '../../types';
import Icon from '../Icon';
import EmptyState from '../EmptyState';
import { ProviderView } from './types';
import { LineChart, BarChart } from '../DataCharts';
import { MarketplaceQuickAccess } from '../DashboardParts/Shared';

interface ProviderOverviewViewProps {
    provider: Provider;
    overviewData: {
        stats: {
            walletBalance: number;
            activeBids: number;
            wonOrders: number;
            openOrders: number;
            totalBids: number;
        };
        recentTransactions: Transaction[];
        charts: {
            activity: { name: string; date: string; quotes: number }[];
            revenue: { name: string; date: string; value: number }[];
        };
    } | null;
    onNavigate: (view: ProviderView) => void;
    isLoading: boolean;
    onRefresh: () => void;
}

const ProviderOverviewView: React.FC<ProviderOverviewViewProps> = ({ provider, overviewData, onNavigate, isLoading, onRefresh }) => {

    const stats = overviewData?.stats || {
        walletBalance: provider.walletBalance ?? 0,
        activeBids: 0,
        wonOrders: 0,
        openOrders: 0,
        totalBids: 0
    };

    const recentTransactions = overviewData?.recentTransactions || [];
    const activityData = overviewData?.charts.activity || [];
    const revenueData = overviewData?.charts.revenue || [];

    // Stat Mini Card with Emoji - Compact on mobile
    const StatMini: React.FC<{ value: string | number, label: string, emoji: string, color: string, bgColor: string, trend?: string }> = ({ value, label, emoji, color, bgColor, trend }) => (
        <div className={`${bgColor} p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-white/50 dark:border-slate-700/50 shadow-lg transition-all hover:scale-105`}>
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <span className="text-3xl sm:text-4xl drop-shadow-sm">{emoji}</span>
                {isLoading ? (
                    <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/50 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                ) : (
                    <span className="text-xl sm:text-3xl font-black text-slate-800 dark:text-slate-200">{value}</span>
                )}
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">{label}</p>
            {trend && <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 hidden sm:block">{trend}</p>}
        </div>
    );

    // Quick Action Button with Emoji - Compact on mobile
    const QuickBtn: React.FC<{ onClick: () => void, emoji: string, label: string, bgColor: string, badge?: number }> = ({ onClick, emoji, label, bgColor, badge }) => (
        <button
            onClick={() => {
                if (navigator.vibrate) navigator.vibrate(30);
                onClick();
            }}
            className={`relative flex flex-col items-center justify-center p-3 sm:p-5 ${bgColor} rounded-2xl active:scale-95 transition-all hover:shadow-xl shadow-lg border-2 border-white/30`}
        >
            <span className="text-3xl sm:text-5xl mb-1 sm:mb-2 drop-shadow-md">{emoji}</span>
            <span className="text-[10px] sm:text-sm font-black text-white text-center leading-tight">{label}</span>
            {badge !== undefined && badge > 0 && !isLoading && (
                <span className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2 bg-red-500 text-white text-[10px] sm:text-xs font-black min-w-[20px] sm:min-w-[24px] h-[20px] sm:h-[24px] px-1 sm:px-1.5 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </button>
    );

    return (
        <div className="w-full h-full animate-fade-in">
            {/* Mobile Header */}
            <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-darkbg/90 backdrop-blur-md px-4 pt-4 pb-6 sm:hidden border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">صباح الخير ☀️</p>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {provider.name} 👋
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRefresh}
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-transform text-slate-600 dark:text-slate-300"
                        >
                            <Icon name="RefreshCw" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => onNavigate('settings')}
                            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <span className="text-xl">⚙️</span>
                        </button>
                    </div>
                </div>

                {/* Wallet Balance - Mobile */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-lg text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-300 text-xs flex items-center gap-1 font-medium">
                                <span>💰</span>
                                رصيد المحفظة
                            </p>
                            <h3 className="text-2xl font-black text-white mt-1" dir="ltr">
                                ${Number(stats.walletBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <button
                            onClick={() => onNavigate('wallet')}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-xl text-xs backdrop-blur-sm border border-white/10 active:scale-95 transition-all"
                        >
                            إدارة
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:block mx-6 mt-6">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-slate-400 font-medium mb-1">أهلاً بك مجدداً، {provider.name}!</p>
                            <div className="flex items-center gap-2 mt-3">
                                <Icon name="Wallet" className="w-5 h-5 text-slate-400" />
                                <span className="text-slate-400">رصيد المحفظة:</span>
                                <span className="text-3xl lg:text-4xl font-black" dir="ltr">
                                    ${Number(stats.walletBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onRefresh}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 backdrop-blur-sm border border-white/10"
                            >
                                <Icon name="RefreshCw" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={() => onNavigate('wallet')}
                                className="bg-white text-slate-900 hover:bg-slate-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <span>إدارة المحفظة</span>
                                <Icon name="ArrowLeft" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 pb-24 sm:pb-8 -mt-2 sm:mt-0">
                <div className="bg-slate-50 dark:bg-darkbg sm:bg-transparent rounded-t-3xl sm:rounded-none pt-4 sm:pt-6">

                    {/* Stats Grid - Visual with Emojis */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <StatMini
                            value={stats.openOrders}
                            label="فرص جديدة"
                            emoji="🔍"
                            color="text-blue-600"
                            bgColor="bg-blue-50 dark:bg-blue-900/30"
                            trend="بانتظار عروضك"
                        />
                        <StatMini
                            value={stats.activeBids}
                            label="عروضي النشطة"
                            emoji="📝"
                            color="text-indigo-600"
                            bgColor="bg-indigo-50 dark:bg-indigo-900/30"
                            trend={`${stats.totalBids} إجمالي`}
                        />
                        <StatMini
                            value={stats.wonOrders}
                            label="طلبات فزت بها"
                            emoji="🏆"
                            color="text-emerald-600"
                            bgColor="bg-emerald-50 dark:bg-emerald-900/30"
                            trend="عمل رائع! 👏"
                        />
                        <StatMini
                            value={recentTransactions.length}
                            label="عمليات حديثة"
                            emoji="💰"
                            color="text-slate-600"
                            bgColor="bg-slate-50 dark:bg-slate-800"
                        />
                    </div>

                    {/* Quick Actions - Big Visual Buttons */}
                    <div className="mb-6">
                        <h3 className="font-bold text-base text-slate-800 dark:text-white mb-4 px-1 flex items-center gap-2">
                            ⚡ إجراءات سريعة
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <QuickBtn
                                onClick={() => onNavigate('openOrders')}
                                emoji="🔍"
                                label="تصفح الطلبات"
                                bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
                                badge={stats.openOrders}
                            />
                            <QuickBtn
                                onClick={() => onNavigate('myBids')}
                                emoji="📝"
                                label="عروضي"
                                bgColor="bg-gradient-to-br from-indigo-500 to-purple-600"
                            />
                            <QuickBtn
                                onClick={() => onNavigate('accepted')}
                                emoji="✅"
                                label="المقبولة"
                                bgColor="bg-gradient-to-br from-emerald-500 to-green-600"
                                badge={stats.wonOrders}
                            />
                            <QuickBtn
                                onClick={() => onNavigate('flashProducts')}
                                emoji="⚡"
                                label="العروض"
                                bgColor="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                        </div>
                    </div>

                    {/* Charts Section - Horizontal scroll on mobile */}
                    <div className="mb-6">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 px-1">الإحصائيات</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:overflow-visible scrollbar-hide">
                            {/* Activity Chart */}
                            <div className="min-w-[280px] sm:min-w-0 bg-white dark:bg-darkcard p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                        <Icon name="BarChart2" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">نشاط العروض</span>
                                </div>
                                <div className="h-36 sm:h-44 w-full">
                                    <LineChart data={activityData} />
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <div className="min-w-[280px] sm:min-w-0 bg-white dark:bg-darkcard p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                        <Icon name="TrendingUp" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">التدفقات المالية</span>
                                </div>
                                <div className="h-36 sm:h-44 w-full">
                                    <BarChart data={revenueData} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-darkcard p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⏱️</span>
                                <span className="font-black text-sm text-slate-800 dark:text-slate-200">آخر العمليات</span>
                            </div>
                            <button onClick={() => onNavigate('wallet')} className="text-xs font-bold text-primary">عرض الكل</button>
                        </div>

                        {recentTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {recentTransactions.map(t => (
                                    <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <div className="min-w-0 flex-grow">
                                            <p className="font-bold text-sm text-slate-700 dark:text-slate-200 truncate">{t.description}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {new Date(t.timestamp).toLocaleDateString('ar-SY', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className={`font-black text-sm px-2 py-1 rounded-lg ${Number(t.amount) > 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`} dir="ltr">
                                            {Number(t.amount) > 0 ? '+' : ''}{Number(t.amount).toLocaleString()}$
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                    <Icon name="Receipt" className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">لا يوجد نشاط مالي حديث</p>
                            </div>
                        )}
                    </div>

                    {/* Marketplace Quick Access */}
                    <MarketplaceQuickAccess onNavigate={(view) => window.location.href = `/${view}`} />

                    {/* Public Services Section */}
                    <div className="mt-6">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 px-1">خدمات عامة</h3>
                        <div className="grid grid-cols-5 gap-2">
                            <button
                                onClick={() => window.location.href = '/technicians'}
                                className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-darkcard rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="text-2xl">👨‍🔧</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">فنيين</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/tow-trucks'}
                                className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-darkcard rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="text-2xl">🚚</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">سطحات</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/internationalLicense'}
                                className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-darkcard rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="text-2xl">🌍</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">رخصة</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/blog'}
                                className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-darkcard rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="text-2xl">📰</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">المدونة</span>
                            </button>
                            <button
                                onClick={() => window.location.href = '/contact'}
                                className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-darkcard rounded-xl border border-slate-100 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
                            >
                                <span className="text-2xl">📞</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">تواصل</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default ProviderOverviewView;