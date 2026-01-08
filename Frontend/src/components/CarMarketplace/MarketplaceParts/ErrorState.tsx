import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onGoHome?: () => void;
    showHomeButton?: boolean;
    icon?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'عذراً، حدث خطأ ما',
    message = 'لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى.',
    onRetry,
    onGoHome,
    showHomeButton = true,
    icon
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-full"
            >
                {icon || <AlertTriangle className="w-12 h-12 text-red-500" />}
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-center">
                {title}
            </h3>

            {/* Message */}
            <p className="text-slate-600 dark:text-slate-400 text-center max-w-md mb-8">
                {message}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
                {onRetry && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRetry}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        إعادة المحاولة
                    </motion.button>
                )}

                {showHomeButton && onGoHome && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onGoHome}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        الصفحة الرئيسية
                    </motion.button>
                )}
            </div>
        </motion.div>
    );
};

export default ErrorState;
