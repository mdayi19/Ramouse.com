import React from 'react';
import { motion } from 'framer-motion';

interface FloatingServicesButtonProps {
    onClick: () => void;
    logoUrl?: string;
    isDocked?: boolean;
    isGrouped?: boolean;
    isDesktop?: boolean;
}

const FloatingServicesButton: React.FC<FloatingServicesButtonProps> = ({ onClick, logoUrl, isDocked = false, isGrouped = false, isDesktop = false }) => {

    // Desktop Dock Mode: Sleek expanding pill
    if (isDesktop) {
        return (
            <motion.button
                onClick={onClick}
                whileHover="hover"
                initial="idle"
                animate="idle"
                whileTap={{ scale: 0.95 }}
                className="relative flex items-center gap-2 px-3 py-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-300"
            >
                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700/50">
                    <img
                        src={logoUrl || "/logo without name.svg"}
                        alt="Services"
                        className="w-5 h-5 object-contain"
                    />
                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full flex items-center justify-center border border-white dark:border-slate-800">
                    </div>
                </div>

                <motion.div
                    variants={{
                        idle: { width: 0, opacity: 0, paddingRight: 0 },
                        hover: { width: 'auto', opacity: 1, paddingRight: 8 }
                    }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                    <span className="text-sm font-bold block">الخدمات</span>
                </motion.div>
            </motion.button>
        );
    }

    if (isDocked) {
        return (
            <motion.button
                onClick={onClick}
                whileTap={{ scale: 0.97 }}
                className="group relative flex items-center justify-center gap-3 px-6 py-4 bg-white/85 dark:bg-slate-900/85 rounded-none border-t border-r border-slate-200/60 dark:border-slate-800 backdrop-blur-xl transition-all duration-300 w-full hover:bg-slate-50 dark:hover:bg-slate-800/50 overflow-hidden"
            >
                {/* Divider Line (Right Border handles it, but maybe a subtle highlight) */}
                <div className="absolute inset-y-2 -right-[1px] w-[1px] bg-slate-200 dark:bg-slate-800" />

                {/* Subtle Gradient Overlay on Hover/Active */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-active:opacity-100 transition-opacity" />

                <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orange-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700/50 group-hover:border-orange-200 transition-all duration-300 group-hover:scale-110">
                    <img
                        src={logoUrl || "/logo without name.svg"}
                        alt="Services"
                        className="w-5 h-5 object-contain"
                    />
                    {/* Badge */}
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gradient-to-br from-secondary to-orange-400 rounded-full flex items-center justify-center shadow-sm border border-white dark:border-slate-800">
                        <span className="text-[8px] font-black text-white">10</span>
                    </div>
                </div>

                <div className="flex flex-col items-start gap-0.5">
                    <span className="font-bold text-sm leading-none text-slate-800 dark:text-slate-200">خدمات عامة</span>
                    <span className="text-[10px] opacity-70 leading-none text-slate-500 dark:text-slate-400">جميع الخدمات</span>
                </div>
            </motion.button>
        );
    }

    return (
        <motion.div
            drag={!isGrouped}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Initially constrained, will update to window
            dragElastic={0.2}
            dragMomentum={false}
            whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
            initial={{ x: 20, y: -20 }} // Start slightly offset from bottom-left
            className={`${isGrouped ? 'relative' : 'fixed bottom-28 left-4'} z-50 touch-none`} // Positioning
            style={{ x: 0, y: 0 }} // Reset transformation for drag to work properly relative to updated position
        >
            <div className="relative group">
                {/* Outer Glow - Pulsing */}
                <div className="absolute inset-0 rounded-full bg-secondary/20 blur-xl animate-pulse pointer-events-none" />

                {/* Rotating Ring */}
                <div className="absolute inset-[-4px] rounded-full border border-secondary/20 animate-spin-slow pointer-events-none" style={{ animationDuration: '8s' }} />

                <button
                    onClick={onClick}
                    className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.25)] active:scale-95 transition-all duration-300 border-[3px] border-white/90 hover:border-white cursor-grab active:cursor-grabbing bg-[#f3efe4]"
                    aria-label="الخدمات"
                >
                    {/* Inner Glow */}
                    <div className="absolute inset-[3px] rounded-full bg-gradient-to-b from-white/30 to-transparent opacity-50 pointer-events-none" />

                    {/* Shine Effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <img
                        src={logoUrl || "/logo without name.svg"}
                        alt="Services"
                        className="w-10 h-10 object-contain relative z-10 drop-shadow-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none"
                    />
                </button>

                {/* Badge - Services Count with Animation */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-secondary to-orange-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce-subtle pointer-events-none">
                    <span className="text-[10px] font-black text-primary-900">10</span>
                </div>
            </div>
        </motion.div>
    );
};

export default FloatingServicesButton;
