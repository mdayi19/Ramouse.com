import React, { useState, useMemo } from 'react';
// Force refresh
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CarProvider, Settings, Order, StoreCategory, Notification, NotificationType, Brand, Customer, CarProviderDashboardProps } from '../../../types';
import Sidebar, { SidebarItemType, SidebarUser } from '../../DashboardParts/Sidebar';
import BottomNavBar from '../../BottomNavBar';
import Icon from '../../Icon';
import {
    getDashboardActiveView,
    createNavigationHandlers,
    createSidebarUser,
    COMMON_MENU_ITEMS,
    buildSidebarItem,
    buildExternalNavItem,
    buildCustomSidebarItem
} from '../../DashboardParts/Shared';

// Provider Views
import { OverviewView } from './OverviewView';
import { ListingsView } from './ListingsView';
import { SettingsView } from './SettingsView';
import { AnalyticsView } from './AnalyticsView';
import SponsorManagementView from './SponsorManagementView';

// Customer/Shared Views
import MyOrders from '../../MyOrders';
import UserWalletView from '../../UserWalletView';
import { StoreView } from '../../Store/StoreView';
import { FlashProductsView } from '../../CustomerDashboardParts/FlashProductsView';
import { UserAuctionsView } from '../../CustomerDashboardParts/UserAuctionsView';
import UserInternationalLicenseView from '../../DashboardParts/UserInternationalLicenseView';
import AISuggestions from '../../AISuggestions';
import CustomerGarage from '../../CustomerGarage';

// CarProviderDashboardProps imported from types.ts

