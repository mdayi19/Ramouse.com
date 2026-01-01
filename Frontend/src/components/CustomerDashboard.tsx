import React, { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Customer, Notification, NotificationType, Order, Settings, Vehicle, OrderFormData, Brand, StoreCategory } from '../types';
import MyOrders from './MyOrders';
import CustomerSettings from './CustomerSettings';
import AISuggestions from './AISuggestions';
import CustomerGarage from './CustomerGarage';
import SkeletonLoader from './SkeletonLoader';
import Icon from './Icon';
import BottomNavBar from './BottomNavBar';
import Sidebar, { SidebarItemType, SidebarUser } from './DashboardParts/Sidebar';

// New modular imports
import CustomerOverview from './CustomerDashboardParts/OverviewView';
import { FlashProductsView } from './CustomerDashboardParts/FlashProductsView';
import { StoreView } from './Store/StoreView';
import { CustomerView } from './CustomerDashboardParts/types';
import UserWalletView from './UserWalletView';
import UserInternationalLicenseView from './DashboardParts/UserInternationalLicenseView';


interface CustomerDashboardProps {
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    userPhone: string;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    isLoading: boolean;
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    onBack: () => void;
    onUpdateCustomer: (customerId: string, updatedData: Partial<Customer>, newPassword?: string) => Promise<void>;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
    allBrands: Brand[];
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    onNavigate: (view: any, params?: any) => void;
    currentView: string;
    unreadCount: number;
    storeCategories: StoreCategory[];
    customer: Customer | null;
}

const AISuggestionsWrapper = () => {
    const location = useLocation();
    const vehicle = location.state?.vehicle as Vehicle | null;
    return <AISuggestions vehicleContext={vehicle} />;
};

