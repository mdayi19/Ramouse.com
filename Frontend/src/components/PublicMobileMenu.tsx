
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
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Sidebar */}
            <aside
                className={`fixed z-50 inset-y-0 right-0 w-72 bg-white dark:bg-darkcard border-l dark:border-slate-700 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="public-menu-title"
            >
                <div className="p-6 flex justify-between items-center border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 pt-safe">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <Icon name="Menu" className="w-5 h-5 text-primary" />
                        </div>
                        <h2 id="public-menu-title" className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">القائمة</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close menu"
                    >
                        <Icon name="X" className="w-6 h-6 text-slate-400" />
                    </button>
                </div>
                <nav className="p-4 flex-grow flex flex-col overflow-hidden pb-safe">
                    <ul className="flex flex-col gap-2 flex-grow overflow-y-auto custom-scrollbar">
                        {isAuthenticated && (
                            <>
                                <li>
                                    <button onClick={onGoToDashboard} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Icon name="LayoutGrid" className="w-5 h-5" />
                                        <span>لوحة التحكم</span>
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => onNavigate('announcements')} className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
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
                                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    <Icon name={item.icon} className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-auto pt-4 border-t dark:border-slate-700">
                        {isAuthenticated ? (
                            <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold py-2.5 px-4 rounded-lg hover:bg-red-200 dark:hover:bg-red-900">
                                <Icon name="LogOut" className="w-5 h-5" />
                                <span>تسجيل الخروج</span>
                            </button>
                        ) : (
                            <button onClick={onLoginClick} className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary-700">
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
