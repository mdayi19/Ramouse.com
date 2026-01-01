
import React, { useMemo } from 'react';
import { AdminFlashProduct, FlashProductBuyerRequest } from '../../../types';
import { StatCard, ViewHeader } from '../Shared';
import Icon from '../../Icon';
import { AdminView } from '../types';
import { BarChart, LineChart, PieChart } from '../../DataCharts';

interface StoreOverviewProps {
    products: AdminFlashProduct[];
    requests: FlashProductBuyerRequest[];
    onNavigate: (view: AdminView) => void;
}

const StoreOverview: React.FC<StoreOverviewProps> = ({ products, requests, onNavigate }) => {
    const stats = useMemo(() => {
        // Only count revenue for secured orders (Approved, Shipped, Delivered, Preparing)
        const totalRevenue = requests
            .filter(r => ['delivered', 'approved', 'shipped', 'preparing'].includes(r.status))
            .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

        const activeProducts = products.filter(p => new Date(p.expiresAt) > new Date() && p.isFlash !== false).length;
        const storeProducts = products.filter(p => p.isFlash === false).length;
        const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'payment_verification').length;
        const completedOrders = requests.filter(r => r.status === 'delivered').length;

        return { totalRevenue, activeProducts, storeProducts, pendingRequests, completedOrders };
    }, [products, requests]);
    
    // Charts Data Mockup (In real app, aggregate by date)
    const salesData = useMemo(() => {
        // Simple aggregation by date
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
        
        return last7Days.map(date => {
            const dailyTotal = requests
                .filter(r => r.requestDate.startsWith(date) && ['approved', 'delivered', 'shipped', 'preparing'].includes(r.status))
                .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
            return { name: date.slice(5), Sales: dailyTotal };
        });
    }, [requests]);

    const lowStockProducts = useMemo(() => {
        return products.filter(p => p.totalStock <= 5 && p.isFlash === false).slice(0, 5);
    }, [products]);

    const topProducts = useMemo(() => {
        const productSales: Record<string, number> = {};
        requests.forEach(r => {
            if(['approved', 'delivered', 'shipped', 'preparing'].includes(r.status)) {
                productSales[r.productId] = (productSales[r.productId] || 0) + r.quantity;
            }
        });
        return Object.entries(productSales)
            .map(([id, qty]) => ({ id, qty, name: products.find(p => p.id === id)?.name || 'Deleted' }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
    }, [requests, products]);

    return (
        <div className="space-y-6 animate-fade-in">
            <ViewHeader title="نظرة عامة على المتجر" subtitle="تحليلات المبيعات، المخزون، والطلبات." />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="إجمالي الإيرادات" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<Icon name="Banknote" className="w-6 h-6" />} />
                <StatCard title="منتجات المتجر" value={stats.storeProducts} icon={<Icon name="Package" className="w-6 h-6" />} />
                <StatCard title="طلبات قيد الانتظار" value={stats.pendingRequests} icon={<Icon name="Clock" className="w-6 h-6" />} />
                <StatCard title="عروض فورية نشطة" value={stats.activeProducts} icon={<Icon name="Zap" className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Sales Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-darkcard p-6 rounded-lg shadow-md border dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">المبيعات (آخر 7 أيام)</h3>
                    <div className="h-64 w-full">
                        <LineChart data={salesData} />
                    </div>
                </div>
                
                {/* Low Stock Alert */}
                <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md border dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2"><Icon name="AlertTriangle" className="w-5 h-5"/> تنبيه المخزون المنخفض</h3>
                    <div className="space-y-3">
                        {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                             <div key={p.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/30">
                                 <span className="text-sm font-medium truncate w-2/3">{p.name}</span>
                                 <span className="text-xs font-bold text-red-700 bg-white px-2 py-1 rounded shadow-sm">بقي {p.totalStock}</span>
                             </div>
                        )) : <p className="text-sm text-slate-500 text-center py-4">المخزون بحالة جيدة.</p>}
                        <button onClick={() => onNavigate('store_products')} className="w-full mt-2 text-sm text-primary font-semibold hover:underline">إدارة المخزون</button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                 <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md border dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">المنتجات الأكثر مبيعاً</h3>
                    <div className="space-y-3">
                        {topProducts.length > 0 ? topProducts.map((p, i) => (
                             <div key={i} className="flex items-center justify-between p-3 border-b dark:border-slate-700 last:border-0">
                                 <div className="flex items-center gap-3">
                                     <span className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                                     <span className="text-sm font-medium">{p.name}</span>
                                 </div>
                                 <span className="text-sm font-bold text-green-600">{p.qty} مباع</span>
                             </div>
                        )) : <p className="text-slate-500 text-sm text-center">لا توجد بيانات كافية.</p>}
                    </div>
                </div>

                 <div className="bg-white dark:bg-darkcard p-6 rounded-lg shadow-md border dark:border-slate-700">
                    <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">إجراءات سريعة</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => onNavigate('store_products')} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border dark:border-slate-600">
                            <Icon name="Plus" className="w-8 h-8 text-primary mb-2"/>
                            <span className="font-semibold">إضافة منتج</span>
                        </button>
                         <button onClick={() => onNavigate('store_orders')} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border dark:border-slate-600">
                            <Icon name="ClipboardList" className="w-8 h-8 text-blue-500 mb-2"/>
                            <span className="font-semibold">إدارة الطلبات</span>
                        </button>
                        <button onClick={() => onNavigate('flashStore')} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border dark:border-slate-600">
                            <Icon name="Zap" className="w-8 h-8 text-amber-500 mb-2"/>
                            <span className="font-semibold">عروض فورية</span>
                        </button>
                         <button onClick={() => onNavigate('store_settings')} className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border dark:border-slate-600">
                            <Icon name="Settings" className="w-8 h-8 text-slate-500 mb-2"/>
                            <span className="font-semibold">الإعدادات</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreOverview;
