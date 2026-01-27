import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { View, Technician, TowTruck, BlogPost } from '../types';
import { db } from '../lib/db';

// Import new hooks
import { useAuth } from './useAuth';
import { useVehicleData } from './useVehicleData';
import { useSettings } from './useSettings';
import { useNotifications } from './useNotifications';
import { useOrderForm } from './useOrderForm';
import { useAppData } from './useAppData';
import { usePWA } from './usePWA';

const CACHE_VERSION = '1.3.2';

export const useAppState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [selectedTowTruck, setSelectedTowTruck] = useState<TowTruck | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Initialize Sub-Hooks
  // Note: We need to pass dependencies between hooks carefully

  // 1. App Data (General Data)
  const appData = useAppData();

  // 2. Settings (Needs Admin check, but Auth needs Settings for admin phone check... circular dependency?)
  // Solution: useSettings loads settings independently. useAuth uses the *loaded* settings.
  // However, useSettings needs 'isAdmin' to fetch from API.
  // We'll initialize useSettings with a temporary isAdmin=false, then update it.
  // Actually, useAuth determines isAdmin based on settings.adminPhone.
  // Let's split the dependency: useAuth takes settings.
  // useSettings takes isAdmin.
  // This is a cycle.
  // Break cycle: useAuth determines isAdmin based on local storage OR settings.
  // Let's instantiate useSettings first. It loads from local storage immediately.
  // Then useAuth uses that.
  // Then useSettings updates if isAdmin becomes true.

  // We need a way to pass the *current* isAdmin to useSettings.
  // But useAuth provides isAdmin.
  // React hooks run in order.

  // Let's use a ref or just let the next render cycle handle the update.
  // We'll pass a "derived" isAdmin to useSettings in the component body.

  // 1. Notifications (Independent-ish)
  // We need userPhone for notifications.
  // We'll initialize it, but it needs userPhone which comes from useAuth.
  // We'll pass userPhone later.

  // Let's structure it:
  // 1. Settings (Loads initial settings)
  // 2. Auth (Uses settings to determine admin)
  // 3. VehicleData (Uses isAdmin)
  // 4. Notifications (Uses userPhone)
  // 5. OrderForm (Uses isAuthenticated)

  // 1. Settings
  // We need a way to know if admin *before* useAuth? No, useAuth tells us.
  // We will pass a "proxy" isAdmin to useSettings.
  // For the first render, isAdmin is false.
  const [isAdminProxy, setIsAdminProxy] = useState(false);

  // Notifications needs showToast, so we need that first.
  // But useNotifications *provides* showToast.
  // So we instantiate useNotifications first with empty phone, then update?
  // Or we extract showToast logic?
  // Let's use useNotifications first.

  // We need userPhone for notifications.
  const [userPhoneProxy, setUserPhoneProxy] = useState('');

  const notifications = useNotifications(userPhoneProxy);
  const { showToast } = notifications;

  const settingsHook = useSettings(isAdminProxy, showToast);
  const { settings } = settingsHook;

  const auth = useAuth(settings, appData.allCustomers);

  // Update proxies when auth changes
  useEffect(() => {
    setIsAdminProxy(auth.isAdmin);
    setUserPhoneProxy(auth.userPhone);
  }, [auth.isAdmin, auth.userPhone]);

  const vehicleData = useVehicleData(auth.isAdmin, showToast);

  const orderForm = useOrderForm(auth.isAuthenticated, showToast, auth.setShowLogin, auth.loggedInCustomer);

  // PWA
  const pwa = usePWA();

  // Derived currentView from location.pathname
  const currentView = useMemo<View>(() => {
    const path = location.pathname;
    if (path === '/') return 'welcome';
    if (path === '/order') return 'newOrder';
    if (path === '/my-orders') return 'myOrders';
    if (path === '/announcements') return 'announcements';
    if (path === '/store') return 'store';
    if (path === '/admin') return 'adminDashboard';
    if (path === '/provider') return 'providerDashboard';
    if (path === '/dashboard') return 'customerDashboard';
    if (path === '/notifications') return 'notificationCenter';
    if (path === '/technician') return 'technicianDashboard';
    if (path === '/technicians') return 'technicianDirectory';
    if (path.startsWith('/technicians/')) return 'technicianProfile';
    if (path === '/register-technician') return 'technicianRegistration';
    if (path === '/tow-trucks') return 'towTruckDirectory';
    if (path.startsWith('/tow-trucks/')) return 'towTruckProfile';
    if (path === '/register-tow-truck') return 'towTruckRegistration';
    if (path === '/tow-truck-dashboard') return 'towTruckDashboard';
    if (path === '/car-provider-dashboard') return 'carProviderDashboard';
    if (path === '/blog') return 'blog';
    if (path.startsWith('/blog/')) return 'blogPost';
    if (path === '/faq') return 'faq';
    if (path === '/privacy') return 'privacyPolicy';
    if (path === '/terms') return 'termsOfUse';
    if (path === '/contact') return 'contact';
    if (path.startsWith('/car-listings')) return 'car-listings';
    if (path.startsWith('/rent-car')) return 'rent-car';
    if (path === '/ai-usage') return 'aiUsage';
    return 'welcome';
  }, [location.pathname]);

  // Navigation params
  const navigationParams = useMemo(() => location.state || null, [location.state]);
  const setNavigationParams = useCallback((params: any) => {
    navigate(location.pathname, { state: params, replace: true });
  }, [navigate, location.pathname]);

  const handleNavigate = useCallback((view: View, params: any = null) => {
    let path = '/';
    switch (view) {
      case 'welcome': path = '/'; break;
      case 'newOrder': path = '/order'; break;
      case 'myOrders': path = '/my-orders'; break;
      case 'announcements': path = '/announcements'; break;
      case 'store': path = '/store'; break;
      case 'adminDashboard': path = '/admin'; break;
      case 'providerDashboard': path = '/provider'; break;
      case 'customerDashboard': path = '/dashboard'; break;
      case 'notificationCenter': path = '/notifications'; break;
      case 'technicianDashboard': path = '/technician'; break;
      case 'technicianDirectory': path = '/technicians'; break;
      case 'technicianProfile': path = params?.technicianId ? `/technicians/${params.technicianId}` : '/technicians'; break;
      case 'technicianRegistration': path = '/register-technician'; break;
      case 'towTruckDirectory': path = '/tow-trucks'; break;
      case 'towTruckProfile': path = params?.towTruckId ? `/tow-trucks/${params.towTruckId}` : '/tow-trucks'; break;
      case 'towTruckRegistration': path = '/register-tow-truck'; break;
      case 'towTruckDashboard': path = '/tow-truck-dashboard'; break;
      case 'carProviderDashboard': path = '/car-provider-dashboard'; break;
      case 'carProviderRegistration': path = '/register-car-provider'; break;
      case 'blog': path = '/blog'; break;
      case 'blogPost': path = params?.slug ? `/blog/${params.slug}` : '/blog'; break;
      case 'faq': path = '/faq'; break;
      case 'privacyPolicy': path = '/privacy'; break;
      case 'termsOfUse': path = '/terms'; break;
      case 'contact': path = '/contact'; break;
      case 'car-listings': path = '/car-listings'; break;
      case 'rent-car': path = '/rent-car'; break;
      case 'aiUsage': path = '/ai-usage'; break;
      default: path = '/';
    }
    navigate(path, { state: params });
    window.scrollTo(0, 0);
  }, [navigate]);

  // Initial DB Init
  useEffect(() => {
    const initDb = async () => {
      await db.init();
      setIsLoading(false);
    };
    initDb();
  }, []);

  return {
    // Auth
    ...auth,
    loggedInCustomer: auth.loggedInCustomer,
    setLoggedInCustomer: auth.setLoggedInCustomer,

    // Vehicle Data
    ...vehicleData,

    // Settings
    ...settingsHook,

    // Notifications
    ...notifications,

    // Order Form
    ...orderForm,

    // App Data
    ...appData,

    // UI State
    isDarkMode: settingsHook.isDarkMode, setIsDarkMode: settingsHook.setIsDarkMode,
    currentView,
    isLoading, setIsLoading,
    navigationParams, setNavigationParams,
    isSidebarOpen, setIsSidebarOpen,
    isPublicMenuOpen, setIsPublicMenuOpen,
    selectedTechnician, setSelectedTechnician,
    selectedTowTruck, setSelectedTowTruck,
    selectedPost, setSelectedPost,

    // PWA
    ...pwa,

    // Misc
    handleNavigate,
    CACHE_VERSION,
  };
};