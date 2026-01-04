
import React, { useMemo } from 'react';
import { Order, OrderStatus, Provider, Customer, WithdrawalRequest, Transaction, AdminFlashProduct } from '../../types';
import { PieChart, LineChart, BarChart } from '../DataCharts';
import EmptyState from '../EmptyState';
import { StatusBadge, StatCard } from './Shared';
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
    stats: any; // Using any for now to match passed prop
    onNavigate: (view: AdminView) => void;
    onRefresh?: () => void;
}

const OverviewView: React.FC<OverviewViewProps> = ({ orders, providers, customers, withdrawals, products, onNavigate, onRefresh }) => {
    // Basic Counts
    const totalOrders = orders.length;
    const activeProviders = providers.filter(p => p.isActive).length;
    const totalCustomers = customers.length;
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending').length;
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Financial calculations
    const totalRevenue = useMemo(() => {
        // Calculate total simplified revenue from completed/delivered orders
        // Note: Ideally transactions give a better picture, but we use orders for "Sales Value"
        return orders
            .filter(o => ['delivered', 'completed', 'shipped', 'تم التوصيل', 'تم الشحن للعميل'].includes(o.status))
            .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    }, [orders]);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.totalStock < 5);
    }, [products]);

    const currentDate = new Date().toLocaleDateString('ar-SY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Chart Data Preparation
    const orderStatusData = useMemo(() => {
        const counts: { [key in OrderStatus]?: number } = {};
        for (const order of orders) {
            counts[order.status] = (counts[order.status] || 0) + 1;
        }
        return [
            { name: 'قيد المراجعة', value: counts['pending'] || counts['قيد المراجعة'] || 0, color: '#f59e0b' },
            { name: 'جاري التجهيز', value: counts['processing'] || counts['جاري التجهيز'] || 0, color: '#0ea5e9' },
            { name: 'تم التوصيل', value: counts['delivered'] || counts['completed'] || counts['تم التوصيل'] || 0, color: '#22c55e' },
            { name: 'ملغي', value: counts['cancelled'] || counts['ملغي'] || 0, color: '#ef4444' },
        ].filter(d => d.value > 0);
    }, [orders]);

    const dailyActivityData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => {
            const dayOrders = orders.filter(o => o.date.startsWith(date));
            const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
            return {
                name: new Date(date).toLocaleDateString('ar-SY', { weekday: 'short' }),
                date,
                orders: dayOrders.length,
                revenue: dayRevenue
            };
        });
        return data;
    }, [orders]);

    const recentOrders = useMemo(() => {
        return [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    }, [orders]);

    const quickActions = [
        { label: 'إدارة الطلبات', icon: 'ClipboardList', view: 'orders', bg: 'from-blue-500 to-blue-600', count: orders.filter(o => o.status === 'pending' || o.status === 'قيد المراجعة').length },
        { label: 'المنتجات', icon: 'Store', view: 'storeProducts', bg: 'from-indigo-500 to-indigo-600', count: lowStockProducts.length > 0 ? `${lowStockProducts.length} منخفض` : undefined },
        { label: 'العروض الفورية', icon: 'Zap', view: 'flashStore', bg: 'from-amber-500 to-amber-600' },
        { label: 'المحاسبة', icon: 'Wallet', view: 'accounting', bg: 'from-emerald-500 to-emerald-600', count: pendingWithdrawals > 0 ? `${pendingWithdrawals} سحب` : undefined },
        { label: 'المستخدمين', icon: 'Users', view: 'users', bg: 'from-purple-500 to-purple-600' },
        { label: 'الإعدادات', icon: 'Settings', view: 'settings', bg: 'from-slate-500 to-slate-600' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <Card className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">صباح الخير، أدمن 👋</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">إليك ملخص لنشاط المنصة اليوم.</p>
                </div>
                <div className="flex gap-3 items-center mt-4 md:mt-0">
                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="Calendar" className="w-4 h-4 text-primary" />
                        {currentDate}
                    </div>
                    {onRefresh && (
                        <Button
                            onClick={handleRefresh}
                            variant="secondary"
                            className={`h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 ${isRefreshing ? 'animate-pulse' : ''}`}
                        >
                            <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="mr-2 hidden sm:inline">تحديث</span>
                        </Button>
                    )}
                </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="إجمالي الطلبات"
                    value={totalOrders}
                    icon={<Icon name="ClipboardList" className="w-6 h-6 text-blue-600 dark:text-blue-300" />}
                    trend={`${dailyActivityData[dailyActivityData.length - 1]?.orders || 0} اليوم`}
                    trendDirection="neutral"
                    trendLabel=""
                    iconClassName="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                    title="مبيعات مكتملة"
                    value={`$${totalRevenue.toLocaleString()}`}
                    icon={<Icon name="CircleDollarSign" className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />}
                    trend="تراكمي"
                    trendDirection="up"
                    trendLabel=""
                    iconClassName="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <StatCard
                    title="المزودون النشطون"
                    value={activeProviders}
                    icon={<Icon name="Users" className="w-6 h-6 text-purple-600 dark:text-purple-300" />}
                    iconClassName="bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                    title="طلبات السحب"
                    value={pendingWithdrawals}
                    icon={<Icon name="Clock" className="w-6 h-6 text-amber-600 dark:text-amber-300" />}
                    trend={pendingWithdrawals > 0 ? "يحتاج مراجعة" : "لا يوجد"}
                    trendDirection={pendingWithdrawals > 0 ? "down" : "neutral"}
                    trendLabel=""
                    iconClassName="bg-amber-100 dark:bg-amber-900/30"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action) => (
                    <Button
                        key={action.view}
                        onClick={() => onNavigate(action.view as AdminView)}
                        variant="ghost"
                        className="group relative flex flex-col items-center justify-center p-4 h-auto rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden bg-white dark:bg-darkcard border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:bg-white dark:hover:bg-darkcard"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.bg} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                        <div className={`mb-3 p-3 rounded-xl bg-gradient-to-br ${action.bg} text-white shadow-md group-hover:scale-110 transition-transform duration-300 relative`}>
                            <Icon name={action.icon as any} className="w-6 h-6" />
                            {action.count !== undefined && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-white dark:border-darkcard">
                                    {action.count}
                                </span>
                            )}
                        </div>
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{action.label}</span>
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Charts */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Weekly Activity Chart */}
                    <Card className="p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">النشاط الأسبوعي (الطلبات)</h3>
                        </div>
                        <div className="h-64 w-full">
                            <LineChart data={dailyActivityData} />
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Order Status Distribution */}
                        <Card className="p-6 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-slate-200">توزيع حالات الطلبات</h3>
                            <div className="h-64 flex justify-center items-center">
                                <PieChart data={orderStatusData} />
                            </div>
                        </Card>

                        {/* Revenue/Sales Chart (Using BarChart for variety if implemented, effectively re-using data but visualizing differently) */}
                        <Card className="p-6 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-slate-200">قيمة المبيعات (أخر 7 أيام)</h3>
                            <div className="h-64 w-full">
                                {/* Create a bar chart format for revenue */}
                                <BarChart data={dailyActivityData.map(d => ({ name: d.name, value: d.revenue }))} />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Recent Activity & Alerts */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Pending Actions / Alerts */}
                    {/* Pending Actions / Alerts */}
                    {(pendingWithdrawals > 0 || lowStockProducts.length > 0) && (
                        <Card className="p-6 rounded-2xl shadow-sm border-orange-100 dark:border-orange-900/30">
                            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <Icon name="AlertTriangle" className="w-5 h-5 text-orange-500" />
                                تنبيهات
                            </h3>
                            <div className="space-y-3">
                                {pendingWithdrawals > 0 && (
                                    <Button
                                        onClick={() => onNavigate('accounting')}
                                        variant="ghost"
                                        className="w-full justify-between p-3 h-auto bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-start"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg text-orange-600">
                                                <Icon name="Wallet" className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{pendingWithdrawals} طلبات سحب معلقة</span>
                                        </div>
                                        <Icon name="ChevronLeft" className="w-4 h-4 text-slate-400" />
                                    </Button>
                                )}
                                {lowStockProducts.length > 0 && (
                                    <Button
                                        onClick={() => onNavigate('storeProducts')}
                                        variant="ghost"
                                        className="w-full justify-between p-3 h-auto bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 text-start"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600">
                                                <Icon name="Package" className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lowStockProducts.length} منتجات منخفضة المخزون</span>
                                        </div>
                                        <Icon name="ChevronLeft" className="w-4 h-4 text-slate-400" />
                                    </Button>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Recent Orders */}
                    <Card className="p-6 rounded-2xl shadow-sm flex flex-col h-full max-h-[600px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">أحدث الطلبات</h3>
                            <Button onClick={() => onNavigate('orders')} variant="secondary" size="sm" className="font-bold text-xs">عرض الكل</Button>
                        </div>
                        <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-1">
                            {recentOrders.length > 0 ? recentOrders.map(order => (
                                <Button
                                    key={order.orderNumber}
                                    onClick={() => onNavigate('orders')}
                                    variant="ghost"
                                    className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:shadow-sm h-auto text-start items-stretch"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm line-clamp-1">{order.formData?.brand || 'غير محدد'} {order.formData?.model || ''}</span>
                                        <StatusBadge status={order.status} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{order.formData?.partDescription || 'لا يوجد وصف'}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                        <span className="text-[10px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border dark:border-slate-700">{order.orderNumber}</span>
                                        <span className="text-[10px] font-medium text-slate-400">{new Date(order.date).toLocaleDateString('ar-SY')}</span>
                                    </div>
                                </Button>
                            )) : <EmptyState message="لا توجد طلبات بعد." />}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OverviewView;