const CustomerDashboard: React.FC<CustomerDashboardProps> = (props) => {
    const { isSidebarOpen, setIsSidebarOpen, onLogout, userPhone, currentView, unreadCount, onNavigate, onBack, storeCategories, customer } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL
    const activeView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') return 'overview';
        return (path as CustomerView) || 'overview';
    }, [location.pathname]);

    useEffect(() => {
        if (props.navigationParams?.orderNumber) {
            navigate('/dashboard/orders');
        }
    }, [props.navigationParams, navigate]);

    const handleViewChange = (view: CustomerView, params?: any) => {
        if (props.onNavigationConsumed) props.onNavigationConsumed();

        if (view === 'overview') {
            navigate('/dashboard');
        } else {
            // Pass params as state if needed, primarily used for vehicle context in diagnose
            navigate(`/dashboard/${view}`, { state: params });
        }
    };

    const handleDiagnose = (vehicle: Vehicle) => {
        navigate('/dashboard/suggestions', { state: { vehicle } });
    };

    const handleSidebarNavClick = (view: CustomerView | 'notifications') => {
        if (view === 'notifications') {
            onNavigate('notificationCenter');
        } else {
            handleViewChange(view);
        }
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'notifications') {
            props.onNavigate('notificationCenter');
        } else {
            handleViewChange(id as CustomerView);
        }
    };

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSidebarNavClick('overview'), isActive: activeView === 'overview' },
        { id: 'orders', label: 'طلباتي', icon: 'ClipboardList', onClick: () => handleSidebarNavClick('orders'), isActive: activeView === 'orders' },
        { id: 'store', label: 'المتجر', icon: 'ShoppingBag', onClick: () => handleSidebarNavClick('store'), isActive: activeView === 'store' },
        { id: 'wallet', label: 'المحفظة', icon: 'Wallet', onClick: () => handleSidebarNavClick('wallet'), isActive: activeView === 'wallet' },
        { id: 'garage', label: 'مرآبي', icon: 'Warehouse', onClick: () => handleSidebarNavClick('garage'), isActive: activeView === 'garage' },
        { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap', onClick: () => handleSidebarNavClick('flashProducts'), isActive: activeView === 'flashProducts' },
        { id: 'internationalLicense', label: 'الرخصة الدولية', icon: 'Globe', onClick: () => handleSidebarNavClick('internationalLicense'), isActive: activeView === 'internationalLicense' },
        { id: 'suggestions', label: 'المساعد الذكي', icon: 'Sparkles', onClick: () => handleSidebarNavClick('suggestions'), isActive: activeView === 'suggestions' },
        { id: 'profile', label: 'الإعدادات', icon: 'Settings', onClick: () => handleSidebarNavClick('profile'), isActive: activeView === 'profile' },
        { id: 'notifications', label: 'الإشعارات', icon: 'Bell', onClick: () => handleSidebarNavClick('notifications'), isActive: currentView === 'notificationCenter', badge: unreadCount },
    ], [activeView, currentView, unreadCount]);

    const bottomNavItems = useMemo(() => [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="ShoppingBag" /> },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'notifications', label: 'الإشعارات', icon: <Icon name="Bell" />, notificationCount: unreadCount },
        { id: 'profile', label: 'ملفي', icon: <Icon name="User" /> },
    ], [unreadCount]);

    const sidebarUser: SidebarUser = {
        name: customer?.name || userPhone || 'عميل',
        phone: userPhone,
        roleLabel: 'العميل',
        avatarChar: customer?.name?.charAt(0) || 'C'
    };

    return (
        <div className="w-full max-w-[1920px] mx-auto flex flex-col md:flex-row bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 md:rounded-2xl md:shadow-2xl min-h-[calc(100vh-8rem)] md:my-4 overflow-hidden">

            <Sidebar
                user={sidebarUser}
                items={sidebarItems}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                onLogout={onLogout}
                onBack={onBack}
                title="لوحة التحكم"
            />

            {/* Main Content Area - Mobile Optimized */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<CustomerOverview onStartNewOrder={props.onStartNewOrder} userPhone={props.userPhone} onNavigate={handleViewChange} onGlobalNavigate={props.onNavigate} allBrands={props.allBrands} />} />
                        <Route path="overview" element={<CustomerOverview onStartNewOrder={props.onStartNewOrder} userPhone={props.userPhone} onNavigate={handleViewChange} onGlobalNavigate={props.onNavigate} allBrands={props.allBrands} />} />
                        <Route path="orders" element={<MyOrders {...props} isDashboardView={true} currentUser={customer || undefined} />} />
                        <Route path="store" element={customer ? <StoreView customer={customer} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={storeCategories} /> : <SkeletonLoader />} />
                        <Route path="store/product/:productId" element={customer ? <StoreView customer={customer} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={storeCategories} /> : <SkeletonLoader />} />
                        <Route path="profile" element={<CustomerSettings userPhone={props.userPhone} showToast={props.showToast} onUpdateCustomer={(data, pass) => props.onUpdateCustomer(props.userPhone, data, pass)} settings={props.settings} onLogout={onLogout} />} />
                        <Route path="garage" element={
                            <CustomerGarage
                                userPhone={props.userPhone}
                                showToast={props.showToast}
                                onUpdateCustomer={(data) => props.onUpdateCustomer(props.userPhone, data)}
                                carCategories={[]}
                                onStartNewOrder={props.onStartNewOrder}
                                onDiagnose={handleDiagnose}
                                allBrands={props.allBrands}
                            />
                        } />
                        <Route path="flashProducts" element={customer ? <FlashProductsView customer={customer} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} /> : <SkeletonLoader />} />
                        <Route path="wallet" element={<UserWalletView settings={props.settings} onAddToast={props.showToast} userId={customer?.user_id} />} />
                        <Route path="internationalLicense" element={<UserInternationalLicenseView showToast={props.showToast} />} />
                        <Route path="suggestions" element={<AISuggestionsWrapper />} />
                        <Route path="*" element={<Navigate to="" replace />} />
                    </Routes>
                </div>
            </main>

            {/* Bottom Navigation for Mobile */}
            <BottomNavBar
                items={bottomNavItems}
                activeItem={currentView === 'notificationCenter' ? 'notifications' : activeView}
                onItemClick={handleBottomNavClick}
            />
        </div>
    );
};

export default CustomerDashboard;