import React from 'react';
import { MessageSquareText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingChatBotButtonProps {
    onClick: () => void;
    isOpen: boolean;
}

export const FloatingChatBotButton: React.FC<FloatingChatBotButtonProps> = ({ onClick, isOpen }) => {
    return (
        <div className="fixed bottom-8 right-4 z-50 touch-none flex flex-col items-center gap-2">

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

            <motion.button
                onClick={onClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    relative w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                    ${isOpen
                        ? 'bg-slate-800 dark:bg-slate-700 text-white rotate-90'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30'
                    }
                `}
            >
                {/* Ping Animation for Engagement */}
                {!isOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20 animate-ping"></span>
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
                            <MessageSquareText className="w-7 h-7" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification Dot (Simulated) */}
                {!isOpen && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </span>
                )}
            </motion.button>
        </div>
    );
};
