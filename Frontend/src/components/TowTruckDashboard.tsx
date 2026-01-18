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
import { MyCarListingsView } from './CarMarketplace/SharedCarListings/MyCarListingsView';

import UserInternationalLicenseView from './DashboardParts/UserInternationalLicenseView';
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
    onShowServices: () => void;
}

// Main Dashboard Component
const TowTruckDashboard: React.FC<TowTruckDashboardProps> = (props) => {
    const { towTruck, onBack, showToast, updateTowTruckData, settings, onStartNewOrder, addNotificationForUser, isSidebarOpen, setIsSidebarOpen, onLogout, userPhone, onNavigate, currentView, unreadCount, storeCategories, onShowServices } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL using shared utility
    const activeView = useMemo(() =>
        getDashboardActiveView(location.pathname, '/tow-truck-dashboard') as TowTruckView,
        [location.pathname]
    );

    // Create navigation handlers using shared utility
    const navigationHandlers = useMemo(() =>
        createNavigationHandlers(navigate, onNavigate, '/tow-truck-dashboard', setIsSidebarOpen),
        [navigate, onNavigate, setIsSidebarOpen]
    );

    const handleSetView = (view: TowTruckView) => {
        navigationHandlers.handleViewChange(view);
    };

    const handleSidebarNavClick = (view: TowTruckView | 'notifications') => {
        navigationHandlers.handleSidebarNavClick(view);
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'services-popup') {
            onShowServices();
            return;
        }
        navigationHandlers.handleBottomNavClick(id, props.onStartNewOrder);
    };

    // Build sidebar items using shared utilities for consistency
    const sidebarItems: SidebarItemType[] = useMemo(() => [
        buildSidebarItem(COMMON_MENU_ITEMS.overview, activeView, () => handleSidebarNavClick('overview')),
        buildSidebarItem(COMMON_MENU_ITEMS.profile, activeView, () => handleSidebarNavClick('profile')),
        buildSidebarItem(COMMON_MENU_ITEMS.reviews, activeView, () => handleSidebarNavClick('reviews')),
        buildCustomSidebarItem('myCarListings', 'إدارة سياراتي للبيع', 'Car', activeView, () => handleSidebarNavClick('myCarListings')),
        buildSidebarItem(COMMON_MENU_ITEMS.wallet, activeView, () => handleSidebarNavClick('wallet')),
        buildExternalNavItem(COMMON_MENU_ITEMS.carListings, onNavigate),
        buildExternalNavItem(COMMON_MENU_ITEMS.rentCar, onNavigate),
        buildSidebarItem(COMMON_MENU_ITEMS.store, activeView, () => handleSidebarNavClick('store')),
        buildCustomSidebarItem('orders', 'طلباتي للقطع', 'ClipboardList', activeView, () => handleSidebarNavClick('orders')),
        buildSidebarItem(COMMON_MENU_ITEMS.flashProducts, activeView, () => handleSidebarNavClick('flashProducts')),
        buildSidebarItem(COMMON_MENU_ITEMS.internationalLicense, activeView, () => handleSidebarNavClick('internationalLicense')),
        buildSidebarItem(COMMON_MENU_ITEMS.settings, activeView, () => handleSidebarNavClick('settings')),
        buildSidebarItem(COMMON_MENU_ITEMS.notifications, activeView, () => handleSidebarNavClick('notifications'), unreadCount),
    ], [activeView, currentView, unreadCount, handleSidebarNavClick, onNavigate]);

    const bottomNavItems = [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="Store" /> },
        { id: 'services-popup', label: 'الخدمات', icon: <img src={settings.logoUrl || '/logo.png'} alt="الخدمات" className="w-full h-full object-contain p-1" />, isSpecial: true },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'profile', label: 'ملفي', icon: <Icon name="User" /> },
    ];

    // Create sidebar user object using shared utility
    const sidebarUser = useMemo(() =>
        createSidebarUser(towTruck.name, userPhone, 'سيارة ونش', towTruck.name.charAt(0)),
        [towTruck, userPhone]
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

            {/* Main Content - Mobile Optimized */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<OverviewView towTruck={towTruck} onNavigate={handleSetView} onStartNewOrder={onStartNewOrder} />} />
                        <Route path="overview" element={<OverviewView towTruck={towTruck} onNavigate={handleSetView} onStartNewOrder={onStartNewOrder} />} />
                        <Route path="profile" element={<ProfileView towTruck={towTruck} updateTowTruckData={updateTowTruckData} showToast={showToast} settings={settings} onLogout={onLogout} />} />
                        <Route path="myCarListings" element={<MyCarListingsView showToast={showToast} userRole="tow_truck" userPhone={towTruck?.phone || ''} />} />
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