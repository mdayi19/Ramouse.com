import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from './hooks/useAppState';
import { TOTAL_STEPS } from './constants';
// Initialize Laravel Echo for real-time notifications
import './lib/echo';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';
import { DirectoryService } from './services/directory.service';

// Eager imports for critical path
import Header from './components/Header';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import PublicMobileMenu from './components/PublicMobileMenu';
import Icon from './components/Icon';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Customer, Technician, TowTruck } from './types';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { usePWA } from './hooks/usePWA';
import { OfflineIndicator } from './components/PWA/OfflineIndicator';
import Preloader from './components/Preloader';
import { initAnalytics } from './lib/analytics';
import RouteTracker from './components/RouteTracker';

// Lazy loads
const WelcomeScreen = lazy(() => import('./components/WelcomeScreen'));
const OrderWizard = lazy(() => import('./components/OrderWizard'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));
const MyOrders = lazy(() => import('./components/MyOrders'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const ProviderDashboard = lazy(() => import('./components/ProviderDashboard'));
const AnnouncementsScreen = lazy(() => import('./components/AnnouncementsScreen'));
const CustomerDashboard = lazy(() => import('./components/CustomerDashboard'));
const NotificationCenter = lazy(() => import('./components/NotificationCenter'));
const TechnicianDashboard = lazy(() => import('./components/TechnicianDashboard'));
const TechnicianProfile = lazy(() => import('./components/TechnicianProfile'));
const TechnicianRegistration = lazy(() => import('./components/TechnicianRegistration'));
const BlogScreen = lazy(() => import('./components/BlogScreen'));
const BlogPostScreen = lazy(() => import('./components/BlogPostScreen'));
const FaqScreen = lazy(() => import('./components/FaqScreen'));
const PrivacyPolicyScreen = lazy(() => import('./components/PrivacyPolicyScreen'));
const TermsOfUseScreen = lazy(() => import('./components/TermsOfUseScreen'));
const ContactScreen = lazy(() => import('./components/ContactScreen'));
const TowTruckProfile = lazy(() => import('./components/TowTruckProfile'));
const TowTruckRegistration = lazy(() => import('./components/TowTruckRegistration'));
const TowTruckDashboard = lazy(() => import('./components/TowTruckDashboard'));

const TechnicianDirectory = lazy(() => import('./components/TechnicianDirectory').then(module => ({ default: module.TechnicianDirectory })));
const TowTruckDirectory = lazy(() => import('./components/TowTruckDirectory').then(module => ({ default: module.TowTruckDirectory })));
const StoreView = lazy(() => import('./components/Store/StoreView').then(module => ({ default: module.StoreView })));
const AuctionListPage = lazy(() => import('./components/CarAuction/AuctionListPage'));
const LiveAuctionRoom = lazy(() => import('./components/CarAuction/LiveAuctionRoom'));

import NotificationPermissionModal from './components/NotificationPermissionModal';

const PageLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-primary animate-in fade-in duration-300">
        <Icon name="Loader" className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">جاري التحميل...</p>
    </div>
);

const TowTruckProfileRouteWrapper = ({
    handleNavigate, userPhone, isCustomer, allCustomers, updateAllTowTrucks, showToast, isAuthenticated, onLoginClick
}: any) => {
    const { towTruckId } = useParams();
    const [towTruck, setTowTruck] = useState<TowTruck | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (towTruckId) {
            setLoading(true);
            DirectoryService.getTowTruck(towTruckId)
                .then(res => setTowTruck(res.data))
                .catch(err => {
                    console.error('Failed to fetch tow truck:', err);
                    showToast('فشل تحميل بيانات السطحة', 'error');
                })
                .finally(() => setLoading(false));
        }
    }, [towTruckId]);

    if (loading) return <PageLoader />;

    return towTruck ? (
        <TowTruckProfile
            towTruck={towTruck}
            onBack={() => handleNavigate('towTruckDirectory')}
            userPhone={userPhone}
            isCustomer={isCustomer}
            showToast={showToast}
            isAuthenticated={isAuthenticated}
            onLoginClick={onLoginClick}
        />
    ) : (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">سطحة غير موجودة</h2>
            <button onClick={() => handleNavigate('towTruckDirectory')} className="text-primary hover:underline">العودة للدليل</button>
        </div>
    );
};

const AuctionRoomWrapper = ({ isAuthenticated, showToast, user }: any) => {
    const { auctionId } = useParams();
    const navigate = useNavigate();
    const walletBalance = user?.wallet_balance || 0;
    const userId = user?.user_id || user?.id;

    if (!auctionId) return <Navigate to="/auctions" />;

    return (
        <LiveAuctionRoom
            auctionId={auctionId}
            onBack={() => navigate('/auctions')}
            isAuthenticated={isAuthenticated}
            showToast={showToast}
            walletBalance={walletBalance}
            userId={userId}
        />
    );
};

