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
import { useRealtime, useProviderOrders } from '../hooks/useRealtime';
import Sidebar, { SidebarItemType, SidebarUser } from './DashboardParts/Sidebar';

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
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = (props) => {
    const { provider, allOrders, updateAllOrders, onBack, showToast, settings, addNotificationForUser, navigationParams, onNavigationConsumed, isSidebarOpen, setIsSidebarOpen, onLogout, onNavigate, currentView, unreadCount, userPhone, storeCategories } = props;

    const navigate = useNavigate();
    const location = useLocation();

    // Derive active view from URL
    const activeView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname === '/provider' || location.pathname === '/provider/') return 'overview';
        return (path as ProviderView) || 'overview';
    }, [location.pathname]);

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


    const fetchOpenOrders = async (background: boolean = false) => {
        try {
            if (!background) setIsLoadingOpenOrders(true);
            const response = await providerAPI.getOpenOrders();
            setOpenOrders(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch open orders", error);
            if (!background) showToast('فشل تحميل الطلبات المتاحة', 'error');
        } finally {
            if (!background) setIsLoadingOpenOrders(false);
        }
    };

    const fetchOverviewData = async () => {
        try {
            setIsLoadingOverview(true);
            const response = await providerAPI.getOverviewData();
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

    const fetchWalletData = async () => {
        try {
            const [txRes, wdrRes, balRes] = await Promise.all([
                providerAPI.getTransactions(),
                providerAPI.getWithdrawals(),
                providerAPI.getWalletBalance()
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

    // Throttled refresh for open orders
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
    const throttledFetchOpenOrders = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            console.log('📦 Throttled refresh of open orders...');
            fetchOpenOrders(true);
        }, 1000);
    };

    // Listen for new orders (standardized events)
    const userId = provider.user_id || provider.id;
    useProviderOrders(userId, (data) => {
        console.log('📦 ProviderDashboard: New Order Event:', data);
        showToast(`طلب جديد متاح: ${data.order?.order_number || ''}`, 'info');
        try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }

        if (activeView === 'openOrders' || activeView === 'overview') {
            throttledFetchOpenOrders();
        }
    });

    useEffect(() => {
        if (!userPhone) return;

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

            // Legacy notification listener for orders - REMOVED to avoid duplicates with useProviderOrders
            // if ((notificationType === 'NEW_ORDER' || notificationType === 'NEW_ORDER_FOR_PROVIDER') && activeView === 'openOrders') { ... }

            if (notificationType === 'OFFER_ACCEPTED_PROVIDER_WIN') {
                console.log('🏆 Offer accepted! Refreshing data...');
                fetchWalletData();
                showToast('مبروك! تم قبول عرضك.', 'success');
                try { new Audio('/sound_success.wav').play().catch(() => { }); } catch (e) { }
            }
        });

        return () => {
            console.log('🔌 ProviderDashboard: Cleaning up listeners');
            cleanup();
        };
    }, [userPhone, activeView, userId, listenToPrivateChannel]);

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

    const handleSidebarNavClick = (view: ProviderView | 'notifications') => {
        if (view === 'notifications') {
            onNavigate('notificationCenter');
        } else {
            if (view === 'overview') {
                navigate('/provider');
            } else {
                navigate(`/provider/${view}`);
            }
        }
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleBottomNavClick = (id: string) => {
        if (id === 'notifications') {
            onNavigate('notificationCenter');
        } else {
            if (id === 'overview') {
                navigate('/provider');
            } else {
                navigate(`/provider/${id}`);
            }
        }
    };

    const handleSetView = (view: ProviderView) => {
        if (view === 'overview') {
            navigate('/provider');
        } else {
            navigate(`/provider/${view}`);
        }
    };

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSidebarNavClick('overview'), isActive: activeView === 'overview' },
        { id: 'openOrders', label: 'الطلبات المتاحة', icon: 'Search', onClick: () => handleSidebarNavClick('openOrders'), isActive: activeView === 'openOrders' },
        { id: 'myBids', label: 'عروضي المقدمة', icon: 'FileText', onClick: () => handleSidebarNavClick('myBids'), isActive: activeView === 'myBids' },
        { id: 'accepted', label: 'الطلبات المقبولة', icon: 'CheckCircle', onClick: () => handleSidebarNavClick('accepted'), isActive: activeView === 'accepted' },
        { id: 'wallet', label: 'المحفظة المالية', icon: 'Wallet', onClick: () => handleSidebarNavClick('wallet'), isActive: activeView === 'wallet' },
        { id: 'flashProducts', label: 'العروض الفورية', icon: 'Zap', onClick: () => handleSidebarNavClick('flashProducts'), isActive: activeView === 'flashProducts' },
        { id: 'internationalLicense', label: 'الرخصة الدولية', icon: 'Globe', onClick: () => handleSidebarNavClick('internationalLicense'), isActive: activeView === 'internationalLicense' },
        { id: 'store', label: 'المتجر', icon: 'Store', onClick: () => handleSidebarNavClick('store'), isActive: activeView === 'store' },
        { id: 'settings', label: 'الإعدادات', icon: 'Settings', onClick: () => handleSidebarNavClick('settings'), isActive: activeView === 'settings' },
        { id: 'notifications', label: 'الإشعارات', icon: 'Bell', onClick: () => handleSidebarNavClick('notifications'), isActive: currentView === 'notificationCenter', badge: unreadCount },
    ], [activeView, currentView, unreadCount]);

    const bottomNavItems = [
        { id: 'overview', label: 'الرئيسية', icon: <Icon name="House" /> },
        { id: 'openOrders', label: 'الطلبات', icon: <Icon name="Search" /> },
        { id: 'store', label: 'المتجر', icon: <Icon name="Store" /> },
        { id: 'notifications', label: 'الإشعارات', icon: <Icon name="Bell" />, notificationCount: unreadCount },
        { id: 'settings', label: 'الإعدادات', icon: <Icon name="Settings" /> },
    ];

    const sidebarUser: SidebarUser = {
        name: localProvider?.name || 'مكتب قطع الغيار',
        phone: userPhone,
        roleLabel: 'مزود خدمة',
        avatarChar: localProvider?.name?.charAt(0) || 'P'
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
                title="لوحة المزود"
            />

            {/* Main Content Area - Mobile Optimized */}
            <main className="flex-1 min-w-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 md:rounded-l-2xl">
                <div className="h-full overflow-y-auto custom-scrollbar scroll-smooth-mobile">
                    <Routes>
                        <Route index element={<ProviderOverviewView provider={localProvider} overviewData={overviewData} onNavigate={handleSetView} isLoading={isLoadingOverview} />} />
                        <Route path="overview" element={<ProviderOverviewView provider={localProvider} overviewData={overviewData} onNavigate={handleSetView} isLoading={isLoadingOverview} />} />
                        <Route path="openOrders" element={<OpenOrdersView provider={localProvider} orders={openOrders} onSubmitQuote={handleSubmitQuote} settings={settings} isLoading={isLoadingOpenOrders} showToast={showToast} />} />
                        <Route path="myBids" element={<MyBidsView provider={localProvider} settings={settings} showToast={showToast} />} />
                        <Route path="accepted" element={<AcceptedOrdersView provider={localProvider} settings={settings} />} />
                        <Route path="wallet" element={<WalletView provider={localProvider} withdrawals={withdrawalRequests} transactions={transactions} settings={settings} onSubmitWithdrawal={handleSubmitWithdrawal} />} />
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