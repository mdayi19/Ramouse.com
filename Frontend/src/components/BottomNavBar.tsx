import React from 'react';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    notificationCount?: number;
}

interface BottomNavBarProps {
    items: NavItem[];
    activeItem: string;
    onItemClick: (id: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ items, activeItem, onItemClick }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200/50 dark:border-slate-800/50 shadow-lg-up" />

            <div className="relative flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)]">
                {items.map((item) => {
                    const isActive = activeItem === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className="relative flex-1 flex flex-col items-center justify-center py-2 outline-none group"
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {/* Active Indicator Background Pill */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute inset-x-0 mx-auto top-2 w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-2xl"
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30
                                    }}
                                />
                            )}

                            {/* Icon Container */}
                            <div className="relative z-10">
                                <motion.div
                                    animate={isActive ? {
                                        scale: 1.1,
                                        y: -2,
                                    } : {
                                        scale: 1,
                                        y: 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className={`relative ${isActive ? 'text-primary dark:text-primary-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'}`}
                                >
                                    {item.icon}

                                    {/* Notification Badge */}
                                    {item.notificationCount !== undefined && item.notificationCount > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center p-0 text-[10px] border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in duration-200"
                                        >
                                            {item.notificationCount > 9 ? '9+' : item.notificationCount}
                                        </Badge>
                                    )}
                                </motion.div>
                            </div>

                            {/* Label */}
                            <motion.span
                                animate={isActive ? {
                                    y: 0,
                                    opacity: 1,
                                    scale: 1
                                } : {
                                    y: 2,
                                    opacity: 0.8,
                                    scale: 0.95
                                }}
                                className={`text-[10px] font-semibold mt-1 transition-colors ${isActive
                                    ? 'text-primary dark:text-primary-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                    }`}
                            >
                                {item.label}
                            </motion.span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;