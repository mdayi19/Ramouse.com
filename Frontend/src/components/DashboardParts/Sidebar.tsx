
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';
import { Button } from '../ui/Button';

export interface SidebarItemType {
    id: string;
    label: string;
    icon: string | React.ReactNode;
    onClick?: () => void;
    badge?: number;
    children?: SidebarItemType[];
    isActive?: boolean;
    description?: string;
    groupLabel?: string;
    color?: string;
}

export interface SidebarUser {
    name: string;
    phone: string;
    roleLabel: string;
    avatarChar?: string;
    image?: string;
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    user: SidebarUser;
    items: SidebarItemType[];
    onLogout: () => void;
    onBack?: () => void;
    title?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    setIsOpen,
    user,
    items,
    onLogout,
    onBack,
    title = "لوحة التحكم"
}) => {
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    const toggleSubmenu = (id: string) => {
        setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const sidebarVariants = {
        closed: {
            x: '100%',
            opacity: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 40
            }
        },
        open: {
            x: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 40,
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        closed: { x: 20, opacity: 0 },
        open: { x: 0, opacity: 1 }
    };

    const overlayVariants = {
        closed: { opacity: 0, pointerEvents: 'none' as const },
        open: { opacity: 1, pointerEvents: 'auto' as const }
    };

    const renderItem = (item: SidebarItemType, depth = 0) => {
        const isSelected = item.isActive;

        if (item.children && item.children.length > 0) {
            const isSubmenuOpen = openSubmenus[item.id] || item.children.some(c => c.isActive);

            return (
                <motion.div key={item.id} variants={itemVariants} className="mb-1 md:!opacity-100 md:!translate-x-0">
                    <Button
                        variant="ghost"
                        onClick={() => toggleSubmenu(item.id)}
                        className={`w-full justify-between gap-3 px-3 py-2.5 h-auto text-sm font-medium transition-all duration-300 rounded-xl relative overflow-hidden group
                            ${isSelected || isSubmenuOpen
                                ? 'text-primary dark:text-primary-400 bg-primary/5 dark:bg-primary-500/10'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                    >
                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out opacity-0 group-hover:opacity-100" />

                        <div className="flex items-center gap-3 relative z-10">
                            <span className={`transition-colors duration-300 ${isSelected || isSubmenuOpen ? 'text-primary dark:text-primary-400 drop-shadow-sm' : 'text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-primary-400'}`}>
                                {typeof item.icon === 'string' ? <Icon name={item.icon as any} className="w-5 h-5" /> : item.icon}
                            </span>
                            <span className="font-semibold tracking-wide">{item.label}</span>
                        </div>
                        <Icon
                            name="ChevronDown"
                            className={`w-4 h-4 transition-transform duration-300 relative z-10 ${isSubmenuOpen ? 'rotate-180 text-primary' : 'text-slate-400 group-hover:text-primary/70'}`}
                        />
                    </Button>

                    <AnimatePresence initial={false}>
                        {isSubmenuOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30, opacity: { duration: 0.2 } }}
                                className="overflow-hidden"
                            >
                                <div className="mt-1 space-y-0.5 pr-4 relative">
                                    <div className="absolute right-6 top-2 bottom-2 w-[1.5px] bg-gradient-to-b from-slate-200/50 via-slate-300/80 to-slate-200/50 dark:from-slate-700/50 dark:via-slate-600/80 dark:to-slate-700/50 rounded-full"></div>
                                    {item.children.map((child, idx) => {
                                        const showGroupLabel = (idx === 0 || (idx > 0 && item.children![idx - 1].groupLabel !== child.groupLabel)) && child.groupLabel;

                                        return (
                                            <React.Fragment key={child.id}>
                                                {showGroupLabel && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 mt-2 uppercase tracking-wider"
                                                    >
                                                        {child.groupLabel}
                                                    </motion.div>
                                                )}
                                                {renderItem(child, depth + 1)}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            );
        }

        return (
            <motion.div key={item.id} variants={itemVariants} className="md:!opacity-100 md:!translate-x-0">
                <Button
                    onClick={item.onClick}
                    variant="ghost"
                    className={`w-full justify-start gap-3 px-3 py-2.5 h-auto text-sm font-medium transition-all duration-300 rounded-xl mb-1 relative overflow-hidden group
                        ${isSelected
                            ? 'text-primary dark:text-primary-400 shadow-[0_2px_12px_-4px_rgba(var(--primary-rgb),0.2)] bg-gradient-to-r from-primary/10 to-transparent dark:from-primary-500/20'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                >
                    {isSelected && (
                        <motion.div
                            layoutId="activePill"
                            className="absolute inset-0 bg-primary/5 dark:bg-primary-500/10 border border-primary/10 dark:border-primary-500/20 rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}

                    {/* Active Indicator Line */}
                    {isSelected && (
                        <motion.div
                            layoutId="activeIndicator"
                            className="absolute right-0 top-2 bottom-2 w-1 bg-primary rounded-l-full shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)]"
                        />
                    )}

                    <span className={`transition-colors duration-300 relative z-10 ${isSelected ? 'text-primary dark:text-primary-400 drop-shadow-sm' : (item.color || 'text-slate-400 dark:text-slate-500 group-hover:text-primary dark:group-hover:text-primary-400')}`}>
                        {typeof item.icon === 'string' ? <Icon name={item.icon as any} className={`w-5 h-5 ${isSelected ? 'fill-primary/20' : ''}`} /> : item.icon}
                    </span>

                    <div className="flex-1 text-right truncate relative z-10">
                        <span className={isSelected ? 'font-bold' : 'font-medium'}>{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center relative z-10 transition-colors duration-300 ${isSelected
                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary'
                            }`}>
                            {item.badge > 99 ? '99+' : item.badge}
                        </span>
                    )}
                </Button>
            </motion.div>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            <motion.div
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={overlayVariants}
                onClick={() => setIsOpen(false)}
                className="md:hidden fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm"
            />

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={isOpen ? "open" : "closed"}
                variants={sidebarVariants}
                // Desktop: Translate 0 (visible). Mobile: Animate X.
                // We use CSS for layout (md:translate-x-0) but need to ensure motion doesn't override it incorrectly on desktop resize.
                // Best practice: use a wrapper for desktop static layout or media query in variants.
                // Here we rely on the fact that `isOpen` is controlled by parent and typically 'true' for desktop if we want persistent sidebar.
                // However, for cleaner code, we can force reset scale/x on desktop via className '!translate-x-0' if needed, but motion inline styles have high specificity.
                // Let's rely on standard mobile-first logic: Drawer on mobile, Static on desktop.
                className={`fixed inset-y-0 right-0 z-50 w-[280px] h-full flex flex-col
                    bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-l border-white/20 dark:border-slate-800/50 shadow-2xl 
                    md:shadow-none md:relative md:!translate-x-0 md:bg-transparent dark:md:bg-transparent md:backdrop-filter-none md:border-none md:!opacity-100`}
            >
                {/* Header */}
                <div className="flex-shrink-0 h-24 flex items-center justify-between px-6 pt-4 pb-2">
                    <div className="flex items-center gap-4 w-full">
                        {/* Animated Logo/Icon Container */}
                        <div className="relative group cursor-pointer">
                            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-700 text-white flex items-center justify-center shadow-lg shadow-primary/20 transform group-hover:scale-105 transition-all duration-300 rotate-3 group-hover:rotate-6">
                                <Icon name="LayoutGrid" className="w-6 h-6" />
                            </div>
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                            <h2 className="font-extrabold text-xl text-slate-800 dark:text-white leading-tight tracking-tight truncate">
                                {title}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                                    {user.roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={() => setIsOpen(false)}
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <Icon name="X" className="w-6 h-6" />
                    </Button>
                </div>

                {/* Navigation Scroll Area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar scroll-smooth">
                    {items.map(item => renderItem(item))}
                </div>

                {/* Footer User Profile */}
                <div className="flex-shrink-0 p-4 m-4 mt-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary via-primary-500 to-primary-600 p-[2px] shadow-md">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-primary font-bold">
                                {user.avatarChar || user.name.charAt(0)}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono" dir="ltr">{user.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {onBack && (
                            <Button
                                onClick={onBack}
                                variant="outline"
                                className="w-full justify-center gap-2 h-8 text-[11px] font-bold border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-primary transition-all shadow-sm"
                            >
                                <Icon name="ArrowRight" className="w-3.5 h-3.5" />
                                <span>الرئيسية</span>
                            </Button>
                        )}
                        <Button
                            onClick={onLogout}
                            variant="ghost"
                            className={`w-full justify-center gap-2 h-8 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 ${!onBack ? 'col-span-2' : ''} border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all`}
                        >
                            <Icon name="LogOut" className="w-3.5 h-3.5" />
                            <span>خروج</span>
                        </Button>
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
