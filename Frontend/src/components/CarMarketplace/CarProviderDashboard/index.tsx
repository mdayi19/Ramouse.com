import React, { useState, useMemo } from 'react';
// Force refresh
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { CarProvider, Settings, Order, StoreCategory, Notification, NotificationType, Brand, Customer, CarProviderDashboardProps } from '../../../types';
import Sidebar, { SidebarItemType, SidebarUser } from '../../DashboardParts/Sidebar';
import BottomNavBar from '../../BottomNavBar';
import Icon from '../../Icon';

// Provider Views
import { OverviewView } from './OverviewView';
import { ListingsView } from './ListingsView';
import { SettingsView } from './SettingsView';
import { AnalyticsView } from '../AnalyticsView';

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

    // Derive active view from URL
    const activeView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname.includes('/car-provider-dashboard') && (path === 'car-provider-dashboard' || path === '')) return 'overview';
        return path || 'overview';
    }, [location.pathname]);

    const handleViewChange = (view: string) => {
        if (view === 'overview') {
            navigate('/car-provider-dashboard');
        } else {
            navigate(`/car-provider-dashboard/${view}`);
        }
    };

    const handleSidebarNavClick = (view: string) => {
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
            onNavigate('notificationCenter');
        } else if (id === 'new-order') {
            // Trigger new order form
            if (props.onStartNewOrder) {
                props.onStartNewOrder();
            }
        } else {
            handleViewChange(id);
        }
    };

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        // Provider Specific
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSidebarNavClick('overview'), isActive: activeView === 'overview' },
        { id: 'listings', label: 'إدارة السيارات', icon: 'Car', onClick: () => handleSidebarNavClick('listings'), isActive: activeView === 'listings' },
        { id: 'analytics', label: 'التحليلات', icon: 'TrendingUp', onClick: () => handleSidebarNavClick('analytics'), isActive: activeView === 'analytics' },

        // Customer Features
        { id: 'orders', label: 'طلباتي (قطع غيار)', icon: 'ClipboardList', onClick: () => handleSidebarNavClick('orders'), isActive: activeView === 'orders' },
        { id: 'car-listings', label: 'سوق السيارات', icon: 'Car', onClick: () => onNavigate('car-listings'), isActive: false },
        { id: 'rent-car', label: 'استئجار سيارة', icon: 'MapPin', onClick: () => onNavigate('rent-car'), isActive: false },
        { id: 'store', label: 'المتجر', icon: 'ShoppingBag', onClick: () => handleSidebarNavClick('store'), isActive: activeView === 'store' },
        { id: 'wallet', label: 'المحفظة', icon: 'Wallet', onClick: () => handleSidebarNavClick('wallet'), isActive: activeView === 'wallet' },
        { id: 'auctions', label: 'المزادات', icon: 'Gavel', onClick: () => handleSidebarNavClick('auctions'), isActive: activeView === 'auctions' },
        { id: 'garage', label: 'مرآبي', icon: 'Warehouse', onClick: () => handleSidebarNavClick('garage'), isActive: activeView === 'garage' },
        { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap', onClick: () => handleSidebarNavClick('flashProducts'), isActive: activeView === 'flashProducts' },
        { id: 'internationalLicense', label: 'الرخصة الدولية', icon: 'Globe', onClick: () => handleSidebarNavClick('internationalLicense'), isActive: activeView === 'internationalLicense' },
        { id: 'suggestions', label: 'المساعد الذكي', icon: 'Sparkles', onClick: () => handleSidebarNavClick('suggestions'), isActive: activeView === 'suggestions' },

        // Settings
        { id: 'settings', label: 'الإعدادات', icon: 'Settings', onClick: () => handleSidebarNavClick('settings'), isActive: activeView === 'settings' },
        { id: 'notifications', label: 'الإشعارات', icon: 'Bell', onClick: () => handleSidebarNavClick('notifications'), isActive: currentView === 'notificationCenter', badge: unreadCount },
    ], [activeView, currentView, unreadCount]);

    const bottomNavItems = useMemo(() => [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'listings', label: 'سياراتي', icon: <Icon name="Car" /> },
        { id: 'new-order', label: 'قطعة جديدة', icon: <Icon name="Plus" className="w-7 h-7" />, isSpecial: true },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="ShoppingBag" /> },
    ], []);

    const sidebarUser: SidebarUser = {
        name: carProvider?.name || 'معرض السيارات',
        phone: userPhone,
        roleLabel: 'معرض سيارات',
        avatarChar: carProvider?.name?.charAt(0) || 'P'
    };

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
                        <Route path="listings" element={<ListingsView showToast={props.showToast} userPhone={userPhone} />} />
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

