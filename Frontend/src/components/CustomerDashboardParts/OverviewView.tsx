import React, { useState, useEffect } from 'react';
import { Order, Customer, Vehicle, Brand, OrderFormData } from '../../types';
import Icon from '../Icon';
import SkeletonLoader from '../SkeletonLoader';
import VisualOrderTimeline from '../VisualOrderTimeline';
import { CustomerView } from './types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MarketplaceQuickAccess } from '../DashboardParts/Shared';
import UserCarListingsWidget from '../DashboardParts/UserCarListingsWidget';
import { ordersAPI } from '../../lib/api';

const GenericCarLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8" /><path d="M10 16.5V8" /><path d="M2 12h20" /><path d="M5 12v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2Z" /></svg>
);

const CustomerOverview: React.FC<{
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    userPhone: string;
    onNavigate: (view: CustomerView, params?: any) => void;
    onGlobalNavigate: (view: any, params?: any) => void;
    allBrands: Brand[];
    allOrders?: Order[];
}> = ({ onStartNewOrder, userPhone, onNavigate, onGlobalNavigate, allBrands, allOrders = [] }) => {
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);

    // Fetch orders from API (same as MyOrders)
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            console.log('🔄 [OverviewView] Starting to fetch orders from API...');
            try {
                const response = await ordersAPI.getOrders(true);
                console.log('📥 [OverviewView] API Response:', response.data);
                const orders: Order[] = response.data.data?.map((order: any) => ({
                    orderNumber: order.orderNumber || order.order_number,
                    userPhone: order.customer_phone || order.customerPhone || order.user_id,
                    date: order.date || order.created_at,
                    status: order.status,
                    formData: order.formData || order.form_data,
                    quotes: order.quotes || [],
                    acceptedQuote: order.acceptedQuote,
                    paymentMethodId: order.paymentMethodId || order.payment_method_id,
                    paymentMethodName: order.paymentMethodName || order.payment_method_name,
                    deliveryMethod: order.deliveryMethod || order.delivery_method,
                    shippingPrice: order.shippingPrice || order.shipping_price,
                    customerName: order.customerName || order.customer_name,
                    customerAddress: order.customerAddress || order.customer_address,
                    customerPhone: order.customerPhone || order.customer_phone,
                    review: order.review
                })) || [];
                console.log('✅ [OverviewView] Fetched orders:', orders.length);
                console.log('📋 [OverviewView] Sample order:', orders[0]);
                setFetchedOrders(orders);
            } catch (error) {
                console.error('❌ [OverviewView] Failed to fetch orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Process orders (same as MyOrders)
    useEffect(() => {
        console.log('🔍 [OverviewView] Processing orders...');
        console.log('📦 [OverviewView] fetchedOrders.length:', fetchedOrders.length);
        console.log('📦 [OverviewView] allOrders.length:', allOrders.length);
        console.log('📦 [OverviewView] userPhone:', userPhone);

        const ordersToUse = (fetchedOrders && fetchedOrders.length > 0) ? fetchedOrders : (allOrders || []);
        console.log('📦 [OverviewView] Using orders from:', fetchedOrders.length > 0 ? 'API (fetchedOrders)' : 'Props (allOrders)');
        console.log('📦 [OverviewView] ordersToUse.length:', ordersToUse.length);

        const userOrders = ordersToUse.filter(o => o.userPhone === userPhone);
        console.log('📦 [OverviewView] User orders found:', userOrders.length);

        if (ordersToUse.length > 0 && userOrders.length === 0) {
            console.warn('⚠️ [OverviewView] No orders matched userPhone!');
            console.warn('⚠️ [OverviewView] Sample order userPhone:', ordersToUse[0]?.userPhone);
            console.warn('⚠️ [OverviewView] Looking for userPhone:', userPhone);
        }

        // Get last order
        const sortedOrders = [...userOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setLastOrder(sortedOrders[0] || null);
        console.log('📌 [OverviewView] Last order:', sortedOrders[0]?.orderNumber || 'None');

        // Get active orders
        const userActiveOrders = userOrders
            .filter(o => !['تم التوصيل', 'ملغي', 'تم الاستلام من الشركة'].includes(o.status))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActiveOrders(userActiveOrders.slice(0, 3));
        console.log('✨ [OverviewView] Active orders:', userActiveOrders.length);
        console.log('✨ [OverviewView] Last order state:', sortedOrders[0] ? 'SET ✓' : 'NULL ✗');
        console.log('✨ [OverviewView] Active orders state:', userActiveOrders.slice(0, 3).length);

        const allCustomersRaw = localStorage.getItem('all_customers');
        if (allCustomersRaw) {
            const allCustomers: Customer[] = JSON.parse(allCustomersRaw);
            const currentUser = allCustomers.find(c => c.id === userPhone);
            setCustomer(currentUser || null);
        }
    }, [userPhone, allOrders, fetchedOrders]);

    // ============================================================================
    // UNIFIED ACTION BUTTON COMPONENT
    // ============================================================================
    interface ActionButtonProps {
        onClick: () => void;
        emoji: string;
        label: string;
        gradient?: string;
        bgColor?: string;
        variant?: 'compact' | 'large';
    }

    const ActionButton: React.FC<ActionButtonProps> = ({
        onClick,
        emoji,
        label,
        gradient,
        bgColor = "bg-slate-100 dark:bg-slate-800",
        variant = 'compact'
    }) => (
        <button
            onClick={onClick}
            className={`
                group relative overflow-hidden rounded-2xl transition-all duration-300
                ${variant === 'compact'
                    ? 'p-3 sm:p-4 min-h-[100px] sm:min-h-[110px]'
                    : 'p-5 min-h-[140px]'
                }
                ${gradient
                    ? `${gradient} text-white shadow-lg hover:shadow-xl`
                    : `${bgColor} border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md`
                }
                hover:scale-[1.02] active:scale-[0.98]
            `}
        >
            {gradient && (
                <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
            )}
            <div className={`relative z-10 flex flex-col items-center justify-center h-full gap-3 ${gradient ? 'text-white' : ''}`}>
                <div className={`
                    ${variant === 'compact' ? 'w-12 h-12 text-2xl' : 'w-16 h-16 text-3xl'}
                    rounded-2xl flex items-center justify-center
                    ${gradient ? 'bg-white/20 backdrop-blur-sm' : ''}
                    transition-transform duration-300 group-hover:scale-110
                `}>
                    {emoji}
                </div>
                <span className={`
                    font-black text-center leading-tight
                    ${variant === 'compact' ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'}
                    ${gradient ? 'text-white drop-shadow-sm' : 'text-slate-700 dark:text-slate-200'}
                `}>
                    {label}
                </span>
            </div>
        </button>
    );

    return (
        <div className="w-full h-full animate-fade-in px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8">

            {/* ============================================================================ */}
            {/* HERO SECTION - PRIMARY CTA */}
            {/* ============================================================================ */}
            <section className="mb-8 animate-fade-in-down">
                <button
                    onClick={() => onStartNewOrder()}
                    className="w-full group relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black text-white p-6 rounded-[2rem] shadow-2xl shadow-slate-900/30 hover:shadow-slate-900/50 transition-all duration-300 border-2 border-slate-600/20 hover:border-primary/30"
                >
                    {/* Animated background effects */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-sky-500 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse group-hover:animate-none group-hover:scale-110 transition-transform">
                                <span className="text-3xl">➕</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-xl sm:text-2xl block mb-1.5 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                                    طلب قطعة جديدة
                                </span>
                                <span className="text-sm text-slate-300 font-medium">
                                    قطع غيار أصلية بأفضل الأسعار ⚡
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon name="ChevronLeft" className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </button>
            </section>

            {/* ============================================================================ */}
            {/* QUICK ACTIONS HUB - PRIMARY NAVIGATION */}
            {/* ============================================================================ */}
            <section className="mb-8">
                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                        <span className="text-xl">⚡</span>
                        وصول سريع
                    </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                    <ActionButton
                        onClick={() => onNavigate('store')}
                        emoji="🛍️"
                        label="المتجر"
                        bgColor="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    />
                    <ActionButton
                        onClick={() => onNavigate('suggestions')}
                        emoji="✨"
                        label="المساعد"
                        bgColor="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                    />
                    <ActionButton
                        onClick={() => onNavigate('myCarListings')}
                        emoji="🚗"
                        label="سياراتي"
                        bgColor="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    />
                    <ActionButton
                        onClick={() => onNavigate('orders')}
                        emoji="📦"
                        label="طلباتي"
                        bgColor="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    />
                    <ActionButton
                        onClick={() => onNavigate('wallet')}
                        emoji="💰"
                        label="المحفظة"
                        bgColor="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    />
                    <ActionButton
                        onClick={() => onNavigate('flashProducts')}
                        emoji="⚡"
                        label="العروض"
                        bgColor="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                    />
                </div>
            </section>

            {/* ============================================================================ */}
            {/* ACTIVE SERVICES - ORDERS & CAR LISTINGS */}
            {/* ============================================================================ */}
            <section className="mb-8">
                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                        <span className="text-xl">🎯</span>
                        نشاطك الحالي
                    </h3>
                </div>

                {/* Orders Section - Premium Design */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="text-xl sm:text-2xl">📦</span>
                            {activeOrders.length > 0 ? 'الطلبات النشطة' : 'آخر طلب'}
                        </h4>
                        {(activeOrders.length > 0 || lastOrder) && (
                            <button
                                onClick={() => onNavigate('orders')}
                                className="text-xs sm:text-sm font-bold text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1 group"
                            >
                                عرض الكل
                                <Icon name="ChevronLeft" className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : activeOrders.length > 0 ? (
                        <div className="space-y-3">
                            {activeOrders.map(order => {
                                const hasNewQuotes = order.quotes?.some(q => !q.viewedByCustomer);
                                const quotesCount = order.quotes?.length || 0;
                                const getStatusEmoji = (status: string) => {
                                    if (status.includes('pending') || status.includes('قيد المراجعة')) return '⏳';
                                    if (status.includes('quoted') || status.includes('عروض')) return '💬';
                                    if (status.includes('payment') || status.includes('تأكيد الدفع')) return '💳';
                                    if (status.includes('processing') || status.includes('التجهيز')) return '🔧';
                                    if (status.includes('shipped') || status.includes('الشحن')) return '🚚';
                                    if (status.includes('delivered') || status.includes('التوصيل')) return '✅';
                                    if (status.includes('cancelled') || status.includes('ملغي')) return '❌';
                                    return '📦';
                                };

                                return (
                                    <button
                                        key={order.orderNumber}
                                        onClick={() => {
                                            if (navigator.vibrate) navigator.vibrate(30);
                                            onNavigate('orders', { orderNumber: order.orderNumber });
                                        }}
                                        className={`w-full text-right p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 relative group active:scale-[0.98] hover:shadow-xl ${hasNewQuotes
                                            ? 'bg-gradient-to-br from-secondary-50 to-amber-50 dark:from-secondary-900/20 dark:to-slate-900 border-secondary-300 dark:border-secondary-700 shadow-lg'
                                            : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700'
                                            }`}
                                    >
                                        {/* NEW QUOTES BANNER */}
                                        {hasNewQuotes && (
                                            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-secondary-500 to-orange-500 text-white text-[10px] sm:text-sm font-black py-1 sm:py-1.5 px-2 sm:px-4 text-center animate-pulse rounded-t-2xl">
                                                🔔 عروض جديدة!
                                            </div>
                                        )}

                                        <div className={`flex items-center gap-3 sm:gap-4 ${hasNewQuotes ? 'mt-6 sm:mt-7' : ''}`}>
                                            {/* STATUS EMOJI */}
                                            <div className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-sm ${hasNewQuotes
                                                ? 'bg-secondary-100 dark:bg-secondary-900/40'
                                                : 'bg-gradient-to-br from-primary-50 to-sky-50 dark:from-primary-900/20 dark:to-slate-800'
                                                } group-hover:scale-110 transition-transform`}>
                                                {getStatusEmoji(order.status)}

                                                {/* New quotes indicator */}
                                                {hasNewQuotes && (
                                                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white dark:border-slate-900 text-[10px] font-black text-white items-center justify-center">
                                                            {quotesCount}
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-base sm:text-lg leading-tight mb-1 truncate text-slate-800 dark:text-white">
                                                    🚗 {order.formData.brand} {order.formData.model}
                                                </h3>
                                                <p className={`text-xs sm:text-sm font-bold mb-2 ${hasNewQuotes ? 'text-secondary-600 dark:text-secondary-400' : 'text-slate-500 dark:text-slate-400'
                                                    }`}>
                                                    {order.status}
                                                </p>
                                                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="Hash" className="w-3 h-3" />
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="Calendar" className="w-3 h-3" />
                                                        {new Date(order.date).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                    {quotesCount > 0 && (
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${hasNewQuotes
                                                            ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/50 dark:text-secondary-300'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            💬 {quotesCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Chevron */}
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-100 group-hover:text-primary-600 dark:group-hover:bg-primary-900/40 dark:group-hover:text-primary-400 transition-all">
                                                <Icon name="ChevronLeft" className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : lastOrder ? (
                        <button
                            onClick={() => {
                                if (navigator.vibrate) navigator.vibrate(30);
                                onNavigate('orders', { orderNumber: lastOrder.orderNumber });
                            }}
                            className="w-full text-right p-4 sm:p-5 rounded-2xl border-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-slate-900 border-emerald-200 dark:border-emerald-900/30 shadow-sm hover:shadow-xl transition-all duration-300 group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Success Icon */}
                                <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-3xl sm:text-4xl shadow-sm group-hover:scale-110 transition-transform">
                                    ✅
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-base sm:text-lg leading-tight mb-1 truncate text-slate-800 dark:text-white">
                                        🚗 {lastOrder.formData.brand} {lastOrder.formData.model}
                                    </h3>
                                    <p className="text-xs sm:text-sm font-bold mb-2 text-emerald-600 dark:text-emerald-400">
                                        {lastOrder.status}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <Icon name="Hash" className="w-3 h-3" />
                                            {lastOrder.orderNumber}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Icon name="Calendar" className="w-3 h-3" />
                                            {new Date(lastOrder.date).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Chevron */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-all">
                                    <Icon name="ChevronLeft" className="w-5 h-5" />
                                </div>
                            </div>
                        </button>
                    ) : (
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 sm:p-8 text-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <span className="text-4xl sm:text-5xl">📭</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 font-bold text-sm sm:text-base mb-3">\r
                                لا توجد طلبات حتى الآن
                            </p>
                            <p className="text-slate-500 dark:text-slate-500 text-xs sm:text-sm mb-4">
                                ابدأ طلبك الأول للحصول على قطع غيار سيارتك
                            </p>
                            <Button
                                onClick={() => onStartNewOrder()}
                                className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <Icon name="Plus" className="w-4 h-4 sm:w-5 sm:h-5 inline ml-2" />
                                إنشاء طلب جديد
                            </Button>
                        </div>
                    )}
                </div>

                {/* User Car Listings Widget */}
                <UserCarListingsWidget userId={userPhone} userRole="customer" onNavigate={onNavigate} />
            </section>

            {/* ============================================================================ */}
            {/* MY ASSETS - GARAGE & MARKETPLACE */}
            {/* ============================================================================ */}
            <section className="mb-8">
                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                        <span className="text-xl">🏆</span>
                        ممتلكاتي
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    {/* Garage Mini View */}
                    <Card className="p-5 shadow-sm border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-2">
                                <span className="text-xl">🚗</span>
                                مرآبي
                            </h4>
                            <button
                                onClick={() => onNavigate('garage')}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                إدارة <Icon name="Settings" className="w-3 h-3" />
                            </button>
                        </div>

                        {loading ? (
                            <SkeletonLoader className="h-20 w-full rounded-xl" />
                        ) : customer?.garage && customer.garage.length > 0 ? (
                            <div className="space-y-2.5">
                                {customer.garage.slice(0, 2).map(vehicle => {
                                    const brandData = allBrands.find(b => b.name === vehicle.brand);
                                    return (
                                        <div key={vehicle.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl hover:from-primary/5 hover:to-sky-500/5 transition-all cursor-pointer group">
                                            <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center p-2 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                                                {brandData?.logo ? (
                                                    <img src={brandData.logo} alt={vehicle.brand} className="w-full h-full object-contain" />
                                                ) : (
                                                    <GenericCarLogo className="w-full h-full object-contain text-slate-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-sm text-slate-800 dark:text-slate-200 truncate">
                                                    {vehicle.brand} {vehicle.model}
                                                </p>
                                                <p className="text-xs text-slate-500 font-medium">{vehicle.year}</p>
                                            </div>
                                            <Icon name="ChevronLeft" className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                        </div>
                                    );
                                })}
                                {customer.garage.length > 2 && (
                                    <button
                                        onClick={() => onNavigate('garage')}
                                        className="w-full text-center text-xs font-bold text-primary hover:underline py-2"
                                    >
                                        +{customer.garage.length - 2} سيارة أخرى
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6 px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <span className="text-3xl">🚗</span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-3">
                                    أضف سيارتك لسهولة الطلب
                                </p>
                                <Button
                                    onClick={() => onNavigate('garage')}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs font-bold border-primary text-primary hover:bg-primary hover:text-white"
                                >
                                    + إضافة سيارة
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Flash Offers */}
                    <button
                        className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white"
                        onClick={() => onNavigate('flashProducts')}
                    >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <span className="text-3xl">⚡</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-black text-xl block mb-1">عروض فورية</span>
                                    <span className="text-xs opacity-90 font-medium">خصومات حصرية</span>
                                </div>
                            </div>
                            <p className="text-sm opacity-95 mb-4 text-right font-medium">
                                على الزيوت والإكسسوارات وقطع الغيار 🎁
                            </p>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-bold self-start group-hover:bg-white/30 transition-colors">
                                تصفح العروض <Icon name="ArrowLeft" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </button>
                </div>

                {/* Marketplace Quick Access */}
                <MarketplaceQuickAccess onNavigate={onGlobalNavigate} />
            </section>

            {/* ============================================================================ */}
            {/* PLATFORM SERVICES - EXTERNAL NAVIGATION */}
            {/* ============================================================================ */}
            <section className="mb-8">
                <div className="mb-4">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 px-1">
                        <span className="text-xl">🌟</span>
                        خدمات إضافية
                    </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ActionButton
                        onClick={() => window.location.href = '/technicians'}
                        emoji="👨‍🔧"
                        label="دليل الفنيين"
                        gradient="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600"
                        variant="large"
                    />
                    <ActionButton
                        onClick={() => window.location.href = '/tow-trucks'}
                        emoji="🚚"
                        label="دليل السطحات"
                        gradient="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600"
                        variant="large"
                    />
                    <ActionButton
                        onClick={() => window.location.href = '/blog'}
                        emoji="📰"
                        label="المدونة"
                        gradient="bg-gradient-to-br from-rose-500 via-pink-600 to-red-600"
                        variant="large"
                    />
                    <ActionButton
                        onClick={() => window.location.href = '/contact'}
                        emoji="📞"
                        label="تواصل معنا"
                        gradient="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900"
                        variant="large"
                    />
                </div>
            </section>

        </div >
    );
};

export default CustomerOverview;