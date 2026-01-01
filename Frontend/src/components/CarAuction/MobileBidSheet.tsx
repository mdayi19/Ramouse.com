import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Icon from '../Icon';
import { Button } from '../ui/Button';

interface MobileBidSheetProps {
    /** Whether the sheet is open */
    isOpen: boolean;
    /** Callback to close the sheet */
    onClose: () => void;
    /** Current minimum bid */
    minimumBid: number;
    /** Bid increment */
    bidIncrement: number;
    /** Current highest bid (if any) */
    currentBid?: number;
    /** Callback when bid is placed */
    onPlaceBid: (amount: number) => Promise<void>;
    /** Loading state */
    isLoading?: boolean;
}

export const MobileBidSheet: React.FC<MobileBidSheetProps> = ({
    isOpen,
    onClose,
    minimumBid,
    bidIncrement,
    currentBid,
    onPlaceBid,
    isLoading = false,
}) => {
    const [customBid, setCustomBid] = useState<string>('');
    const [selectedQuickBid, setSelectedQuickBid] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Generate quick bid options
    const quickBidOptions = [
        minimumBid,
        minimumBid + bidIncrement,
        minimumBid + (bidIncrement * 2),
        minimumBid + (bidIncrement * 3),
    ];

    // Handle swipe to dismiss
    const handleDragEnd = (event: any, info: PanInfo) => {
        if (info.offset.y > 100) {
            onClose();
        }
    };

    const handlePlaceBid = async (amount: number) => {
        if (amount < minimumBid) {
            setError(`الحد الأدنى للمزايدة هو $${minimumBid.toLocaleString()}`);
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            await onPlaceBid(amount);
            onClose();
            // Reset form
            setCustomBid('');
            setSelectedQuickBid(null);
        } catch (err: any) {
            setError(err.message || 'فشلت المزايدة');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickBid = (amount: number) => {
        setSelectedQuickBid(amount);
        setCustomBid('');
        setError(null);
    };

    const handleCustomBidChange = (value: string) => {
        setCustomBid(value);
        setSelectedQuickBid(null);
        setError(null);
    };

    const finalBidAmount = selectedQuickBid || (customBid ? parseFloat(customBid) : 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-darkcard rounded-t-[2rem] shadow-2xl max-h-[85vh] overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-2rem)]">
                            {/* Header */}
                            <div className="mb-6 pt-2">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        ضع مزايدتك
                                    </h2>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <Icon name="X" className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Current Bid Info */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">
                                                {currentBid ? 'أعلى مزايدة حالية' : 'سعر البداية'}
                                            </p>
                                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                                ${(currentBid || minimumBid).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">
                                                أقل مزايدة
                                            </p>
                                            <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                                                ${minimumBid.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Bid Options */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <Icon name="Zap" className="w-4 h-4 text-blue-500" />
                                    مزايدة سريعة
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {quickBidOptions.map((amount) => (
                                        <motion.button
                                            key={amount}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleQuickBid(amount)}
                                            className={`
                                                p-4 rounded-xl font-bold text-lg transition-all
                                                ${selectedQuickBid === amount
                                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }
                                            `}
                                        >
                                            ${amount.toLocaleString()}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Bid Input */}
                            <div className="mb-6">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                    <Icon name="Edit" className="w-4 h-4 text-blue-500" />
                                    مزايدة مخصصة
                                </h3>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <span className="text-2xl font-black text-slate-400 dark:text-slate-500">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        value={customBid}
                                        onChange={(e) => handleCustomBidChange(e.target.value)}
                                        placeholder={minimumBid.toString()}
                                        className="
                                            w-full pl-12 pr-6 py-4 text-2xl font-black
                                            bg-slate-100 dark:bg-slate-800
                                            border-2 border-slate-200 dark:border-slate-700
                                            rounded-xl
                                            text-slate-900 dark:text-white
                                            placeholder-slate-400 dark:placeholder-slate-500
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            transition-all
                                        "
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                                    <Icon name="Info" className="w-3 h-3" />
                                    الزيادة الدنيا: ${bidIncrement.toLocaleString()}
                                </p>
                            </div>

                            {/* Error Message */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon name="AlertCircle" className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                                                {error}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit Button */}
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => handlePlaceBid(finalBidAmount)}
                                isLoading={isProcessing || isLoading}
                                disabled={!finalBidAmount || finalBidAmount < minimumBid}
                                className="w-full py-5 rounded-xl font-black text-lg shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 touch-target"
                                leftIcon={<Icon name="Gavel" className="w-6 h-6" />}
                            >
                                {finalBidAmount > 0
                                    ? `زايد الآن • $${finalBidAmount.toLocaleString()}`
                                    : 'اختر مبلغ المزايدة'
                                }
                            </Button>

                            {/* Safe Area Bottom Padding */}
                            <div className="h-[env(safe-area-inset-bottom)]" />
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileBidSheet;
