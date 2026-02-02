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
import {
    getDashboardActiveView,
    createNavigationHandlers,
    createSidebarUser,
    COMMON_MENU_ITEMS,
    buildSidebarItem,
    buildExternalNavItem,
    buildCustomSidebarItem
} from './DashboardParts/Shared';

// New modular imports
import CustomerOverview from './CustomerDashboardParts/OverviewView';
import { FlashProductsView } from './CustomerDashboardParts/FlashProductsView';
import { StoreView } from './Store/StoreView';
import { CustomerView } from './CustomerDashboardParts/types';
import UserWalletView from './UserWalletView';
import UserInternationalLicenseView from './DashboardParts/UserInternationalLicenseView';
import { UserAuctionsView } from './CustomerDashboardParts/UserAuctionsView';
import { MyCarListingsView } from './CarMarketplace/SharedCarListings/MyCarListingsView';


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
    onShowServices?: () => void;
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

    // Derive active view from URL using shared utility
    const activeView = useMemo(() =>
        getDashboardActiveView(location.pathname, '/dashboard') as CustomerView,
        [location.pathname]
    );

    useEffect(() => {
        if (props.navigationParams?.orderNumber) {
            navigate('/dashboard/orders');
        }
    }, [props.navigationParams, navigate]);

    // Create navigation handlers using shared utility
    const navigationHandlers = useMemo(() =>
        createNavigationHandlers(navigate, onNavigate, '/dashboard', setIsSidebarOpen),
        [navigate, onNavigate, setIsSidebarOpen]
    );

    const handleViewChange = (view: CustomerView, params?: any) => {
        if (props.onNavigationConsumed) props.onNavigationConsumed();
        navigationHandlers.handleViewChange(view, params);
    };

    const handleDiagnose = (vehicle: Vehicle) => {
        navigate('/dashboard/suggestions', { state: { vehicle } });
    };

    const handleSidebarNavClick = (view: CustomerView | 'notifications') => {
        navigationHandlers.handleSidebarNavClick(view);
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'services-popup' && props.onShowServices) {
            props.onShowServices();
            return;
        }
        navigationHandlers.handleBottomNavClick(id, props.onStartNewOrder);
    };

    // Build sidebar items using shared utilities for consistency
    const sidebarItems: SidebarItemType[] = useMemo(() => [
        buildSidebarItem(COMMON_MENU_ITEMS.overview, activeView, () => handleSidebarNavClick('overview')),
        buildSidebarItem(COMMON_MENU_ITEMS.orders, activeView, () => handleSidebarNavClick('orders')),
        buildCustomSidebarItem('myCarListings', 'إدارة سياراتي للبيع', 'Car', activeView, () => handleSidebarNavClick('myCarListings')),
        buildExternalNavItem(COMMON_MENU_ITEMS.carListings, onNavigate),
        buildExternalNavItem(COMMON_MENU_ITEMS.rentCar, onNavigate),
        buildSidebarItem(COMMON_MENU_ITEMS.store, activeView, () => handleSidebarNavClick('store')),
        buildSidebarItem(COMMON_MENU_ITEMS.wallet, activeView, () => handleSidebarNavClick('wallet')),
        buildSidebarItem(COMMON_MENU_ITEMS.auctions, activeView, () => handleSidebarNavClick('auctions')),
        buildSidebarItem(COMMON_MENU_ITEMS.garage, activeView, () => handleSidebarNavClick('garage')),
        buildSidebarItem(COMMON_MENU_ITEMS.flashProducts, activeView, () => handleSidebarNavClick('flashProducts')),
        buildSidebarItem(COMMON_MENU_ITEMS.internationalLicense, activeView, () => handleSidebarNavClick('internationalLicense')),
        buildSidebarItem(COMMON_MENU_ITEMS.suggestions, activeView, () => handleSidebarNavClick('suggestions')),
        buildSidebarItem(COMMON_MENU_ITEMS.settings, activeView, () => handleSidebarNavClick('profile')), // 'profile' is settings for customer
        buildSidebarItem(COMMON_MENU_ITEMS.notifications, activeView, () => handleSidebarNavClick('notifications'), unreadCount),
    ], [activeView, currentView, unreadCount, handleSidebarNavClick, onNavigate]);

    const bottomNavItems = useMemo(() => [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="ShoppingBag" /> },
        { id: 'services-popup', label: 'الخدمات', icon: <img src={props.settings.logoUrl || '/logo.png'} alt="الخدمات" className="w-full h-full object-contain p-1" />, isSpecial: true },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'profile', label: 'ملفي', icon: <Icon name="User" /> },
    ], []);

    // Create sidebar user object using shared utility
    const sidebarUser = useMemo(() =>
        createSidebarUser(
            customer?.name || userPhone || 'عميل',
            userPhone,
            'العميل',
            customer?.name?.charAt(0) || 'C'
        ),
        [customer, userPhone]
    );

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
                        <Route index element={<CustomerOverview onStartNewOrder={props.onStartNewOrder} userPhone={props.userPhone} onNavigate={handleViewChange} onGlobalNavigate={props.onNavigate} allBrands={props.allBrands} allOrders={props.allOrders} />} />
                        <Route path="overview" element={<CustomerOverview onStartNewOrder={props.onStartNewOrder} userPhone={props.userPhone} onNavigate={handleViewChange} onGlobalNavigate={props.onNavigate} allBrands={props.allBrands} allOrders={props.allOrders} />} />
                        <Route path="orders" element={<MyOrders {...props} isDashboardView={true} currentUser={customer || undefined} />} />
                        <Route path="myCarListings" element={<MyCarListingsView showToast={props.showToast} userRole="customer" userPhone={props.userPhone} currentUser={customer} settings={props.settings} />} />
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
                        <Route path="auctions" element={<UserAuctionsView userPhone={props.userPhone} showToast={props.showToast} />} />
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