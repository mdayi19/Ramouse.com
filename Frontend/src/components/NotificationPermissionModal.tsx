import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import { NotificationService } from '../services/notification.service';

interface NotificationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPermissionGranted: () => void;
}

const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
    isOpen,
    onClose,
    onPermissionGranted
}) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleEnable = async () => {
        setIsLoading(true);
        try {
            const success = await NotificationService.subscribeToPush();
            if (success) {
                onPermissionGranted();
                onClose();
            } else {
                // Permission denied or other error
                alert('فشل تفعيل الإشعارات. يرجى التأكد من سماح المتصفح بها.');
                onClose(); // Close anyway to not block user
            }
        } catch (error) {
            console.error('Failed to enable notifications:', error);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-darkcard rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
                >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Icon name="Bell" className="w-8 h-8" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        تفعيل التنبيهات
                    </h2>

                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        قم بتفعيل الإشعارات لتصلك تحديثات طلبك، والعروض الخاصة، ورسائل المتجر مباشرة حتى واأنت خارج التطبيق.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Icon name="Loader" className="w-5 h-5 animate-spin" />
                                    جاري التفعيل...
                                </>
                            ) : (
                                'تفعيل الإشعارات الآن'
                            )}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-xl transition-colors"
                        >
                            ليس الآن
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default NotificationPermissionModal;
