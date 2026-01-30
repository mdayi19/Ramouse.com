
import React, { useMemo } from 'react';
import { Order, OrderStatus, Provider, Customer, WithdrawalRequest, Transaction, AdminFlashProduct } from '../../types';
import { PieChart, LineChart, BarChart } from '../DataCharts';
import EmptyState from '../EmptyState';
import { StatusBadge } from './Shared';
import Icon from '../Icon';
import { AdminView } from './types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface OverviewViewProps {
    orders: Order[];
    providers: Provider[];
    customers: Customer[];
    withdrawals: WithdrawalRequest[];
    transactions: Transaction[];
    products: AdminFlashProduct[];
    stats: any;
    onNavigate: (view: AdminView) => void;
    onRefresh?: () => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({ orders, providers, customers, withdrawals, products, onNavigate, onRefresh }) => {
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    // Comprehensive Calculations
    const totalOrders = orders.length;
    const activeProviders = providers.filter(p => p.isActive).length;
    const totalCustomers = customers.length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;
    const totalProviders = providers.length;

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Order Status Breakdown
    const ordersByStatus = useMemo(() => {
        const pending = orders.filter(o => o.status === 'pending' || o.status === 'قيد المراجعة').length;
        const processing = orders.filter(o => o.status === 'processing' || o.status === 'جاري التجهيز').length;
        const completed = orders.filter(o => o.status === 'delivered' || o.status === 'completed' || o.status === 'تم التوصيل').length;
        const cancelled = orders.filter(o => o.status === 'cancelled' || o.status === 'ملغي').length;
        return { pending, processing, completed, cancelled };
    }, [orders]);

    // Financial Calculations
    const totalRevenue = useMemo(() => {
        return orders
            .filter(o => ['delivered', 'completed', 'shipped', 'تم التوصيل', 'تم الشحن للعميل'].includes(o.status))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    }, [orders]);

    const pendingRevenue = useMemo(() => {
        return orders
            .filter(o => ['pending', 'processing', 'قيد المراجعة', 'جاري التجهيز'].includes(o.status))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    }, [orders]);

    const totalWithdrawalAmount = useMemo(() => {
        return withdrawals
            .filter(w => w.status === 'Pending')
            .reduce((sum, w) => sum + (w.amount || 0), 0);
    }, [withdrawals]);

    // Product Stats
    const lowStockProducts = useMemo(() => products.filter(p => p.totalStock < 5), [products]);
    const outOfStockProducts = useMemo(() => products.filter(p => p.totalStock === 0), [products]);
    const totalProducts = products.length;

    // Date Info
    const currentDate = new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' });

    // Chart Data
    const orderStatusData = useMemo(() => {
        return [
            { name: 'قيد المراجعة', value: ordersByStatus.pending, color: '#f59e0b' },
            { name: 'جاري التجهيز', value: ordersByStatus.processing, color: '#0ea5e9' },
            { name: 'تم التوصيل', value: ordersByStatus.completed, color: '#22c55e' },
            { name: 'ملغي', value: ordersByStatus.cancelled, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [ordersByStatus]);

    const dailyActivityData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const dayOrders = orders.filter(o => o.date.startsWith(date));
            const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            return {
                name: new Date(date).toLocaleDateString('ar-SY', { weekday: 'short' }),
                date,
                orders: dayOrders.length,
                revenue: dayRevenue
            };
        });
    }, [orders]);

    const recentOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    }, [orders]);

    const todayOrders = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return orders.filter(o => o.date.startsWith(today)).length;
    }, [orders]);

    const todayRevenue = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return orders
            .filter(o => o.date.startsWith(today) && ['delivered', 'completed', 'تم التوصيل'].includes(o.status))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    }, [orders]);

    return (
        <div className="space-y-6 pb-10">
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 shadow-lg">
                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="text-4xl">👋</span>
                                مرحباً، أدمن
                            </h2>
                            <p className="text-white/90 text-lg">نظرة شاملة على أداء المنصة والأنشطة الحالية</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="backdrop-blur-xl bg-white/20 px-4 py-2 rounded-xl border border-white/30 text-white font-bold text-sm flex items-center gap-2">
                                <Icon name="Calendar" className="w-4 h-4" />
                                {currentDate}
                            </div>
                            <div className="backdrop-blur-xl bg-white/20 px-4 py-2 rounded-xl border border-white/30 text-white font-bold text-sm flex items-center gap-2">
                                <Icon name="Clock" className="w-4 h-4" />
                                {currentTime}
                            </div>
                        </div>
                    </div>
                    {onRefresh && (
                        <Button
                            onClick={handleRefresh}
                            className={`mt-4 backdrop-blur-xl bg-white/20 border border-white/30 text-white hover:bg-white/30 px-4 py-2 rounded-xl ${isRefreshing ? 'animate-pulse' : ''}`}
                        >
                            <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="mr-2 font-bold">تحديث البيانات</span>
                        </Button>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Comprehensive Stats Grid - 6 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {/* Total Orders */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '0ms' }}>
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Package" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">إجمالي الطلبات</p>
                        <p className="text-3xl font-black text-blue-900 dark:text-blue-100">{totalOrders}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{todayOrders} طلب اليوم</p>
                    </div>
                </Card>

                {/* Revenue */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '50ms' }}>
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="DollarSign" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">إيرادات مكتملة</p>
                        <p className="text-3xl font-black text-emerald-900 dark:text-emerald-100">${totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">${todayRevenue.toLocaleString()} اليوم</p>
                    </div>
                </Card>

                {/* Customers */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '100ms' }}>
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Users" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">إجمالي العملاء</p>
                        <p className="text-3xl font-black text-purple-900 dark:text-purple-100">{totalCustomers}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">مستخدم مسجل</p>
                    </div>
                </Card>

                {/* Providers */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/30 border-2 border-indigo-200 dark:border-indigo-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '150ms' }}>
                    <div className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Store" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">المزودون</p>
                        <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100">{activeProviders}</p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">من {totalProviders} كلي</p>
                    </div>
                </Card>

                {/* Pending Withdrawals */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '200ms' }}>
                    <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Wallet" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">طلبات السحب</p>
                        <p className="text-3xl font-black text-amber-900 dark:text-amber-100">{pendingWithdrawals}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">${totalWithdrawalAmount.toLocaleString()} قيمة</p>
                    </div>
                </Card>

                {/* Products Inventory */}
                <Card className="p-5 backdrop-blur-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/30 border-2 border-rose-200 dark:border-rose-700 shadow-lg flex items-center gap-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1" style={{ animationDelay: '250ms' }}>
                    <div className="bg-gradient-to-br from-rose-500 to-red-500 text-white p-3 rounded-full shadow-md">
                        <Icon name="Package" className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">المنتجات</p>
                        <p className="text-3xl font-black text-rose-900 dark:text-rose-100">{totalProducts}</p>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{lowStockProducts.length} منخفض / {outOfStockProducts.length} نفذ</p>
                    </div>
                </Card>
            </div>

            {/* Order Status Breakdown - Detailed Stats */}
            <Card className="p-6 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-2 border-slate-200 dark:border-slate-700 shadow-xl">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Icon name="BarChart3" className="w-5 h-5 text-violet-500" />
                    توزيع حالات الطلبات
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">قيد المراجعة</p>
                        </div>
                        <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{ordersByStatus.pending}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{((ordersByStatus.pending / totalOrders) * 100).toFixed(1)}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">جاري التجهيز</p>
                        </div>
                        <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{ordersByStatus.processing}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{((ordersByStatus.processing / totalOrders) * 100).toFixed(1)}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">تم التوصيل</p>
                        </div>
                        <p className="text-2xl font-black text-green-900 dark:text-green-100">{ordersByStatus.completed}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{((ordersByStatus.completed / totalOrders) * 100).toFixed(1)}%</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-700">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">ملغي</p>
                        </div>
                        <p className="text-2xl font-black text-red-900 dark:text-red-100">{ordersByStatus.cancelled}</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{((ordersByStatus.cancelled / totalOrders) * 100).toFixed(1)}%</p>
                    </div>
                </div>
            </Card>

            {/* Enhanced Quick Actions Grid */}
            <Card className="p-6 backdrop-blur-xl bg-gradient-to-br from-white/90 to-violet-50/90 dark:from-darkcard/90 dark:to-violet-900/20 border-2 border-violet-200 dark:border-violet-700 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Icon name="Zap" className="w-5 h-5 text-violet-500" />
                        إجراءات سريعة
                    </h3>
                    <span className="text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full font-bold">
                        9 أقسام
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* Orders - Pending */}
                    <button
                        onClick={() => onNavigate('orders')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="ClipboardList" className="w-7 h-7 text-white" />
                            </div>
                            {ordersByStatus.pending > 0 && (
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800 animate-pulse">
                                    {ordersByStatus.pending}
                                </div>
                            )}
                            <p className="font-bold text-sm text-blue-800 dark:text-blue-200 mb-1">الطلبات</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">{ordersByStatus.pending} معلق</p>
                        </div>
                    </button>

                    {/* Products - Low Stock */}
                    <button
                        onClick={() => onNavigate('storeProducts')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Package" className="w-7 h-7 text-white" />
                            </div>
                            {lowStockProducts.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800">
                                    {lowStockProducts.length}
                                </div>
                            )}
                            <p className="font-bold text-sm text-indigo-800 dark:text-indigo-200 mb-1">المنتجات</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{totalProducts} منتج</p>
                        </div>
                    </button>

                    {/* Flash Store */}
                    <button
                        onClick={() => onNavigate('flashStore')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-200 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Zap" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-amber-800 dark:text-amber-200 mb-1">العروض</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">خاطفة</p>
                        </div>
                    </button>

                    {/* Accounting - Withdrawals */}
                    <button
                        onClick={() => onNavigate('accounting')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Wallet" className="w-7 h-7 text-white" />
                            </div>
                            {pendingWithdrawals > 0 && (
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg border-2 border-white dark:border-slate-800 animate-pulse">
                                    {pendingWithdrawals}
                                </div>
                            )}
                            <p className="font-bold text-sm text-emerald-800 dark:text-emerald-200 mb-1">المحاسبة</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">{pendingWithdrawals} سحب</p>
                        </div>
                    </button>

                    {/* Users */}
                    <button
                        onClick={() => onNavigate('users')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Users" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-purple-800 dark:text-purple-200 mb-1">المستخدمين</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">{totalCustomers} عميل</p>
                        </div>
                    </button>

                    {/* Providers */}
                    <button
                        onClick={() => onNavigate('providers')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/30 border-2 border-sky-200 dark:border-sky-700 hover:border-sky-300 dark:hover:border-sky-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Store" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-sky-800 dark:text-sky-200 mb-1">المزودون</p>
                            <p className="text-xs text-sky-600 dark:text-sky-400">{activeProviders} نشط</p>
                        </div>
                    </button>

                    {/* Reviews */}
                    <button
                        onClick={() => onNavigate('reviews')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-200 dark:border-yellow-700 hover:border-yellow-300 dark:hover:border-yellow-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Star" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-yellow-800 dark:text-yellow-200 mb-1">التقييمات</p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">إدارة</p>
                        </div>
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => onNavigate('sendNotification')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30 border-2 border-rose-200 dark:border-rose-700 hover:border-rose-300 dark:hover:border-rose-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Bell" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-rose-800 dark:text-rose-200 mb-1">الإشعارات</p>
                            <p className="text-xs text-rose-600 dark:text-rose-400">إرسال</p>
                        </div>
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => onNavigate('settings')}
                        className="group relative p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/30 dark:to-gray-900/30 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-gray-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="relative">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <Icon name="Settings" className="w-7 h-7 text-white" />
                            </div>
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">الإعدادات</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">عامة</p>
                        </div>
                    </button>
                </div>
            </Card>

            {/* Charts and Activity Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left: Charts (2 cols) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Weekly Activity */}
                    <Card className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/90 to-blue-50/90 dark:from-darkcard/90 dark:to-blue-900/20 border-2 border-blue-200 dark:border-blue-700 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                                <Icon name="TrendingUp" className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">النشاط الأسبوعي</h3>
                            <span className="mr-auto text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600 dark:text-slate-400">آخر 7 أيام</span>
                        </div>
                        <div className="h-64">
                            <LineChart data={dailyActivityData} />
                        </div>
                    </Card>

                    {/* Pie and Bar Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                    <Icon name="PieChart" className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">توزيع الحالات</h3>
                            </div>
                            <div className="h-64 flex items-center justify-center">
                                <PieChart data={orderStatusData} />
                            </div>
                        </Card>

                        <Card className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                                    <Icon name="BarChart3" className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">المبيعات اليومية</h3>
                            </div>
                            <div className="h-64">
                                <BarChart data={dailyActivityData.map(d => ({ name: d.name, value: d.revenue }))} />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right: Activity & Alerts (1 col) */}
                <div className="space-y-6">
                    {/* Financial Summary */}
                    <Card className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-700 shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Icon name="DollarSign" className="w-5 h-5 text-violet-500" />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">ملخص مالي</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-violet-200 dark:border-violet-800">
                                <p className="text-xs text-slate-600 dark:text-slate-400">الإيرادات المكتملة</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">${totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-violet-200 dark:border-violet-800">
                                <p className="text-xs text-slate-600 dark:text-slate-400">إيرادات معلقة</p>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400">${pendingRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-violet-200 dark:border-violet-800">
                                <p className="text-xs text-slate-600 dark:text-slate-400">طلبات سحب معلقة</p>
                                <p className="text-2xl font-black text-orange-600 dark:text-orange-400">${totalWithdrawalAmount.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Alerts */}
                    {(pendingWithdrawals > 0 || lowStockProducts.length > 0) && (
                        <Card className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="AlertTriangle" className="w-5 h-5 text-orange-500" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">تنبيهات</h3>
                            </div>
                            <div className="space-y-2">
                                {pendingWithdrawals > 0 && (
                                    <button
                                        onClick={() => onNavigate('accounting')}
                                        className="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all text-right"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                                                <Icon name="Wallet" className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{pendingWithdrawals} طلب سحب</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">${totalWithdrawalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                                {lowStockProducts.length > 0 && (
                                    <button
                                        onClick={() => onNavigate('storeProducts')}
                                        className="w-full p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-red-200 dark:border-red-800 hover:shadow-md transition-all text-right"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                                <Icon name="Package" className="w-4 h-4 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{lowStockProducts.length} منتج منخفض</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{outOfStockProducts.length} نفذ تماماً</p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Recent Orders */}
                    <Card className="p-6 rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-2 border-slate-200 dark:border-slate-700 shadow-xl max-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Icon name="Clock" className="w-5 h-5 text-violet-500" />
                                أحدث الطلبات
                            </h3>
                            <Button onClick={() => onNavigate('orders')} variant="ghost" size="sm" className="text-xs">
                                عرض الكل
                            </Button>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1">
                            {recentOrders.length > 0 ? recentOrders.map(order => (
                                <div
                                    key={order.orderNumber}
                                    onClick={() => onNavigate('orders')}
                                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{order.formData?.brand || 'غير محدد'}</span>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-1">{order.formData?.partDescription || 'لا يوجد وصف'}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs font-mono text-slate-400">{order.orderNumber}</span>
                                        <span className="text-xs text-slate-400">{new Date(order.date).toLocaleDateString('ar-SY')}</span>
                                    </div>
                                </div>
                            )) : <EmptyState message="لا توجد طلبات" />}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OverviewView;
