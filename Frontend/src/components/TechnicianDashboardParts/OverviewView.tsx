import React, { useState, useEffect } from 'react';
import { Technician, Order, FlashProductBuyerRequest } from '../../types';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { StatusBadge, MarketplaceQuickAccess } from '../DashboardParts/Shared';
import UserCarListingsWidget from '../DashboardParts/UserCarListingsWidget';
import { TechnicianView } from './types';
import { api } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface DashboardStats {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    pendingRequests: number;
    confirmedPurchases: number;
    isVerified: boolean;
}

const OverviewView: React.FC<{
    technician: Technician;
    onStartNewOrder: () => void;
    onNavigate: (view: TechnicianView) => void;
    onGlobalNavigate: (view: any, params?: any) => void;
    orders: Order[];
    myRequests: FlashProductBuyerRequest[];
}> = ({ technician, onStartNewOrder, onNavigate, onGlobalNavigate, orders, myRequests }) => {

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(technician.profilePhoto);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = async (forceRefresh = false) => {
        try {
            const params = forceRefresh ? { _t: Date.now() } : {};
            const response = await api.get('/technician/stats', { params });
            if (response.data && response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchStats(true);
        setTimeout(() => setIsRefreshing(false), 500);
    };

    useEffect(() => {
        const loadProfilePhoto = async () => {
            if (technician.profilePhoto === 'db:profilePhoto') {
                const db = (window as any).db;
                if (db) {
                    try {
                        const media = await db.getMedia('profileMedia', technician.id);
                        if (media?.profilePhoto) {
                            setProfilePhotoUrl(URL.createObjectURL(media.profilePhoto));
                        }
                    } catch (e) { console.error(e); }
                }
            } else {
                setProfilePhotoUrl(technician.profilePhoto);
            }
        };
        loadProfilePhoto();
    }, [technician]);

    const displayTotalOrders = stats ? stats.totalOrders : orders.length;
    const displayActiveOrders = stats ? stats.activeOrders : orders.filter(o => !['تم التوصيل', 'ملغي'].includes(o.status)).length;
    const displayPendingRequests = stats ? stats.pendingRequests : myRequests.filter(r => r.status === 'pending').length;
    const displayConfirmedPurchases = stats ? stats.confirmedPurchases : (technician.flashPurchases?.length || 0);

    const recentOrders = orders.slice(0, 3);

    // Stat Mini Card for mobile grid
    const StatMini: React.FC<{ value: string | number, label: string, emoji: string, color: string, bgColor: string, isLoading?: boolean }> = ({ value, label, emoji, color, bgColor, isLoading }) => (
        <Card className="p-3 border-slate-100 dark:border-slate-700 shadow-sm transition-transform active:scale-95">
            <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor} text-xl`}>
                    {emoji}
                </div>
                {isLoading ? (
                    <div className="h-6 w-8 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></div>
                ) : (
                    <span className="text-xl font-black text-slate-800 dark:text-slate-200">{value}</span>
                )}
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
        </Card>
    );

    // Quick Action Button
    const QuickBtn: React.FC<{ onClick: () => void, emoji: string, label: string, color: string }> = ({ onClick, emoji, label, color }) => (
        <Button
            onClick={onClick}
            variant="ghost"
            className="flex flex-col items-center justify-center p-2 h-auto bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700"
        >
            <span className="text-2xl mb-1">{emoji}</span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
        </Button>
    );

    // Service Card for public pages
    const ServiceCard: React.FC<{ onClick: () => void, emoji: string, title: string, gradient: string }> = ({ onClick, emoji, title, gradient }) => (
        <Button
            onClick={onClick}
            className={`relative overflow-hidden rounded-xl p-3 h-auto w-full border-none shadow-none ${gradient} justify-between`}
        >
            <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 text-white backdrop-blur-sm">
                    <span className="text-xl">{emoji}</span>
                </div>
                <span className="font-bold text-sm text-white flex-1 text-right">{title}</span>
                <Icon name="ChevronLeft" className="w-5 h-5 mr-auto opacity-80 text-white" />
            </div>
        </Button>
    );

    return (
        <div className="w-full h-full animate-fade-in">
            {/* Mobile Header */}
            <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-darkbg/90 backdrop-blur-md px-4 pt-4 pb-6 sm:hidden border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {profilePhotoUrl ? (
                            <img className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500" src={profilePhotoUrl} alt={technician.name} />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <span className="text-2xl">👷</span>
                            </div>
                        )}
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold">صباح الخير ☀️</p>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">{technician.name}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleRefresh}
                            variant="secondary"
                            size="icon"
                            className={`rounded-full h-8 w-8 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 ${isRefreshing ? 'animate-pulse' : ''}`}
                        >
                            <Icon name="RefreshCw" className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${technician.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                            <span>{technician.isVerified ? "✅" : "⏳"}</span>
                            {technician.isVerified ? 'موثوق' : 'بانتظار'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden sm:flex justify-between items-center bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mx-6 mt-6">
                <div className="flex items-center gap-4">
                    {profilePhotoUrl ? (
                        <img className="w-14 h-14 rounded-full object-cover ring-4 ring-slate-100 dark:ring-slate-800" src={profilePhotoUrl} alt={technician.name} />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Icon name="User" className="w-7 h-7" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-200">أهلاً بك، {technician.name}!</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">{technician.specialty} • {technician.city}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleRefresh}
                        variant="secondary"
                        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-pulse' : ''}`}
                    >
                        <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        <span>تحديث</span>
                    </Button>
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold text-sm ${technician.isVerified ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400'}`}>
                        <Icon name={technician.isVerified ? "BadgeCheck" : "Clock"} className="w-5 h-5" />
                        {technician.isVerified ? 'حساب موثوق' : 'بانتظار التوثيق'}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 pb-24 sm:pb-8 -mt-2 sm:mt-0">
                <div className="bg-slate-50 dark:bg-darkbg sm:bg-transparent rounded-t-3xl sm:rounded-none pt-4 sm:pt-6">

                    {/* Stats Grid - Mobile optimized */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <StatMini value={displayTotalOrders} label="إجمالي الطلبات" emoji="📋" color="text-blue-600 dark:text-blue-400" bgColor="bg-blue-100 dark:bg-blue-900/30" isLoading={loadingStats} />
                        <StatMini value={displayActiveOrders} label="الطلبات النشطة" emoji="⏳" color="text-amber-600 dark:text-amber-400" bgColor="bg-amber-100 dark:bg-amber-900/30" isLoading={loadingStats} />
                        <StatMini value={displayPendingRequests} label="طلبات شراء" emoji="🛒" color="text-purple-600 dark:text-purple-400" bgColor="bg-purple-100 dark:bg-purple-900/30" isLoading={loadingStats} />
                        <StatMini value={displayConfirmedPurchases} label="مشتريات فورية" emoji="⚡" color="text-rose-600 dark:text-rose-400" bgColor="bg-rose-100 dark:bg-rose-900/30" isLoading={loadingStats} />
                    </div>

                    {/* Primary CTAs */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <Button
                            onClick={() => onStartNewOrder()}
                            className="h-auto flex-col sm:flex-row gap-2 py-4 shadow-lg shadow-primary/20 rounded-2xl"
                        >
                            <span className="text-2xl">➕</span>
                            <span className="font-bold">اطلب قطعة</span>
                        </Button>
                        <Button
                            onClick={() => onNavigate('flashProducts')}
                            className="h-auto flex-col sm:flex-row gap-2 py-4 bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 border-transparent rounded-2xl"
                        >
                            <span className="text-2xl">⚡</span>
                            <span className="font-bold">العروض الفورية</span>
                        </Button>
                    </div>

                    {/* Quick Actions Grid */}
                    <Card className="p-4 border-slate-100 dark:border-slate-700 mb-6 bg-slate-50/50 dark:bg-slate-800/30">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <span>⚡</span>
                            الوصول السريع
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            <QuickBtn onClick={() => onNavigate('orders')} emoji="📦" label="طلباتي" color="text-blue-500" />
                            <QuickBtn onClick={() => onNavigate('wallet')} emoji="💰" label="المحفظة" color="text-green-500" />
                            <QuickBtn onClick={() => onNavigate('reviews')} emoji="⭐" label="التقييمات" color="text-yellow-500" />
                            <QuickBtn onClick={() => onNavigate('store')} emoji="🛍️" label="المتجر" color="text-purple-500" />
                            <QuickBtn onClick={() => onNavigate('profile')} emoji="👤" label="ملفي" color="text-indigo-500" />
                            <QuickBtn onClick={() => onNavigate('settings')} emoji="⚙️" label="الإعدادات" color="text-slate-500" />
                        </div>
                    </Card>

                    {/* Marketplace Quick Access */}
                    <MarketplaceQuickAccess onNavigate={onGlobalNavigate} />

                    {/* User Car Listings */}
                    <UserCarListingsWidget userId={technician.id} userRole="technician" onNavigate={onNavigate} />

                    {/* Public Services Section */}
                    <div className="mb-6">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 px-1">خدمات عامة</h3>
                        <div className="space-y-2">
                            <ServiceCard
                                onClick={() => window.location.href = '/technicians'}
                                emoji="👨‍🔧"
                                title="دليل الفنيين"
                                gradient="bg-gradient-to-l from-indigo-500 to-indigo-600"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/tow-trucks'}
                                emoji="🚚"
                                title="دليل السطحات"
                                gradient="bg-gradient-to-l from-emerald-500 to-emerald-600"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/internationalLicense'}
                                emoji="🌍"
                                title="رخصة قيادة دولية"
                                gradient="bg-gradient-to-l from-violet-500 to-violet-600"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/blog'}
                                emoji="📰"
                                title="المدونة"
                                gradient="bg-gradient-to-l from-rose-500 to-rose-600"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/contact'}
                                emoji="📞"
                                title="تواصل معنا"
                                gradient="bg-gradient-to-l from-slate-600 to-slate-700"
                            />
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <Card className="p-4 border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">أحدث الطلبات</h3>
                            <Button onClick={() => onNavigate('orders')} variant="link" size="sm" className="text-primary font-bold px-0">عرض الكل</Button>
                        </div>

                        {recentOrders.length > 0 ? (
                            <div className="space-y-3">
                                {recentOrders.map(order => (
                                    <div
                                        key={order.orderNumber}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl active:scale-[0.99] transition-transform cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                                        onClick={() => onNavigate('orders')}
                                    >
                                        <div className="flex-grow min-w-0">
                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{order.formData.partDescription}</p>
                                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <span>{order.formData.brand}</span>
                                                <span className="font-mono text-[10px] bg-white dark:bg-slate-800 px-1.5 rounded border dark:border-slate-700">{order.orderNumber}</span>
                                            </p>
                                        </div>
                                        <StatusBadge status={order.status} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                                    <Icon name="Inbox" className="w-6 h-6" />
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">لا توجد طلبات بعد</p>
                                <Button onClick={() => onStartNewOrder()} variant="link" className="mt-2 text-primary font-bold">+ أنشئ طلبك الأول</Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OverviewView;