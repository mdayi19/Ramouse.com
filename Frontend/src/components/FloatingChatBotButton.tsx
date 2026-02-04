import React from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingChatBotButtonProps {
    onClick: () => void;
    isOpen: boolean;
    isDocked?: boolean; // New prop for docked mode
    isGrouped?: boolean;
    isDesktop?: boolean;
}

export const FloatingChatBotButton: React.FC<FloatingChatBotButtonProps> = ({ onClick, isOpen, isDocked = false, isGrouped = false, isDesktop = false }) => {

    // Desktop Dock Mode: Sleek expanding pill
    if (isDesktop) {
        return (
            <motion.button
                onClick={onClick}
                whileHover="hover"
                initial="idle"
                animate={isOpen ? "open" : "idle"}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative flex items-center gap-2 px-3 py-2.5 rounded-full transition-all duration-300
                    ${isOpen
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                `}
            >
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${isOpen ? 'bg-white/20' : 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'}`}>
                    {isOpen ? <X className="w-5 h-5" /> : <MessageSquareText className="w-5 h-5" />}
                </div>

                <motion.div
                    variants={{
                        idle: { width: 0, opacity: 0, paddingRight: 0 },
                        hover: { width: 'auto', opacity: 1, paddingRight: 8 },
                        open: { width: 'auto', opacity: 1, paddingRight: 8 }
                    }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                >
                    <span className="text-sm font-bold block">المساعد الذكي</span>
                </motion.div>

                {!isOpen && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </motion.button>
        );
    }

    // If docked, render only the button part (styles handled by parent/dock props)
    if (isDocked) {
        return (
            <motion.button
                onClick={onClick}
                whileTap={{ scale: 0.97 }}
                className={`
                    group relative flex items-center justify-center gap-3 px-6 py-4 rounded-none border-t backdrop-blur-xl transition-all duration-300 w-full overflow-hidden
                    ${isOpen
                        ? 'bg-slate-900/95 border-slate-700 text-white'
                        : 'bg-white/85 dark:bg-slate-900/85 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                `}
            >
                {/* Active Indicator Line */}
                {isOpen && (
                    <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    />
                )}

                {/* Subtle Gradient Overlay on Hover/Active */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-white/5 opacity-0 group-active:opacity-100 transition-opacity" />

                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${isOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:scale-110'}`}>
                    {isOpen ? <X className="w-5 h-5" /> : <MessageSquareText className="w-5 h-5" />}
                </div>

                <div className="flex flex-col items-start gap-0.5">
                    <span className="font-bold text-sm leading-none">راموسة AI</span>
                    <span className="text-[10px] opacity-70 leading-none">مساعد ذكي</span>
                </div>

                {!isOpen && (
                    <span className="absolute top-3 left-1/2 -ml-8 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
                )}
            </motion.button>
        );
    }

    return (
        <div className={`${isGrouped ? 'relative' : 'fixed bottom-8 left-4'} z-50 touch-none flex flex-col items-center gap-2`}>

            {/* Label (Optional, nicely fades in/out) */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-bold whitespace-nowrap hidden sm:block pointer-events-none mb-1 border border-slate-100 dark:border-slate-700"
                    >
                        مساعد راموسة الذكي 🤖
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative group">
                {/* Outer Glow - Pulsing (Matches Services Button) */}
                {!isOpen && (
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse pointer-events-none" />
                )}

                {/* Rotating Ring (Matches Services Button) */}
                {!isOpen && (
                    <div className="absolute inset-[-4px] rounded-full border border-blue-500/20 animate-spin-slow pointer-events-none" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
                )}

                <motion.button
                    onClick={onClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                        relative w-16 h-16 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.2)] flex items-center justify-center transition-all duration-300 border-[3px]
                        ${isOpen
                            ? 'bg-slate-800 dark:bg-slate-700 border-slate-600 text-white rotate-90'
                            : 'bg-gradient-to-br from-blue-600 to-indigo-700 border-white/90 hover:border-white text-white hover:shadow-[0_12px_45px_rgba(37,99,235,0.3)]'
                        }
                    `}
                >
                    {/* Inner Shine/Gloss Effect */}
                    {!isOpen && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none" />
                    )}

                    {/* Ping Animation for Engagement (Subtler now) */}
                    {!isOpen && (
                        <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-10 animate-ping"></span>
                    )}

                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0, rotate: 90 }}
                            >
                                <X className="w-7 h-7" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                            >
                                <MessageSquareText className="w-7 h-7 drop-shadow-md" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Notification Dot */}
                    {!isOpen && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center z-10">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </span>
                    )}
                </motion.button>
            </div>
        </div>
    );
};
