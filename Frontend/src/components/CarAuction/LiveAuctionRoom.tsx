import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveAuction, useAuctionCountdown, usePlaceBid, useAuctionRegistration } from '../../hooks/useAuction';
import { useOutbidNotification } from '../../hooks/useAuctionUpdates';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { useAuctionConnection } from '../../hooks/useAuctionConnection';
import * as auctionService from '../../services/auction.service';
import { Auction, AuctionBid } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';
import { AuctionStatusBadge } from './AuctionStatusBadge';
import { AuctionTimeline } from './AuctionTimeline';
import { LiveAuctionRoomSkeleton } from './AuctionSkeleton';
import { AuctionPolicyModal } from './AuctionPolicyModal';
import { parseAuctionError, getErrorMessage } from '../../constants/auctionErrors';
import confetti from 'canvas-confetti';

// New infrastructure components
import { AuctionConnectionStatus } from './AuctionConnectionStatus';
import { BidHistoryCard } from './BidHistoryCard';
import { QuickBidButton } from './QuickBidButton';
import { MobileBidSheet } from './MobileBidSheet';
import { ParticipantsList } from './ParticipantsList';

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

interface LiveAuctionRoomProps {
    auctionId: string;
    onBack: () => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated: boolean;
    walletBalance?: number;
    userId?: string | number;
}

