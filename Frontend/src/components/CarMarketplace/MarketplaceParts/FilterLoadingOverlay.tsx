import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterLoadingOverlayProps {
    isLoading: boolean;
}

export const FilterLoadingOverlay: React.FC<FilterLoadingOverlayProps> = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl"
            >
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
                >
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        جاري تطبيق الفلاتر...
                    </span>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
