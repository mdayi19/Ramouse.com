import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ClearChatDialogProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Accessible confirmation dialog for clearing chat messages
 * Uses proper ARIA attributes and keyboard navigation
 */
export const ClearChatDialog: React.FC<ClearChatDialogProps> = ({
    isOpen,
    onConfirm,
    onCancel
}) => {
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    // Focus management - focus cancel button when dialog opens
    useEffect(() => {
        if (isOpen && cancelButtonRef.current) {
            cancelButtonRef.current.focus();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        aria-hidden="true"
                    />

                    {/* Dialog */}
                    <div
                        className="fixed inset-0 z-[61] flex items-center justify-center p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dialog-title"
                        aria-describedby="dialog-description"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>

                            {/* Title */}
                            <h2
                                id="dialog-title"
                                className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2"
                            >
                                مسح المحادثة
                            </h2>

                            {/* Description */}
                            <p
                                id="dialog-description"
                                className="text-slate-600 dark:text-slate-400 text-center mb-6"
                            >
                                هل أنت متأكد من مسح جميع الرسائل؟ لا يمكن التراجع عن هذا الإجراء.
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    ref={cancelButtonRef}
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                                    aria-label="إلغاء مسح المحادثة"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                                    aria-label="تأكيد مسح المحادثة"
                                >
                                    مسح
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};
