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

    // Derive active view from URL
    const activeView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname === '/technician' || location.pathname === '/technician/') return 'overview';
        return (path as TechnicianView) || 'overview';
    }, [location.pathname]);

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

    const handleSetView = (view: TechnicianView) => {
        if (view === 'overview') {
            navigate('/technician');
        } else {
            navigate(`/technician/${view}`);
        }
    };

    const handleSidebarNavClick = (view: TechnicianView | 'notifications') => {
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
            handleSetView(id as TechnicianView);
        }
    };

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSidebarNavClick('overview'), isActive: activeView === 'overview' },
        { id: 'profile', label: 'ملفي الشخصي', icon: 'User', onClick: () => handleSidebarNavClick('profile'), isActive: activeView === 'profile' },
        { id: 'reviews', label: 'التقييمات', icon: 'Star', onClick: () => handleSidebarNavClick('reviews'), isActive: activeView === 'reviews' },
        { id: 'wallet', label: 'المحفظة', icon: 'Wallet', onClick: () => handleSidebarNavClick('wallet'), isActive: activeView === 'wallet' },
        { id: 'store', label: 'المتجر', icon: 'Store', onClick: () => handleSidebarNavClick('store'), isActive: activeView === 'store' },
        { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap', onClick: () => handleSidebarNavClick('flashProducts'), isActive: activeView === 'flashProducts' },
        { id: 'orders', label: 'طلباتي للقطع', icon: 'ClipboardList', onClick: () => handleSidebarNavClick('orders'), isActive: activeView === 'orders' },
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
        name: technician.name,
        phone: userPhone,
        roleLabel: technician.specialty || 'فني',
        avatarChar: technician.name.charAt(0)
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