import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Auction,
    AuctionBid,
    AuctionBidPlacedEvent,
    AuctionStartedEvent,
    AuctionEndedEvent,
    AuctionExtendedEvent,
} from '../types';
import * as auctionService from '../services/auction.service';
import { useRealtime } from './useRealtime';

/**
 * Hook to fetch and filter auctions
 */
export const useAuctions = (initialStatus?: 'upcoming' | 'live' | 'ended') => {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState(initialStatus);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchAuctions = useCallback(async (reset = false) => {
        try {
            setLoading(true);
            const currentPage = reset ? 1 : page;
            const response = await auctionService.getPublicAuctions({
                status,
                page: currentPage,
                per_page: 12,
            });

            if (reset) {
                setAuctions(response.data);
                setPage(1);
            } else {
                setAuctions(prev => [...prev, ...response.data]);
            }

            setHasMore(response.current_page < response.last_page);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء تحميل المزادات');
        } finally {
            setLoading(false);
        }
    }, [status, page]);

    useEffect(() => {
        fetchAuctions(true);
    }, [status]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [loading, hasMore]);

    useEffect(() => {
        if (page > 1) {
            fetchAuctions();
        }
    }, [page]);

    return {
        auctions,
        setAuctions,
        loading,
        error,
        status,
        setStatus,
        loadMore,
        hasMore,
        refresh: () => fetchAuctions(true),
    };
};

/**
 * Hook to fetch a single auction with real-time updates
 */
