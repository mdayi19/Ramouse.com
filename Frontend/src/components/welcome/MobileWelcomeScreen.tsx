import React, { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Icon from '../Icon';
import { View, OrderFormData } from '../../types';
import { Button } from '../ui/Button';

interface MobileWelcomeScreenProps {
    onStart: (prefillData?: Partial<OrderFormData>) => void;
    onViewOrders: () => void;
    onViewAnnouncements: () => void;
    isAuthenticated: boolean;
    onNavigate?: (view: View, params?: any) => void;
    onLoginClick: () => void;
    userName?: string;
    unreadCount?: number;
    showInstallPrompt?: boolean;
    installApp?: () => Promise<boolean>;
    isInstalled?: boolean;
}

export const MobileWelcomeScreen: React.FC<MobileWelcomeScreenProps> = ({
    onStart,
    onViewAnnouncements,
    isAuthenticated,
    onNavigate,
    onLoginClick,
    userName,
    showInstallPrompt,
    installApp,
    isInstalled
}) => {
    const [isLocating, setIsLocating] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const { scrollY } = useScroll();

    // Parallax effects - lightweight
    const yHero = useTransform(scrollY, [0, 300], [0, 100]);
    const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);

    useEffect(() => {
        setMounted(true);
        if (showInstallPrompt && !isInstalled) {
            const bannerTimer = setTimeout(() => setShowInstallBanner(true), 2000);
            return () => clearTimeout(bannerTimer);
        }
    }, [showInstallPrompt, isInstalled]);

    const handleFindNearest = useCallback((type: 'technicians' | 'towTrucks') => {
        setIsLocating(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsLocating(false);
                    onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    setIsLocating(false);
                    console.error("Geolocation error:", error);
                    onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory');
                }
            );
        } else {
            setIsLocating(false);
            onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory');
        }
    }, [onNavigate]);

    const handleInstallApp = useCallback(async () => {
        if (installApp) {
            setIsInstalling(true);
            const success = await installApp();
            setIsInstalling(false);
            if (success) setShowInstallBanner(false);
        }
    }, [installApp]);

    const carCategories = [
        { label: 'ألمانية', flag: '🇩🇪', gradient: 'from-slate-700 to-slate-900' },
        { label: 'أمريكية', flag: '🇺🇸', gradient: 'from-blue-700 to-blue-900' },
        { label: 'كورية', flag: '🇰🇷', gradient: 'from-red-700 to-red-900' },
        { label: 'يابانية', flag: '🇯🇵', gradient: 'from-red-50 to-white' },
        { label: 'فرنسية', flag: '🇫🇷', gradient: 'from-blue-600 to-red-600' },
        { label: 'فئة أخرى', flag: '🚗', gradient: 'from-emerald-600 to-emerald-800' },
    ];

    const steps = [
        { num: '01', title: 'سجّل طلبك', desc: 'حدد السيارة والقطعة. أضف صوراً إن أردت.' },
        { num: '02', title: 'استقبل العروض', desc: 'عروض من مزودين متعددين خلال دقائق.' },
        { num: '03', title: 'استلم واستمتع', desc: 'اختر العرض الأنسب واستلم طلبك.' },
    ];

    const footerLinks = [
        { label: 'المدونة', icon: 'BookOpen', onClick: () => onNavigate?.('blog'), color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'الإعلانات', icon: 'Megaphone', onClick: onViewAnnouncements, color: 'text-pink-500', bg: 'bg-pink-500/10' },
        { label: 'رخصة دولية', icon: 'Globe', onClick: () => onNavigate?.('internationalLicense'), color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'الاسئلة الشائعة', icon: 'HelpCircle', onClick: () => onNavigate?.('faq'), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative overflow-x-hidden font-sans selection:bg-blue-500/30" dir="rtl">
            {/* Optimized Background - using CSS will-change for performance */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 dark:brightness-50 mix-blend-overlay"></div>

                {/* Static or simple CSS animated blobs for better performance */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }} />
            </div>

            {/* Install Banner */}
            <AnimatePresence>
                {showInstallBanner && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-4 left-4 right-4 z-50 overflow-hidden"
                    >
                        <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <Icon name="Download" className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">تثبيت التطبيق</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">تجربة أفضل وأسرع</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setShowInstallBanner(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">لا شكراً</button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleInstallApp}
                                    className="px-4 py-1.5 text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg shadow-lg"
                                >
                                    {isInstalling ? '...' : 'تثبيت'}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Hero Section - LCP Optimized (No initial=hidden on text) */}
            <motion.header
                style={{ y: prefersReducedMotion ? 0 : yHero, opacity: prefersReducedMotion ? 1 : opacityHero }}
                className="pt-24 pb-12 px-6 text-center relative z-10 min-h-[400px] flex flex-col justify-center"
            >
                <div>
                    <div className="inline-block mb-4 relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full transform scale-150" />
                        <h1 className="relative text-7xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 drop-shadow-sm font-sans tracking-tight">
                            راموسة
                        </h1>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 tracking-tight">
                        ثورة في عالم خدمات السيارات
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed w-full mx-auto mb-10 text-base font-medium">
                        جميع خدمات السيارات في تطبيق واحد.
                        <br />
                        <span className="text-sm opacity-80">قطع غيار • ميكانيك • سطحات</span>
                    </p>

                    <div className="flex flex-col gap-4 w-full mx-auto px-4">
                        <motion.button
                            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(59 130 246 / 0.5)" }}
                            whileTap={{ scale: 0.98 }}
                            className="relative w-full h-14 text-lg font-bold text-white rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/30 overflow-hidden group"
                            onClick={() => onStart()}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                            <span className="relative flex items-center justify-center gap-2">
                                ابدأ طلبك الآن <Icon name="ArrowLeft" className="w-5 h-5 rotate-180" />
                            </span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full h-12 text-base font-semibold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all"
                            onClick={() => onNavigate?.('store')}
                        >
                            تصفح المتجر
                        </motion.button>
                    </div>
                </div>
            </motion.header>

            {/* Content Container - CLS Optimized with min-heights */}
            <div className="relative z-20 -mt-8">

                {/* Categories */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4 }}
                    className="px-4 mb-4"
                >
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 rounded-[2rem] p-6 shadow-xl border border-white/20 dark:border-white/5 min-h-[200px]">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 pr-2 border-r-4 border-blue-500 rounded-sm">اختر فئة سيارتك</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {carCategories.map((cat, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <button
                                        className="w-full flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-all"
                                        onClick={() => onStart({})}
                                    >
                                        <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">{cat.flag}</div>
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cat.label}</span>
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Car Marketplace - Big Buttons */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.4 }}
                    className="px-4 mb-4"
                >
                    <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 rounded-[2rem] p-6 shadow-xl border border-white/20 dark:border-white/5">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 pr-2 border-r-4 border-emerald-500 rounded-sm">سوق السيارات</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {/* Car Listings - Big Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate?.('car-listings')}
                                className="relative overflow-hidden group rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-xl shadow-emerald-500/30"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Icon name="Car" className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-xl font-black text-white mb-1">سوق السيارات</h4>
                                            <p className="text-sm text-emerald-50">تصفح واشترِ سيارات جديدة ومستعملة</p>
                                        </div>
                                    </div>
                                    <Icon name="ArrowLeft" className="w-6 h-6 text-white rotate-180" />
                                </div>
                            </motion.button>

                            {/* Rent Car - Big Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onNavigate?.('rent-car')}
                                className="relative overflow-hidden group rounded-2xl p-6 bg-gradient-to-br from-purple-500 to-pink-500 shadow-xl shadow-purple-500/30"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Icon name="Key" className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-xl font-black text-white mb-1">تأجير السيارات</h4>
                                            <p className="text-sm text-purple-50">استأجر سيارتك بأفضل الأسعار</p>
                                        </div>
                                    </div>
                                    <Icon name="ArrowLeft" className="w-6 h-6 text-white rotate-180" />
                                </div>
                            </motion.button>

                            {/* Car Auction - Big Button - Coming Soon */}
                            <motion.div
                                whileTap={{ scale: 0.98 }}
                                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl shadow-amber-500/20 opacity-75"
                            >
                                <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 text-amber-600 dark:text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                                    قريباً
                                </div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Icon name="Gavel" className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="text-right">
                                            <h4 className="text-xl font-black text-white mb-1">مزاد السيارات</h4>
                                            <p className="text-sm text-amber-50">مزادات حية وعروض استثنائية</p>
                                        </div>
                                    </div>
                                    <Icon name="ArrowLeft" className="w-6 h-6 text-white/50 rotate-180" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.section>

                {/* Professional Services */}
                <section className="px-4 mb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Technicians */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: 50 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden group rounded-[2.5rem] p-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.3rem] p-6 border border-white/40 dark:border-white/10 shadow-lg h-full flex flex-col min-h-[240px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                        <Icon name="Wrench" className="w-6 h-6" />
                                    </div>
                                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                                        معتمد
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">دليل الفنيين</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow">
                                    أفضل الورشات الفنية في منطقتك، مع تقييمات حقيقية من العملاء.
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <Button
                                        size="sm"
                                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg"
                                        onClick={() => handleFindNearest('technicians')}
                                        isLoading={isLocating}
                                    >
                                        الأقرب مني
                                    </Button>
                                    <button
                                        onClick={() => onNavigate?.('technicianDirectory')}
                                        className="w-10 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Icon name="ArrowLeft" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Tow Trucks */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: -50 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden group rounded-[2.5rem] p-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.3rem] p-6 border border-white/40 dark:border-white/10 shadow-lg h-full flex flex-col min-h-[240px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                                        <Icon name="Truck" className="w-6 h-6" />
                                    </div>
                                    <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200 dark:border-orange-800 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> 24/7
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">خدمات السطحات</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow">
                                    خدمة سريعة في أي وقت وأي مكان. تتبع السطحة مباشرة على الخريطة.
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <Button
                                        size="sm"
                                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg"
                                        onClick={() => handleFindNearest('towTrucks')}
                                        isLoading={isLocating}
                                    >
                                        الأقرب مني
                                    </Button>
                                    <button
                                        onClick={() => onNavigate?.('towTruckDirectory')}
                                        className="w-10 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Icon name="ArrowLeft" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Car Listings */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: 50 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden group rounded-[2.5rem] p-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.3rem] p-6 border border-white/40 dark:border-white/10 shadow-lg h-full flex flex-col min-h-[240px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                        <Icon name="Car" className="w-6 h-6" />
                                    </div>
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                        جديد
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">سوق السيارات</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow">
                                    تصفح واشترِ سيارات جديدة ومستعملة من موردين موثوقين.
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <Button
                                        size="sm"
                                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg"
                                        onClick={() => onNavigate?.('car-listings')}
                                    >
                                        تصفح العروض
                                    </Button>
                                    <button
                                        onClick={() => onNavigate?.('car-listings')}
                                        className="w-10 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Icon name="ArrowLeft" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Rent Car */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: -50 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden group rounded-[2.5rem] p-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.3rem] p-6 border border-white/40 dark:border-white/10 shadow-lg h-full flex flex-col min-h-[240px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                                        <Icon name="Key" className="w-6 h-6" />
                                    </div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                        مميز
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">تأجير السيارات</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow">
                                    استأجر سيارتك المثالية بأسعار تنافسية وخيارات مرنة.
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <Button
                                        size="sm"
                                        className="flex-1 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg"
                                        onClick={() => onNavigate?.('rent-car')}
                                    >
                                        عرض السيارات
                                    </Button>
                                    <button
                                        onClick={() => onNavigate?.('rent-car')}
                                        className="w-10 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <Icon name="ArrowLeft" className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Car Auction - Coming Soon */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: 50 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden rounded-[2.5rem] p-1 opacity-75"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-10" />
                            <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.3rem] p-6 border border-white/40 dark:border-white/10 shadow-lg h-full flex flex-col min-h-[240px]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                                        <Icon name="Gavel" className="w-6 h-6" />
                                    </div>
                                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                                        قريباً
                                    </div>
                                </div>
                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-2">مزاد السيارات</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed flex-grow">
                                    مزادات حية للسيارات بأسعار تنافسية وعروض استثنائية.
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <Button
                                        size="sm"
                                        className="flex-1 rounded-xl bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-lg"
                                        disabled
                                    >
                                        قريباً
                                    </Button>
                                    <button
                                        disabled
                                        className="w-10 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                                    >
                                        <Icon name="ArrowLeft" className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* How It Works */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="py-12 px-6"
                >
                    <h3 className="text-2xl font-black text-center text-slate-900 dark:text-white mb-12">كيف تعمل راموسة؟</h3>
                    <div className="w-full mx-auto relative px-4">
                        {/* Static Line for Performance */}
                        <div className="absolute top-0 bottom-0 right-[28px] w-0.5 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0" />

                        <div className="space-y-12">
                            {steps.map((step, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -30 }} // Removed scale to reduce repaint
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: idx * 0.1 }}
                                    className="flex gap-6 relative group"
                                >
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.15)] border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 will-change-transform">
                                            <span className="font-black text-xl bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-purple-600">{step.num}</span>
                                        </div>
                                    </div>
                                    <div className="pt-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl flex-1 border border-white/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors shadow-sm">
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{step.title}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Ultra Premium CTA */}
                <section className="px-4 mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-[2.5rem]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
                        {/* Simplify noise to reduce main thread load if possible, or keep as is if efficient enough */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

                        {/* CSS Animation instead of JS for background shapes */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl opacity-50 animate-spin-slow" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl opacity-50 animate-spin-slow-reverse" />

                        <div className="relative z-10 p-10 text-center text-white">
                            <div>
                                <h3 className="text-4xl font-black mb-4 tracking-tight">جاهز تبدأ؟</h3>
                                <p className="text-blue-100 mb-8 w-full mx-auto text-lg leading-relaxed px-4">
                                    انضم لآلاف المستخدمين وسجل طلبك الأول الآن.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onStart()}
                                    className="w-full bg-white text-slate-900 font-bold text-xl py-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <span>🚀</span>
                                    <span>ابدأ الرحلة مجاناً</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Footer Grid */}
                <footer className="px-6 pb-28">
                    <div className="grid grid-cols-2 gap-3 mb-12">
                        {footerLinks.map((link, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={link.onClick}
                                className="flex flex-col items-center justify-center p-4 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all text-center group"
                            >
                                <div className={`w-10 h-10 rounded-2xl ${link.bg} ${link.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                                    <Icon name={link.icon as any} className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{link.label}</span>
                            </motion.button>
                        ))}
                    </div>

                    <div className="text-center space-y-4">
                        <button
                            onClick={isAuthenticated ? undefined : onLoginClick}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-sm font-bold border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all"
                        >
                            {isAuthenticated ? (
                                <>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    مرحباً، {userName}
                                </>
                            ) : (
                                <>تسجيل الدخول / إنشاء حساب</>
                            )}
                        </button>

                    </div>
                </footer>
            </div>
        </div>
    );
};
