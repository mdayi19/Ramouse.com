import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Order, Quote, PartStatus, Notification, Provider, OrderStatus, WithdrawalRequest, Transaction, Settings, NotificationType, PartSizeCategory, AdminFlashProduct, FlashProductBuyerRequest, Technician, Customer, FlashProductPurchase, StoreCategory } from '../types';
import Icon from './Icon';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ProviderView } from './ProviderDashboardParts/types';
import ProviderOverviewView from './ProviderDashboardParts/ProviderOverviewView';
import OpenOrdersView from './ProviderDashboardParts/OpenOrdersView';
import MyBidsView from './ProviderDashboardParts/MyBidsView';
import AcceptedOrdersView from './ProviderDashboardParts/AcceptedOrdersView';
import WalletView from './ProviderDashboardParts/WalletView';
import ProviderSettingsView from './ProviderDashboardParts/ProviderSettingsView';
import { FlashProductsView } from './ProviderDashboardParts/FlashProductsView';
import BottomNavBar from './BottomNavBar';
import { StoreView } from './Store/StoreView';
import { db } from '../lib/db';
import { providerAPI, ordersAPI } from '../lib/api';
import UserInternationalLicenseView from './DashboardParts/UserInternationalLicenseView';
import { useRealtime } from '../hooks/useRealtime';
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

