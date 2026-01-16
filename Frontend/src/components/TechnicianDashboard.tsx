import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Technician, OrderFormData, Notification, NotificationType, Settings, Order, FlashProductBuyerRequest, TechnicianSpecialty, StoreCategory } from '../types';
import MyOrders from './MyOrders';
import Icon from './Icon';
import BottomNavBar from './BottomNavBar';
import { StoreView } from './Store/StoreView';

// New, modular imports
import { TechnicianView } from './TechnicianDashboardParts/types';
import OverviewView from './TechnicianDashboardParts/OverviewView';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import ProfileView from './TechnicianDashboardParts/ProfileView';
import ReviewsView from './TechnicianDashboardParts/ReviewsView';
import { FlashProductsView } from './TechnicianDashboardParts/FlashProductsView';
import SettingsView from './TechnicianDashboardParts/SettingsView';
import UserWalletView from './UserWalletView';
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

interface TechnicianDashboardProps {
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    technician: Technician;
    onBack: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    updateTechnicianData: (technicianId: string, updatedData: Partial<Technician>, newPassword?: string) => Promise<void>;
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    userPhone: string;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
    isLoading: boolean;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
    technicianSpecialties: TechnicianSpecialty[];
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    onNavigate: (view: any, params?: any) => void;
    currentView: string;
    unreadCount: number;
    storeCategories: StoreCategory[];
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = (props) => {
    const { technician, onBack, userPhone, isSidebarOpen, setIsSidebarOpen, onLogout, onNavigate, currentView, unreadCount, storeCategories } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL using shared utility
    const activeView = useMemo(() =>
        getDashboardActiveView(location.pathname, '/technician') as TechnicianView,
        [location.pathname]
    );

    const [technicianOrders, setTechnicianOrders] = useState<Order[]>([]);
    const [myRequests, setMyRequests] = useState<FlashProductBuyerRequest[]>([]);

    useEffect(() => {
        const allOrdersRaw = localStorage.getItem('all_orders');
        if (allOrdersRaw) {
            const allOrders: Order[] = JSON.parse(allOrdersRaw);
            const userOrders = allOrders
                .filter(o => o.userPhone === userPhone)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTechnicianOrders(userOrders);
        }

        const requestsRaw = localStorage.getItem('flash_product_buyer_requests');
        if (requestsRaw) {
            const allRequests: FlashProductBuyerRequest[] = JSON.parse(requestsRaw);
            setMyRequests(allRequests.filter(r => r.buyerId === userPhone && r.buyerType === 'technician'));
        }
    }, [userPhone]);

    // Create navigation handlers using shared utility
    const navigationHandlers = useMemo(() =>
        createNavigationHandlers(navigate, onNavigate, '/technician', setIsSidebarOpen),
        [navigate, onNavigate, setIsSidebarOpen]
    );

    const handleSetView = (view: TechnicianView) => {
        navigationHandlers.handleViewChange(view);
    };

    const handleSidebarNavClick = (view: TechnicianView | 'notifications') => {
        navigationHandlers.handleSidebarNavClick(view);
    };

    const handleBottomNavClick = (id: string) => {
        navigationHandlers.handleBottomNavClick(id, props.onStartNewOrder);
    };

    // Build sidebar items using shared utilities for consistency
    const sidebarItems: SidebarItemType[] = useMemo(() => [
        buildSidebarItem(COMMON_MENU_ITEMS.overview, activeView, () => handleSidebarNavClick('overview')),
        buildSidebarItem(COMMON_MENU_ITEMS.profile, activeView, () => handleSidebarNavClick('profile')),
        buildSidebarItem(COMMON_MENU_ITEMS.reviews, activeView, () => handleSidebarNavClick('reviews')),
        buildSidebarItem(COMMON_MENU_ITEMS.wallet, activeView, () => handleSidebarNavClick('wallet')),
        buildExternalNavItem(COMMON_MENU_ITEMS.carListings, onNavigate),
        buildExternalNavItem(COMMON_MENU_ITEMS.rentCar, onNavigate),
        buildSidebarItem(COMMON_MENU_ITEMS.store, activeView, () => handleSidebarNavClick('store')),
        buildSidebarItem(COMMON_MENU_ITEMS.flashProducts, activeView, () => handleSidebarNavClick('flashProducts')),
        buildCustomSidebarItem('orders', 'طلباتي للقطع', 'ClipboardList', activeView, () => handleSidebarNavClick('orders')),
        buildSidebarItem(COMMON_MENU_ITEMS.internationalLicense, activeView, () => handleSidebarNavClick('internationalLicense')),
        buildSidebarItem(COMMON_MENU_ITEMS.settings, activeView, () => handleSidebarNavClick('settings')),
        buildSidebarItem(COMMON_MENU_ITEMS.notifications, activeView, () => handleSidebarNavClick('notifications'), unreadCount),
    ], [activeView, currentView, unreadCount, handleSidebarNavClick, onNavigate]);

    const bottomNavItems = [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="Store" /> },
        { id: 'add-order', label: 'طلب جديد', icon: <Icon name="Plus" className="w-7 h-7" />, isSpecial: true },
        { id: 'orders', label: 'طلباتي', icon: <Icon name="ClipboardList" /> },
        { id: 'profile', label: 'ملفي', icon: <Icon name="User" /> },
    ];

    // Create sidebar user object using shared utility
    const sidebarUser = useMemo(() =>
        createSidebarUser(technician.name, userPhone, technician.specialty || 'فني', technician.name.charAt(0)),
        [technician, userPhone]
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
                        <Route index element={<OverviewView technician={props.technician} onStartNewOrder={props.onStartNewOrder} onNavigate={handleSetView} onGlobalNavigate={props.onNavigate} orders={technicianOrders} myRequests={myRequests} />} />
                        <Route path="overview" element={<OverviewView technician={props.technician} onStartNewOrder={props.onStartNewOrder} onNavigate={handleSetView} onGlobalNavigate={props.onNavigate} orders={technicianOrders} myRequests={myRequests} />} />
                        <Route path="profile" element={<ProfileView {...props} onLogout={onLogout} />} />
                        <Route path="reviews" element={<ReviewsView technician={props.technician} showToast={props.showToast} />} />
                        <Route path="store" element={<StoreView technician={technician} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={storeCategories} />} />
                        <Route path="store/product/:productId" element={<StoreView technician={technician} showToast={props.showToast} addNotificationForUser={props.addNotificationForUser} settings={props.settings} storeCategories={storeCategories} />} />
                        <Route path="flashProducts" element={<FlashProductsView {...props} />} />
                        <Route path="orders" element={<MyOrders {...props} onUpdateCustomer={async (id, data) => { /* Technicians don't update customer data directly */ }} isDashboardView={true} currentUser={technician} />} />
                        <Route path="wallet" element={<UserWalletView settings={props.settings} onAddToast={props.showToast} userId={technician.user_id} />} />
                        <Route path="internationalLicense" element={<UserInternationalLicenseView showToast={props.showToast} />} />
                        <Route path="settings" element={<SettingsView technician={props.technician} showToast={props.showToast} onUpdateTechnician={(data, pass) => props.updateTechnicianData(technician.id, data, pass)} settings={props.settings} onLogout={onLogout} />} />
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

export default TechnicianDashboard;