export const LiveAuctionRoom: React.FC<LiveAuctionRoomProps> = ({
    auctionId,
    onBack,
    showToast,
    isAuthenticated,
    walletBalance: propWalletBalance,
    userId,
}) => {
    const {
        auction,
        bids,
        loading,
        error,
        participants,
        announcement,
        clearAnnouncement,
        refresh,
        updateLocalAuction,
        addLocalBid,
        loadMoreBids,
        bidsHasMore,
        loadingMoreBids
    } = useLiveAuction(auctionId);

    const { placeBid, buyNow, loading: bidLoading, error: bidError, success: bidSuccess, setError } = usePlaceBid(auctionId);
    const { register, loading: registerLoading, error: registerError, isRegistered, setIsRegistered } = useAuctionRegistration(auctionId);
    const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [showMobileBidSheet, setShowMobileBidSheet] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    // Connection monitoring
    const { status: wsConnectionStatus, quality: connectionQuality, isOnline } = useAuctionConnection();


    // Real-time wallet balance
    const { balance: liveWalletBalance, available: availableBalance } = useWalletBalance(userId, propWalletBalance);
    const walletBalance = liveWalletBalance;

    // Outbid notifications
    useOutbidNotification(userId, (data) => {
        if (data.auction_id === auctionId) {
            showToast?.(`تم المزايدة عليك! المزايدة الجديدة: $${data.new_bid.toLocaleString()}`, 'info');
            confetti({
                particleCount: 30,
                spread: 40,
                origin: { y: 0.6 },
                colors: ['#F59E0B'] // Warning color
            });
        }
    });

    // Watchlist check
    useEffect(() => {
        if (isAuthenticated && auctionId) {
            auctionService.checkWatchlist(auctionId)
                .then(res => setIsInWatchlist(res.in_watchlist))
                .catch(console.error);
        }
    }, [isAuthenticated, auctionId]);

    const handleToggleWatchlist = async () => {
        if (!isAuthenticated) return;
        setWatchlistLoading(true);
        try {
            if (isInWatchlist) {
                await auctionService.removeFromWatchlist(auctionId);
                setIsInWatchlist(false);
                showToast?.('تمت الإزالة من المفضلة', 'info');
            } else {
                await auctionService.addToWatchlist(auctionId);
                setIsInWatchlist(true);
                showToast?.('تمت الإضافة للمفضلة', 'success');
            }
        } catch (error) {
            console.error('Watchlist toggle error', error);
        } finally {
            setWatchlistLoading(false);
        }
    };

    const [customBid, setCustomBid] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showCarDetails, setShowCarDetails] = useState(false);
    const [showParticipantsList, setShowParticipantsList] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [bidFeedback, setBidFeedback] = useState<'success' | 'error' | null>(null);
    const bidInputRef = useRef<HTMLInputElement>(null);
    const bidsContainerRef = useRef<HTMLDivElement>(null);
    const lastBidCountRef = useRef(0);
    const lastBidAttempt = useRef<number | null>(null);
    const [isPaying, setIsPaying] = useState(false);

    const handlePayAuction = async () => {
        if (!window.confirm('هل أنت متأكد من دفع المبلغ من محفظتك؟ سيتم خصم المبلغ من رصيدك.')) return;

        setIsPaying(true);
        try {
            await auctionService.payAuction(auctionId);
            showToast?.('تم الدفع بنجاح!', 'success');
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD700', '#FFA500'] // Gold
            });
            refresh(true);
        } catch (err: any) {
            showToast?.(err.response?.data?.error || 'فشل الدفع', 'error');
        } finally {
            setIsPaying(false);
        }
    };

    // Countdown
    const targetIsLive = auction?.is_live || auction?.status === 'live' || auction?.status === 'extended';

    // Use scheduled_end for live auctions (actual_end is only set when auction ends)
    const targetTime = targetIsLive
        ? auction?.scheduled_end
        : auction?.scheduled_start;

    // Debug countdown
    console.log('⏱️ Countdown Debug:', {
        status: auction?.status,
        is_live: auction?.is_live,
        scheduled_end: auction?.scheduled_end,
        actual_end: auction?.actual_end,
        time_remaining_backend: auction?.time_remaining,
        targetTime,
    });

    // Callback for timer end
    const handleTimerEnd = useCallback(() => {
        const isAuctionLive = auction?.is_live || auction?.status === 'live' || auction?.status === 'extended';
        const auctionHasEnded = auction?.has_ended || auction?.status === 'ended';

        if (auctionId && !auctionHasEnded && isAuctionLive) {
            console.log('🏁 Timer reached zero, forcing status check...');
            auctionService.checkAuctionStatus(auctionId)
                .then(() => {
                    refresh(true);
                    showToast?.('انتهى المزاد', 'info');
                })
                .catch(err => console.error('Failed to check status on timer end', err));
        }
    }, [auctionId, auction, refresh, showToast]);

    const { formatted, timeRemaining, isExpired } = useAuctionCountdown(targetTime, handleTimerEnd);

    // Sync registration state
    useEffect(() => {
        if (auction?.is_registered) {
            setIsRegistered(true);
        }
    }, [auction?.is_registered, setIsRegistered]);

    // Play sound on new bid (removed excessive confetti)
    useEffect(() => {
        if (bids.length > lastBidCountRef.current) {
            // New bid arrived
            if (soundEnabled) {
                try {
                    new Audio('/bid_sound.mp3').play().catch(() => { });
                } catch { }
            }

            lastBidCountRef.current = bids.length;
        }
    }, [bids.length, soundEnabled]);

    // Scroll to top on new bid
    useEffect(() => {
        if (bidsContainerRef.current) {
            bidsContainerRef.current.scrollTop = 0;
        }
    }, [bids.length]);

    // Handle bid success - ONLY trigger confetti for user's own successful bid
    useEffect(() => {
        if (bidSuccess) {
            showToast?.('تم تقديم مزايدتك بنجاح! 🎉', 'success');
            setCustomBid('');
            setRetryCount(0); // Reset retry count on success
            lastBidAttempt.current = null;

            // Visual feedback: Green flash
            setBidFeedback('success');
            setTimeout(() => setBidFeedback(null), 1500);

            // Confetti only for own successful bid
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10B981', '#34D399', '#6EE7B7']
            });
        }
    }, [bidSuccess, showToast]);

    // Handle bid error
    useEffect(() => {
        if (bidError) {
            showToast?.(bidError, 'error');
            setError(null);

            // Visual feedback: Red shake
            setBidFeedback('error');
            setTimeout(() => setBidFeedback(null), 1000);
        }
    }, [bidError, showToast, setError]);

    const handlePlaceBid = async (amount: number, isRetry = false, maxAutoBid?: number) => {
        if (!isAuthenticated) {
            showToast?.('يرجى تسجيل الدخول للمزايدة', 'error');
            return;
        }
        if (!isRegistered) {
            showToast?.('يجب التسجيل أولاً للمشاركة في المزاد', 'error');
            return;
        }

        // Store last bid attempt for retry
        lastBidAttempt.current = amount;

        try {
            setIsRetrying(isRetry);
            const response = await placeBid(amount, maxAutoBid);

            // Deterministic Optimistic Update
            if (auction) {
                // Force number conversion to avoid string concatenation
                const safeAmount = Number(amount);
                const safeIncrement = Number(auction.bid_increment || 0);
                const safeCurrentCount = Number(auction.bid_count || 0);

                const nextBid = safeAmount + safeIncrement;

                // Update auction stats immediately
                updateLocalAuction({
                    current_bid: safeAmount,
                    bid_count: safeCurrentCount + 1,
                    minimum_bid: nextBid
                });

                // Handle different response structures (wrapped or direct)
                const bidData = response?.bid || response;

                if (bidData) {
                    // Transform raw backend bid to frontend AuctionBid structure
                    const newBid = {
                        ...bidData,
                        display_name: 'أنت', // "You" in Arabic
                        anonymized_name: 'أنت',
                        is_mine: true,
                        bid_time: bidData.created_at || bidData.bid_time || new Date().toISOString()
                    };

                    addLocalBid(newBid);
                }
            }

        } catch (error: any) {
            console.error('Bid error:', error);

            // Parse and display structured error
            const parsedError = parseAuctionError(error.response?.data || error);
            const { message, action } = getErrorMessage(parsedError);

            // Check if it's a network error
            if (!navigator.onLine || error.message?.includes('Network Error')) {
                setConnectionStatus('disconnected');
                showToast?.('فقدان الاتصال بالإنترنت. يرجى التحقق من الاتصال', 'error');
            } else {
                // Show structured error with action
                showToast?.(`${message}${action ? ` - ${action}` : ''}`, 'error');
            }

            // Immediate refresh on error to get latest state
            refresh(true);
        } finally {
            setIsRetrying(false);
        }
    };

    // Retry last failed bid
    const retryLastBid = useCallback(() => {
        if (lastBidAttempt.current && retryCount < 3) {
            setRetryCount(prev => prev + 1);
            handlePlaceBid(lastBidAttempt.current, true);
        }
    }, [retryCount, lastBidAttempt.current]);

    // Monitor network status
    useEffect(() => {
        const handleOnline = () => {
            setConnectionStatus('connected');
            setRetryCount(0);
            showToast?.('تم استعادة الاتصال', 'success');
        };
        const handleOffline = () => {
            setConnectionStatus('disconnected');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [showToast]);

    // Debounced quick bid to prevent spam
    const handleQuickBid = useMemo(
        () => debounce(() => {
            if (auction?.minimum_bid) {
                handlePlaceBid(auction.minimum_bid);
            }
        }, 500),
        [auction?.minimum_bid, handlePlaceBid]
    );

    const handleCustomBid = () => {
        const amount = parseFloat(customBid);
        if (isNaN(amount) || amount < (auction?.minimum_bid || 0)) {
            showToast?.(`الحد الأدنى للمزايدة هو ${auction?.minimum_bid?.toLocaleString()}$`, 'error');
            return;
        }
        handlePlaceBid(amount);
    };

    const handleRegisterClick = () => {
        if (!isAuthenticated) {
            showToast?.('يرجى تسجيل الدخول للتسجيل', 'error');
            return;
        }
        // Show policy modal first
        setShowPolicyModal(true);
    };

    const handleAcceptPolicy = async () => {
        setShowPolicyModal(false);
        await register();
        if (!registerError) {
            showToast?.('تم التسجيل بنجاح! يمكنك الآن المزايدة', 'success');
        } else {
            showToast?.(registerError, 'error');
        }
    };

    const images = auction?.car?.media?.images || [];
    const car = auction?.car;

    if (loading && !auction) {
        return <LiveAuctionRoomSkeleton />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Icon name="AlertCircle" className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">حدث خطأ</h2>
                    <p className="text-slate-400 mb-6">{error}</p>
                    <Button variant="primary" onClick={onBack}>
                        <Icon name="ArrowRight" className="w-4 h-4 mr-2" />
                        العودة للمزادات
                    </Button>
                </div>
            </div>
        );
    }

    if (!auction) return null;

    const isLive = auction.is_live || auction.status === 'live';
    const hasEnded = auction.has_ended;
    const isUrgent = timeRemaining < 30 && !hasEnded;

    return (
        <div className={`min-h-screen bg-slate-900 transition-colors duration-1000 ${isUrgent ? 'bg-red-950/30' : ''}`}>
            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>

            {/* Connection Status Indicator  - New Component */}
            <AuctionConnectionStatus
                showDetails={true}
                position="top-right"
                compact={false}
            />

            {/* Auctioneer Announcement Overlay */}
            <AnimatePresence>
                {announcement && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-full px-4"
                    >
                        <div className={`
                            rounded-2xl p-4 shadow-2xl backdrop-blur-xl border text-center
                            ${announcement.type === 'going_once' ? 'bg-yellow-500/90 border-yellow-400 text-white' : ''}
                            ${announcement.type === 'going_twice' ? 'bg-orange-500/90 border-orange-400 text-white' : ''}
                            ${announcement.type === 'sold' ? 'bg-green-500/90 border-green-400 text-white' : ''}
                            ${announcement.type === 'warning' ? 'bg-red-500/90 border-red-400 text-white' : ''}
                            ${announcement.type === 'info' ? 'bg-blue-500/90 border-blue-400 text-white' : ''}
                        `}
                        >
                            <div className="flex items-center justify-center gap-3">
                                <Icon name="Megaphone" className="w-6 h-6" />
                                <p className="font-bold text-lg">{announcement.message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Bar */}
            <div className={`bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky z-50 ${connectionStatus !== 'connected' ? 'top-14' : 'top-0'}`}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="!text-white/70 hover:!text-white hover:!bg-white/10"
                    >
                        <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
                        العودة
                    </Button>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Watchlist Toggle */}
                        {isAuthenticated && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleWatchlist}
                                disabled={watchlistLoading}
                                className={`!w-8 !h-8 md:!w-10 md:!h-10 rounded-xl transition-all ${isInWatchlist ? '!bg-red-500 !text-white shadow-lg shadow-red-500/20' : '!bg-white/10 !text-white/50 hover:!text-red-400'}`}
                            >
                                <Icon name="Heart" className={`w-4 h-4 md:w-5 md:h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
                            </Button>
                        )}
                        {/* Live Badge */}
                        {isLive && (
                            <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 shadow-lg shadow-red-500/20">
                                <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 md:h-2.5 w-2 md:w-2.5 bg-white"></span>
                                </span>
                                <span className="hidden md:inline">مباشر</span>
                            </Badge>
                        )}

                        {/* Online Participants - Clickable */}
                        <button
                            onClick={() => setShowParticipantsList(true)}
                            className="flex items-center gap-1.5 md:gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 md:px-3 py-1 md:py-1.5 rounded-xl backdrop-blur-sm text-xs md:text-sm transition-all"
                        >
                            <Icon name="Users" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="font-semibold">{participants.length}</span>
                        </button>

                        {/* Sound Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`!w-8 !h-8 md:!w-10 md:!h-10 rounded-xl transition-all ${soundEnabled ? '!bg-primary !text-white shadow-lg shadow-primary/20' : '!bg-white/10 !text-white/50'}`}
                        >
                            <Icon name={soundEnabled ? 'Volume2' : 'VolumeX'} className="w-4 h-4 md:w-5 md:h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

                    {/* 1. Image Gallery - Order 1 */}
                    <div className="lg:col-span-2 order-1">
                        <div className="group relative bg-slate-800/50 rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 shadow-xl">
                            <div className="relative h-60 sm:h-80 md:h-[500px]">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={currentImageIndex}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        src={images[currentImageIndex] || '/placeholder-car.jpg'}
                                        alt={auction.title}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                                {images.length > 1 && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 !w-10 !h-10 md:!w-12 md:!h-12 !bg-black/30 backdrop-blur-md !text-white hover:!bg-black/50 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Icon name="ChevronLeft" className="w-5 h-5 md:w-6 md:h-6" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setCurrentImageIndex(i => Math.min(images.length - 1, i + 1))}
                                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 !w-10 !h-10 md:!w-12 md:!h-12 !bg-black/30 backdrop-blur-md !text-white hover:!bg-black/50 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Icon name="ChevronRight" className="w-5 h-5 md:w-6 md:h-6" />
                                        </Button>
                                    </>
                                )}
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentImageIndex(i)}
                                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4 md:w-6' : 'bg-white/40 hover:bg-white/60'}`}
                                        />
                                    ))}
                                </div>

                                {/* Ended Overlay */}
                                {hasEnded && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10"
                                    >
                                        <div className="text-center text-white p-4">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                                className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl shadow-yellow-500/20"
                                            >
                                                <Icon name="Trophy" className="w-8 h-8 md:w-12 md:h-12 text-white" />
                                            </motion.div>
                                            <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">انتهى المزاد</h2>
                                            {auction.winner_name && (
                                                <div className="bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-md border border-white/10 mt-2 md:mt-4">
                                                    <p className="text-sm md:text-lg text-slate-300">الفائز بالمزاد</p>
                                                    <p className="font-bold text-lg md:text-2xl text-white">{auction.winner_name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Bidding Panel - Order 2 Mobile / Right Column Desktop */}
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
                                    {hasEnded ? '00:00:00' : formatted}
                                </p>
                            </motion.div>

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

                            {/* Actions */}
                            {isLive && !hasEnded && (
                                <div className="relative z-10">
                                    {!isRegistered ? (
                                        <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-sm border border-white/10 shadow-lg">
                                            <div className="text-center mb-4 md:mb-6">
                                                <div className="inline-flex p-3 md:p-4 rounded-full bg-primary/10 mb-3 md:mb-4 ring-1 ring-primary/30">
                                                    <Icon name="UserPlus" className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                                                </div>
                                                <p className="text-white font-bold text-base md:text-lg mb-1">سجّل للمشاركة</p>
                                                {car && car.deposit_amount > 0 && (
                                                    <Badge variant="warning" className="mt-2 text-xs">
                                                        تأمين: ${car.deposit_amount.toLocaleString()}
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

                                            {/* Mobile Quick Bid - Shows only on Mobile */}
                                            <div className="lg:hidden">
                                                <Button
                                                    variant="success"
                                                    size="lg"
                                                    onClick={() => setShowMobileBidSheet(true)}
                                                    className="w-full !text-lg !py-6 font-black shadow-lg shadow-emerald-500/20 touch-target"
                                                    leftIcon={<Icon name="Hammer" className="w-6 h-6" />}
                                                >
                                                    زايد الآن
                                                </Button>
                                            </div>

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
                                                            onChange={(e) => {
                                                                // Store in a ref or state if needed, simpler to just use ref for now or adding state
                                                                // For simplicity, let's treat customBid as the direct bid, and this as max
                                                                // I'll add a state for autoBid
                                                            }}
                                                            id="auto-bid-input"
                                                        />
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => {
                                                                // Get values
                                                                const amount = parseFloat(customBid);
                                                                const maxAuto = parseFloat((document.getElementById('auto-bid-input') as HTMLInputElement).value) || undefined;

                                                                if (isNaN(amount) || amount < (auction?.minimum_bid || 0)) {
                                                                    showToast?.(`الحد الأدنى للمزايدة هو ${auction?.minimum_bid?.toLocaleString()}$`, 'error');
                                                                    return;
                                                                }
                                                                if (maxAuto && maxAuto <= amount) {
                                                                    showToast?.('يجب أن يكون الحد الأقصى أكبر من مبلغ المزايدة', 'error');
                                                                    return;
                                                                }

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
                    </div>

                    {/* 3. Car Details - Order 3 Mobile / Left Column Desktop */}
                    <div className="lg:col-span-2 order-3">
                        <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-6 backdrop-blur-sm border border-white/10">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                        <AuctionStatusBadge status={auction.status} isLive={isLive} />
                                        <h1 className="text-xl md:text-3xl font-black text-white">{auction.title}</h1>
                                    </div>
                                    {car && (
                                        <p className="text-slate-400 font-medium text-sm md:text-base">{car.brand} {car.model} • {car.year}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCarDetails(!showCarDetails)}
                                    className="!text-primary hover:!bg-primary/10"
                                >
                                    {showCarDetails ? 'إخفاء' : 'عرض الكل'}
                                    <Icon name={showCarDetails ? 'ChevronUp' : 'ChevronDown'} className="w-4 h-4 mr-1" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                                {car?.mileage && (
                                    <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                                        <Icon name="Gauge" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                                        <p className="text-slate-400 text-[10px] md:text-xs font-medium">الممشى</p>
                                        <p className="text-white font-bold text-sm md:text-base">{car.mileage.toLocaleString()}</p>
                                    </div>
                                )}
                                {car?.transmission && (
                                    <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                                        <Icon name="Settings" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                                        <p className="text-slate-400 text-[10px] md:text-xs font-medium">القير</p>
                                        <p className="text-white font-bold text-sm md:text-base">{car.transmission === 'automatic' ? 'أوتوماتيك' : 'يدوي'}</p>
                                    </div>
                                )}
                                {car?.fuel_type && (
                                    <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                                        <Icon name="Fuel" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                                        <p className="text-slate-400 text-[10px] md:text-xs font-medium">الوقود</p>
                                        <p className="text-white font-bold text-sm md:text-base">{car.fuel_type === 'petrol' ? 'بنزين' : 'ديزل'}</p>
                                    </div>
                                )}
                                {car?.exterior_color && (
                                    <div className="bg-slate-700/30 rounded-xl md:rounded-2xl p-3 md:p-4 text-center border border-white/5">
                                        <Icon name="Palette" className="w-5 h-5 md:w-6 md:h-6 text-primary mx-auto mb-1.5" />
                                        <p className="text-slate-400 text-[10px] md:text-xs font-medium">اللون</p>
                                        <p className="text-white font-bold text-sm md:text-base capitalize">{car.exterior_color}</p>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {showCarDetails && car?.description && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-4 mt-4 border-t border-white/10">
                                            <h3 className="text-white font-bold mb-2">الوصف</h3>
                                            <p className="text-slate-300 leading-relaxed text-sm md:text-base">{car.description}</p>
                                            {car.features && car.features.length > 0 && (
                                                <div className="mt-4">
                                                    <h3 className="text-white font-bold mb-2">المميزات</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {car.features.map((feature, i) => (
                                                            <Badge key={i} variant="secondary" className="!bg-slate-700 !text-white border border-white/10">
                                                                <Icon name="Check" className="w-3 h-3 mr-1 text-emerald-400" />
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* 4. Timeline/History - Order 4 */}
                    <div className="lg:col-span-1 order-4">
                        <div className="bg-slate-800/50 rounded-2xl md:rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 flex flex-col h-[300px] md:h-[400px]">
                            <div className="p-4 border-b border-white/10 bg-black/20">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Icon name="Activity" className="w-5 h-5 text-primary" />
                                    سجل المزايدات
                                </h3>
                            </div>
                            <AuctionTimeline
                                auction={auction}
                                bids={bids}
                                onLoadMore={loadMoreBids}
                                hasMore={bidsHasMore}
                                loadingMore={loadingMoreBids}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Policy Modal */}
            <AuctionPolicyModal
                isOpen={showPolicyModal}
                onClose={() => setShowPolicyModal(false)}
                onAccept={handleAcceptPolicy}
                depositAmount={auction?.car?.deposit_amount || 0}
            />

            {/* Mobile Bid Sheet */}
            <MobileBidSheet
                isOpen={showMobileBidSheet}
                onClose={() => setShowMobileBidSheet(false)}
                minimumBid={auction.minimum_bid || 0}
                bidIncrement={auction.bid_increment || 100}
                currentBid={auction.current_bid}
                onPlaceBid={handlePlaceBid}
                isLoading={bidLoading}
            />

            {/* Participants List Modal */}
            <AnimatePresence>
                {showParticipantsList && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowParticipantsList(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md"
                        >
                            <div className="relative">
                                <button
                                    onClick={() => setShowParticipantsList(false)}
                                    className="absolute -top-2 -right-2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-white hover:bg-slate-700 border-2 border-white/10 shadow-lg"
                                >
                                    <Icon name="X" className="w-5 h-5" />
                                </button>
                                <ParticipantsList
                                    totalParticipants={participants.length}
                                    onlineParticipants={participants.map(p => ({
                                        id: p.id || p.user_id,
                                        name: p.name || p.bidder_name,
                                        isOnline: true,
                                    }))}
                                    showList={true}
                                    compact={false}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default LiveAuctionRoom;
