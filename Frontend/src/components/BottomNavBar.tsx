import React from 'react';
import { Badge } from './ui/Badge';
import { motion } from 'framer-motion';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    notificationCount?: number;
    isSpecial?: boolean; // New prop for the special add button
}

interface BottomNavBarProps {
    items: NavItem[];
    activeItem: string;
    onItemClick: (id: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ items, activeItem, onItemClick }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe" role="navigation" aria-label="التنقل الرئيسي">
            {/* Background */}
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200/50 dark:border-slate-800/50 shadow-lg" aria-hidden="true" />

            <div className="relative flex items-center justify-around h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] px-2">
                {items.map((item) => {
                    const isActive = activeItem === item.id;
                    const isSpecial = item.isSpecial;

                    if (isSpecial) {
                        return (
                            <div key={item.id} className="relative -top-8 flex justify-center">
                                <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-full scale-110 -z-10" />
                                <button
                                    onClick={() => onItemClick(item.id)}
                                    className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-600/40 hover:scale-110 hover:shadow-blue-600/50 active:scale-95 transition-all duration-300 ring-4 ring-white dark:ring-slate-900"
                                    aria-label={item.label}
                                >
                                    {item.icon}
                                </button>
                            </div>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className="relative flex-1 flex flex-col items-center justify-center py-2 outline-none group min-h-[56px]"
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavIndicator"
                                    className="absolute inset-x-0 mx-auto top-1.5 w-11 h-11 bg-primary/10 dark:bg-primary/20 rounded-xl"
                                    transition={{
                                        type: "tween",
                                        duration: 0.2,
                                        ease: "easeOut"
                                    }}
                                />
                            )}

                            {/* Icon Container */}
                            <div className="relative z-10">
                                <motion.div
                                    animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                                    transition={{ type: "tween", duration: 0.15 }}
                                    className={`relative ${isActive ? 'text-primary dark:text-primary-400' : 'text-slate-400 dark:text-slate-500'}`}
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
                            <span
                                className={`text-[10px] font-semibold mt-0.5 ${isActive
                                    ? 'text-primary dark:text-primary-400'
                                    : 'text-slate-400 dark:text-slate-500'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNavBar;