import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '../Icon';
import { Button } from '../ui/Button';

interface QuickBidButtonProps {
    /** Current minimum bid amount */
    minimumBid: number;
    /** Bid increment */
    bidIncrement: number;
    /** Whether user is registered */
    isRegistered: boolean;
    /** Whether auction is live */
    isLive: boolean;
    /** Loading state */
    isLoading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Callback when bid is placed */
    onBid: (amount: number) => Promise<void>;
    /** Show confetti on success */
    showConfetti?: boolean;
    /** Compact mode for mobile */
    compact?: boolean;
}

export const QuickBidButton: React.FC<QuickBidButtonProps> = ({
    minimumBid,
    bidIncrement,
    isRegistered,
    isLive,
    isLoading = false,
    disabled = false,
    onBid,
    showConfetti = true,
    compact = false,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleQuickBid = async () => {
        if (!isRegistered || !isLive || disabled) return;

        setIsProcessing(true);
        setError(null);

        try {
            await onBid(minimumBid);

            // Show success state
            setShowSuccess(true);

            // Trigger confetti if enabled
            if (showConfetti && typeof window !== 'undefined' && (window as any).confetti) {
                (window as any).confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }

            // Reset success state after animation
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'فشلت المزايدة');
            setTimeout(() => setError(null), 3000);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isRegistered) {
        return (
            <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <Icon name="Lock" className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    يجب التسجيل في المزاد أولاً
                </p>
            </div>
        );
    }

    if (!isLive) {
        return (
            <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Icon name="Clock" className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                    المزاد غير مباشر حالياً
                </p>
            </div>
        );
    }

    const bidAmount = minimumBid;

    return (
        <div className="space-y-3">
            {/* Quick Bid Button */}
            <motion.div
                animate={showSuccess ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
            >
                <Button
                    variant="primary"
                    size={compact ? 'sm' : 'lg'}
                    onClick={handleQuickBid}
                    isLoading={isProcessing || isLoading}
                    disabled={disabled || isProcessing || showSuccess}
                    className={`
                        w-full rounded-xl font-black shadow-lg
                        ${showSuccess
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        }
                        ${compact ? 'py-3' : 'py-4'}
                        transition-all duration-300
                        relative overflow-hidden
                    `}
                    leftIcon={
                        showSuccess ? (
                            <Icon name="CheckCircle" className="w-5 h-5" />
                        ) : (
                            <Icon name="Zap" className="w-5 h-5" />
                        )
                    }
                >
                    {/* Animated Background */}
                    {!showSuccess && !isProcessing && (
                        <motion.div
                            className="absolute inset-0 bg-white/20"
                            animate={{
                                x: ['-100%', '100%'],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear',
                            }}
                        />
                    )}

                    {/* Button Text */}
                    <span className="relative z-10">
                        {showSuccess ? (
                            'تم بنجاح! ✨'
                        ) : isProcessing ? (
                            'جاري المزايدة...'
                        ) : (
                            <>
                                مزايدة سريعة{' '}
                                <span className="font-mono">${bidAmount.toLocaleString()}</span>
                            </>
                        )}
                    </span>
                </Button>
            </motion.div>

            {/* Bid Info */}
            {!compact && (
                <div className="flex items-center justify-between text-xs px-2">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Icon name="TrendingUp" className="w-3 h-3" />
                        <span>زيادة: ${bidIncrement.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                        <Icon name="Sparkles" className="w-3 h-3" />
                        <span>مزايدة فورية</span>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                        <Icon name="AlertCircle" className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                </motion.div>
            )}

            {/* Pulsing Indicator when Active */}
            {isLive && !isProcessing && !showSuccess && (
                <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="font-semibold">المزاد نشط</span>
                </motion.div>
            )}
        </div>
    );
};

export default QuickBidButton;