interface ProviderDashboardProps {
    provider: Provider;
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    onBack: () => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
    isLoading: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onLogout: () => void;
    onNavigate: (view: any, params?: any) => void;
    currentView: string;
    unreadCount: number;
    userPhone: string;
    storeCategories: StoreCategory[];
    onShowServices: () => void;
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = (props) => {
    const { provider, allOrders, updateAllOrders, onBack, showToast, settings, addNotificationForUser, navigationParams, onNavigationConsumed, isSidebarOpen, setIsSidebarOpen, onLogout, onNavigate, currentView, unreadCount, userPhone, storeCategories, onShowServices } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL using shared utility
    const activeView = useMemo(() =>
        getDashboardActiveView(location.pathname, '/provider') as ProviderView,
        [location.pathname]
    );

    const [allProviders, setAllProviders] = useState<Provider[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [localProvider, setLocalProvider] = useState<Provider>(provider);
    const [openOrders, setOpenOrders] = useState<Order[]>([]);
    const [isLoadingOpenOrders, setIsLoadingOpenOrders] = useState(false);

    const [overviewData, setOverviewData] = useState<any>(null);
    const [isLoadingOverview, setIsLoadingOverview] = useState(false);

    useEffect(() => {
        console.log('🎯 Raw provider object:', provider);

        const mappedProvider = {
            ...provider,
            assignedCategories: provider.assignedCategories || (provider as any).assigned_categories || []
        };

        setLocalProvider(mappedProvider);
    }, [provider]);

    useEffect(() => {
        if (navigationParams?.orderNumber && onNavigationConsumed) {

            if (activeView === 'accepted') {
                navigate('/provider/accepted', { state: { orderNumber: navigationParams.orderNumber }, replace: true });
            } else if (activeView === 'myBids') {
                navigate('/provider/myBids', { state: { orderNumber: navigationParams.orderNumber }, replace: true });
            } else if (activeView === 'openOrders') {
                navigate('/provider/openOrders', { state: { orderNumber: navigationParams.orderNumber }, replace: true });
            } else {
                // Fallback logic if view not set
            }

            onNavigationConsumed();
        }
    }, [navigationParams, onNavigationConsumed, activeView, navigate]);


    const fetchOpenOrders = async (background: boolean = false, forceRefresh: boolean = false) => {
        try {
            if (!background) setIsLoadingOpenOrders(true);
            const response = await providerAPI.getOpenOrders(forceRefresh);
            setOpenOrders(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch open orders", error);
            if (!background) showToast('فشل تحميل الطلبات المتاحة', 'error');
        } finally {
            if (!background) setIsLoadingOpenOrders(false);
        }
    };

    const fetchOverviewData = async (forceRefresh: boolean = false) => {
        try {
            setIsLoadingOverview(true);
            const response = await providerAPI.getOverviewData(forceRefresh);
            setOverviewData(response.data);
            if (response.data.stats?.walletBalance !== undefined) {
                setLocalProvider(prev => ({ ...prev, walletBalance: response.data.stats.walletBalance }));
            }
        } catch (error) {
            console.error("Failed to fetch overview data", error);
            showToast('فشل تحميل بيانات لوحة التحكم', 'error');
        } finally {
            setIsLoadingOverview(false);
        }
    };

    const fetchWalletData = async (forceRefresh: boolean = false) => {
        try {
            const [txRes, wdrRes, balRes] = await Promise.all([
                providerAPI.getTransactions(forceRefresh),
                providerAPI.getWithdrawals(forceRefresh),
                providerAPI.getWalletBalance(forceRefresh)
            ]);
            const transactionsData = txRes.data.data || txRes.data;
            const withdrawalsData = wdrRes.data.data || wdrRes.data;

            setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
            setWithdrawalRequests(Array.isArray(withdrawalsData) ? withdrawalsData : []);
            setLocalProvider(prev => ({ ...prev, walletBalance: balRes.data.balance }));
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
            showToast('فشل تحميل بيانات المحفظة', 'error');
        }
    };

    const fetchData = () => {
        setAllProviders(JSON.parse(localStorage.getItem('all_providers') || '[]'));
        if (activeView === 'overview') {
            fetchOverviewData();
        } else if (activeView === 'wallet') {
            fetchWalletData();
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeView === 'openOrders') {
            fetchOpenOrders();
        } else if (activeView === 'overview') {
            fetchOverviewData();
        } else if (activeView === 'wallet') {
            fetchWalletData();
        }
    }, [activeView]);

    const { listenToPrivateChannel } = useRealtime();

    useEffect(() => {
        if (!userPhone) return;

        const userId = provider.user_id || provider.id;
        const channelName = `user.${userId}`;

        console.log(`🔌 ProviderDashboard: Setting up listeners on ${channelName}`);

        const cleanup = listenToPrivateChannel(channelName, '.user.notification', (data: any) => {
            const notificationType = data.notification?.type;
            console.log('🔔 ProviderDashboard notification:', notificationType);

            if (notificationType === 'WITHDRAWAL_PROCESSED_APPROVED' ||
                notificationType === 'WITHDRAWAL_PROCESSED_REJECTED' ||
                notificationType === 'FUNDS_DEPOSITED') {
                console.log('💰 Financial notification received, refreshing wallet data...', notificationType);
                fetchWalletData();
            }

            if (notificationType === 'NEW_ORDER' || notificationType === 'NEW_ORDER_FOR_PROVIDER') {
                console.log('📦 New order notification received, refreshing open orders...');
                fetchOpenOrders(true, true); // background=true, forceRefresh=true
                // Play notification sound
                try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
            }

            if (notificationType === 'OFFER_ACCEPTED_PROVIDER_WIN') {
                console.log('🏆 Offer accepted! Refreshing data...');
                fetchWalletData();
            }
        });

        return () => {
            console.log('🔌 ProviderDashboard: Cleaning up listeners');
            cleanup();
        };
    }, [userPhone, activeView, provider.user_id, provider.id, listenToPrivateChannel]);

    const handleUpdateProvider = async (updatedData: Partial<Provider>) => {
        try {
            const response = await providerAPI.updateProfile(updatedData);
            setLocalProvider(prev => ({ ...prev, ...response.data }));
            showToast('تم تحديث البيانات بنجاح!', 'success');
        } catch (error) {
            console.error("Failed to update profile", error);
            showToast('فشل تحديث البيانات.', 'error');
        }
    };

    const handleSubmitQuote = async (orderNumber: string, quoteDetails: { price: number; partStatus: PartStatus; partSizeCategory: PartSizeCategory; notes?: string; }, media: { images: File[]; video: File | null; voiceNote: Blob | null; }) => {
        const { price, partStatus, partSizeCategory, notes } = quoteDetails;

        try {
            const response = await ordersAPI.submitQuote(orderNumber, {
                price,
                part_status: partStatus,
                part_size_category: partSizeCategory,
                notes,
            }, media);

            const newQuote = response.data.data;

            const updatedOrders = allOrders.map(o => {
                if (o.orderNumber === orderNumber) {
                    return {
                        ...o,
                        status: 'quoted' as const,
                        quotes: [...(o.quotes || []), newQuote]
                    };
                }
                return o;
            });
            updateAllOrders(updatedOrders);

            // Refresh open orders list to remove the quoted order immediately
            fetchOpenOrders(true);

            showToast('تم إرسال العرض بنجاح!', 'success');
        } catch (error) {
            console.error("Failed to submit quote", error);
            showToast('فشل إرسال العرض.', 'error');
        }
    };

    const handleSubmitWithdrawal = async (amount: number, paymentMethodId: string) => {
        try {
            const response = await providerAPI.requestWithdrawal(amount, paymentMethodId);
            const newRequest = response.data;

            setWithdrawalRequests(prev => [newRequest, ...prev]);

            showToast('تم إرسال طلب السحب بنجاح.', 'success');
            fetchWalletData();
        } catch (error: any) {
            console.error("Withdrawal request failed", error);
            showToast(error.response?.data?.error || 'فشل إرسال طلب السحب.', 'error');
        }
    };

    // Create navigation handlers using shared utility
    const navigationHandlers = useMemo(() =>
        createNavigationHandlers(navigate, onNavigate, '/provider', setIsSidebarOpen),
        [navigate, onNavigate, setIsSidebarOpen]
    );

    const handleSidebarNavClick = (view: ProviderView | 'notifications') => {
        navigationHandlers.handleSidebarNavClick(view);
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'services-popup') {
            onShowServices();
            return;
        }
        navigationHandlers.handleBottomNavClick(id);
    };

    const handleSetView = (view: ProviderView) => {
        navigationHandlers.handleViewChange(view);
    };

    // Build sidebar items using shared utilities for consistency
    const sidebarItems: SidebarItemType[] = useMemo(() => [
        buildSidebarItem(COMMON_MENU_ITEMS.overview, activeView, () => handleSidebarNavClick('overview')),
        buildCustomSidebarItem('openOrders', 'الطلبات المتاحة', 'Search', activeView, () => handleSidebarNavClick('openOrders')),
        buildCustomSidebarItem('myBids', 'عروضي المقدمة', 'FileText', activeView, () => handleSidebarNavClick('myBids')),
        buildCustomSidebarItem('accepted', 'الطلبات المقبولة', 'CheckCircle', activeView, () => handleSidebarNavClick('accepted')),
        buildCustomSidebarItem('wallet', 'المحفظة المالية', 'Wallet', activeView, () => handleSidebarNavClick('wallet')),
        buildExternalNavItem(COMMON_MENU_ITEMS.carListings, onNavigate),
        buildExternalNavItem(COMMON_MENU_ITEMS.rentCar, onNavigate),
        buildSidebarItem(COMMON_MENU_ITEMS.flashProducts, activeView, () => handleSidebarNavClick('flashProducts')),
        buildSidebarItem(COMMON_MENU_ITEMS.internationalLicense, activeView, () => handleSidebarNavClick('internationalLicense')),
        buildSidebarItem(COMMON_MENU_ITEMS.store, activeView, () => handleSidebarNavClick('store')),
        buildSidebarItem(COMMON_MENU_ITEMS.settings, activeView, () => handleSidebarNavClick('settings')),
        buildSidebarItem(COMMON_MENU_ITEMS.notifications, activeView, () => handleSidebarNavClick('notifications'), unreadCount),
    ], [activeView, currentView, unreadCount, handleSidebarNavClick, onNavigate]);

    const bottomNavItems = [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'openOrders', label: 'الطلبات', icon: <Icon name="Search" /> },
        { id: 'services-popup', label: 'الخدمات', icon: <img src={settings.logoUrl || '/logo.png'} alt="الخدمات" className="w-full h-full object-contain p-1" />, isSpecial: true },
        { id: 'notifications', label: 'الإشعارات', icon: <Icon name="Bell" />, notificationCount: unreadCount },
        { id: 'settings', label: 'الإعدادات', icon: <Icon name="Settings" /> },
    ];

