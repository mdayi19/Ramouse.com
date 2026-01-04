import React, { useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { TowTruck, Settings, Notification, NotificationType, OrderFormData, Order, StoreCategory } from '../types';
import MyOrders from './MyOrders';
import Icon from './Icon';
import BottomNavBar from './BottomNavBar';
import { StoreView } from './Store/StoreView';

// New modular imports
import { TowTruckView } from './TowTruckDashboardParts/types';
import OverviewView from './TowTruckDashboardParts/OverviewView';
import ProfileView from './TowTruckDashboardParts/ProfileView';
import ReviewsView from './TowTruckDashboardParts/ReviewsView';
import SettingsView from './TowTruckDashboardParts/SettingsView';
import { FlashProductsView } from './TowTruckDashboardParts/FlashProductsView';
import UserWalletView from './UserWalletView';

import UserInternationalLicenseView from './DashboardParts/UserInternationalLicenseView';
import Sidebar, { SidebarItemType, SidebarUser } from './DashboardParts/Sidebar';


interface TowTruckDashboardProps {
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    towTruck: TowTruck;
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    updateTowTruckData: (truckId: string, updatedData: Partial<TowTruck>, newPassword?: string) => Promise<void>;
    settings: Settings;
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    isLoading: boolean;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    userPhone: string;
    onNavigate: (view: any, params?: any) => void;
    currentView: string;
    unreadCount: number;
    storeCategories: StoreCategory[];
}

// Main Dashboard Component
const TowTruckDashboard: React.FC<TowTruckDashboardProps> = (props) => {
    const { towTruck, onBack, showToast, updateTowTruckData, settings, onStartNewOrder, addNotificationForUser, isSidebarOpen, setIsSidebarOpen, onLogout, userPhone, onNavigate, currentView, unreadCount, storeCategories } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL
    const activeView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname === '/tow-truck-dashboard' || location.pathname === '/tow-truck-dashboard/') return 'overview';
        return (path as TowTruckView) || 'overview';
    }, [location.pathname]);

    const handleSetView = (view: TowTruckView) => {
        if (view === 'overview') {
            navigate('/tow-truck-dashboard');
        } else {
            navigate(`/tow-truck-dashboard/${view}`);
        }
    };

    const handleSidebarNavClick = (view: TowTruckView | 'notifications') => {
        if (view === 'notifications') {
            onNavigate('notificationCenter');
        } else {
            handleSetView(view);
        }
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'home') {
            props.onBack();
        } else if (id === 'notifications') {
            props.onNavigate('notificationCenter');
        } else if (id === 'add-order') {
            props.onStartNewOrder();
        } else {
            handleSetView(id as TowTruckView);
        }
    };

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSidebarNavClick('overview'), isActive: activeView === 'overview' },
        { id: 'profile', label: 'ملفي الشخصي', icon: 'User', onClick: () => handleSidebarNavClick('profile'), isActive: activeView === 'profile' },
        { id: 'reviews', label: 'التقييمات', icon: 'Star', onClick: () => handleSidebarNavClick('reviews'), isActive: activeView === 'reviews' },
        { id: 'wallet', label: 'المحفظة', icon: 'Wallet', onClick: () => handleSidebarNavClick('wallet'), isActive: activeView === 'wallet' },
        { id: 'store', label: 'المتجر', icon: 'Store', onClick: () => handleSidebarNavClick('store'), isActive: activeView === 'store' },
        { id: 'orders', label: 'طلباتي للقطع', icon: 'ClipboardList', onClick: () => handleSidebarNavClick('orders'), isActive: activeView === 'orders' },
        { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap', onClick: () => handleSidebarNavClick('flashProducts'), isActive: activeView === 'flashProducts' },
        { id: 'internationalLicense', label: 'الرخصة الدولية', icon: 'Globe', onClick: () => handleSidebarNavClick('internationalLicense'), isActive: activeView === 'internationalLicense' },
        { id: 'settings', label: 'الإعدادات', icon: 'Settings', onClick: () => handleSidebarNavClick('settings'), isActive: activeView === 'settings' },
        { id: 'notifications', label: 'الإشعارات', icon: 'Bell', onClick: () => handleSidebarNavClick('notifications'), isActive: currentView === 'notificationCenter', badge: unreadCount },
    ], [activeView, currentView, unreadCount]);

    const bottomNavItems = [
        { id: 'home', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'add-order', label: 'طلب جديد', icon: <Icon name="Plus" className="w-6 h-6" />, isSpecial: true },
        { id: 'store', label: 'المتجر', icon: <Icon name="Store" /> },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'profile', label: 'ملفي', icon: <Icon name="User" /> },
    ];

    const sidebarUser: SidebarUser = {
        name: towTruck.name,
        phone: userPhone,
        roleLabel: 'سيارة ونش',
        avatarChar: towTruck.name.charAt(0)
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

            {/* Main Content - Mobile Optimized */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<OverviewView towTruck={towTruck} onNavigate={handleSetView} onStartNewOrder={onStartNewOrder} />} />
                        <Route path="overview" element={<OverviewView towTruck={towTruck} onNavigate={handleSetView} onStartNewOrder={onStartNewOrder} />} />
                        <Route path="profile" element={<ProfileView towTruck={towTruck} updateTowTruckData={updateTowTruckData} showToast={showToast} settings={settings} onLogout={onLogout} />} />
                        <Route path="reviews" element={<ReviewsView towTruck={towTruck} showToast={showToast} />} />
                        <Route path="store" element={<StoreView towTruck={towTruck} showToast={showToast} addNotificationForUser={props.addNotificationForUser} settings={settings} storeCategories={storeCategories} />} />
                        <Route path="store/product/:productId" element={<StoreView towTruck={towTruck} showToast={showToast} addNotificationForUser={props.addNotificationForUser} settings={settings} storeCategories={storeCategories} />} />
                        <Route path="orders" element={<MyOrders {...props} isDashboardView={true} onUpdateCustomer={async (id, data) => { /* Tow truck operators don't have customer profile to update */ }} currentUser={towTruck} />} />
                        <Route path="wallet" element={<UserWalletView settings={settings} onAddToast={showToast} userId={towTruck.user_id} />} />
                        <Route path="settings" element={<SettingsView towTruck={towTruck} updateTowTruckData={updateTowTruckData} showToast={showToast} settings={settings} onLogout={onLogout} />} />
                        <Route path="flashProducts" element={<FlashProductsView towTruck={towTruck} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} />} />
                        <Route path="internationalLicense" element={<UserInternationalLicenseView showToast={showToast} />} />
                        <Route path="*" element={<Navigate to="" replace />} />
                    </Routes>
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNavBar
                items={bottomNavItems}
                activeItem={currentView === 'notificationCenter' ? 'notifications' : activeView}
                onItemClick={handleBottomNavClick}
            />
        </div>
    );
};

export default TowTruckDashboard;