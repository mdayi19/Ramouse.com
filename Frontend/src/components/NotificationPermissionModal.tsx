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
    // Debug log for mount
    React.useEffect(() => {
        console.log('🔵 [NotificationModal] Component Mounted. isOpen:', isOpen);
    }, [isOpen]);

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleEnable = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('🔵 [Modal] User clicked enable notifications');
            const success = await NotificationService.subscribeToPush();

            if (success) {
                console.log('✅ [Modal] Subscription successful');
                onPermissionGranted();
                onClose();
            } else {
                console.warn('⚠️ [Modal] Subscription failed (returned false)');
                setError('فشل تفعيل الإشعارات. يرجى التأكد من سماح المتصفح بها.');
            }
        } catch (error: any) {
            console.error('❌ [Modal] Subscription error:', error);

            // Show user-friendly error messages
            if (error.name === 'NotAllowedError') {
                setError('تم رفض الإذن. يرجى السماح بالإشعارات من إعدادات المتصفح.');
            } else if (error.message?.includes('not registered')) {
                setError('خدمة الإشعارات غير مفعلة. يرجى إعادة تحميل الصفحة.');
            } else if (error.message?.includes('not ready')) {
                setError('خدمة الإشعارات لم تكتمل. يرجى الانتظار قليلاً وإعادة المحاولة.');
            } else if (error.message?.includes('Service worker')) {
                setError('خطأ في تحميل الخدمة. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.');
            } else if (error.message?.includes('VAPID')) {
                setError('خطأ في الإعدادات. يرجى الاتصال بالدعم الفني.');
            } else {
                setError('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
            }
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

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>
                            {(error.includes('إعادة تحميل') || error.includes('reload')) && (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="text-xs bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 text-red-700 dark:text-red-200 px-3 py-1 rounded transition-colors"
                                >
                                    إعادة تحميل الصفحة
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleEnable}
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            disabled={isLoading}
                            className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