    // Create sidebar user object using shared utility
    const sidebarUser = useMemo(() =>
        createSidebarUser(
            localProvider?.name || 'مكتب قطع الغيار',
            userPhone,
            'مزود خدمة',
            localProvider?.name?.charAt(0) || 'P'
        ),
        [localProvider, userPhone]
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
                title="لوحة المزود"
            />

            {/* Main Content Area - Mobile Optimized */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<ProviderOverviewView provider={localProvider} overviewData={overviewData} onNavigate={handleSetView} isLoading={isLoadingOverview} onRefresh={() => fetchOverviewData(true)} />} />
                        <Route path="overview" element={<ProviderOverviewView provider={localProvider} overviewData={overviewData} onNavigate={handleSetView} isLoading={isLoadingOverview} onRefresh={() => fetchOverviewData(true)} />} />
                        <Route path="openOrders" element={<OpenOrdersView provider={localProvider} orders={openOrders} onSubmitQuote={handleSubmitQuote} settings={settings} isLoading={isLoadingOpenOrders} showToast={showToast} onRefresh={() => fetchOpenOrders(false, true)} />} />
                        <Route path="myBids" element={<MyBidsView provider={localProvider} settings={settings} showToast={showToast} />} />
                        <Route path="accepted" element={<AcceptedOrdersView provider={localProvider} settings={settings} />} />
                        <Route path="wallet" element={<WalletView provider={localProvider} withdrawals={withdrawalRequests} transactions={transactions} settings={settings} onSubmitWithdrawal={handleSubmitWithdrawal} onRefresh={() => fetchWalletData(true)} />} />
                        <Route path="settings" element={<ProviderSettingsView provider={localProvider} settings={settings} showToast={showToast} onUpdateProvider={handleUpdateProvider} onLogout={onLogout} />} />
                        <Route path="flashProducts" element={<FlashProductsView provider={localProvider} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} />} />
                        <Route path="store" element={<StoreView provider={localProvider} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} storeCategories={storeCategories} />} />
                        <Route path="store/product/:productId" element={<StoreView provider={localProvider} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} storeCategories={storeCategories} />} />
                        <Route path="internationalLicense" element={<UserInternationalLicenseView showToast={showToast} />} />
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
        </div >
    );
};

export default ProviderDashboard;