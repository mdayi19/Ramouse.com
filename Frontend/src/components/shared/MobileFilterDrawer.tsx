import React, { useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    activeFilterCount?: number;
    onApply?: () => void;
    onReset?: () => void;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
    isOpen,
    onClose,
    title = 'الفلاتر',
    children,
    activeFilterCount = 0,
    onApply,
    onReset,
}) => {
    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed inset-x-0 bottom-0 z-[70] md:hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="drawer-title"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-3">
                                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                                    <h2
                                        id="drawer-title"
                                        className="text-lg font-bold text-slate-900 dark:text-white"
                                    >
                                        {title}
                                    </h2>
                                    {activeFilterCount > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-bold text-white bg-primary rounded-full">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    aria-label="إغلاق"
                                    type="button"
                                >
                                    <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {children}
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                <div className="flex gap-3">
                                    {onReset && (
                                        <button
                                            onClick={onReset}
                                            className="flex-1 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            type="button"
                                        >
                                            إعادة تعيين
                                        </button>
                                    )}
                                    {onApply && (
                                        <button
                                            onClick={() => {
                                                onApply();
                                                onClose();
                                            }}
                                            className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-800 rounded-xl transition-colors shadow-lg"
                                            type="button"
                                        >
                                            تطبيق الفلاتر
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

MobileFilterDrawer.displayName = 'MobileFilterDrawer';
