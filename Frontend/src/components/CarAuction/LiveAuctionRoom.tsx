import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveAuction, useAuctionCountdown, usePlaceBid, useAuctionRegistration } from '../../hooks/useAuction';
import { useOutbidNotification } from '../../hooks/useAuctionUpdates';
import { useWalletBalance } from '../../hooks/useWalletBalance';
import { useAuctionConnection } from '../../hooks/useAuctionConnection';
import * as auctionService from '../../services/auction.service';
import { Button } from '../ui/Button';
import Icon from '../Icon';
// AuctionStatusBadge removed (moved to AuctionCarDetails)
// AuctionReactions removed
// useAIAuctioneer removed
import { AuctionTimeline } from './AuctionTimeline';
import { LiveAuctionRoomSkeleton } from './AuctionSkeleton';
import { AuctionPolicyModal } from './AuctionPolicyModal';
import { parseAuctionError, getErrorMessage } from '../../constants/auctionErrors';
import confetti from 'canvas-confetti';

// New infrastructure components
import { AuctionConnectionStatus } from './AuctionConnectionStatus';
import { MobileBidSheet } from './MobileBidSheet';
import { ParticipantsList } from './ParticipantsList';
import { SimilarAuctionsCarousel } from './SimilarAuctionsCarousel';
import { BidderFeed } from './BidderFeed';

// Sub components
import { AuctionHeader } from './AuctionHeader';
import { AuctionMedia } from './AuctionMedia';
import { AuctionBiddingPanel } from './AuctionBiddingPanel';
import { AuctionCarDetails } from './AuctionCarDetails';

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
        refresh,
        updateLocalAuction,
        addLocalBid,
        loadMoreBids,
        bidsHasMore,
        loadingMoreBids
    } = useLiveAuction(auctionId);

    const { placeBid, loading: bidLoading, error: bidError, success: bidSuccess, setError } = usePlaceBid(auctionId);
    const { register, loading: registerLoading, error: registerError, isRegistered, setIsRegistered } = useAuctionRegistration(auctionId);
    const [showBuyNowConfirm, setShowBuyNowConfirm] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [showMobileBidSheet, setShowMobileBidSheet] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    // Connection monitoring
    const { status: wsConnectionStatus } = useAuctionConnection();

    // Real-time wallet balance
    const { balance: liveWalletBalance } = useWalletBalance(userId, propWalletBalance);

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
    const [showCarDetails, setShowCarDetails] = useState(false);
    const [showParticipantsList, setShowParticipantsList] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const [bidFeedback, setBidFeedback] = useState<'success' | 'error' | null>(null);
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

    const { formatted, timeRemaining } = useAuctionCountdown(targetTime, handleTimerEnd);

    // Sync registration state
    useEffect(() => {
        if (auction?.is_registered) {
            setIsRegistered(true);
        }
    }, [auction?.is_registered, setIsRegistered]);

    // Play sound on new bid logic removed


    // Handle bid success
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

    const isLive = !!(auction.is_live || auction.status === 'live');
    const hasEnded = !!auction.has_ended;
    const isUrgent = timeRemaining < 30 && !hasEnded;

    return (
        <div className={`min-h-screen transition-colors duration-1000 ${isUrgent ? 'bg-red-950/30' : 'bg-slate-900'} ${isImmersive ? 'overflow-hidden' : ''}`}>
            {/* Immersive Background */}
            <div className={`absolute inset-0 transition-all duration-1000 ${isImmersive ? 'z-[60] bg-black/95' : '-z-10'}`}>
                {isImmersive && (
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                )}
            </div>

            {/* Bidder Feed Overlay */}
            <div className="hidden lg:block">
                <BidderFeed bids={bids} />
            </div>

            <div className="fixed inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>

            {/* Connection Status Indicator */}
            <AuctionConnectionStatus
                showDetails={true}
                position="top-right"
                compact={false}
            />

            {/* Top Bar / Header */}
            <AuctionHeader
                onBack={onBack}
                isImmersive={isImmersive}
                setIsImmersive={setIsImmersive}
                isAuthenticated={isAuthenticated}
                isInWatchlist={isInWatchlist}
                handleToggleWatchlist={handleToggleWatchlist}
                watchlistLoading={watchlistLoading}
                isLive={isLive}
                participantsCount={participants.length}
                setShowParticipantsList={setShowParticipantsList}
                connectionStatus={connectionStatus}
            />

            <div className={`max-w-7xl mx-auto px-4 py-4 md:py-6 transition-all duration-500 ${isImmersive ? 'relative z-[70] scale-105 mt-10' : ''}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

                    {/* 1. Image Gallery */}
                    <AuctionMedia
                        images={images}
                        currentImageIndex={currentImageIndex}
                        setCurrentImageIndex={setCurrentImageIndex}
                        auction={auction}
                        hasEnded={hasEnded}
                    />

                    {/* 2. Bidding Panel */}
                    <AuctionBiddingPanel
                        auction={auction}
                        bids={bids}
                        timeRemaining={timeRemaining}
                        formattedTime={formatted}
                        isUrgent={isUrgent}
                        bidFeedback={bidFeedback}
                        handlePlaceBid={handlePlaceBid}
                        bidLoading={bidLoading}
                        isRegistered={isRegistered}
                        handleRegisterClick={handleRegisterClick}
                        registerLoading={registerLoading}
                        showBuyNowConfirm={showBuyNowConfirm}
                        setShowBuyNowConfirm={setShowBuyNowConfirm}
                        handleQuickBid={handleQuickBid}
                        customBid={customBid}
                        setCustomBid={setCustomBid}
                        handlePayAuction={handlePayAuction}
                        isPaying={isPaying}
                        userId={userId}
                        hasEnded={hasEnded}
                        isLive={isLive}
                        showToast={showToast}
                    />
                </div>

                {/* 3. Car Details & Timeline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 md:mt-6">
                    {/* Car Details - Left Column Desktop */}
                    <AuctionCarDetails
                        auction={auction}
                        car={car}
                        showCarDetails={showCarDetails}
                        setShowCarDetails={setShowCarDetails}
                        isLive={isLive}
                    />

                    {/* Timeline/History - Right Column Desktop */}
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

            {/* Similar Auctions */}
            <div className={`max-w-7xl mx-auto px-4 ${isImmersive ? 'relative z-[70] scale-105' : ''}`}>
                <SimilarAuctionsCarousel currentAuctionId={auctionId} />
            </div>

            {/* Policy Modal */}
            <AuctionPolicyModal
                isOpen={showPolicyModal}
                onClose={() => setShowPolicyModal(false)}
                onAccept={handleAcceptPolicy}
                depositAmount={auction?.car?.deposit_amount || 0}
            />

            {/* Mobile Sticky Action Bar */}
            {isLive && !hasEnded && isRegistered && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-[60] lg:hidden pb-safe">
                    <Button
                        variant="success"
                        size="lg"
                        onClick={() => setShowMobileBidSheet(true)}
                        className="w-full !text-lg !py-4 font-black shadow-lg shadow-emerald-500/20 touch-target"
                        leftIcon={<Icon name="Hammer" className="w-6 h-6" />}
                    >
                        زايد الآن
                    </Button>
                </div>
            )}

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
        </div>
    );
};

export default LiveAuctionRoom;