export const useLiveAuction = (auctionId: string | undefined) => {
    const [auction, setAuction] = useState<Auction | null>(null);
    const [bids, setBids] = useState<AuctionBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [announcement, setAnnouncement] = useState<{ message: string; type: string } | null>(null);
    const { getEcho } = useRealtime();

    // Fetch auction data
    const [bidsPage, setBidsPage] = useState(1);
    const [bidsHasMore, setBidsHasMore] = useState(false);
    const [loadingMoreBids, setLoadingMoreBids] = useState(false);

    // Fetch auction data
    const fetchAuction = useCallback(async (silent = false) => {
        if (!auctionId) return;
        try {
            if (!silent) setLoading(true);
            const [auctionData, bidsResponse] = await Promise.all([
                auctionService.getPublicAuction(auctionId),
                auctionService.getAuctionBids(auctionId, { per_page: 50 }),
            ]);
            setAuction(auctionData);
            setBids(bidsResponse.data || []);
            setBidsPage(bidsResponse.current_page || 1);
            setBidsHasMore((bidsResponse.current_page || 1) < (bidsResponse.last_page || 1));
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء تحميل المزاد');
        } finally {
            if (!silent) setLoading(false);
        }
    }, [auctionId]);

    const loadMoreBids = useCallback(async () => {
        if (!auctionId || loadingMoreBids || !bidsHasMore) return;

        try {
            setLoadingMoreBids(true);
            const response = await auctionService.getAuctionBids(auctionId, {
                page: bidsPage + 1,
                per_page: 50
            });

            setBids(prev => [...prev, ...response.data]);
            setBidsPage(response.current_page);
            setBidsHasMore(response.current_page < response.last_page);
        } catch (err) {
            console.error('Failed to load more bids', err);
        } finally {
            setLoadingMoreBids(false);
        }
    }, [auctionId, bidsPage, bidsHasMore, loadingMoreBids]);

    useEffect(() => {
        fetchAuction();
    }, [fetchAuction]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!auctionId || !auction?.is_live) return;

        const echo = getEcho(); // Get fresh Echo instance inside effect

        // 1. Presence Channel (for Participant list only)
        // console.log(`🎯 Joining auction presence channel: auction.${auctionId}`);
        const presenceChannel = echo.join(`auction.${auctionId}`)
            .here((users: any[]) => {
                setParticipants(users);
            })
            .joining((user: any) => {
                setParticipants(prev => [...prev, user]);
            })
            .leaving((user: any) => {
                setParticipants(prev => prev.filter(p => p.id !== user.id));
            });

        // 2. Public Updates Channel (for Bids and Status - Reliable)
        console.log(`📡 Listening to public auction updates: auction-updates.${auctionId}`);
        const publicChannel = echo.channel(`auction-updates.${auctionId}`)
            .listen('.bid.placed', (event: AuctionBidPlacedEvent) => {
                console.log('⚡ Bid Placed Event Received:', event);
                // Update auction state
                setAuction(prev => prev ? {
                    ...prev,
                    current_bid: event.auction.currentBid,
                    minimum_bid: event.auction.minimumBid,
                    bid_count: event.auction.bidCount,
                    time_remaining: event.auction.timeRemaining,
                    status: event.auction.status,
                    extensions_used: event.auction.extensionsUsed,
                } : null);
                // Add bid to list with duplicate detection
                setBids(prev => {
                    // Check if bid already exists by ID or by amount+bidderName (for optimistic updates)
                    const isDuplicate = prev.some(b =>
                        b.id === event.bid.id ||
                        (b.amount === event.bid.amount && b.bidder_name === event.bid.bidderName)
                    );
                    if (isDuplicate) {
                        // Update existing optimistic bid with server ID
                        return prev.map(b =>
                            (b.amount === event.bid.amount && b.bidder_name === event.bid.bidderName && !b.id)
                                ? { ...b, id: event.bid.id }
                                : b
                        );
                    }

                    const newBids = [{
                        id: event.bid.id,
                        auction_id: auctionId,
                        user_id: '',
                        user_type: '',
                        bidder_name: event.bid.bidderName,
                        amount: event.bid.amount,
                        bid_time: event.bid.bidTime,
                        status: 'valid',
                        is_auto_bid: event.bid.isAutoBid,
                        display_name: event.bid.bidderName,
                    } as AuctionBid, ...prev];
                    return newBids;
                });
            })
            .listen('.auction.extended', (event: AuctionExtendedEvent) => {
                console.log('⏰ Auction Extended:', event);
                setAuction(prev => prev ? {
                    ...prev,
                    status: 'extended',
                    actual_end: event.auction.newEndTime,
                    time_remaining: event.auction.timeRemaining,
                    extensions_used: event.auction.extensionsUsed,
                } : null);
            })
            .listen('.auction.started', (event: AuctionStartedEvent) => {
                console.log('🚀 Auction Started:', event);
                setAuction(prev => prev ? {
                    ...prev,
                    status: 'live',
                    actual_start: event.auction.actualStart,
                    time_remaining: event.auction.timeRemaining,
                    is_live: true,
                } : null);
            })
            .listen('.auction.ended', (event: AuctionEndedEvent) => {
                console.log('🏁 Auction Ended:', event);
                setAuction(prev => prev ? {
                    ...prev,
                    status: 'ended',
                    winner_name: event.auction.winnerName,
                    final_price: event.auction.finalPrice,
                    has_ended: true,
                    is_live: false,
                } : null);
            })
            .listen('.auction.paused', (event: any) => {
                console.log('⏸️ Auction Paused:', event);
                setAuction(prev => prev ? {
                    ...prev,
                    status: 'paused',
                } : null);
            })
            .listen('.auction.resumed', (event: any) => {
                console.log('▶️ Auction Resumed:', event);
                setAuction(prev => prev ? {
                    ...prev,
                    status: 'live',
                    scheduled_end: event.auction.scheduledEnd,
                    time_remaining: event.auction.timeRemaining,
                } : null);
            })
            .listen('.auctioneer.announcement', (event: any) => {
                console.log('📢 Auctioneer Announcement:', event);
                setAnnouncement({
                    message: event.message,
                    type: event.type,
                });
                // Auto-clear after 5 seconds
                setTimeout(() => setAnnouncement(null), 5000);
            });

        return () => {
            const echo = getEcho();
            echo.leave(`auction.${auctionId}`);
            echo.leave(`auction-updates.${auctionId}`);
        };
    }, [auctionId, auction?.is_live, getEcho]);

    const updateLocalAuction = useCallback((data: Partial<Auction>) => {
        setAuction(prev => prev ? { ...prev, ...data } : null);
    }, []);

    const addLocalBid = useCallback((bid: AuctionBid) => {
        setBids(prev => {
            // Check for duplicates by ID or by amount+bidderName
            const isDuplicate = prev.some(b =>
                b.id === bid.id ||
                (b.amount === bid.amount && b.bidder_name === bid.bidder_name)
            );
            if (isDuplicate) return prev;
            return [bid, ...prev];
        });
    }, []);

    return {
        auction,
        bids,
        loading,
        error,
        participants,
        announcement,
        clearAnnouncement: () => setAnnouncement(null),
        refresh: fetchAuction,
        updateLocalAuction,
        addLocalBid,
        loadMoreBids,
        bidsHasMore,
        loadingMoreBids,
        bidsPage
    };
};

/**
 * Countdown timer hook
 */
export const useAuctionCountdown = (endTime: string | undefined, onEnd?: () => void) => {
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!endTime) return;

        const calculateRemaining = () => {
            const end = new Date(endTime).getTime();
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((end - now) / 1000));
            setTimeRemaining(remaining);

            if (remaining === 0) {
                // Stop the interval when countdown reaches 0
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                if (onEnd) {
                    onEnd();
                }
            }

            return remaining;
        };

        // Calculate initial time
        const initialRemaining = calculateRemaining();

        // Only start interval if there's time remaining (check actual calculated value, not state)
        if (initialRemaining > 0) {
            intervalRef.current = setInterval(calculateRemaining, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [endTime, onEnd]);

    // Format time remaining
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    return {
        timeRemaining,
        days,
        hours,
        minutes,
        seconds,
        isExpired: timeRemaining === 0,
        formatted: `${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
};

/**
 * Hook to handle placing bids
 */
export const usePlaceBid = (auctionId: string | undefined) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const placeBid = useCallback(async (amount: number, maxAutoBid?: number) => {
        if (!auctionId) return;

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const response = await auctionService.placeBid(auctionId, amount, maxAutoBid);
            setSuccess(true);

            // Auto-reset success after 3 seconds to allow new bids
            setTimeout(() => setSuccess(false), 3000);

            return response.data; // Return data for immediate update
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء تقديم المزايدة');
            throw err; // Re-throw to let caller know it failed
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    const buyNow = useCallback(async () => {
        if (!auctionId) return;

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            await auctionService.buyNow(auctionId);
            setSuccess(true);
            return true;
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء الشراء الفوري');
            return false;
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    return { placeBid, buyNow, loading, error, success, setError };
};

/**
 * Hook to handle auction registration
 */
export const useAuctionRegistration = (auctionId: string | undefined) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);

    const register = useCallback(async () => {
        if (!auctionId) return;

        try {
            setLoading(true);
            setError(null);

            await auctionService.registerForAuction(auctionId);
            setIsRegistered(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء التسجيل');
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    return { register, loading, error, isRegistered, setIsRegistered };
};

/**
 * Hook to handle auction reminders
 */
export const useAuctionReminder = (auctionId: string | undefined) => {
    const [loading, setLoading] = useState(false);
    const [hasReminder, setHasReminder] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setReminder = useCallback(async (minutesBefore: number = 30) => {
        if (!auctionId) return;

        try {
            setLoading(true);
            setError(null);

            await auctionService.setAuctionReminder(auctionId, minutesBefore);
            setHasReminder(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء تعيين التذكير');
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    const cancelReminder = useCallback(async () => {
        if (!auctionId) return;

        try {
            setLoading(true);
            setError(null);

            await auctionService.cancelAuctionReminder(auctionId);
            setHasReminder(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'حدث خطأ أثناء إلغاء التذكير');
        } finally {
            setLoading(false);
        }
    }, [auctionId]);

    return { setReminder, cancelReminder, loading, hasReminder, setHasReminder, error };
};
