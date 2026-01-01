import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuctionConnection, ConnectionStatus, ConnectionQuality } from '../../hooks/useAuctionConnection';
import Icon from '../Icon';

interface AuctionConnectionStatusProps {
    /** Show detailed metrics (latency, reconnect attempts) */
    showDetails?: boolean;
    /** Position of the indicator */
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
    /** Compact mode for mobile */
    compact?: boolean;
}

export const AuctionConnectionStatus: React.FC<AuctionConnectionStatusProps> = ({
    showDetails = false,
    position = 'top-right',
    compact = false,
}) => {
    const { status, quality, isOnline, metrics, retryConnection } = useAuctionConnection();

    // Don't show anything if connected and quality is good
    if (status === 'connected' && quality === 'excellent' && !showDetails) {
        return null;
    }

    const getStatusConfig = (status: ConnectionStatus, quality: ConnectionQuality) => {
        if (!isOnline || status === 'disconnected') {
            return {
                icon: 'WifiOff',
                label: 'غير متصل',
                color: 'bg-red-500',
                textColor: 'text-red-800 dark:text-red-200',
                bgColor: 'bg-red-50 dark:bg-red-900/30',
                borderColor: 'border-red-200 dark:border-red-800',
                pulse: false,
            };
        }

        if (status === 'error') {
            return {
                icon: 'AlertCircle',
                label: 'خطأ في الاتصال',
                color: 'bg-red-500',
                textColor: 'text-red-800 dark:text-red-200',
                bgColor: 'bg-red-50 dark:bg-red-900/30',
                borderColor: 'border-red-200 dark:border-red-800',
                pulse: true,
            };
        }

        if (status === 'reconnecting' || status === 'connecting') {
            return {
                icon: 'RefreshCw',
                label: 'إعادة الاتصال...',
                color: 'bg-amber-500',
                textColor: 'text-amber-800 dark:text-amber-200',
                bgColor: 'bg-amber-50 dark:bg-amber-900/30',
                borderColor: 'border-amber-200 dark:border-amber-800',
                pulse: true,
            };
        }

        // Connected - show quality indicator
        if (quality === 'poor' || quality === 'fair') {
            return {
                icon: 'Wifi',
                label: quality === 'poor' ? 'اتصال ضعيف' : 'اتصال متوسط',
                color: quality === 'poor' ? 'bg-orange-500' : 'bg-yellow-500',
                textColor: quality === 'poor'
                    ? 'text-orange-800 dark:text-orange-200'
                    : 'text-yellow-800 dark:text-yellow-200',
                bgColor: quality === 'poor'
                    ? 'bg-orange-50 dark:bg-orange-900/30'
                    : 'bg-yellow-50 dark:bg-yellow-900/30',
                borderColor: quality === 'poor'
                    ? 'border-orange-200 dark:border-orange-800'
                    : 'border-yellow-200 dark:border-yellow-800',
                pulse: false,
            };
        }

        return {
            icon: 'Wifi',
            label: 'متصل',
            color: 'bg-emerald-500',
            textColor: 'text-emerald-800 dark:text-emerald-200',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            pulse: false,
        };
    };

    const config = getStatusConfig(status, quality);

    const positionClasses = {
        'top-right': 'fixed top-4 right-4 z-50',
        'top-left': 'fixed top-4 left-4 z-50',
        'bottom-right': 'fixed bottom-4 right-4 z-50',
        'bottom-left': 'fixed bottom-4 left-4 z-50',
        'inline': 'relative',
    };

    const showRetryButton = status === 'disconnected' || status === 'error';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`${positionClasses[position]}`}
            >
                <div
                    className={`
                        ${config.bgColor} ${config.borderColor} ${config.textColor}
                        backdrop-blur-md border rounded-xl shadow-lg
                        ${compact ? 'p-2' : 'p-3'}
                        flex items-center gap-2
                        transition-all duration-300
                    `}
                >
                    {/* Status Icon */}
                    <div className="relative">
                        <div className={`${config.color} rounded-full p-1.5 ${config.pulse ? 'animate-pulse' : ''}`}>
                            <Icon
                                name={config.icon as any}
                                className={`w-4 h-4 text-white ${status === 'reconnecting' || status === 'connecting' ? 'animate-spin' : ''}`}
                            />
                        </div>
                        {status === 'connected' && (
                            <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 ${config.color} rounded-full animate-pulse`} />
                        )}
                    </div>

                    {/* Status Label */}
                    {!compact && (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold leading-tight">{config.label}</span>
                            {showDetails && metrics.latency > 0 && (
                                <span className="text-xs opacity-70">
                                    {metrics.latency}ms
                                </span>
                            )}
                        </div>
                    )}

                    {/* Retry Button */}
                    {showRetryButton && !compact && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={retryConnection}
                            className="mr-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                        >
                            إعادة المحاولة
                        </motion.button>
                    )}

                    {/* Details Panel */}
                    {showDetails && !compact && (
                        <div className="mr-3 pr-3 border-r border-current/20 text-xs space-y-0.5">
                            {metrics.reconnectAttempts > 0 && (
                                <div className="flex items-center gap-1 opacity-70">
                                    <Icon name="RotateCw" className="w-3 h-3" />
                                    <span>محاولات: {metrics.reconnectAttempts}</span>
                                </div>
                            )}
                            {metrics.lastDisconnectedAt && status !== 'connected' && (
                                <div className="opacity-70">
                                    قطع منذ: {new Date(metrics.lastDisconnectedAt).toLocaleTimeString('ar-EG')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile Retry Button (when compact) */}
                {showRetryButton && compact && (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={retryConnection}
                        className={`
                            mt-2 w-full ${config.bgColor} ${config.borderColor} ${config.textColor}
                            backdrop-blur-md border rounded-lg px-3 py-2
                            text-xs font-bold
                            flex items-center justify-center gap-2
                        `}
                    >
                        <Icon name="RefreshCw" className="w-3 h-3" />
                        إعادة المحاولة
                    </motion.button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default AuctionConnectionStatus;
