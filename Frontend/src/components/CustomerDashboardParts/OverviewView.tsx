import React, { useState, useEffect } from 'react';
import { Order, Customer, Vehicle, Brand, OrderFormData } from '../../types';
import Icon from '../Icon';
import EmptyState from '../EmptyState';
import SkeletonLoader from '../SkeletonLoader';
import VisualOrderTimeline from '../VisualOrderTimeline';
import { CustomerView } from './types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MarketplaceQuickAccess } from '../DashboardParts/Shared';

const GenericCarLogo: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16.5V8" /><path d="M10 16.5V8" /><path d="M2 12h20" /><path d="M5 12v-5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5" /><path d="M2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H2Z" /></svg>
);

const CustomerOverview: React.FC<{
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    userPhone: string;
    onNavigate: (view: CustomerView, params?: any) => void;
    onGlobalNavigate: (view: any, params?: any) => void;
    allBrands: Brand[];
}> = ({ onStartNewOrder, userPhone, onNavigate, onGlobalNavigate, allBrands }) => {
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const allOrdersRaw = localStorage.getItem('all_orders');
        if (allOrdersRaw) {
            const allOrders: Order[] = JSON.parse(allOrdersRaw);
            const userOrders = allOrders.filter(o => o.userPhone === userPhone);
            const userActiveOrders = userOrders
                .filter(o => !['تم التوصيل', 'ملغي', 'تم الاستلام من الشركة'].includes(o.status))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setActiveOrders(userActiveOrders.slice(0, 3));
        }

        const allCustomersRaw = localStorage.getItem('all_customers');
        if (allCustomersRaw) {
            const allCustomers: Customer[] = JSON.parse(allCustomersRaw);
            const currentUser = allCustomers.find(c => c.id === userPhone);
            setCustomer(currentUser || null);
        }
        setLoading(false);
    }, [userPhone]);

    // Quick Action Button Component
    const QuickActionBtn: React.FC<{ onClick: () => void, emoji: string, label: string, bgColor: string }> = ({ onClick, emoji, label, bgColor }) => (
        <Button
            onClick={onClick}
            variant="outline"
            className="flex flex-col items-center justify-center p-2 sm:p-4 h-auto shadow-sm hover:shadow-md w-full min-h-[90px] sm:min-h-[110px] border-slate-200 dark:border-slate-700 active:scale-95 transition-transform rounded-2xl"
        >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2 ${bgColor} text-2xl sm:text-3xl shadow-sm`}>
                {emoji}
            </div>
            <span className="font-black text-xs sm:text-sm text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-1">{label}</span>
        </Button>
    );

    // Service Card for public pages
    const ServiceCard: React.FC<{ onClick: () => void, emoji: string, title: string, subtitle: string, gradient: string }> = ({ onClick, emoji, title, subtitle, gradient }) => (
        <button
            onClick={onClick}
            className={`relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl ${gradient}`}
        >
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                    <span className="text-2xl">{emoji}</span>
                </div>
                <div>
                    <h4 className="font-black text-lg mb-1">{title}</h4>
                    <p className="text-sm opacity-90 font-medium">{subtitle}</p>
                </div>
            </div>
        </button>
    );

    return (
        <div className="w-full h-full animate-fade-in">
            {/* Mobile Header - Sticky */}
            {/* Mobile Header - Sticky */}
            <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-darkbg/90 backdrop-blur-md px-4 pt-4 pb-4 sm:hidden border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mb-1">صباح الخير ☀️</p>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {customer?.name?.split(' ')[0] || 'يا هلا'} 👋
                        </h2>
                    </div>
                    <button
                        onClick={() => onNavigate('settings')}
                        className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <span className="text-xl">⚙️</span>
                    </button>
                </div>
            </div>

            {/* Main Content with negative margin for overlap effect on mobile */}
            <div className="px-4 sm:px-6 lg:px-8 pb-24 sm:pb-8 -mt-2 sm:mt-0">
                {/* Desktop Welcome Header */}
                <div className="hidden sm:block mb-8 bg-gradient-to-r from-primary to-sky-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black mb-2">أهلاً بك، {customer?.name?.split(' ')[0] || 'عميلنا العزيز'}! 👋</h2>
                        <p className="text-white/90 text-lg font-medium max-w-xl">جاهزون لتلبية احتياجات سيارتك اليوم. ماذا تريد أن تفعل؟</p>
                    </div>
                </div>

                {/* Mobile Content Container */}
                <div className="bg-slate-50 dark:bg-darkbg sm:bg-transparent rounded-t-3xl sm:rounded-none pt-4 sm:pt-0">

                    {/* Primary CTA - New Order */}
                    {/* Primary CTA - New Order */}
                    {/* Primary CTA - New Order */}
                    <button
                        onClick={() => onStartNewOrder()}
                        className="w-full mb-8 flex items-center justify-between gap-4 bg-slate-900 dark:bg-black text-white p-5 rounded-[2rem] shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all border-4 border-white dark:border-slate-800"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                                <span className="text-2xl">➕</span>
                            </div>
                            <div className="text-right">
                                <span className="font-black text-xl block mb-1">طلب قطعة جديدة</span>
                                <span className="text-sm text-slate-300 font-medium">قطع غيار أصلية بأفضل الأسعار</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon name="ChevronLeft" className="w-6 h-6 text-white" />
                        </div>
                    </button>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 mb-8 px-1">
                        <QuickActionBtn onClick={() => onNavigate('store')} emoji="🛍️" label="المتجر" bgColor="bg-blue-100 dark:bg-blue-900/30" />
                        <QuickActionBtn onClick={() => onNavigate('suggestions')} emoji="✨" label="المساعد" bgColor="bg-purple-100 dark:bg-purple-900/30" />
                        <QuickActionBtn onClick={() => onNavigate('garage')} emoji="🚗" label="سياراتي" bgColor="bg-amber-100 dark:bg-amber-900/30" />
                        <QuickActionBtn onClick={() => onNavigate('orders')} emoji="📦" label="طلباتي" bgColor="bg-green-100 dark:bg-green-900/30" />
                        <QuickActionBtn onClick={() => onNavigate('wallet')} emoji="💰" label="المحفظة" bgColor="bg-emerald-100 dark:bg-emerald-900/30" />
                        <QuickActionBtn onClick={() => onNavigate('flashProducts')} emoji="⚡" label="العروض" bgColor="bg-orange-100 dark:bg-orange-900/30" />
                    </div>

                    {/* Marketplace Quick Access */}
                    <MarketplaceQuickAccess onNavigate={onGlobalNavigate} />

                    {/* Public Services Section */}
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4 px-1 flex items-center gap-2">
                            <span>🌟</span>
                            خدمات عامة
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <ServiceCard
                                onClick={() => window.location.href = '/technicians'}
                                emoji="👨‍🔧"
                                title="دليل الفنيين"
                                subtitle="ابحث عن سباك أو كهربائي"
                                gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/tow-trucks'}
                                emoji="🚚"
                                title="دليل السطحات"
                                subtitle="خدمات سحب السيارات"
                                gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/blog'}
                                emoji="📰"
                                title="المدونة"
                                subtitle="نصائح هامة لسيارتك"
                                gradient="bg-gradient-to-br from-rose-500 to-rose-700"
                            />
                            <ServiceCard
                                onClick={() => window.location.href = '/contact'}
                                emoji="📞"
                                title="تواصل معنا"
                                subtitle="نحن هنا لمساعدتك"
                                gradient="bg-gradient-to-br from-slate-600 to-slate-800"
                            />
                        </div>
                    </div>

                    {/* Active Orders Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <span>📦</span>
                                الطلبات النشطة
                            </h3>
                            <button onClick={() => onNavigate('orders')} className="text-sm font-bold text-primary">
                                عرض الكل
                            </button>
                        </div>

                        {loading ? (
                            <SkeletonLoader className="h-32 w-full rounded-2xl" />
                        ) : activeOrders.length > 0 ? (
                            <div className="space-y-3">
                                {activeOrders.map(order => (
                                    <Card
                                        key={order.orderNumber}
                                        className="p-4 shadow-sm border-slate-100 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow"
                                        onClick={() => onNavigate('orders', { orderNumber: order.orderNumber })}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                                    <Icon name="Package" className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{order.formData.brand} {order.formData.model}</p>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{order.orderNumber}</p>
                                                </div>
                                            </div>
                                            <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                                {order.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">"{order.formData.partDescription}"</p>
                                        <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
                                            <VisualOrderTimeline order={order} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-darkcard rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                    <span className="text-4xl">📭</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-3">لا توجد طلبات نشطة حالياً</p>
                                <Button onClick={() => onStartNewOrder()} variant="link" className="text-primary font-bold">
                                    + أنشئ طلبك الأول
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Garage & Offers Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Garage Mini View */}
                        <div className="bg-white dark:bg-darkcard p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-lg">
                                    <span>🚗</span>
                                    مرآبي
                                </h3>
                                <button onClick={() => onNavigate('garage')} className="text-xs font-bold text-slate-500">إدارة</button>
                            </div>

                            {loading ? (
                                <SkeletonLoader className="h-16 w-full rounded-xl" />
                            ) : customer?.garage && customer.garage.length > 0 ? (
                                <div className="space-y-2">
                                    {customer.garage.slice(0, 2).map(vehicle => {
                                        const brandData = allBrands.find(b => b.name === vehicle.brand);
                                        return (
                                            <div key={vehicle.id} className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <div className="flex-shrink-0 w-10 h-10 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                                                    {brandData?.logo ? (
                                                        <img src={brandData.logo} alt={vehicle.brand} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <GenericCarLogo className="w-full h-full object-contain text-slate-400" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{vehicle.brand} {vehicle.model}</p>
                                                    <p className="text-xs text-slate-500">{vehicle.year}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 px-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">أضف سيارتك لسهولة الطلب</p>
                                    <button onClick={() => onNavigate('garage')} className="text-xs font-bold text-primary">+ إضافة سيارة</button>
                                </div>
                            )}
                        </div>

                        {/* Flash Offers */}
                        <div
                            className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-2xl shadow-lg text-white relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                            onClick={() => onNavigate('flashProducts')}
                        >
                            <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">⚡</span>
                                    <span className="font-black text-xl">عروض فورية</span>
                                </div>
                                <p className="text-sm opacity-90 mb-3">خصومات حصرية على الزيوت والإكسسوارات</p>
                                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold">
                                    تصفح العروض <Icon name="ArrowLeft" className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerOverview;