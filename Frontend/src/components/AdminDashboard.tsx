import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Order, Settings, AnnouncementPost, Category, Brand, PartType, Technician, TowTruck, TechnicianSpecialty, OrderStatus, Customer, Provider, WithdrawalRequest, Transaction, StoreCategory, FlashProductBuyerRequest, AdminFlashProduct, CarModel } from '../types';
import Sidebar, { SidebarItemType } from './DashboardParts/Sidebar';
import OverviewView from './DashboardParts/OverviewView';
import OrdersView from './DashboardParts/OrdersView';
import ProvidersView from './ProvidersView';
import UsersView from './DashboardParts/UsersView';
import TechniciansView from './DashboardParts/TechniciansView';
import TowTruckManagementView from './DashboardParts/TowTruckManagementView';
import SettingsView from './DashboardParts/SettingsView';
import CeoSettingsView from './DashboardParts/CeoSettingsView';
import BulletinBoardView from './DashboardParts/BulletinBoardView';
import AccountingView from './DashboardParts/AccountingView';
import UserWalletManagementView from './DashboardParts/UserWalletManagementView';
import LimitsSettingsView from './DashboardParts/LimitsSettingsView';
import ModelManagementView from './DashboardParts/ModelManagementView';
import PaymentMethodsView from './PaymentMethodsView';
import WhatsappManagementView from './DashboardParts/WhatsappManagementView';
import ShippingView from './DashboardParts/ShippingView';
import ShippingSettingsView from './DashboardParts/ShippingSettingsView';
import MessageTemplatesView from './DashboardParts/MessageTemplatesView';
import NotificationSettingsEditor from './DashboardParts/NotificationSettingsEditor';
import TelegramManagementView from './DashboardParts/TelegramManagementView';
import CacheManagementView from './DashboardParts/CacheManagementView';
import ServerStatusView from './DashboardParts/ServerStatusView';
import MaintenanceView from './DashboardParts/MaintenanceView';
import SeoManagementView from './DashboardParts/SeoManagementView';
import BlogManagementView from './DashboardParts/BlogManagementView';
import FaqManagementView from './DashboardParts/FaqManagementView';
import ReviewsManagementView from './DashboardParts/ReviewsManagementView';
import InternationalLicenseManagementView from './DashboardParts/InternationalLicenseManagementView';
import SendNotificationView from './DashboardParts/SendNotificationView';
import AuctionManagementView from './DashboardParts/AuctionManagementView';
import SchedulerManagementView from './DashboardParts/SchedulerManagementView';
import ShippingReceipt from './ShippingReceipt';
import { AdminView } from './DashboardParts/types';
import { adminAPI } from '../lib/api';
import { getEcho } from '../lib/echo';
import Icon from './Icon';
import { Button } from './ui/Button';

// Store Components
import StoreOverview from './DashboardParts/Store/StoreOverview';
import ProductManagement from './DashboardParts/Store/ProductManagement';
import FlashProductManagement from './DashboardParts/Store/FlashProductManagement';
import StoreOrderManagement from './DashboardParts/Store/StoreOrderManagement';
import StoreSettings from './DashboardParts/Store/StoreSettings';

export interface AdminDashboardProps {
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    onBack: () => void;
    addNotificationForUser: (userPhone: string, notification: any, type: any, context?: any) => void;
    settings: Settings;
    updateSettings: (s: Partial<Settings>) => void;
    announcements: AnnouncementPost[];
    publishAnnouncement: (post: any) => Promise<void>;
    deleteAnnouncement: (id: string) => void;
    isLoading: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    carCategories: Category[];
    updateCarCategories: (categories: Category[]) => void;
    allBrands: Brand[];
    updateAllBrands: (brands: Brand[]) => void;
    brandModels: { [key: string]: string[] };
    updateBrandModels: (models: { [key: string]: string[] }) => void;
    partTypes: PartType[];
    updatePartTypes: (types: PartType[]) => void;
    sendTelegramNotification: (botToken: string, channelId: string, message: string, media?: any) => Promise<void>;
    cacheVersion: string;
    allTechnicians: Technician[];
    updateAllTechnicians: (technicians: Technician[]) => void;
    allTowTrucks: TowTruck[];
    updateAllTowTrucks: (towTrucks: TowTruck[]) => void;
    technicianSpecialties: TechnicianSpecialty[];
    updateTechnicianSpecialties: (specialties: TechnicianSpecialty[]) => void;
    storeCategories: StoreCategory[];
    updateStoreCategories: (categories: StoreCategory[]) => void;
    allModels: { [key: string]: CarModel[] };
    navigationParams: any;
    onNavigationConsumed: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
    const {
        allOrders, updateAllOrders, onBack, addNotificationForUser, settings, updateSettings, announcements,
        publishAnnouncement, deleteAnnouncement, showToast, carCategories, updateCarCategories, allBrands,
        updateAllBrands, brandModels, updateBrandModels, partTypes, updatePartTypes, allTechnicians,
        updateAllTechnicians, allTowTrucks, updateAllTowTrucks, technicianSpecialties, updateTechnicianSpecialties,
        storeCategories, updateStoreCategories, allModels,
        navigationParams, onNavigationConsumed, isSidebarOpen, setIsSidebarOpen, sendTelegramNotification, cacheVersion
    } = props;

    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Derive current view from URL
    const currentView = useMemo(() => {
        const path = location.pathname.split('/').pop();
        if (location.pathname === '/admin' || location.pathname === '/admin/') return 'overview';
        return (path as AdminView) || 'overview';
    }, [location.pathname]);

    const currentFilterStatus = (searchParams.get('status') as OrderStatus | 'all') || 'all';

    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);

    const [allProviders, setAllProviders] = useState<Provider[]>([]);
    const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
    const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [adminFlashProducts, setAdminFlashProducts] = useState<AdminFlashProduct[]>([]);
    const [flashRequests, setFlashRequests] = useState<FlashProductBuyerRequest[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    const fetchProviders = async (background: boolean = false) => {
        try {
            const url = '/api/admin/providers' + (background ? `?_t=${Date.now()}` : '');
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAllProviders(data.data);
            } else {
                console.error('Failed to fetch providers:', response.status, response.statusText);
                if (!background) showToast('فشل تحميل قائمة المزودين', 'error');
            }
        } catch (error) {
            console.error('Failed to fetch providers', error);
            if (!background) showToast('حدث خطأ أثناء تحميل المزودين', 'error');
        }
    };

    const fetchFinancialData = async (background: boolean = false) => {
        try {
            const [withdrawalsRes, transactionsRes] = await Promise.all([
                adminAPI.getWithdrawals(background),
                adminAPI.getTransactions(background)
            ]);

            const withdrawalsData = withdrawalsRes.data.data || withdrawalsRes.data;
            const transactionsData = transactionsRes.data.data || transactionsRes.data;

            setWithdrawalRequests(Array.isArray(withdrawalsData) ? withdrawalsData : []);
            setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        } catch (error) {
            console.error('Failed to fetch financial data', error);
            if (!background) showToast('فشل تحميل البيانات المالية', 'error');
            // Don't reset data on error if background refresh
            if (!background) {
                setWithdrawalRequests([]);
                setTransactions([]);
            }
        }
    };

    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const fetchStats = async (background: boolean = false) => {
        try {
            const url = '/api/admin/stats' + (background ? `?_t=${Date.now()}` : '');
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (response.ok) {
                const data = await response.json();
                setDashboardStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        }
    };

    const fetchProducts = async (background: boolean = false) => {
        try {
            const response = await adminAPI.getProducts(background);
            const productsData = response.data.data || response.data;
            setAdminFlashProducts(Array.isArray(productsData) ? productsData : []);
        } catch (error) {
            console.error('Failed to fetch products', error);
            if (!background) showToast('فشل تحميل المنتجات', 'error');
            if (!background) setAdminFlashProducts([]);
        }
    };

    const fetchOrders = async (background: boolean = false) => {
        if (!background) setOrdersLoading(true);
        try {
            const response = await adminAPI.getOrders(background);
            const ordersData = response.data.data || response.data;
            updateAllOrders(Array.isArray(ordersData) ? ordersData : []);
            if (background) console.log('🔄 Orders silently refreshed');
        } catch (error) {
            console.error('Failed to fetch orders', error);
            if (!background) showToast('فشل تحميل الطلبات', 'error');
        } finally {
            if (!background) setOrdersLoading(false);
        }
    };

    useEffect(() => {
        const loadLocalData = () => {
            setAllCustomers(JSON.parse(localStorage.getItem('all_customers') || '[]'));
            setFlashRequests(JSON.parse(localStorage.getItem('flash_product_buyer_requests') || '[]'));
        };
        loadLocalData();
        fetchProviders();
        fetchFinancialData();
        fetchProducts();
        fetchOrders();
        fetchStats();
        window.addEventListener('storage', loadLocalData);
        return () => window.removeEventListener('storage', loadLocalData);
    }, []);

    // Real-time Listeners for Smooth Refresh
    useEffect(() => {
        const echo = getEcho();
        if (!echo) return;

        console.log('🔌 AdminDashboard: Setting up real-time listeners...');

        const ordersChannel = echo.channel('orders');
        ordersChannel.listen('.order.created', (data: any) => {
            console.log('📦 Admin: New Order Received:', data);
            showToast(`طلب جديد: ${data.order?.order_number || ''}`, 'info');
            try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
            fetchOrders(true);
        });

        const adminChannel = echo.private('admin.dashboard');

        adminChannel.listen('.admin.order.created', (data: any) => {
            console.log('📦 Admin: Order Created:', data);
            showToast(`طلب جديد: ${data.data?.order_number || ''}`, 'info');
            try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
            fetchOrders(true);
        });

        adminChannel.listen('.admin.quote.received', (data: any) => {
            console.log('💬 Admin: Quote Received:', data);
            showToast(`عرض سعر جديد للطلب: ${data.data?.order_number || ''}`, 'info');
            try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (e) { }
            fetchOrders(true);
        });

        adminChannel.listen('.admin.order.status_updated', (data: any) => {
            console.log('🔄 Admin: Order Status Updated (admin channel):', data);
            fetchOrders(true);
        });

        // Add listener for the confirmed backend event name on the admin channel
        adminChannel.listen('.order.status.updated', (data: any) => {
            console.log('🔄 Admin: Order Status Updated (admin channel standard):', data);
            fetchOrders(true);
        });

        adminChannel.listen('.admin.order.payment_updated', (data: any) => {
            console.log('💳 Admin: Payment Updated:', data);
            fetchOrders(true);
        });

        adminChannel.listen('.admin.order.quote_accepted', (data: any) => {
            console.log('💳 Admin: Quote Accepted/Payment Uploaded:', data);
            showToast(`تم قبول عرض للطلب: ${data.data?.order_number || ''}`, 'info');
            try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (e) { }
            fetchOrders(true);
        });

        adminChannel.listen('.admin.provider.registered', (data: any) => {
            console.log('👤 Admin: Provider Registered:', data);
            showToast(`مزود جديد: ${data.data?.name || ''}`, 'info');
            fetchProviders();
        });

        adminChannel.listen('.admin.provider.balance_changed', (data: any) => {
            console.log('💰 Admin: Provider Balance Changed:', data);
            fetchProviders();
            fetchFinancialData();
        });

        adminChannel.listen('.admin.withdrawal.requested', (data: any) => {
            console.log('💸 Admin: Withdrawal Requested:', data);
            showToast(`طلب سحب جديد من ${data.data?.provider_name || ''}`, 'info');
            try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (e) { }
            fetchFinancialData();
        });

        adminChannel.listen('.admin.withdrawal.processed', (data: any) => {
            console.log('✅ Admin: Withdrawal Processed:', data);
            fetchFinancialData();
            fetchProviders();
        });

        adminChannel.listen('.admin.store_order.created', (data: any) => {
            console.log('🛒 Admin: Store Order Created:', data);
            showToast(`طلب متجر جديد من ${data.data?.buyer_name || ''}`, 'info');
            try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
        });

        adminChannel.listen('.admin.user.registered', (data: any) => {
            console.log('👤 Admin: User Registered:', data);
            showToast(`عميل جديد`, 'info');
        });

        adminChannel.listen('.admin.technician.registered', (data: any) => {
            console.log('🔧 Admin: Technician Registered:', data);
            showToast(`فني جديد: ${data.data?.name || ''}`, 'info');
        });

        adminChannel.listen('.admin.tow_truck.registered', (data: any) => {
            console.log('🚚 Admin: Tow Truck Registered:', data);
            showToast(`سطحة جديدة: ${data.data?.name || ''}`, 'info');
        });

        adminChannel.listen('.order.status.updated', (data: any) => {
            console.log('🔄 Admin: Order Status Updated (legacy):', data);
            fetchOrders(true);
        });

        adminChannel.listen('.quote.received', (data: any) => {
            console.log('💬 Admin: Quote Received (legacy):', data);
            fetchOrders(true);
        });

        return () => {
            console.log('🔌 AdminDashboard: Cleaning up listeners');
            echo.leave('orders');
            echo.leave('admin.dashboard');
        };
    }, []);


    const handleSaveProvider = async (provider: Provider) => {
        try {
            const isEditing = allProviders.some(p => p.id === provider.id);
            const url = isEditing ? `/api/admin/providers/${provider.id}` : '/api/admin/providers';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(provider)
            });

            if (response.ok) {
                await fetchProviders();
                showToast(isEditing ? 'تم تحديث المزود بنجاح' : 'تم إضافة المزود بنجاح', 'success');
            } else {
                const errorData = await response.json();
                showToast(errorData.error || 'حدث خطأ أثناء حفظ المزود', 'error');
            }
        } catch (error) {
            console.error('Error saving provider:', error);
            showToast('حدث خطأ في الاتصال', 'error');
        }
    };

    const handleDeleteProvider = async (id: string) => {
        try {
            const response = await fetch(`/api/admin/providers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });

            if (response.ok) {
                await fetchProviders();
                showToast('تم حذف المزود بنجاح', 'success');
            } else {
                showToast('حدث خطأ أثناء حذف المزود', 'error');
            }
        } catch (error) {
            console.error('Error deleting provider:', error);
            showToast('حدث خطأ في الاتصال', 'error');
        }
    };

    const updateAdminFlashProducts = async (products: AdminFlashProduct[]) => {
        setAdminFlashProducts(products);
    };

    const updateFlashRequests = (requests: FlashProductBuyerRequest[]) => {
        setFlashRequests(requests);
        localStorage.setItem('flash_product_buyer_requests', JSON.stringify(requests));
    };

    const handleUpdateOrderStatus = async (orderNumber: string, newStatus: OrderStatus) => {
        console.log(`🔄 handleUpdateOrderStatus called for ${orderNumber} -> ${newStatus}`);

        // 1. Optimistic Update: Update local state immediately
        const originalOrders = [...allOrders]; // Keep copy for rollback
        updateAllOrders(allOrders.map(order =>
            order.orderNumber === orderNumber
                ? { ...order, status: newStatus }
                : order
        ));

        try {
            // 2. Call API
            await adminAPI.updateOrderStatus(orderNumber, newStatus);

            // 3. Force Fetch from server to ensure consistency (and get side effects like updated timestamps)
            await fetchOrders(true);
            showToast('تم تحديث حالة الطلب.', 'success');
        } catch (error: any) {
            console.error('Failed to update order status', error);
            // 4. Rollback on error
            updateAllOrders(originalOrders);
            showToast(error.response?.data?.message || 'فشل تحديث حالة الطلب', 'error');
        }
    };

    const handleUpdateShippingNotes = async (orderNumber: string, notes: string) => {
        try {
            await adminAPI.updateShippingNotes(orderNumber, notes);
            await fetchOrders();
            showToast('تم تحديث ملاحظات الشحن.', 'success');
        } catch (error: any) {
            console.error('Failed to update shipping notes', error);
            showToast(error.response?.data?.message || 'فشل تحديث ملاحظات الشحن', 'error');
        }
    };

    const handleApprovePayment = async (order: Order) => {
        // Optimistic Update
        const originalOrders = [...allOrders];
        updateAllOrders(allOrders.map(o =>
            o.orderNumber === order.orderNumber
                ? { ...o, status: 'processing' }
                : o
        ));

        try {
            await adminAPI.approveOrderPayment(order.orderNumber);
            await fetchOrders(true);
            showToast('تمت الموافقة على الدفع.', 'success');
        } catch (error: any) {
            console.error('Failed to approve payment', error);
            updateAllOrders(originalOrders);
            showToast(error.response?.data?.message || 'فشل الموافقة على الدفع', 'error');
        }
    };

    const handleRejectPayment = async (order: Order) => {
        const reason = prompt("سبب رفض الدفع:");
        if (reason) {
            // Optimistic Update
            const originalOrders = [...allOrders];
            updateAllOrders(allOrders.map(o =>
                o.orderNumber === order.orderNumber
                    ? { ...o, status: 'pending', rejectionReason: reason }
                    : o
            ));

            try {
                await adminAPI.rejectOrderPayment(order.orderNumber, reason);
                await fetchOrders(true);
                showToast('تم رفض الدفع.', 'info');
            } catch (error: any) {
                console.error('Failed to reject payment', error);
                updateAllOrders(originalOrders);
                showToast(error.response?.data?.message || 'فشل رفض الدفع', 'error');
            }
        }
    };

    const handleSetView = (view: AdminView) => {
        if (view === 'overview') {
            navigate('/admin');
        } else {
            navigate(`/admin/${view}`);
        }
    };

    const handleSetFilterStatus = (status: OrderStatus | 'all') => {
        navigate(`/admin/orders?status=${status}`);
    };

    const handleAddManualDeposit = async (providerId: string, amount: number, notes: string) => {
        try {
            await adminAPI.addFunds(providerId, amount, notes);
            await fetchFinancialData();
            await fetchProviders();
            showToast('تم إضافة الرصيد بنجاح', 'success');
        } catch (error: any) {
            console.error('Error adding manual deposit:', error);
            showToast(error.response?.data?.message || 'فشل إضافة الإيداع', 'error');
        }
    };

    const handleApproveWithdrawal = async (withdrawalId: string) => {
        if (!window.confirm('هل أنت متأكد من الموافقة على طلب السحب؟')) return;

        try {
            await adminAPI.approveWithdrawal(withdrawalId);
            await fetchFinancialData();
            showToast('تمت الموافقة على السحب', 'success');
        } catch (error: any) {
            console.error('Error approving withdrawal:', error);
            showToast(error.response?.data?.message || 'فشل الموافقة على السحب', 'error');
        }
    };

    const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
        try {
            await adminAPI.rejectWithdrawal(withdrawalId, reason);
            await fetchFinancialData();
            showToast('تم رفض طلب السحب', 'success');
        } catch (error: any) {
            console.error('Error rejecting withdrawal:', error);
            showToast(error.response?.data?.message || 'فشل رفض السحب', 'error');
        }
    };

    // --- Sidebar and Data Logic ---
    const ordersByStatusCount = useMemo(() => {
        const counts: Record<string, number> = { 'all': allOrders.length };
        allOrders.forEach(order => {
            counts[order.status] = (counts[order.status] || 0) + 1;
        });
        return counts;
    }, [allOrders]);

    const shippingCount = useMemo(() => allOrders.filter(o => ['تم الاستلام من المزود', 'تم الشحن للعميل', 'قيد التوصيل'].includes(o.status)).length, [allOrders]);

    const sidebarItems: SidebarItemType[] = useMemo(() => [
        { id: 'overview', label: 'نظرة عامة', icon: 'LayoutGrid', onClick: () => handleSetView('overview'), isActive: currentView === 'overview' },
        {
            id: 'orders',
            label: 'إدارة الطلبات',
            icon: 'List',
            children: [
                { id: 'orders_all', label: 'جميع الطلبات', badge: ordersByStatusCount['all'], onClick: () => handleSetFilterStatus('all'), isActive: currentView === 'orders' && currentFilterStatus === 'all', icon: 'List', groupLabel: 'عرض الكل' },
                { id: 'orders_pending', label: 'قيد المراجعة', badge: ordersByStatusCount['pending'], onClick: () => handleSetFilterStatus('pending'), isActive: currentView === 'orders' && currentFilterStatus === 'pending', icon: 'Clock', groupLabel: 'طلبات نشطة', color: 'text-blue-600 dark:text-blue-400' },
                { id: 'orders_payment', label: 'بانتظار تأكيد الدفع', badge: ordersByStatusCount['payment_pending'], onClick: () => handleSetFilterStatus('payment_pending'), isActive: currentView === 'orders' && currentFilterStatus === 'payment_pending', icon: 'DollarSign', color: 'text-amber-600 dark:text-amber-400' },
                { id: 'orders_processing', label: 'جاري التجهيز', badge: ordersByStatusCount['processing'], onClick: () => handleSetFilterStatus('processing'), isActive: currentView === 'orders' && currentFilterStatus === 'processing', icon: 'Package', color: 'text-purple-600 dark:text-purple-400' },
                { id: 'orders_ready', label: 'جاهز للاستلام', badge: ordersByStatusCount['ready_for_pickup'], onClick: () => handleSetFilterStatus('ready_for_pickup'), isActive: currentView === 'orders' && currentFilterStatus === 'ready_for_pickup', icon: 'CheckCircle', groupLabel: 'الشحن والتوصيل', color: 'text-green-600 dark:text-green-400' },
                { id: 'orders_received', label: 'تم الاستلام من المزود', badge: ordersByStatusCount['provider_received'], onClick: () => handleSetFilterStatus('provider_received'), isActive: currentView === 'orders' && currentFilterStatus === 'provider_received', icon: 'Archive', color: 'text-indigo-600 dark:text-indigo-400' },
                { id: 'orders_shipped', label: 'تم الشحن للعميل', badge: ordersByStatusCount['shipped'], onClick: () => handleSetFilterStatus('shipped'), isActive: currentView === 'orders' && currentFilterStatus === 'shipped', icon: 'Truck', color: 'text-blue-600 dark:text-blue-400' },
                { id: 'orders_delivery', label: 'قيد التوصيل', badge: ordersByStatusCount['out_for_delivery'], onClick: () => handleSetFilterStatus('out_for_delivery'), isActive: currentView === 'orders' && currentFilterStatus === 'out_for_delivery', icon: 'Navigation', color: 'text-orange-600 dark:text-orange-400' },
                { id: 'orders_delivered', label: 'تم التوصيل', badge: ordersByStatusCount['delivered'], onClick: () => handleSetFilterStatus('delivered'), isActive: currentView === 'orders' && currentFilterStatus === 'delivered', icon: 'CheckCircle2', groupLabel: 'طلبات مكتملة', color: 'text-green-600 dark:text-green-400' },
                { id: 'orders_completed', label: 'تم الاستلام من الشركة', badge: ordersByStatusCount['completed'], onClick: () => handleSetFilterStatus('completed'), isActive: currentView === 'orders' && currentFilterStatus === 'completed', icon: 'Home', color: 'text-green-600 dark:text-green-400' },
                { id: 'orders_cancelled', label: 'ملغي', badge: ordersByStatusCount['cancelled'], onClick: () => handleSetFilterStatus('cancelled'), isActive: currentView === 'orders' && currentFilterStatus === 'cancelled', icon: 'XCircle', groupLabel: 'طلبات ملغاة', color: 'text-red-600 dark:text-red-400' },
            ]
        },
        {
            id: 'store',
            label: 'إدارة المتجر',
            icon: 'Store',
            children: [
                { id: 'store_overview', label: 'نظرة عامة', onClick: () => handleSetView('store_overview'), isActive: currentView === 'store_overview', icon: 'LayoutGrid' },
                { id: 'store_products', label: 'منتجات المتجر', onClick: () => handleSetView('store_products'), isActive: currentView === 'store_products', icon: 'ShoppingBag' },
                { id: 'flashStore', label: 'العروض الفورية', onClick: () => handleSetView('flashStore'), isActive: currentView === 'flashStore', icon: 'Zap' },
                { id: 'store_orders', label: 'طلبات الشراء', onClick: () => handleSetView('store_orders'), isActive: currentView === 'store_orders', icon: 'ShoppingCart' },
                { id: 'store_settings', label: 'إعدادات المتجر', onClick: () => handleSetView('store_settings'), isActive: currentView === 'store_settings', icon: 'Settings' },
            ]
        },
        {
            id: 'auctions',
            label: 'إدارة المزادات',
            icon: 'Hammer', // Changed to Hammer
            onClick: () => handleSetView('auctionManagement'),
            isActive: currentView === 'auctionManagement'
        },
        { id: 'shipping', label: 'الشحن والتوصيل', icon: 'Truck', onClick: () => handleSetView('shipping'), isActive: currentView === 'shipping', badge: shippingCount },
        {
            id: 'users',
            label: 'إدارة المستخدمين',
            icon: 'Users',
            children: [
                { id: 'providers', label: 'المزودين', onClick: () => handleSetView('providers'), isActive: currentView === 'providers', icon: 'Truck' },
                { id: 'technicians', label: 'الفنيين', onClick: () => handleSetView('technicians'), isActive: currentView === 'technicians', icon: 'Wrench' },
                { id: 'towTruckManagement', label: 'السطحات', onClick: () => handleSetView('towTruckManagement'), isActive: currentView === 'towTruckManagement', icon: 'Truck' },
                { id: 'users', label: 'العملاء', onClick: () => handleSetView('users'), isActive: currentView === 'users', icon: 'User' },
                { id: 'internationalLicenses', label: 'الرخص الدولية', onClick: () => handleSetView('internationalLicenses'), isActive: currentView === 'internationalLicenses', icon: 'Globe' },
            ]
        },
        {
            id: 'content',
            label: 'إدارة المحتوى',
            icon: 'FileText',
            children: [
                { id: 'sendNotifications', label: 'إرسال إشعارات', onClick: () => handleSetView('sendNotifications'), isActive: currentView === 'sendNotifications', icon: 'Bell' },
                { id: 'bulletinBoard', label: 'الإعلانات', onClick: () => handleSetView('bulletinBoard'), isActive: currentView === 'bulletinBoard', icon: 'Megaphone' },
                { id: 'reviewsManagement', label: 'التقييمات', onClick: () => handleSetView('reviewsManagement'), isActive: currentView === 'reviewsManagement', icon: 'Star' },
                { id: 'blogManagement', label: 'المدونة', onClick: () => handleSetView('blogManagement'), isActive: currentView === 'blogManagement', icon: 'BookOpen' },
                { id: 'faqManagement', label: 'الأسئلة الشائعة', onClick: () => handleSetView('faqManagement'), isActive: currentView === 'faqManagement', icon: 'HelpCircle' },
            ]
        },
        {
            id: 'financials',
            label: 'المالية',
            icon: 'Banknote',
            children: [
                { id: 'accounting', label: 'المحاسبة', onClick: () => handleSetView('accounting'), isActive: currentView === 'accounting', icon: 'FileBarChart' },
                { id: 'userWallet', label: 'محفظة المستخدمين', onClick: () => handleSetView('userWallet'), isActive: currentView === 'userWallet', icon: 'Wallet' },
                { id: 'paymentMethods', label: 'طرق الدفع', onClick: () => handleSetView('paymentMethods'), isActive: currentView === 'paymentMethods', icon: 'CreditCard' },
                { id: 'shippingSettings', label: 'أسعار الشحن', onClick: () => handleSetView('shippingSettings'), isActive: currentView === 'shippingSettings', icon: 'Truck' },
                { id: 'limits', label: 'إدارة الحدود', onClick: () => handleSetView('limits'), isActive: currentView === 'limits', icon: 'Sliders' },
            ]
        },
        {
            id: 'system',
            label: 'النظام والتكامل',
            icon: 'Cog',
            children: [
                { id: 'whatsappManagement', label: 'إدارة WhatsApp', onClick: () => handleSetView('whatsappManagement'), isActive: currentView === 'whatsappManagement', icon: 'MessageCircle' },
                { id: 'telegramManagement', label: 'إدارة Telegram', onClick: () => handleSetView('telegramManagement'), isActive: currentView === 'telegramManagement', icon: 'Send' },
                { id: 'messageTemplates', label: 'قوالب الرسائل', onClick: () => handleSetView('messageTemplates'), isActive: currentView === 'messageTemplates', icon: 'FileText' },
                { id: 'notifications', label: 'إعدادات الإشعارات', onClick: () => handleSetView('notifications'), isActive: currentView === 'notifications', icon: 'Bell' },
                { id: 'modelManagement', label: 'إدارة النماذج', onClick: () => handleSetView('modelManagement'), isActive: currentView === 'modelManagement', icon: 'Database' },
                { id: 'cacheManagement', label: 'إدارة التخزين', onClick: () => handleSetView('cacheManagement'), isActive: currentView === 'cacheManagement', icon: 'HardDrive' },
                { id: 'schedulerManagement', label: 'المجدول', onClick: () => handleSetView('schedulerManagement'), isActive: currentView === 'schedulerManagement', icon: 'Clock' },
                { id: 'serverStatus', label: 'حالة الخادم', onClick: () => handleSetView('serverStatus'), isActive: currentView === 'serverStatus', icon: 'Activity' },
                { id: 'maintenance', label: 'مركز الصيانة', onClick: () => handleSetView('maintenance'), isActive: currentView === 'maintenance', icon: 'Shield' },
            ]
        },
        {
            id: 'siteSettings',
            label: 'إعدادات الموقع',
            icon: 'Settings2',
            children: [
                { id: 'settings', label: 'الإعدادات العامة', onClick: () => handleSetView('settings'), isActive: currentView === 'settings', icon: 'Settings' },
                { id: 'ceoSettings', label: 'إعدادات المدير', onClick: () => handleSetView('ceoSettings'), isActive: currentView === 'ceoSettings', icon: 'UserCheck' },
                { id: 'seoManagement', label: 'إدارة SEO', onClick: () => handleSetView('seoManagement'), isActive: currentView === 'seoManagement', icon: 'Search' },
            ]
        },
    ], [currentView, currentFilterStatus, ordersByStatusCount, shippingCount]);

    const adminUser = {
        name: settings.appName || 'Ramous Admin',
        phone: 'Administrator',
        roleLabel: 'Admin Panel',
    };

    const handleLogout = () => {
        // Implement logout logic if needed, or pass prop
        onBack();
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-100">
            <Sidebar
                user={adminUser}
                items={sidebarItems}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                onLogout={handleLogout}
                onBack={onBack}
                title="لوحة التحكم"
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header - Optimized for Touch */}
                <div className="md:hidden flex items-center justify-between h-14 px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-darkcard safe-area-padding-top">
                    <h1 className="text-base font-bold text-slate-800 dark:text-white truncate">لوحة التحكم</h1>
                    <Button
                        onClick={() => setIsSidebarOpen(true)}
                        variant="ghost"
                        size="icon"
                        className="touch-target -mr-2 text-slate-500 hover:text-primary transition-colors"
                    >
                        <Icon name="Menu" className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 scroll-smooth-mobile">
                    <div className="max-w-[1600px] mx-auto w-full space-y-6">
                        <Routes>
                            <Route index element={<OverviewView orders={allOrders} providers={allProviders} customers={allCustomers} withdrawals={withdrawalRequests} transactions={transactions} products={adminFlashProducts} stats={dashboardStats} onNavigate={handleSetView} onRefresh={async () => { await Promise.all([fetchOrders(true), fetchProviders(true), fetchFinancialData(true), fetchStats(true)]); }} />} />
                            <Route path="overview" element={<OverviewView orders={allOrders} providers={allProviders} customers={allCustomers} withdrawals={withdrawalRequests} transactions={transactions} products={adminFlashProducts} stats={dashboardStats} onNavigate={handleSetView} onRefresh={async () => { await Promise.all([fetchOrders(true), fetchProviders(true), fetchFinancialData(true), fetchStats(true)]); }} />} />
                            <Route path="orders" element={<OrdersView
                                orders={allOrders}
                                onToggleExpand={(id) => setExpandedOrderId(expandedOrderId === id ? null : id)}
                                expandedOrderId={expandedOrderId}
                                onApprovePayment={handleApprovePayment}
                                onRejectPayment={handleRejectPayment}
                                onUpdateStatus={handleUpdateOrderStatus}
                                onOpenShippingReceipt={setPrintOrder}
                                onUpdateShippingNotes={handleUpdateShippingNotes}
                                filterStatus={currentFilterStatus}
                                onRefresh={() => fetchOrders(true)}
                            />} />
                            <Route path="providers" element={<ProvidersView allProviders={allProviders} onSaveProvider={handleSaveProvider} onDeleteProvider={handleDeleteProvider} showToast={showToast} carCategories={carCategories} navigationParams={navigationParams} addManualDeposit={handleAddManualDeposit} onRefresh={() => fetchProviders(true)} />} />
                            <Route path="users" element={<UsersView allOrders={allOrders} />} />
                            <Route path="technicians" element={<TechniciansView addNotificationForUser={addNotificationForUser} showToast={showToast} navigationParams={navigationParams} technicianSpecialties={technicianSpecialties} settings={settings} />} />
                            <Route path="towTruckManagement" element={<TowTruckManagementView addNotificationForUser={addNotificationForUser} showToast={showToast} settings={settings} />} />
                            <Route path="settings" element={<SettingsView settings={settings} onSave={updateSettings} />} />
                            <Route path="ceoSettings" element={<CeoSettingsView settings={settings} onSave={updateSettings} />} />
                            <Route path="bulletinBoard" element={<BulletinBoardView showToast={showToast} />} />
                            <Route path="accounting" element={<AccountingView providers={allProviders} withdrawals={withdrawalRequests} transactions={transactions} onApproveWithdrawal={handleApproveWithdrawal} onRejectWithdrawal={handleRejectWithdrawal} onAddFunds={handleAddManualDeposit} onRefresh={() => fetchFinancialData(true)} />} />
                            <Route path="userWallet" element={<UserWalletManagementView showToast={showToast} />} />
                            <Route path="limits" element={<LimitsSettingsView settings={settings} onSave={updateSettings} />} />
                            <Route path="modelManagement" element={<ModelManagementView carCategories={carCategories} updateCarCategories={updateCarCategories} allBrands={allBrands} updateAllBrands={updateAllBrands} brandModels={brandModels} updateBrandModels={updateBrandModels} partTypes={partTypes} updatePartTypes={updatePartTypes} technicianSpecialties={technicianSpecialties} updateTechnicianSpecialties={updateTechnicianSpecialties} allModels={allModels} />} />
                            <Route path="paymentMethods" element={<PaymentMethodsView settings={settings} onSave={updateSettings} />} />
                            <Route path="whatsappManagement" element={<WhatsappManagementView settings={settings} onSave={updateSettings} />} />
                            <Route path="shipping" element={<ShippingView orders={allOrders} onUpdateStatus={handleUpdateOrderStatus} onOpenShippingReceipt={setPrintOrder} settings={settings} />} />
                            <Route path="shippingSettings" element={<ShippingSettingsView settings={settings} onSave={updateSettings} />} />
                            <Route path="messageTemplates" element={<MessageTemplatesView settings={settings} onSave={updateSettings} />} />
                            <Route path="notifications" element={<NotificationSettingsEditor settings={settings} onSave={updateSettings} />} />
                            <Route path="store_overview" element={<StoreOverview products={adminFlashProducts} requests={flashRequests} onNavigate={handleSetView} onRefresh={() => fetchProducts(true)} />} />
                            <Route path="store_products" element={<ProductManagement products={adminFlashProducts} updateProducts={updateAdminFlashProducts} storeCategories={storeCategories} technicianSpecialties={technicianSpecialties} showToast={showToast} settings={settings} />} />
                            <Route path="storeProducts" element={<Navigate to="store_products" replace />} />
                            <Route path="flashStore" element={<FlashProductManagement products={adminFlashProducts} updateProducts={updateAdminFlashProducts} storeCategories={storeCategories} technicianSpecialties={technicianSpecialties} showToast={showToast} settings={settings} />} />
                            <Route path="store_orders" element={<StoreOrderManagement requests={flashRequests} products={adminFlashProducts} updateRequests={updateFlashRequests} addNotificationForUser={addNotificationForUser} showToast={showToast} settings={settings} onPrintReceipt={() => { }} />} />
                            <Route path="store_settings" element={<StoreSettings categories={storeCategories} updateCategories={updateStoreCategories} showToast={showToast} settings={settings} updateSettings={updateSettings} />} />
                            <Route path="cacheManagement" element={<CacheManagementView showToast={showToast} cacheVersion={cacheVersion} />} />
                            <Route path="serverStatus" element={<ServerStatusView showToast={showToast} />} />
                            <Route path="maintenance" element={<MaintenanceView showToast={showToast} />} />
                            <Route path="seoManagement" element={<SeoManagementView settings={settings} onSave={updateSettings} />} />
                            <Route path="telegramManagement" element={<TelegramManagementView carCategories={carCategories} updateCarCategories={updateCarCategories} showToast={showToast} sendTelegramNotification={sendTelegramNotification} settings={settings} />} />
                            <Route path="blogManagement" element={<BlogManagementView />} />
                            <Route path="faqManagement" element={<FaqManagementView />} />
                            <Route path="reviewsManagement" element={<ReviewsManagementView showToast={showToast} />} />
                            <Route path="sendNotifications" element={<SendNotificationView showToast={showToast} />} />
                            <Route path="auctionManagement" element={<AuctionManagementView showToast={showToast} />} />
                            <Route path="schedulerManagement" element={<SchedulerManagementView showToast={showToast} />} />
                            <Route path="internationalLicenses" element={<InternationalLicenseManagementView showToast={showToast} />} />
                            <Route path="*" element={<Navigate to="" replace />} />
                        </Routes>
                    </div>
                </div>
            </main>

            {printOrder && <ShippingReceipt order={printOrder} settings={settings} onDone={() => setPrintOrder(null)} />}
        </div>
    );
};

export default AdminDashboard;
