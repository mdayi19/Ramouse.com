
import React, { useState } from 'react';
import { OrderStatus, WithdrawalStatus, Provider, FlashProductRequestStatus } from '../../types';
import Icon from '../Icon';
import Modal from '../Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const ViewHeader: React.FC<{ title: string; subtitle: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in-down">
        <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base font-medium">{subtitle}</p>
        </div>
        {actions && <div className="flex gap-3 shrink-0">{actions}</div>}
    </div>
);

export const getStatusColorClasses = (status: OrderStatus | WithdrawalStatus | FlashProductRequestStatus): string => {
    switch (status as string) {
        // Pending statuses
        case 'pending': case 'Pending': case 'قيد المراجعة':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700';

        // Quoted status
        case 'quoted': case 'تم استلام عروض':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';

        // Payment pending
        case 'payment_pending': case 'بانتظار تأكيد الدفع': case 'payment_verification':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700';

        // Processing/Preparing
        case 'processing': case 'جاري التجهيز': case 'preparing':
            return 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700';

        // Provider received
        case 'provider_received': case 'تم الاستلام من المزود':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700';

        // Ready for pickup
        case 'ready_for_pickup': case 'جاهز للاستلام':
            return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700';

        // Shipped
        case 'shipped': case 'تم الشحن للعميل':
            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700';

        // Out for delivery
        case 'out_for_delivery': case 'قيد التوصيل':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700';

        // Delivered/Completed
        case 'delivered': case 'completed': case 'تم التوصيل': case 'تم الاستلام من الشركة':
            return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700';

        // Approved
        case 'Approved': case 'approved': case 'تمت الموافقة':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';

        // Cancelled/Rejected
        case 'cancelled': case 'ملغي': case 'Rejected': case 'rejected': case 'مرفوض':
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-700';

        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
};

import { Badge } from '../ui/Badge';

export const StatusBadge: React.FC<{ status: OrderStatus | WithdrawalStatus | FlashProductRequestStatus; size?: 'sm' | 'md' }> = ({ status, size = 'md' }) => {
    const getStatusText = (s: string) => {
        switch (s) {
            // Order statuses
            case 'pending': return 'قيد المراجعة';
            case 'quoted': return 'تم استلام عروض';
            case 'payment_pending': return 'بانتظار تأكيد الدفع';
            case 'processing': return 'جاري التجهيز';
            case 'ready_for_pickup': return 'جاهز للاستلام';
            case 'provider_received': return 'تم الاستلام من المزود';
            case 'shipped': return 'تم الشحن للعميل';
            case 'out_for_delivery': return 'قيد التوصيل';
            case 'delivered': return 'تم التوصيل';
            case 'completed': return 'تم الاستلام من الشركة';
            case 'cancelled': case 'canceled': return 'ملغي'; // Both spellings

            // Withdrawal statuses
            case 'Pending': return 'قيد المراجعة';
            case 'Approved': case 'approved': return 'تمت الموافقة';
            case 'Rejected': case 'rejected': return 'مرفوض';

            // Flash product request statuses
            case 'payment_verification': return 'بانتظار تأكيد الدفع';
            case 'preparing': return 'جاري التجهيز';

            // Default - return as is (for legacy Arabic statuses)
            default:
                // If status contains Arabic characters, return as is
                if (/[؀-ۿ]/.test(s)) {
                    return s;
                }
                // Log unknown English statuses for debugging
                console.warn(`[StatusBadge] Unknown status: "${s}" - displaying as-is. Please add translation.`);
                return s;
        }
    };

    const getVariant = (s: string): any => {
        switch (s as string) {
            case 'pending': case 'Pending': case 'قيد المراجعة': return 'warning';
            case 'quoted': case 'تم استلام عروض': return 'purple';
            case 'payment_pending': case 'بانتظار تأكيد الدفع': case 'payment_verification': return 'orange';
            case 'processing': case 'جاري التجهيز': case 'preparing': return 'sky';
            case 'provider_received': case 'تم الاستلام من المزود': return 'info';
            case 'ready_for_pickup': case 'جاهز للاستلام': return 'teal';
            case 'shipped': case 'تم الشحن للعميل': return 'indigo';
            case 'out_for_delivery': case 'قيد التوصيل': return 'purple';
            case 'delivered': case 'completed': case 'تم التوصيل': case 'تم الاستلام من الشركة': case 'Approved': case 'approved': case 'تمت الموافقة': return 'success';
            case 'cancelled': case 'ملغي': case 'Rejected': case 'rejected': case 'مرفوض': return 'destructive';
            default: return 'secondary';
        }
    }

    return (
        <Badge variant={getVariant(status)} className={`whitespace-nowrap shadow-sm ${size === 'sm' ? 'text-[10px] px-2 py-0.5 h-auto' : ''}`}>
            {getStatusText(status)}
        </Badge>
    );
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    trendLabel?: string;
    iconClassName?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendDirection, trendLabel = "مقارنة بالشهر الماضي", iconClassName = "bg-primary/10 text-primary", className }) => (
    <div className={`bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group ${className}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClassName}`}>
                {icon}
            </div>
        </div>
        {trend && (
            <div className="mt-4 flex items-center text-xs font-bold">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${trendDirection === 'up' ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    trendDirection === 'down' ? 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400' :
                        'text-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                    {trendDirection === 'up' && <Icon name="TrendingUp" className="w-3 h-3" />}
                    {trendDirection === 'down' && <Icon name="TrendingDown" className="w-3 h-3" />}
                    {trendDirection === 'neutral' && <Icon name="Minus" className="w-3 h-3" />}
                    {trend}
                </span>
                <span className="text-slate-400 ml-2">{trendLabel}</span>
            </div>
        )}
    </div>
);

export const AddFundsModal: React.FC<{
    provider: Provider;
    onClose: () => void;
    onConfirm: (providerId: string, amount: number, description: string) => Promise<void>;
}> = ({ provider, onClose, onConfirm }) => {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
            setIsSubmitting(true);
            try {
                await onConfirm(provider.id, numAmount, description);
                onClose(); // Close modal on success
            } catch (error) {
                console.error('Error in AddFundsModal:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };
    return (
        <Modal title={`إضافة رصيد إلى ${provider.name}`} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <Input
                        label="المبلغ ($)"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={isSubmitting}
                        className="text-left"
                        dir="ltr"
                        min="0"
                    />
                </div>
                <div>
                    <Input
                        label="الوصف (اختياري)"
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="مثال: تسوية رصيد"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600"
                        disabled={isSubmitting}
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="primary"
                        className="font-bold flex items-center gap-2"
                        disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
                    >
                        {isSubmitting && <Icon name="Loader" className="w-4 h-4 animate-spin" />}
                        {isSubmitting ? 'جاري الإضافة...' : 'تأكيد الإضافة'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export { Icon };
export const EditIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Pencil" className={className} />;
export const DeleteIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Trash2" className={className} />;
export const WrenchScrewdriverIcon: React.FC<{ className?: string }> = ({ className }) => <Icon name="Wrench" className={className} />;

// ============================================================================
// DASHBOARD SHARED UTILITIES
// ============================================================================

import { SidebarItemType, SidebarUser } from './Sidebar';

/**
 * Common menu items shared across all user types
 * Use these to ensure consistent labels and icons
 */
export const COMMON_MENU_ITEMS = {
    overview: { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid' },
    store: { id: 'store', label: 'المتجر', icon: 'ShoppingBag' },
    carListings: { id: 'car-listings', label: 'سوق السيارات', icon: 'Car' },
    rentCar: { id: 'rent-car', label: 'استئجار سيارة', icon: 'MapPin' },
    wallet: { id: 'wallet', label: 'المحفظة', icon: 'Wallet' },
    flashProducts: { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap' },
    internationalLicense: { id: 'internationalLicense', label: 'الرخصة الدولية', icon: 'Globe' },
    settings: { id: 'settings', label: 'الإعدادات', icon: 'Settings' },
    notifications: { id: 'notifications', label: 'الإشعارات', icon: 'Bell' },
    orders: { id: 'orders', label: 'طلباتي', icon: 'ClipboardList' },
    profile: { id: 'profile', label: 'ملفي الشخصي', icon: 'User' },
    reviews: { id: 'reviews', label: 'التقييمات', icon: 'Star' },
    garage: { id: 'garage', label: 'مرآبي', icon: 'Warehouse' },
    auctions: { id: 'auctions', label: 'المزادات', icon: 'Gavel' },
    suggestions: { id: 'suggestions', label: 'المساعد الذكي', icon: 'Sparkles' },
} as const;

/**
 * Derives the active view from the current pathname
 * @param pathname - Current location pathname
 * @param basePath - Dashboard base path (e.g., '/dashboard', '/technician')
 * @returns Active view name
 */
export const getDashboardActiveView = (pathname: string, basePath: string): string => {
    const path = pathname.split('/').pop();
    if (pathname === basePath || pathname === `${basePath}/`) {
        return 'overview';
    }
    return path || 'overview';
};

/**
 * Creates a standardized SidebarUser object
 * @param name - User's display name
 * @param phone - User's phone number
 * @param roleLabel - Role label in Arabic (e.g., 'عميل', 'فني')
 * @param avatarChar - Optional avatar character (defaults to first char of name)
 * @returns SidebarUser object
 */
export const createSidebarUser = (
    name: string,
    phone: string,
    roleLabel: string,
    avatarChar?: string
): SidebarUser => ({
    name,
    phone,
    roleLabel,
    avatarChar: avatarChar || name.charAt(0)
});

/**
 * Creates standard navigation handlers for dashboards
 * Reduces boilerplate across all dashboard components
 */
export const createNavigationHandlers = (
    navigate: any,
    onNavigate: Function,
    basePath: string,
    setIsSidebarOpen?: (open: boolean) => void
) => {
    const handleViewChange = (view: string, params?: any) => {
        if (view === 'overview') {
            navigate(basePath);
        } else {
            navigate(`${basePath}/${view}`, { state: params });
        }
    };

    const handleSidebarNavClick = (view: string) => {
        if (view === 'notifications') {
            onNavigate('notificationCenter');
        } else {
            handleViewChange(view);
        }
        if (setIsSidebarOpen && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleBottomNavClick = (id: string, onStartNewOrder?: Function) => {
        if (id === 'notifications') {
            onNavigate('notificationCenter');
        } else if (id === 'add-order' || id === 'new-order') {
            onStartNewOrder?.();
        } else {
            handleViewChange(id);
        }
    };

    return { handleViewChange, handleSidebarNavClick, handleBottomNavClick };
};

/**
 * Builds a sidebar menu item with consistent structure
 * @param menuItem - Menu item definition from COMMON_MENU_ITEMS
 * @param activeView - Currently active view
 * @param onClick - Click handler
 * @param badge - Optional badge count
 * @returns SidebarItemType
 */
export const buildSidebarItem = (
    menuItem: typeof COMMON_MENU_ITEMS[keyof typeof COMMON_MENU_ITEMS],
    activeView: string,
    onClick: () => void,
    badge?: number
): SidebarItemType => ({
    ...menuItem,
    onClick,
    isActive: activeView === menuItem.id,
    badge
});

/**
 * Builds an external navigation item (navigates outside dashboard)
 * @param menuItem - Menu item definition
 * @param onNavigate - Global navigation function
 * @returns SidebarItemType
 */
export const buildExternalNavItem = (
    menuItem: typeof COMMON_MENU_ITEMS[keyof typeof COMMON_MENU_ITEMS],
    onNavigate: Function
): SidebarItemType => ({
    ...menuItem,
    onClick: () => onNavigate(menuItem.id),
    isActive: false
});

/**
 * Builds a custom sidebar item (not in COMMON_MENU_ITEMS)
 * @param id - Unique identifier
 * @param label - Display label (Arabic)
 * @param icon - Icon name from lucide-react
 * @param activeView - Currently active view
 * @param onClick - Click handler
 * @param badge - Optional badge count
 * @returns SidebarItemType
 */
export const buildCustomSidebarItem = (
    id: string,
    label: string,
    icon: string,
    activeView: string,
    onClick: () => void,
    badge?: number
): SidebarItemType => ({
    id,
    label,
    icon,
    onClick,
    isActive: activeView === id,
    badge
});

// ============================================================================
// QUICK ACCESS CARDS FOR DASHBOARD OVERVIEWS
// ============================================================================

interface QuickAccessCardProps {
    title: string;
    description: string;
    emoji: string;
    onClick: () => void;
    gradient: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ title, description, emoji, onClick, gradient }) => (
    <button
        onClick={onClick}
        className={`group relative overflow-hidden rounded-3xl p-5 text-white text-right w-full active:scale-95 transition-all shadow-lg hover:shadow-xl ${gradient}`}
    >
        <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm self-start">
                <span className="text-2xl">{emoji}</span>
            </div>
            <div>
                <h4 className="font-black text-lg mb-1">{title}</h4>
                <p className="text-sm opacity-90 font-medium">{description}</p>
            </div>
        </div>
    </button>
);

/**
 * Quick access cards for Car Listings and Rent Car
 * Display in dashboard overviews for easy access
 */
export const MarketplaceQuickAccess: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => (
    <div className="grid grid-cols-2 gap-4 mb-8">
        <QuickAccessCard
            title={COMMON_MENU_ITEMS.carListings.label}
            description="تصفح السيارات المعروضة للبيع"
            emoji="🚗"
            onClick={() => onNavigate('car-listings')}
            gradient="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <QuickAccessCard
            title={COMMON_MENU_ITEMS.rentCar.label}
            description="استأجر سيارة لفترة قصيرة أو طويلة"
            emoji="🗺️"
            onClick={() => onNavigate('rent-car')}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
    </div>
);