const App: React.FC = () => {
    const {
        isDarkMode, setIsDarkMode, currentStep, currentView, formData, orderNumber, isAuthenticated, isAdmin,
        isProvider, isTechnician, isTowTruck, loggedInProvider, loggedInTechnician, loggedInTowTruck, loggedInCustomer, userPhone,
        setLoggedInProvider, setLoggedInTechnician, setLoggedInTowTruck, setLoggedInCustomer,
        showLogin, notifications, setNotifications, isSubmitting, settings, announcements, toastMessages, setToastMessages,
        isLoading, navigationParams, setNavigationParams, isSidebarOpen, setIsSidebarOpen, isPublicMenuOpen, setIsPublicMenuOpen,
        carCategories, setCarCategories, allBrands, setAllBrands, brandModels, setBrandModels, partTypes, setPartTypes,
        allCustomers, setAllCustomers, allTechnicians, setAllTechnicians, allTowTrucks, setAllTowTrucks,
        technicianSpecialties, setTechnicianSpecialties, storeCategories, updateStoreCategories,
        selectedTechnician, selectedTowTruck, allOrders, allModels,
        blogPosts, faqItems, selectedPost, unreadCount, showToast, userName, updateAllOrders, updateAllTechnicians,
        updateAllTowTrucks, updateSettings, sendMessage, addNotificationForUser, handleLoginSuccess, handleLogout,
        handleStartNewOrder, resetForm, updateFormData, nextStep, prevStep, goToStep, submitForm, handleNavigate,
        publishAnnouncement, deleteAnnouncement, sendTelegramNotification, CACHE_VERSION, setShowLogin, setPostLoginAction
    } = useAppState();

    // PWA Install Hook
    const { deferredPrompt, installApp, isInstalled } = usePWA();

    const location = useLocation();
    const navigate = useNavigate();
    const [showSplash, setShowSplash] = useState(true);
    const [showNotificationModal, setShowNotificationModal] = useState(false);

    const handleSplashFinish = useCallback(() => {
        setShowSplash(false);
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Initialize Analytics (GA4 + GTM)
    useEffect(() => {
        initAnalytics();
    }, []);

    // Handle legacy hash-based URLs for backward compatibility
    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#?')) {
            console.log('🔍 Legacy URL Handler triggered:', hash);
            // Parse old hash-based URL parameters
            const params = new URLSearchParams(hash.substring(2)); // Remove '#?'
            const view = params.get('view');
            const towTruckId = params.get('towTruckId');
            const technicianId = params.get('technicianId');

            console.log('🔍 Parsed params:', { view, towTruckId, technicianId });

            // Redirect to new React Router paths
            if (view === 'towTruckProfile' && towTruckId) {
                console.log('🔀 Redirecting to tow truck profile');
                window.location.href = `/tow-trucks/${encodeURIComponent(towTruckId)}`;
            } else if (view === 'technicianProfile' && technicianId) {
                console.log('🔀 Redirecting to technician profile');
                window.location.href = `/technicians/${encodeURIComponent(technicianId)}`;
            }
        }
    }, [location]);

    // Fetch notifications and profile on login - optimized with ref to prevent double fetching
    const hasFetchedProfile = React.useRef(false);

    useEffect(() => {
        if (isAuthenticated && userPhone && !hasFetchedProfile.current) {
            hasFetchedProfile.current = true;

            // Fetch latest profile data to ensure UI is in sync with DB
            AuthService.getProfile()
                .then(user => {
                    if (!user) return;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    if (isTowTruck) setLoggedInTowTruck(user);
                    else if (isProvider) setLoggedInProvider(user);
                    else if (isTechnician) setLoggedInTechnician(user);
                    else setLoggedInCustomer(user);
                })
                .catch(err => {
                    console.error('Failed to fetch profile:', err);
                    showToast('فشل تحميل الملف الشخصي', 'error');
                });

            NotificationService.getAll()
                .then(data => {
                    if (data?.notifications) {
                        setNotifications(data.notifications);
                    }
                })
                .catch(err => console.error('Failed to fetch notifications:', err));

            // Handle Notification Logic with improved flow
            if ('Notification' in window && 'serviceWorker' in navigator) {
                console.log('🔵 [App] Notification Support: Supported. Current Permission:', Notification.permission);

                if (Notification.permission === 'default') {
                    console.log('🔵 [App] Permission is default. Scheduling modal...');
                    // Wait a bit for user to settle in before showing modal
                    setTimeout(() => {
                        console.log('🔵 [App] Showing notification permission modal now (2s delay passed)');
                        setShowNotificationModal(true);
                    }, 2000);
                } else if (Notification.permission === 'granted') {
                    // Already granted, ensure subscription is up to date (Silent)
                    console.log('🔵 [App] Permission already granted, syncing subscription...');

                    // Wait for service worker to be ready first
                    navigator.serviceWorker.ready
                        .then(() => {
                            console.log('🔵 [App] Service worker ready, attempting silent subscription sync');
                            return NotificationService.subscribeToPush();
                        })
                        .then(() => {
                            console.log('✅ [App] Silent subscription sync successful');
                        })
                        .catch(err => {
                            console.warn('⚠️ [App] Silent push sync failed:', err);
                        });
                } else {
                    console.log('⚠️ [App] Notification permission denied. Modal will NOT be shown.');
                }
            } else {
                console.warn('⚠️ [App] Notifications or Service Workers not supported');
            }
        }

        // Reset ref when user logs out
        if (!isAuthenticated) {
            hasFetchedProfile.current = false;
        }
    }, [isAuthenticated, userPhone, isTowTruck, isProvider, isTechnician]);

    // Real-time notification listener for admins
    useEffect(() => {
        if (isAdmin && userPhone) {
            console.log('🔔 Setting up real-time notifications for admin');

            const channel = window.Echo.private('admin.dashboard');

            channel.listen('.user.registered', (data: any) => {
                console.log('👤 New user registered:', data);

                // Add to notifications
                addNotificationForUser(userPhone, {
                    title: `مستخدم جديد: ${data.user.typeLabel}`,
                    message: `${data.user.name} (${data.user.phone})`,
                    type: 'NEW_PROVIDER_REQUEST',
                    link: {
                        view: 'adminDashboard',
                        params: { tab: 'users' }
                    }
                }, 'NEW_PROVIDER_REQUEST', data.user);
                showToast(`تم تسجيل مستخدم جديد: ${data.user.name}`, 'success');
            });

            channel.listen('.admin.technician.registered', (data: any) => {
                const userData = data.data;
                showToast(`فني جديد: ${userData.name}`, 'success');
                addNotificationForUser(userPhone, {
                    title: 'فني جديد',
                    message: `${userData.name} - ${userData.specialty}`,
                    type: 'NEW_TECHNICIAN_REQUEST',
                    link: { view: 'adminDashboard', params: { adminView: 'technicians' } }
                }, 'NEW_TECHNICIAN_REQUEST', userData);
            });

            channel.listen('.admin.provider.registered', (data: any) => {
                const userData = data.data;
                showToast(`مزود جديد: ${userData.name}`, 'success');
                addNotificationForUser(userPhone, {
                    title: 'مزود جديد',
                    message: `${userData.name}`,
                    type: 'NEW_PROVIDER_REQUEST',
                    link: { view: 'adminDashboard', params: { adminView: 'providers' } }
                }, 'NEW_PROVIDER_REQUEST', userData);
            });

            channel.listen('.admin.tow_truck.registered', (data: any) => {
                const userData = data.data;
                showToast(`سطحة جديدة: ${userData.name}`, 'success');
                addNotificationForUser(userPhone, {
                    title: 'سطحة جديدة',
                    message: `${userData.name} - ${userData.city}`,
                    type: 'NEW_TOW_TRUCK_REQUEST',
                    link: { view: 'adminDashboard', params: { adminView: 'towTruckManagement' } }
                }, 'NEW_TOW_TRUCK_REQUEST', userData);
            });

            // Listen for New Order (Crucial for Admin)
            channel.listen('.admin.order.created', (data: any) => {
                console.log('📦 Admin: New Order Created:', data);
                const orderData = data.data;
                addNotificationForUser(userPhone, {
                    title: 'طلب جديد',
                    message: `طلب رقم ${orderData.order_number}`,
                    type: 'ORDER_CREATED_ADMIN',
                    link: {
                        view: 'adminDashboard',
                        params: { adminView: 'orders' }
                    }
                }, 'ORDER_CREATED_ADMIN', orderData);
                showToast(`طلب جديد: ${orderData.order_number}`, 'info');
                try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
            });

            // Listen for New Deposit Requests
            channel.listen('.admin.USER_DEPOSIT_REQUEST', (data: any) => {
                console.log('💰 Admin: New Deposit Request:', data);
                addNotificationForUser(userPhone, {
                    title: 'طلب إيداع جديد',
                    message: `طلب إيداع بقيمة ${data.amount} من ${data.userName}`,
                    type: 'DEPOSIT_REQUEST',
                    link: {
                        view: 'adminDashboard',
                        params: { adminView: 'userWallet' }
                    }
                }, 'DEPOSIT_REQUEST', data);
                showToast(`طلب إيداع جديد من ${data.userName}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (e) { }
            });

            // Listen for New Withdrawal Requests
            channel.listen('.admin.USER_WITHDRAWAL_REQUEST', (data: any) => {
                console.log('💸 Admin: New Withdrawal Request:', data);
                addNotificationForUser(userPhone, {
                    title: 'طلب سحب جديد',
                    message: `طلب سحب بقيمة ${data.amount} من ${data.userName}`,
                    type: 'WITHDRAWAL_REQUEST',
                    link: {
                        view: 'adminDashboard',
                        params: { adminView: 'userWallet' }
                    }
                }, 'WITHDRAWAL_REQUEST', data);
                showToast(`طلب سحب جديد من ${data.userName}`, 'info');
                try { new Audio('/sound_info.wav').play().catch(() => { }); } catch (e) { }
            });

            // Listen for New Store Orders
            channel.listen('.admin.store_order.created', (data: any) => {
                console.log('🛒 Admin: New Store Order:', data);
                addNotificationForUser(userPhone, {
                    title: 'طلب متجر جديد',
                    message: `طلب جديد رقم ${data.data?.order_number || ''}`,
                    type: 'new_store_order',
                    link: {
                        view: 'adminDashboard',
                        params: { adminView: 'store_orders' }
                    }
                }, 'new_store_order', data);
                showToast('طلب متجر جديد', 'info');
                try { new Audio('/sound_new_order.wav').play().catch(() => { }); } catch (e) { }
            });

            return () => {
                console.log('🔴 Cleaning up admin notification listeners');
                window.Echo.leave('admin.dashboard');
                channel.stopListening('.user.registered');
                channel.stopListening('.admin.technician.registered');
                channel.stopListening('.admin.provider.registered');
                channel.stopListening('.admin.tow_truck.registered');
                channel.stopListening('.admin.order.created');
                channel.stopListening('.admin.USER_DEPOSIT_REQUEST');
                channel.stopListening('.admin.USER_WITHDRAWAL_REQUEST');
                channel.stopListening('.admin.store_order.created');
            };
        }
    }, [isAdmin, userPhone, addNotificationForUser, showToast]);

    // Global Real-time notification listener for ALL users
    useEffect(() => {
        // Get current user ID from local storage
        let userId: string | number | null = null;
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                // Use user_id if available (for Customer/Provider profiles), otherwise id (for Admin/User)
                userId = user.user_id || user.id;
            }
        } catch (e) {
            console.error('Failed to parse currentUser for ID', e);
        }

        if (isAuthenticated && userId) {
            console.log(`🔔 Setting up personal notification listener for user ID: ${userId}`);

            // Use user ID directly (no encoding needed)
            const channel = window.Echo.private(`user.${userId}`);

            channel.listen('.user.notification', (data: any) => {
                console.log('📨 New notification received:', data);

                // Add to notifications list locally
                const notificationData = data.notification;

                // Prevent duplicates - check if notification already exists
                setNotifications(prev => {
                    const exists = prev.some(n => n.id === notificationData.id);
                    if (exists) {
                        console.log('⚠️ Duplicate notification ignored:', notificationData.id);
                        return prev;
                    }
                    return [notificationData, ...prev];
                });

                // Show toast
                showToast(notificationData.title, 'info');

                // Play sound (optional)
                // Play sound based on notification type
                try {
                    let soundFile = '/notification.wav'; // Default (Money sound for wins)

                    const type = notificationData.type;
                    if (type === 'OFFER_ACCEPTED_PROVIDER_WIN' || type === 'FUNDS_DEPOSITED' || type === 'AUCTION_WON') {
                        soundFile = '/sound_money.wav';
                    } else if (type === 'NEW_ORDER_FOR_PROVIDER' || type === 'NEW_PROVIDER_REQUEST' || type === 'NEW_TECHNICIAN_REQUEST') {
                        soundFile = '/sound_new_order.wav';
                    } else if (type === 'OFFER_ACCEPTED_PROVIDER_LOSS' || type === 'PAYMENT_REJECTED' || type === 'ORDER_CANCELLED') {
                        soundFile = '/sound_error.wav';
                    } else {
                        // General status changes, info, etc.
                        soundFile = '/sound_info.wav';
                    }

                    const audio = new Audio(soundFile);
                    // Play audio silently catching errors to avoid console spam
                    audio.play().catch(() => { });
                } catch (e) {
                    // Ignore audio errors
                }
            });

            return () => {
                console.log(`🔴 Cleaning up personal notification listener for user ID: ${userId}`);
                window.Echo.leave(`user.${userId}`);
            };
        }
    }, [isAuthenticated, userPhone, setNotifications, showToast, isAdmin]);

    const handleLoginClick = () => setShowLogin(true);
    const handleCloseLogin = () => setShowLogin(false);

    const markNotificationsAsRead = useCallback(async () => {
        try {
            await NotificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
            showToast('فشل تحديث حالة الإشعارات', 'error');
        }
    }, [setNotifications, showToast]);

    const onClearAllNotifications = useCallback(async () => {
        try {
            await NotificationService.clearAll();
            setNotifications([]);
            showToast('تم مسح جميع الإشعارات', 'success');
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            showToast('فشل مسح الإشعارات', 'error');
        }
    }, [setNotifications, showToast]);

    const onDeleteNotification = useCallback(async (id: string) => {
        try {
            await NotificationService.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            showToast('تم حذف الإشعار', 'success');
        } catch (error) {
            console.error('Failed to delete notification:', error);
            showToast('فشل حذف الإشعار', 'error');
        }
    }, [setNotifications, showToast]);

    const onUpdateCustomer = useCallback(async (customerId: string, updatedData: Partial<Customer>, newPassword?: string) => {
        try {
            const payload = { ...updatedData, password: newPassword };
            await AuthService.updateProfile(payload);

            setAllCustomers(prev => prev.map(c =>
                c.id === customerId ? { ...c, ...updatedData } as Customer : c
            ));
            showToast('تم تحديث الملف الشخصي بنجاح', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast('فشل تحديث الملف الشخصي', 'error');
        }
    }, [setAllCustomers, showToast]);

    const onUpdateTechnician = useCallback(async (technicianId: string, updatedData: Partial<Technician>, newPassword?: string) => {
        try {
            if (newPassword) {
                await AuthService.updateProfile({ ...updatedData, password: newPassword });
            }
            const updated = allTechnicians.map(t =>
                t.id === technicianId ? { ...t, ...updatedData } as Technician : t
            );
            updateAllTechnicians(updated);
            showToast('تم تحديث الملف الشخصي بنجاح', 'success');
        } catch (error) {
            console.error('Failed to update technician:', error);
            showToast('فشل تحديث الملف الشخصي', 'error');
        }
    }, [allTechnicians, updateAllTechnicians, showToast]);

    const onUpdateTowTruck = useCallback(async (truckId: string, updatedData: Partial<TowTruck>, newPassword?: string) => {
        try {
            const payload = { ...updatedData, password: newPassword };
            if (truckId === userPhone) {
                await AuthService.updateProfile(payload);
                showToast('تم تحديث الملف الشخصي بنجاح', 'success');

                // Update loggedInTowTruck if it's the current user
                if (loggedInTowTruck && loggedInTowTruck.id === truckId) {
                    setLoggedInTowTruck({ ...loggedInTowTruck, ...updatedData });
                }
            }
            const updated = allTowTrucks.map(t =>
                t.id === truckId ? { ...t, ...updatedData } as TowTruck : t
            );
            updateAllTowTrucks(updated);
        } catch (error) {
            console.error('Failed to update tow truck profile:', error);
            showToast('فشل تحديث الملف الشخصي', 'error');
        }
    }, [userPhone, loggedInTowTruck, allTowTrucks, setLoggedInTowTruck, updateAllTowTrucks, showToast]);

    const getDashboardAction = useCallback(() => {
        if (isAdmin) return () => handleNavigate('adminDashboard');
        if (isProvider) return () => handleNavigate('providerDashboard');
        if (isTechnician) return () => handleNavigate('technicianDashboard');
        if (isTowTruck) return () => handleNavigate('towTruckDashboard');
        return () => handleNavigate('customerDashboard');
    }, [isAdmin, isProvider, isTechnician, isTowTruck, handleNavigate]);

    const getLoggedInCustomer = useMemo(() => {
        if (isAuthenticated && !isAdmin && !isProvider && !isTechnician && !isTowTruck) {
            return allCustomers.find(c => c.id === userPhone) || null;
        }
        return null;
    }, [isAuthenticated, isAdmin, isProvider, isTechnician, isTowTruck, allCustomers, userPhone]);

    const handleNavigationConsumed = useCallback(() => {
        setNavigationParams(null);
    }, [setNavigationParams]);

    const stepNames = ['الفئة', 'الشركة', 'الموديل', 'نوع القطعة', 'التفاصيل', 'مراجعة', 'تم الطلب'];

    const BlogPostRoute = () => {
        const { slug } = useParams();
        return slug ? <BlogPostScreen slug={slug} onBack={() => handleNavigate('blog')} /> : <Navigate to="/blog" />;
    };

    const TechnicianProfileRouteWrapper = ({
        handleNavigate, userPhone, isCustomer, allCustomers, updateAllTechnicians, showToast, isAuthenticated, onLoginClick, technicianSpecialties
    }: any) => {
        const { technicianId } = useParams();
        const [technician, setTechnician] = useState<Technician | null>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            if (technicianId) {
                setLoading(true);
                DirectoryService.getTechnician(technicianId)
                    .then(res => setTechnician(res.data))
                    .catch(err => {
                        console.error('Failed to fetch technician:', err);
                        showToast('فشل تحميل بيانات الفني', 'error');
                    })
                    .finally(() => setLoading(false));
            }
        }, [technicianId]);

        if (loading) return <PageLoader />;

        return technician ? (
            <TechnicianProfile
                technician={technician}
                onBack={() => handleNavigate('technicianDirectory')}
                technicianSpecialties={technicianSpecialties}
                userPhone={userPhone}
                isCustomer={isCustomer}
                showToast={showToast}
                isAuthenticated={isAuthenticated}
                onLoginClick={onLoginClick}
            />
        ) : (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-4">فني غير موجود</h2>
                <button onClick={() => handleNavigate('technicianDirectory')} className="text-primary hover:underline">العودة للدليل</button>
            </div>
        );
    };

    const showBottomNav = ['customerDashboard', 'providerDashboard', 'technicianDashboard', 'towTruckDashboard', 'notificationCenter'].includes(currentView);
    const isPublicView = ['welcome', 'store', 'technicianDirectory', 'technicianProfile', 'technicianRegistration', 'blog', 'blogPost', 'faq', 'privacyPolicy', 'termsOfUse', 'contact', 'towTruckDirectory', 'towTruckProfile', 'towTruckRegistration'].includes(currentView);
    const isDashboardView = ['adminDashboard', 'providerDashboard', 'customerDashboard', 'technicianDashboard', 'towTruckDashboard'].includes(currentView);

    if (isLoading) {
        // We can render Preloader here if we want to block completely, OR we can render the app hidden behind it.
        // To optimize perception, let's render the app structure but cover it with Preloader.
        // However, some hooks might need data. 'isLoading' from useAppState typically means DB init is done.
        // If we render Routes before DB is ready, we might get errors if components expect daat.
        // But our goal is to show Preloader *while* loading.
    }

    return (
        <div className={`min-h-screen flex flex-col font-sans bg-sky-50 dark:bg-darkbg text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
            <AnimatePresence>
                {showSplash && (
                    <Preloader
                        key="main-preloader"
                        onFinish={handleSplashFinish}
                        isLoading={isLoading}
                    />
                )}
            </AnimatePresence>            <OfflineIndicator />
            <InstallPrompt deferredPrompt={deferredPrompt} installApp={installApp} />
            <Header
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                isProvider={isProvider}
                isTechnician={isTechnician}
                isTowTruck={isTowTruck}
                onLogout={handleLogout}
                userPhone={userPhone}
                userName={userName}
                onGoToOrders={() => handleNavigate('customerDashboard')}
                onGoToAdmin={() => handleNavigate('adminDashboard')}
                onGoToProvider={() => handleNavigate('providerDashboard')}
                onGoToTechnician={() => handleNavigate('technicianDashboard')}
                onGoToTowTruck={() => handleNavigate('towTruckDashboard')}
                onGoToAnnouncements={() => handleNavigate('announcements')}
                onGoToNotifications={() => handleNavigate('notificationCenter')}
                onLoginClick={handleLoginClick}
                notifications={notifications}
                unreadCount={unreadCount}
                markNotificationsAsRead={markNotificationsAsRead}
                settings={settings}
                onStartNewOrder={handleStartNewOrder}
                onClearAllNotifications={onClearAllNotifications}
                onDeleteNotification={onDeleteNotification}
                onNavigate={handleNavigate}
                showMobileMenuButton={isPublicView || (isAuthenticated && isDashboardView)}
                onMobileMenuClick={() => {
                    if (isDashboardView && isAuthenticated) setIsSidebarOpen(true);
                    else setIsPublicMenuOpen(true);
                }}
            />

            <main className="flex-grow w-full px-4 sm:px-6 py-8 flex flex-col pb-28 md:pb-8">
                <ErrorBoundary>
                    <Suspense fallback={<PageLoader />}>
                        <RouteTracker />
                        <Routes>
                            <Route path="/" element={<WelcomeScreen onStart={handleStartNewOrder} onViewOrders={() => handleNavigate(isAdmin ? 'adminDashboard' : isProvider ? 'providerDashboard' : 'customerDashboard')} onViewAnnouncements={() => handleNavigate('announcements')} isAuthenticated={isAuthenticated} onNavigate={handleNavigate} onLoginClick={handleLoginClick} showInstallPrompt={!!deferredPrompt && !isInstalled} installApp={installApp} isInstalled={isInstalled} technicianSpecialties={technicianSpecialties} />} />
                            <Route path="/order" element={
                                <OrderWizard
                                    currentStep={currentStep}
                                    totalSteps={TOTAL_STEPS}
                                    stepNames={stepNames}
                                    formData={formData}
                                    updateFormData={updateFormData}
                                    nextStep={nextStep}
                                    prevStep={prevStep}
                                    goToStep={goToStep}
                                    submitForm={submitForm}
                                    resetForm={resetForm}
                                    isSubmitting={isSubmitting}
                                    orderNumber={orderNumber}
                                    carCategories={carCategories}
                                    allBrands={allBrands}
                                    brandModels={brandModels}
                                    partTypes={partTypes}
                                    settings={settings}
                                />
                            } />
                            <Route path="/my-orders" element={isAuthenticated ? <MyOrders allOrders={allOrders} updateAllOrders={updateAllOrders} userPhone={userPhone} onBack={() => handleNavigate('welcome')} addNotificationForUser={addNotificationForUser} settings={settings} isLoading={isLoading} showToast={showToast} onUpdateCustomer={onUpdateCustomer} /> : <Navigate to="/" replace />} />
                            <Route path="/announcements" element={<AnnouncementsScreen onBack={() => handleNavigate('welcome')} isAuthenticated={isAuthenticated} isProvider={isProvider} isTechnician={isTechnician} isTowTruck={isTowTruck} />} />
                            <Route path="/store" element={<StoreView customer={loggedInCustomer} provider={loggedInProvider} technician={loggedInTechnician} towTruck={loggedInTowTruck} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} onLoginRequest={() => { setPostLoginAction(() => () => { }); setShowLogin(true); }} storeCategories={storeCategories} />} />
                            <Route path="/store/product/:productId" element={<StoreView customer={loggedInCustomer} provider={loggedInProvider} technician={loggedInTechnician} towTruck={loggedInTowTruck} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} onLoginRequest={() => { setPostLoginAction(() => () => { }); setShowLogin(true); }} storeCategories={storeCategories} />} />
                            <Route path="/admin/*" element={isAdmin ? <AdminDashboard allOrders={allOrders} updateAllOrders={updateAllOrders} onBack={handleLogout} addNotificationForUser={addNotificationForUser} settings={settings} updateSettings={updateSettings} announcements={announcements} publishAnnouncement={async (post) => { publishAnnouncement(post); }} deleteAnnouncement={deleteAnnouncement} isLoading={isLoading} showToast={showToast} carCategories={carCategories} updateCarCategories={setCarCategories} allBrands={allBrands} updateAllBrands={setAllBrands} brandModels={brandModels} updateBrandModels={setBrandModels} partTypes={partTypes} updatePartTypes={setPartTypes} allTechnicians={allTechnicians} updateAllTechnicians={updateAllTechnicians} allTowTrucks={allTowTrucks} updateAllTowTrucks={updateAllTowTrucks} technicianSpecialties={technicianSpecialties} updateTechnicianSpecialties={setTechnicianSpecialties} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} sendTelegramNotification={sendTelegramNotification} cacheVersion={CACHE_VERSION} storeCategories={storeCategories} updateStoreCategories={updateStoreCategories} allModels={allModels} /> : <Navigate to="/" replace />} />
                            <Route path="/provider/*" element={isProvider ? (loggedInProvider ? <ProviderDashboard provider={loggedInProvider} allOrders={allOrders} updateAllOrders={updateAllOrders} onBack={() => handleNavigate('welcome')} addNotificationForUser={addNotificationForUser} settings={settings} isLoading={isLoading} showToast={showToast} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onLogout={handleLogout} userPhone={userPhone} onNavigate={handleNavigate} currentView={currentView} unreadCount={unreadCount} storeCategories={storeCategories} /> : <PageLoader />) : <Navigate to="/" replace />} />
                            <Route path="/dashboard/*" element={isAuthenticated ? <CustomerDashboard allOrders={allOrders} updateAllOrders={updateAllOrders} userPhone={userPhone} showToast={showToast} settings={settings} addNotificationForUser={addNotificationForUser} isLoading={isLoading} onStartNewOrder={handleStartNewOrder} onBack={() => handleNavigate('welcome')} onUpdateCustomer={onUpdateCustomer} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} allBrands={allBrands} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onLogout={handleLogout} onNavigate={handleNavigate} currentView={currentView} unreadCount={unreadCount} storeCategories={storeCategories} customer={loggedInCustomer} /> : <Navigate to="/" replace />} />
                            <Route path="/notifications" element={isAuthenticated ? <NotificationCenter notifications={notifications} setNotifications={setNotifications} onNavigate={handleNavigate} onBack={() => handleNavigate(isAdmin ? 'adminDashboard' : isProvider ? 'providerDashboard' : isTechnician ? 'technicianDashboard' : isTowTruck ? 'towTruckDashboard' : 'customerDashboard')} onDeleteNotification={onDeleteNotification} onClearAllNotifications={onClearAllNotifications} /> : <Navigate to="/" replace />} />
                            <Route path="/technician/*" element={isTechnician ? (loggedInTechnician ? <TechnicianDashboard allOrders={allOrders} updateAllOrders={updateAllOrders} technician={loggedInTechnician} onBack={() => handleNavigate('welcome')} showToast={showToast} updateTechnicianData={onUpdateTechnician} onStartNewOrder={handleStartNewOrder} userPhone={userPhone} addNotificationForUser={addNotificationForUser} settings={settings} isLoading={isLoading} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} technicianSpecialties={technicianSpecialties} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onLogout={handleLogout} onNavigate={handleNavigate} currentView={currentView} unreadCount={unreadCount} storeCategories={storeCategories} /> : <PageLoader />) : <Navigate to="/" replace />} />
                            <Route path="/technicians" element={<TechnicianDirectory allTechnicians={allTechnicians} onBack={() => handleNavigate('welcome')} onViewProfile={(technicianId) => handleNavigate('technicianProfile', { technicianId })} technicianSpecialties={technicianSpecialties} showToast={showToast} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} />} />
                            <Route path="/technicians/:technicianId" element={<TechnicianProfileRouteWrapper handleNavigate={handleNavigate} userPhone={userPhone} isCustomer={!isAdmin && !isProvider && !isTechnician && !isTowTruck} allCustomers={allCustomers} updateAllTechnicians={updateAllTechnicians} showToast={showToast} isAuthenticated={isAuthenticated} onLoginClick={handleLoginClick} technicianSpecialties={technicianSpecialties} />} />
                            <Route path="/register-technician" element={<TechnicianRegistration allTechnicians={allTechnicians} onRegisterTechnician={(tech) => updateAllTechnicians([...allTechnicians, tech])} onBack={() => handleNavigate('welcome')} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} technicianSpecialties={technicianSpecialties} />} />
                            <Route path="/tow-trucks" element={<TowTruckDirectory onBack={() => handleNavigate('welcome')} onViewProfile={(towTruckId: string) => handleNavigate('towTruckProfile', { towTruckId })} showToast={showToast} />} />
                            <Route path="/tow-trucks/:towTruckId" element={<TowTruckProfileRouteWrapper handleNavigate={handleNavigate} userPhone={userPhone} isCustomer={!isAdmin && !isProvider && !isTechnician && !isTowTruck} allCustomers={allCustomers} updateAllTowTrucks={updateAllTowTrucks} showToast={showToast} isAuthenticated={isAuthenticated} onLoginClick={handleLoginClick} />} />
                            <Route path="/register-tow-truck" element={<TowTruckRegistration onBack={() => handleNavigate('welcome')} showToast={showToast} addNotificationForUser={addNotificationForUser} settings={settings} />} />
                            <Route path="/tow-truck-dashboard/*" element={isTowTruck ? (loggedInTowTruck ? <TowTruckDashboard allOrders={allOrders} updateAllOrders={updateAllOrders} towTruck={loggedInTowTruck} onBack={() => handleNavigate('welcome')} showToast={showToast} updateTowTruckData={onUpdateTowTruck} settings={settings} onStartNewOrder={handleStartNewOrder} addNotificationForUser={addNotificationForUser} isLoading={isLoading} navigationParams={navigationParams} onNavigationConsumed={handleNavigationConsumed} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} onLogout={handleLogout} userPhone={userPhone} onNavigate={handleNavigate} currentView={currentView} unreadCount={unreadCount} storeCategories={storeCategories} /> : <PageLoader />) : <Navigate to="/" replace />} />
                            <Route path="/blog" element={<BlogScreen onReadMore={(slug) => handleNavigate('blogPost', { slug })} onBack={() => handleNavigate('welcome')} />} />
                            <Route path="/blog/:slug" element={<BlogPostRoute />} />
                            <Route path="/faq" element={<FaqScreen onBack={() => handleNavigate('welcome')} />} />
                            <Route path="/privacy" element={<PrivacyPolicyScreen onBack={() => handleNavigate('welcome')} />} />
                            <Route path="/terms" element={<TermsOfUseScreen onBack={() => handleNavigate('welcome')} />} />
                            <Route path="/contact" element={<ContactScreen onBack={() => handleNavigate('welcome')} settings={settings} showToast={showToast} />} />

                            {/* Auction Routes */}
                            <Route path="/auctions" element={<AuctionListPage onSelectAuction={(auction) => navigate(`/auctions/${auction.id}`)} showToast={showToast} />} />
                            <Route path="/auctions/:auctionId" element={<AuctionRoomWrapper isAuthenticated={isAuthenticated} showToast={showToast} user={loggedInProvider || loggedInTechnician || loggedInTowTruck || loggedInCustomer} />} />

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </main>

            {!isDashboardView && <Footer settings={settings} onNavigate={(view) => handleNavigate(view as any)} className={showBottomNav ? 'hidden md:block' : ''} />}

            {isPublicMenuOpen && (
                <PublicMobileMenu
                    isOpen={isPublicMenuOpen}
                    onClose={() => setIsPublicMenuOpen(false)}
                    onNavigate={(view, params) => { handleNavigate(view, params); setIsPublicMenuOpen(false); }}
                    onLoginClick={() => { handleLoginClick(); setIsPublicMenuOpen(false); }}
                    isAuthenticated={isAuthenticated}
                    onGoToDashboard={() => { getDashboardAction()(); setIsPublicMenuOpen(false); }}
                    onLogout={() => { handleLogout(); setIsPublicMenuOpen(false); }}
                />
            )}

            <Suspense fallback={null}>
                {showLogin && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]" onClick={handleCloseLogin}>
                        <LoginScreen
                            onLoginSuccess={handleLoginSuccess}
                            onClose={handleCloseLogin}
                            settings={settings}
                            sendMessage={sendMessage}
                            addNotificationForUser={addNotificationForUser}
                            showToast={showToast}
                            onGoToTechnicianRegistration={() => { handleNavigate('technicianRegistration'); handleCloseLogin(); }}
                            onGoToTowTruckRegistration={() => { handleNavigate('towTruckRegistration'); handleCloseLogin(); }}
                        />
                    </div>
                )}
            </Suspense>

            <NotificationPermissionModal
                isOpen={showNotificationModal}
                onClose={() => setShowNotificationModal(false)}
                onPermissionGranted={() => setShowNotificationModal(false)}
            />
            <ToastContainer messages={toastMessages} setMessages={setToastMessages} />
        </div>
    );
}

export default App;