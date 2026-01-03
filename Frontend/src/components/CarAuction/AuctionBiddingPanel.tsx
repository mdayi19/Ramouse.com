import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import { Badge } from '../ui/Badge';
import { Auction, AuctionBid } from '../../types';

interface AuctionBiddingPanelProps {
    auction: Auction;
    bids: AuctionBid[];
    timeRemaining: number;
    formattedTime: string;
    isUrgent: boolean;
    bidFeedback: 'success' | 'error' | null;
    handlePlaceBid: (amount: number, isRetry?: boolean, maxAutoBid?: number) => void;
    bidLoading: boolean;
    isRegistered: boolean;
    handleRegisterClick: () => void;
    registerLoading: boolean;
    showBuyNowConfirm: boolean;
    setShowBuyNowConfirm: (value: boolean) => void;
    handleQuickBid: () => void;
    customBid: string;
    setCustomBid: (value: string) => void;
    handlePayAuction: () => void;
    isPaying: boolean;
    userId?: string | number;
    hasEnded: boolean;
    isLive: boolean;
    /** Toast notification function */
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AuctionBiddingPanel: React.FC<AuctionBiddingPanelProps> = ({
    auction,
    bids,
    timeRemaining,
    formattedTime,
    isUrgent,
    bidFeedback,
    handlePlaceBid,
    bidLoading,
    isRegistered,
    handleRegisterClick,
    registerLoading,
    showBuyNowConfirm,
    setShowBuyNowConfirm,
    handleQuickBid,
    customBid,
    setCustomBid,
    handlePayAuction,
    isPaying,
    userId,
    hasEnded,
    isLive,
    showToast,
}) => {
    const bidInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="lg:col-span-1 order-2">
            <div className="space-y-4 sticky top-24">
                {/* Timer */}
                <motion.div
                    animate={{
                        scale: isUrgent ? [1, 1.02, 1] : 1,
                        borderColor: isUrgent ? 'rgb(239 68 68 / 0.5)' : timeRemaining < 3600 ? 'rgb(251 191 36 / 0.5)' : 'rgb(255 255 255 / 0.1)',
                        backgroundColor: isUrgent ? 'rgb(239 68 68 / 0.1)' : timeRemaining < 3600 ? 'rgb(251 191 36 / 0.1)' : 'rgb(30 41 59 / 0.5)',
                    }}
                    transition={{ duration: 1, repeat: isUrgent ? Infinity : 0 }}
                    className={`rounded-2xl md:rounded-3xl p-4 md:p-6 text-center backdrop-blur-sm border shadow-lg relative overflow-hidden ${isUrgent ? 'animate-countdown-critical' : timeRemaining < 3600 ? 'animate-countdown-urgent' : ''
                        }`}
                >
                    {isUrgent && (
                        <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none"></div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3 relative z-10">
                        <Icon name="Clock" className={`w-4 h-4 md:w-5 md:h-5 ${isUrgent ? 'text-red-400' : timeRemaining < 3600 ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className={`text-sm md:text-base font-medium ${isUrgent ? 'text-red-400' : timeRemaining < 3600 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {hasEnded ? 'انتهى' : isLive ? 'ينتهي خلال' : 'يبدأ خلال'}
                        </span>
                    </div>
                    <p className={`text-4xl md:text-6xl font-mono font-black tracking-widest relative z-10 ${isUrgent ? 'text-red-400' : timeRemaining < 3600 ? 'text-amber-400' : 'text-white'}`}>
                        {hasEnded ? '00:00:00' : formattedTime}
                    </p>
                </motion.div>

                {/* King of the Hill - Highest Bidder */}
                {bids[0] && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={bids[0].id}
                        className="mb-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl p-3 flex items-center justify-between relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-yellow-500/5 animate-pulse"></div>
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50 shadow-lg shadow-yellow-500/20">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <Icon name="Crown" className="w-6 h-6 text-yellow-400" />
                                </motion.div>
                            </div>
                            <div>
                                <p className="text-[10px] text-yellow-200 font-bold uppercase tracking-wider">ملك المزاد حالياً</p>
                                <p className="text-white font-bold">{bids[0].display_name}</p>
                            </div>
                        </div>
                        <div className="text-yellow-400 font-black text-lg relative z-10">
                            ${bids[0].amount.toLocaleString()}
                        </div>
                    </motion.div>
                )}

                {/* Current Bid */}
                <motion.div
                    animate={{
                        scale: bidFeedback === 'success' ? [1, 1.05, 1] : bidFeedback === 'error' ? [1, 0.95, 1.02, 0.98, 1] : 1,
                        borderColor: bidFeedback === 'success' ? '#10B981' : bidFeedback === 'error' ? '#EF4444' : 'rgb(16 185 129 / 0.3)',
                    }}
                    transition={{
                        duration: bidFeedback === 'error' ? 0.5 : 0.3,
                        times: bidFeedback === 'error' ? [0, 0.1, 0.3, 0.5, 1] : undefined,
                    }}
                    className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-sm border border-emerald-500/30 text-center relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Icon name="Hammer" className="w-20 h-20 md:w-24 md:h-24 text-emerald-400" />
                    </div>
                    <p className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">
                        {auction.current_bid ? 'المزايدة الحالية' : 'سعر البداية'}
                    </p>
                    <motion.p
                        key={auction.current_bid}
                        initial={{ scale: 1.1, color: '#34d399' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="text-4xl md:text-5xl font-black text-white mb-2 md:mb-3 tracking-tight"
                    >
                        ${(auction.current_bid || auction.starting_bid)?.toLocaleString()}
                    </motion.p>
                    <div className="flex flex-col gap-1 items-center justify-center relative z-10">
                        <div className="flex items-center justify-center gap-4 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <Icon name="Hammer" className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="font-bold">{auction.bid_count}</span> مزايدة
                            </div>
                            <div className="text-slate-400">
                                الحد الأدنى: <span className="text-white font-bold">${auction.minimum_bid?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
                {/* Win Probability Gauge (Visual only for now) */}
                {isLive && !hasEnded && (
                    <div className="w-full h-1.5 bg-slate-700/50 rounded-full mt-4 overflow-hidden relative group">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-full opacity-30"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: `${Math.min((bids.length * 5), 100) - 100}%` }}
                            className="absolute inset-0 bg-white/50 w-full"
                        />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white bg-black px-2 rounded">
                            حماسة المزاد
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            {isLive && !hasEnded && (
                <div className="relative z-10 mt-4">
                    {!isRegistered ? (
                        <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-sm border border-white/10 shadow-lg">
                            <div className="text-center mb-4 md:mb-6">
                                <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4 ring-1 ring-primary/30">
                                    <Icon name="UserPlus" className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                </div>
                                <p className="text-white font-bold text-base md:text-lg mb-1">سجّل للمشاركة</p>
                                {auction.car && auction.car.deposit_amount > 0 && (
                                    <Badge variant="warning" className="mt-2 text-xs">
                                        تأمين: ${auction.car.deposit_amount.toLocaleString()}
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleRegisterClick}
                                isLoading={registerLoading}
                                className="w-full font-bold shadow-lg shadow-primary/25 !text-sm md:!text-base"
                            >
                                سجّل الآن في المزاد
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl p-4 backdrop-blur-sm border border-white/10 space-y-3">
                            {/* Buy Now Button */}
                            {auction?.car?.buy_now_price && (
                                <div className="mb-3 md:mb-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl md:rounded-2xl p-3 md:p-4 border border-purple-500/20">
                                    <div className="flex justify-between items-center mb-2 md:mb-3">
                                        <span className="text-purple-300 font-bold text-xs md:text-sm">شراء فوري</span>
                                        <span className="text-white font-black text-lg md:text-xl">${auction.car.buy_now_price.toLocaleString()}</span>
                                    </div>
                                    <Button
                                        variant="primary"
                                        className="w-full !bg-gradient-to-r !from-purple-600 !to-pink-600 hover:!from-purple-500 hover:!to-pink-500 shadow-lg shadow-purple-500/20 border-0 !text-sm"
                                        onClick={() => setShowBuyNowConfirm(true)}
                                        disabled={bidLoading}
                                    >
                                        شراء الآن
                                    </Button>
                                </div>
                            )}

                            {/* Quick Bid Button */}
                            <Button
                                variant="success"
                                size="lg"
                                onClick={handleQuickBid}
                                isLoading={bidLoading}
                                className="w-full !text-base md:!text-lg !py-4 md:!py-6 font-black shadow-lg shadow-emerald-500/20 group relative overflow-hidden"
                                leftIcon={<Icon name="Hammer" className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />}
                            >
                                <span className="relative z-10">زايد ${auction.minimum_bid?.toLocaleString()}</span>
                            </Button>

                            {/* Quick Increments */}
                            <div className="grid grid-cols-3 gap-2">
                                {[100, 500, 1000].map(increment => (
                                    <Button
                                        key={increment}
                                        variant="ghost"
                                        onClick={() => handlePlaceBid((auction.minimum_bid || 0) + increment)}
                                        disabled={bidLoading}
                                        className="!bg-slate-700/50 !text-white hover:!bg-slate-600 font-bold border border-white/5 !text-xs md:!text-sm"
                                    >
                                        +${increment}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom Bid Input & Auto Bid */}
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            ref={bidInputRef}
                                            type="number"
                                            value={customBid}
                                            onChange={(e) => setCustomBid(e.target.value)}
                                            placeholder="مبلغ المزايدة.."
                                            className="w-full bg-slate-700/50 text-white py-2 md:py-3.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold border border-white/5 transition-all focus:bg-slate-700 text-sm md:text-base text-center"
                                        />
                                    </div>
                                </div>

                                {/* Auto Bid Input */}
                                <div className="relative">
                                    <label className="text-xs text-slate-400 mb-1 block">مزايدة تلقائية (اختياري)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="أقصى حد للمزايدة..."
                                            className="flex-1 bg-slate-700/30 text-white py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-white/5 text-sm"
                                            id="auto-bid-input"
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={() => {
                                                const amount = parseFloat(customBid);
                                                const maxAuto = parseFloat((document.getElementById('auto-bid-input') as HTMLInputElement).value) || undefined;

                                                if (isNaN(amount) || amount < (auction?.minimum_bid || 0)) {
                                                    const minBidMessage = `الحد الأدنى للمزايدة هو $${auction?.minimum_bid?.toLocaleString()}`;
                                                    if (showToast) {
                                                        showToast(minBidMessage, 'error');
                                                    }
                                                    return;
                                                }
                                                // Actually let's assume valid and pass to parent handler
                                                handlePlaceBid(amount, false, maxAuto);
                                            }}
                                            disabled={bidLoading || !customBid}
                                            className="!px-4 md:!px-6 shadow-lg shadow-primary/20"
                                        >
                                            <Icon name="Send" className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                                            زايد
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Winner Action - Pay Now */}
            {hasEnded && auction.winner_id === userId && auction.payment_status !== 'paid' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-center text-white shadow-xl mt-4 relative z-20"
                >
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                            <Icon name="Award" className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-1">مبروك! لقد ربحت المزاد 🎉</h3>
                        <p className="text-emerald-100 text-sm">يرجى إتمام عملية الدفع لاستلام السيارة</p>
                    </div>
                    <Button
                        variant="secondary"
                        size="lg"
                        className="w-full font-bold bg-white text-emerald-700 hover:bg-emerald-50"
                        onClick={handlePayAuction}
                        isLoading={isPaying}
                    >
                        إتمام الدفع (${auction.current_bid?.toLocaleString()})
                    </Button>
                </motion.div>
            )}

            {/* Paid Status */}
            {hasEnded && auction.winner_id === userId && auction.payment_status === 'paid' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center mt-4"
                >
                    <Icon name="CheckCircle" className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-white mb-1">تم الدفع بنجاح</h3>
                    <p className="text-slate-400">سيتم التواصل معك لتسليم السيارة</p>
                </motion.div>
            )}
        </div>
    );
};
