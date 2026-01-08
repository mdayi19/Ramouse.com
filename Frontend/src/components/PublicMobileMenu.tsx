
import React from 'react';
import Icon from './Icon';
import { View } from '../types';

interface PublicMobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View, params?: any) => void;
    onLoginClick: () => void;
    isAuthenticated: boolean;
    onGoToDashboard: () => void;
    onLogout: () => void;
}

const PublicMobileMenu: React.FC<PublicMobileMenuProps> = ({ isOpen, onClose, onNavigate, onLoginClick, isAuthenticated, onGoToDashboard, onLogout }) => {
    const navItems: { label: string; view: View; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
        { label: 'الرئيسية', view: 'welcome', icon: 'House' },
        { label: 'سوق السيارات', view: 'car-listings', icon: 'Car' },
        { label: 'استئجار سيارة', view: 'rent-car', icon: 'MapPin' },
        { label: 'المتجر', view: 'store', icon: 'ShoppingBag' },
        { label: 'دليل الفنيين', view: 'technicianDirectory', icon: 'Wrench' },
        { label: 'دليل السطحات', view: 'towTruckDirectory', icon: 'Truck' },
        { label: 'المدونة', view: 'blog', icon: 'Newspaper' },
        { label: 'الأسئلة الشائعة', view: 'faq', icon: 'Info' },
        { label: 'تواصل معنا', view: 'contact', icon: 'Mail' },
        { label: 'سياسة الخصوصية', view: 'privacyPolicy', icon: 'Shield' },
        { label: 'شروط الاستخدام', view: 'termsOfUse', icon: 'FileText' },
    ];

    return (
        <>
            {/* Backdrop - no blur for performance */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-200 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar - faster transition */}
            <aside
                className={`fixed z-50 inset-y-0 right-0 w-72 bg-white dark:bg-slate-900 border-l border-slate-200/50 dark:border-slate-800 transform transition-transform duration-200 ease-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="public-menu-title"
            >
                <div className="p-4 sm:p-6 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pt-safe">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Icon name="Menu" className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <h2 id="public-menu-title" className="font-bold text-lg sm:text-xl text-slate-800 dark:text-white tracking-tight">القائمة</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-lg sm:rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="إغلاق القائمة"
                    >
                        <Icon name="X" className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                    </button>
                </div>
                <nav className="p-3 sm:p-4 flex-grow flex flex-col overflow-hidden pb-safe">
                    <ul className="flex flex-col gap-1 flex-grow overflow-y-auto custom-scrollbar">
                        {isAuthenticated && (
                            <>
                                <li>
                                    <button onClick={onGoToDashboard} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]">
                                        <Icon name="LayoutGrid" className="w-5 h-5" />
                                        <span>لوحة التحكم</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('announcements')} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]">
                                        <Icon name="Megaphone" className="w-5 h-5" />
                                        <span>الإعلانات</span>
                                    </button>
                                </li>
                            </>
                        )}
                        {navItems.map(item => (
                            <li key={item.view}>
                                <button
                                    onClick={() => onNavigate(item.view)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                                >
                                    <Icon name={item.icon} className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-200/50 dark:border-slate-700">
                        {isAuthenticated ? (
                            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300 font-bold py-3 px-4 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors min-h-[44px]">
                                <Icon name="LogOut" className="w-5 h-5" />
                                <span>تسجيل الخروج</span>
                            </button>
                        ) : (
                            <button onClick={onLoginClick} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px]">
                                تسجيل الدخول / إنشاء حساب
                            </button>
                        )}
                    </div>
                </nav>
            </aside>
        </>
    );
};

export default PublicMobileMenu;
