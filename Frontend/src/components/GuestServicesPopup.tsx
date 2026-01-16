import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { View } from '../types';

interface ServiceItem {
    id: View;
    label: string;
    icon: string;
    color: string;
    gradient: string;
}

interface GuestServicesPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View) => void;
    onLoginClick: () => void;
    onOrderNow: () => void;
    isAuthenticated?: boolean;
}

const GuestServicesPopup: React.FC<GuestServicesPopupProps> = ({ isOpen, onClose, onNavigate, onLoginClick, onOrderNow, isAuthenticated }) => {
    const services: ServiceItem[] = [
        { id: 'car-listings', label: 'سوق السيارات', icon: 'Car', color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-500' },
        { id: 'rent-car', label: 'تأجير السيارات', icon: 'Key', color: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
        { id: 'store', label: 'المتجر', icon: 'ShoppingBag', color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-500' },
        { id: 'technicianDirectory', label: 'دليل الفنيين', icon: 'Wrench', color: 'text-orange-600', gradient: 'from-orange-500 to-red-500' },
        { id: 'towTruckDirectory', label: 'السطحات', icon: 'Truck', color: 'text-pink-600', gradient: 'from-pink-500 to-rose-500' },
        { id: 'blog', label: 'المدونة', icon: 'BookOpen', color: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
        { id: 'announcements', label: 'الإعلانات', icon: 'Megaphone', color: 'text-amber-600', gradient: 'from-amber-500 to-orange-500' },
        { id: 'internationalLicense', label: 'رخصة دولية', icon: 'Globe', color: 'text-cyan-600', gradient: 'from-cyan-500 to-blue-500' },
        { id: 'faq', label: 'الأسئلة الشائعة', icon: 'HelpCircle', color: 'text-teal-600', gradient: 'from-teal-500 to-emerald-500' },
        { id: 'contact', label: 'تواصل معنا', icon: 'Mail', color: 'text-slate-600', gradient: 'from-slate-500 to-slate-600' },
    ];

    const handleServiceClick = (id: View) => {
        onNavigate(id);
        onClose();
    };

    // Responsive State
    const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Animation Variants
    const variants = {
        hidden: isDesktop
            ? { opacity: 0, scale: 0.95 }
            : { opacity: 0, y: "100%" },
        visible: isDesktop
            ? { opacity: 1, scale: 1, transition: { type: "spring" as const, duration: 0.4 } }
            : { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 25, stiffness: 300 } },
        exit: isDesktop
            ? { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
            : { opacity: 0, y: "100%", transition: { duration: 0.2 } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Popup Container - Positioning Wrapper */}
                    <div className={`fixed inset-0 z-[70] pointer-events-none flex flex-col p-0 md:p-6 transition-all duration-300 ${isDesktop ? 'items-center justify-center' : 'justify-end'
                        }`}>

                        {/* Actual Popup Card */}
                        <motion.div
                            variants={variants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-[#f3efe4] dark:bg-slate-900 w-full md:w-auto md:min-w-[800px] md:max-w-5xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[90vh] md:max-h-[95vh] flex flex-col pointer-events-auto overflow-hidden"
                            dir="rtl"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                                        <Icon name="Grid3X3" className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white">الخدمات</h2>
                                        <p className="text-xs text-blue-100">اختر الخدمة المناسبة لك</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <Icon name="X" className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Content - Scrollable on mobile, Grid on desktop */}
                            <div className="p-4 md:p-8 flex-1 flex flex-col min-h-0 overflow-y-auto md:overflow-visible">
                                {/* Order Now Button - Horizontal on Desktop */}
                                <div className="mb-6 shrink-0">
                                    <motion.button
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0 }}
                                        onClick={() => {
                                            onOrderNow();
                                            onClose();
                                        }}
                                        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-secondary to-orange-400 text-slate-900 font-black shadow-lg shadow-secondary/30 hover:shadow-secondary/50 transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        <Icon name="CirclePlus" className="w-6 h-6" />
                                        <span>اطلب الآن</span>
                                    </motion.button>
                                </div>

                                {/* Services Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-8">
                                    {services.map((service, idx) => (
                                        <motion.button
                                            key={service.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleServiceClick(service.id)}
                                            className="relative overflow-hidden group rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-transparent transition-all shadow-sm hover:shadow-md flex flex-col items-center justify-center min-h-[110px] md:min-h-[120px]"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                                            <div className="relative flex flex-col items-center text-center gap-2">
                                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                                                    <Icon name={service.icon as any} className="w-6 h-6 text-white" />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white leading-tight">
                                                    {service.label}
                                                </span>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Login Button */}
                                {!isAuthenticated && (
                                    <div className="mt-auto pt-4 shrink-0 border-t border-slate-200 dark:border-slate-700/50 md:border-0 md:pt-0">
                                        <motion.button
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: services.length * 0.03 }}
                                            onClick={() => {
                                                onLoginClick();
                                                onClose();
                                            }}
                                            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 text-base"
                                        >
                                            <Icon name="LogIn" className="w-5 h-5" />
                                            <span>تسجيل الدخول</span>
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default GuestServicesPopup;