export const CarProviderDashboard: React.FC<CarProviderDashboardProps> = (props) => {
    const {
        carProvider,
        userPhone,
        isSidebarOpen,
        setIsSidebarOpen,
        onLogout,
        onBack,
        currentView,
        unreadCount,
        onNavigate,
        isLoading,
        orders,
        updateAllOrders,
        onUpdateCarProvider
    } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL using shared utility
    const activeView = useMemo(() =>
        getDashboardActiveView(location.pathname, '/car-provider-dashboard'),
        [location.pathname]
    );

    // Create navigation handlers using shared utility
    const navigationHandlers = useMemo(() =>
        createNavigationHandlers(navigate, onNavigate, '/car-provider-dashboard', setIsSidebarOpen),
        [navigate, onNavigate, setIsSidebarOpen]
    );

    const handleViewChange = (view: string) => {
        navigationHandlers.handleViewChange(view);
    };

    const handleSidebarNavClick = (view: string) => {
        navigationHandlers.handleSidebarNavClick(view);
    };

    const handleBottomNavClick = (id: string) => {
        navigationHandlers.handleBottomNavClick(id, props.onStartNewOrder);
    };

    // Build sidebar items using shared utilities for consistency
    const sidebarItems: SidebarItemType[] = useMemo(() => [
        // Provider Specific
        buildSidebarItem(COMMON_MENU_ITEMS.overview, activeView, () => handleSidebarNavClick('overview')),
        buildCustomSidebarItem('listings', 'إدارة السيارات', 'Car', activeView, () => handleSidebarNavClick('listings')),
        buildCustomSidebarItem('sponsorManagement', 'الإعلانات الممولة', 'Star', activeView, () => handleSidebarNavClick('sponsorManagement')),
        buildCustomSidebarItem('analytics', 'التحليلات', 'TrendingUp', activeView, () => handleSidebarNavClick('analytics')),

        // Customer Features
        buildCustomSidebarItem('orders', 'طلباتي (قطع غيار)', 'ClipboardList', activeView, () => handleSidebarNavClick('orders')),
        buildExternalNavItem(COMMON_MENU_ITEMS.carListings, onNavigate),
        buildExternalNavItem(COMMON_MENU_ITEMS.rentCar, onNavigate),
        buildSidebarItem(COMMON_MENU_ITEMS.store, activeView, () => handleSidebarNavClick('store')),
        buildSidebarItem(COMMON_MENU_ITEMS.wallet, activeView, () => handleSidebarNavClick('wallet')),
        buildSidebarItem(COMMON_MENU_ITEMS.auctions, activeView, () => handleSidebarNavClick('auctions')),
        buildSidebarItem(COMMON_MENU_ITEMS.garage, activeView, () => handleSidebarNavClick('garage')),
        buildSidebarItem(COMMON_MENU_ITEMS.flashProducts, activeView, () => handleSidebarNavClick('flashProducts')),
        buildSidebarItem(COMMON_MENU_ITEMS.internationalLicense, activeView, () => handleSidebarNavClick('internationalLicense')),
        buildSidebarItem(COMMON_MENU_ITEMS.suggestions, activeView, () => handleSidebarNavClick('suggestions')),

        // Settings
        buildSidebarItem(COMMON_MENU_ITEMS.settings, activeView, () => handleSidebarNavClick('settings')),
        buildSidebarItem(COMMON_MENU_ITEMS.notifications, activeView, () => handleSidebarNavClick('notifications'), unreadCount),
    ], [activeView, currentView, unreadCount, handleSidebarNavClick, onNavigate]);

    const bottomNavItems = useMemo(() => [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'listings', label: 'سياراتي', icon: <Icon name="Car" /> },
        { id: 'new-order', label: 'قطعة جديدة', icon: <Icon name="Plus" className="w-7 h-7" />, isSpecial: true },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="ShoppingBag" /> },
    ], []);

    // Create sidebar user object using shared utility
    const sidebarUser = useMemo(() =>
        createSidebarUser(
            carProvider?.name || 'معرض السيارات',
            userPhone,
            'معرض سيارات',
            carProvider?.name?.charAt(0) || 'P'
        ),
        [carProvider, userPhone]
    );

    if (!carProvider) return <div>جاري التحميل...</div>;

    // Mock Customer object for shared components that expect "Customer" type
    // We cast carProvider properties or use minimal compatible object
    const mockCustomerForStore: Customer = {
        id: carProvider.id,
        user_id: carProvider.user_id,
        name: carProvider.name,
        phone: userPhone, // Auth user phone for store purchases
        city: carProvider.city,
        // Add other required fields if missing in CarProvider
    } as any;

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

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<OverviewView provider={carProvider} showToast={props.showToast} />} />
                        <Route path="overview" element={<OverviewView provider={carProvider} showToast={props.showToast} />} />
                        <Route path="listings" element={<ListingsView showToast={props.showToast} userPhone={userPhone} provider={carProvider} settings={props.settings} />} />
                        <Route path="sponsorManagement" element={<SponsorManagementView showToast={props.showToast} provider={carProvider} />} />
                        <Route path="analytics" element={<AnalyticsView showToast={props.showToast} />} />
                        <Route path="settings" element={<SettingsView
                            provider={carProvider}
                            showToast={props.showToast}
                            settings={props.settings}
                            onUpdateProvider={(data) => {
                                if (onUpdateCarProvider) onUpdateCarProvider(data);
                            }}
                        />} />

                        {/* Customer Featuers Routes */}
                        <Route path="orders" element={<MyOrders
                            {...props}
                            allOrders={props.orders}
                            isDashboardView={true}
                            currentUser={carProvider as any}
                            isLoading={isLoading}
                            onUpdateCustomer={async (customerId, updatedData) => {
                                if (props.onUpdateCustomer) {
                                    await props.onUpdateCustomer(customerId, updatedData);
                                }
                            }}
                        />} />
                        <Route path="store" element={<StoreView customer={mockCustomerForStore} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={props.storeCategories} />} />
                        <Route path="store/product/:productId" element={<StoreView customer={mockCustomerForStore} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={props.storeCategories} />} />
                        <Route path="wallet" element={<UserWalletView settings={props.settings} onAddToast={props.showToast} userId={carProvider.user_id} />} />
                        <Route path="auctions" element={<UserAuctionsView userPhone={userPhone} showToast={props.showToast} />} />
                        <Route path="flashProducts" element={<FlashProductsView customer={mockCustomerForStore} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} />} />
                        <Route path="internationalLicense" element={<UserInternationalLicenseView showToast={props.showToast} />} />
                        <Route path="suggestions" element={<AISuggestions />} />
                        <Route path="garage" element={
                            <CustomerGarage
                                userPhone={userPhone}
                                showToast={props.showToast}
                                onUpdateCustomer={async (data) => {
                                    if (props.onUpdateCustomer) {
                                        await props.onUpdateCustomer(userPhone, data);
                                    }
                                }}
                                carCategories={[]}
                                onStartNewOrder={props.onStartNewOrder}
                                onDiagnose={() => { }}
                                allBrands={props.allBrands}
                            />
                        } />

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
// Force refresh types

