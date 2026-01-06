import React, { useState, useEffect, useRef } from 'react';
import { Notification, Settings, OrderFormData } from '../types';
import Icon from './Icon';
import NotificationDropdown from './NotificationDropdown';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface HeaderProps {
    isDarkMode: boolean;
    setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isProvider: boolean;
    isTechnician: boolean;
    isTowTruck: boolean;
    onLogout: () => void;
    userPhone: string;
    userName?: string;
    onGoToOrders: () => void;
    onGoToAdmin: () => void;
    onGoToProvider: () => void;
    onGoToTechnician: () => void;
    onGoToTowTruck: () => void;
    onGoToAnnouncements: () => void;
    onGoToNotifications: () => void;
    onLoginClick: () => void;
    notifications: Notification[];
    unreadCount: number;
    markNotificationsAsRead: () => void;
    settings: Settings;
    onStartNewOrder: (prefillData?: Partial<OrderFormData>) => void;
    onClearAllNotifications: () => void;
    onDeleteNotification: (id: string) => void;
    onNavigate: (view: any, params?: any) => void;
    showMobileMenuButton?: boolean;
    onMobileMenuClick?: () => void;
    deferredPrompt?: any;
    installApp?: () => Promise<boolean>;
}

const Header: React.FC<HeaderProps> = ({
    isDarkMode, setIsDarkMode, isAuthenticated, isAdmin, isProvider, isTechnician, isTowTruck, onLogout, userPhone,
    userName, onGoToOrders, onGoToAdmin, onGoToProvider, onGoToTechnician, onGoToTowTruck, onGoToAnnouncements, onGoToNotifications, onLoginClick,
    notifications, unreadCount, markNotificationsAsRead,
    settings,
    onStartNewOrder,
    onClearAllNotifications,
    onDeleteNotification,
    onNavigate,
    showMobileMenuButton = false,
    onMobileMenuClick,
    deferredPrompt,
    installApp
}) => {
    const [isNotifyDropdownOpen, setIsNotifyDropdownOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const notifyDropdownRef = useRef<HTMLDivElement>(null);
    const profileDropdownRef = useRef<HTMLDivElement>(null);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleNotificationClick = () => {
        if (!isNotifyDropdownOpen && unreadCount > 0) markNotificationsAsRead();
        setIsNotifyDropdownOpen(prev => !prev);
        setIsProfileDropdownOpen(false);
    };

    const handleProfileClick = () => {
        setIsProfileDropdownOpen(prev => !prev);
        setIsNotifyDropdownOpen(false);
    }

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 10);
                    // Calculate scroll progress - throttled  
                    const totalScroll = document.documentElement.scrollTop;
                    const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    if (windowHeight > 0) {
                        setScrollProgress(totalScroll / windowHeight);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifyDropdownRef.current && !notifyDropdownRef.current.contains(event.target as Node)) setIsNotifyDropdownOpen(false);
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setIsProfileDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDashboardAction = () => {
        if (isAdmin) return onGoToAdmin;
        if (isProvider) return onGoToProvider;
        if (isTechnician) return onGoToTechnician;
        if (isTowTruck) return onGoToTowTruck;
        return onGoToOrders;
    };

    const getUserRole = () => {
        if (isAdmin) return "مدير النظام";
        if (isProvider) return "مزود خدمة";
        if (isTechnician) return "فني";
        if (isTowTruck) return "خدمة سطحات";
        return "عميل";
    };

    // --- NavLink (Touch-Friendly) ---
    const NavLink = ({ label, onClick, icon, isActive = false }: any) => (
        <button
            onClick={onClick}
            className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-medium transition-colors duration-200 flex items-center gap-1.5 sm:gap-2 group min-h-[40px]
        ${isActive
                    ? 'bg-secondary/10 text-secondary'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-300 hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {icon && <Icon name={icon} className={`w-4 h-4 transition-colors ${isActive ? 'text-secondary' : 'text-slate-400 group-hover:text-primary'}`} />}
            <span className="text-sm sm:text-base">{label}</span>
            <span className={`absolute bottom-1 left-3 right-3 h-0.5 bg-secondary transform scale-x-0 transition-transform duration-200 origin-right group-hover:scale-x-100 ${isActive ? 'scale-x-100' : ''}`} aria-hidden="true" />
        </button>
    );

    return (
        <>
            <header
                className={`sticky top-0 z-50 w-full transition-all duration-500 border-b ${isScrolled
                    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 shadow-sm py-2'
                    : 'bg-transparent border-transparent py-4'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">

                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group relative z-20"
                            onClick={() => onNavigate('welcome')}
                        >
                            <img
                                src={settings.logoUrl || "/logo without name.svg"}
                                alt={settings.appName || 'Ramouse'}
                                className="relative z-10 w-12 h-12 md:w-14 md:h-14 object-contain transition-all duration-500 group-hover:scale-105 drop-shadow-lg"
                            />

                            <div className="flex flex-col">
                                <span className="text-2xl md:text-3xl font-black text-primary dark:text-white tracking-tighter leading-none">
                                    {settings.appName || 'راموسة'}
                                    <span className="text-secondary inline-block animate-pulse ml-0.5">.</span>
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase mt-0.5 group-hover:text-secondary transition-colors duration-300">
                                    Auto Parts
                                </span>
                            </div>
                        </div>

                        {/* Desktop Navigation - Pill Style */}
                        <div className="hidden lg:flex items-center mx-4">
                            <nav className="flex items-center p-1.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                <NavLink label="الرئيسية" onClick={() => onNavigate('welcome')} />
                                <NavLink label="المتجر" icon="ShoppingBag" onClick={() => onNavigate('store')} />
                                <NavLink label="المدونة" onClick={() => onNavigate('blog')} />

                                {/* Car Marketplace Links */}
                                <NavLink label="سوق السيارات" icon="Car" onClick={() => onNavigate('car-marketplace')} />
                                <NavLink label="استئجار سيارة" icon="MapPin" onClick={() => onNavigate('rent-car')} />

                                {isAuthenticated && (
                                    <>
                                        <NavLink label="لوحة التحكم" icon="LayoutDashboard" onClick={getDashboardAction()} />
                                        <NavLink label="الإعلانات" onClick={onGoToAnnouncements} />
                                    </>
                                )}

                                {!isAuthenticated && (
                                    <NavLink label="تواصل معنا" onClick={() => onNavigate('contact')} />
                                )}
                            </nav>
                        </div>

                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3 md:gap-4 z-20">

                            {/* Install App Button (PWA) */}
                            {deferredPrompt && (
                                <Button
                                    onClick={installApp}
                                    className="hidden md:flex gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 text-white border-0"
                                >
                                    <Icon name="Download" className="w-4 h-4" />
                                    <span>تثبيت</span>
                                </Button>
                            )}

                            {/* Auth Buttons */}
                            {isAuthenticated && !isAdmin && !isProvider ? (
                                <Button
                                    onClick={() => onStartNewOrder()}
                                    className="hidden md:flex gap-2 bg-gradient-to-r from-secondary to-orange-400 hover:from-secondary-500 hover:to-orange-500 text-primary-900 font-bold rounded-full shadow-lg shadow-secondary/20 border-0 hover:-translate-y-0.5 transition-transform"
                                >
                                    <Icon name="CirclePlus" className="w-5 h-5" />
                                    <span>طلب جديد</span>
                                </Button>
                            ) : !isAuthenticated && (
                                <div className="flex items-center gap-2">
                                    {/* Install Button for Guests */}
                                    {deferredPrompt && (
                                        <Button
                                            onClick={installApp}
                                            className="hidden md:flex gap-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                            size="sm"
                                        >
                                            <Icon name="Download" className="w-4 h-4" />
                                            <span>تثبيت التطبيق</span>
                                        </Button>
                                    )}
                                    <Button
                                        onClick={onLoginClick}
                                        className="gap-2 bg-primary hover:bg-primary-800 text-white rounded-full shadow-lg shadow-primary/20 px-6 border-0"
                                    >
                                        <Icon name="LogIn" className="w-4 h-4" />
                                        <span>دخول</span>
                                    </Button>
                                </div>
                            )}

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all hover:rotate-12 hover:text-secondary group"
                                aria-label="Toggle dark mode"
                            >
                                <Icon name={isDarkMode ? 'Sun' : 'Moon'} className="w-5 h-5 transition-colors" />
                            </button>

                            {/* Authenticated User Menu */}
                            {isAuthenticated && (
                                <>
                                    <div className="relative" ref={notifyDropdownRef}>
                                        <button
                                            onClick={handleNotificationClick}
                                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${isNotifyDropdownOpen
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Icon name="Bell" className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce-subtle' : ''}`} />
                                            {unreadCount > 0 && (
                                                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                                </span>
                                            )}
                                        </button>
                                        {isNotifyDropdownOpen && <NotificationDropdown notifications={notifications} onClose={() => setIsNotifyDropdownOpen(false)} onViewAll={onGoToNotifications} onClearAll={onClearAllNotifications} onDelete={onDeleteNotification} onNavigate={onNavigate} />}
                                    </div>

                                    <div className="relative" ref={profileDropdownRef}>
                                        <button
                                            onClick={handleProfileClick}
                                            className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                                        >
                                            <div className="w-9 h-9 bg-gradient-to-br from-secondary to-orange-400 rounded-full flex items-center justify-center text-primary-900 font-bold shadow-md">
                                                {userName ? userName.charAt(0).toUpperCase() : <Icon name="User" className="w-5 h-5" />}
                                            </div>
                                        </button>

                                        {isProfileDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-4 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden origin-top-left ring-1 ring-black/5">
                                                {/* User Info Header */}
                                                <div className="p-6 bg-gradient-to-br from-primary to-primary-900 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                                                    <div className="relative z-10 flex items-center gap-4 mb-2">
                                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-2xl border border-white/20 shadow-inner">
                                                            {userName ? userName.charAt(0).toUpperCase() : <Icon name="User" className="w-6 h-6" />}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-bold text-white truncate text-lg">{userName || 'مستخدم'}</p>
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/20 backdrop-blur-sm">
                                                                {getUserRole()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                                                    <Button
                                                        onClick={() => { getDashboardAction()(); setIsProfileDropdownOpen(false); }}
                                                        variant="ghost"
                                                        className="w-full justify-start text-right px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group h-auto"
                                                    >
                                                        <div className="p-2 ml-3 bg-primary/5 dark:bg-white/5 rounded-xl text-primary dark:text-primary-300 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                                            <Icon name="LayoutDashboard" className="w-4 h-4" />
                                                        </div>
                                                        <span>لوحة التحكم</span>
                                                    </Button>

                                                    <Button
                                                        onClick={() => { onGoToAnnouncements(); setIsProfileDropdownOpen(false); }}
                                                        variant="ghost"
                                                        className="w-full justify-start text-right px-4 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group h-auto"
                                                    >
                                                        <div className="p-2 ml-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                                                            <Icon name="Megaphone" className="w-4 h-4" />
                                                        </div>
                                                        <span>الإعلانات</span>
                                                    </Button>
                                                </div>

                                                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6 my-1"></div>

                                                <div className="p-2 bg-white dark:bg-slate-900">
                                                    <Button
                                                        onClick={() => { onLogout(); setIsProfileDropdownOpen(false); }}
                                                        variant="ghost"
                                                        className="w-full justify-start text-right px-4 py-3.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-2xl transition-colors group h-auto"
                                                    >
                                                        <div className="p-2 ml-3 bg-red-50 dark:bg-red-500/10 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                                                            <Icon name="LogOut" className="w-4 h-4" />
                                                        </div>
                                                        <span>تسجيل الخروج</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Mobile Menu Button - Styled */}
                            {showMobileMenuButton && (
                                <div className="lg:hidden">
                                    <button
                                        onClick={onMobileMenuClick}
                                        className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        <Icon name="Menu" className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll Progress Bar */}
                <div
                    className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-secondary via-orange-400 to-secondary transition-all duration-100 z-50 opacity-80"
                    style={{ width: `${scrollProgress * 100}%` }}
                />
            </header>
        </>
    );
};

export default Header;
