import { useEffect, useRef } from 'react';
import { useRealtime } from './useRealtime';
import { Auction, AuctionStats } from '../types';

/**
 * Subscribe to real-time auction updates for listing pages
 * Updates auction status, bids, and timing in real-time
 */
export const useAuctionUpdates = (
    auctionIds: string[],
    onUpdate: (auctionId: string, data: Partial<Auction>) => void
) => {
    const { echo } = useRealtime();
    const onUpdateRef = useRef(onUpdate);

    // Keep ref synced with latest callback
    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (auctionIds.length === 0) return;

        // console.log(`📡 Subscribing to updates for ${auctionIds.length} auctions:`, auctionIds);

        const channels = auctionIds.map(id => {
            return echo.channel(`auction-updates.${id}`)
                .listen('bid.placed', (event: any) => {
                    console.log(`💰 Bid placed on ${id}:`, event);
                    onUpdateRef.current(id, {
                        current_bid: event.auction.currentBid,
                        bid_count: event.auction.bidCount,
                        minimum_bid: event.auction.minimumBid,
                        time_remaining: event.auction.timeRemaining,
                    });
                })
            onUpdateRef.current(id, {
                current_bid: event.auction.currentBid,
                bid_count: event.auction.bidCount,
                minimum_bid: event.auction.minimumBid,
                time_remaining: event.auction.timeRemaining,
            });
        })
            .listen('auction.started', (event: any) => {
                onUpdateRef.current(id, {
                    status: 'live',
                    actual_start: event.auction.actualStart,
                    is_live: true,
                });
            })
            .listen('auction.ended', (event: any) => {
                onUpdateRef.current(id, {
                    status: 'ended',
                    has_ended: true,
                    is_live: false,
                    winner_name: event.auction.winnerName,
                    final_price: event.auction.finalPrice,
                });
            });
    });

    return () => {
        // console.log(`🚪 Unsubscribing from auction updates`);
        auctionIds.forEach(id => {
            echo.leave(`auction-updates.${id}`);
        });
    };
}, [JSON.stringify(auctionIds), echo]);
};

/**
 * Subscribe to outbid notifications for current user
 */
export const useOutbidNotification = (
    userId: string | number | undefined,
    onOutbid?: (data: {
        auction_id: string;
        auction_title: string;
        your_bid: number;
        new_bid: number;
        minimum_bid: number;
    }) => void
) => {
    const { echo } = useRealtime();

    useEffect(() => {
        if (!userId) return;

        // console.log(`🔔 Listening for outbid notifications for user ${userId}`);

        const channel = echo.private(`user.${userId}`)
            .listen('outbid', (event: any) => {
                console.log('❌ You were outbid:', event);

                if (onOutbid) {
                    onOutbid(event);
                }
            });

        return () => {
            channel.stopListening('outbid');
            // echo.leave(`user.${userId}`); // Don't leave private channel as it might be used by other hooks
        };
    }, [userId, echo, onOutbid]);
};

/**
 * Hook to listen for new auctions being created/started (Public)
 */
export const useAuctionListUpdates = (
    onAuctionUpdate: (auction: Auction) => void
) => {
    const { echo } = useRealtime();
    const onUpdateRef = useRef(onAuctionUpdate);

    useEffect(() => {
        onUpdateRef.current = onAuctionUpdate;
    }, [onAuctionUpdate]);

    useEffect(() => {
        console.log('📡 Listening for auction list updates on public channel...');
        const channel = echo.channel('auctions')
            .listen('auction.created', (event: any) => {
                console.log('🆕 New Auction Created:', event.auction);
                if (onUpdateRef.current && event.auction) {
                    onUpdateRef.current(event.auction);
                }
            })
            .listen('auction.started', (event: any) => {
                console.log('🔴 Auction Started (Live):', event.auction);
                if (onUpdateRef.current && event.auction) {
                    // Transform backend data to frontend Auction format
                    const auctionUpdate = {
                        id: event.auction.id,
                        title: event.auction.title,
                        status: 'live',
                        is_live: true,
                        current_bid: event.auction.currentBid,
                        minimum_bid: event.auction.minimumBid,
                        starting_bid: event.auction.startingBid,
                    };
                    onUpdateRef.current(auctionUpdate as Auction);
                }
            })
            .listen('auction.ended', (event: any) => {
                console.log('🏁 Auction Ended:', event.auction);
                if (onUpdateRef.current && event.auction) {
                    const auctionUpdate = {
                        id: event.auction.id,
                        status: 'ended',
                        is_live: false,
                        has_ended: true,
                    };
                    onUpdateRef.current(auctionUpdate as Auction);
                }
            });

        return () => {
            channel.stopListening('auction.created');
            channel.stopListening('auction.started');
            channel.stopListening('auction.ended');
            // echo.leave('auctions');
        };
    }, [echo]);
};

/**
 * Hook for Admin Dashboard Realtime Updates
 */
export const useAdminDashboardUpdates = (
    callbacks: {
        onStatsUpdate?: (stats: AuctionStats) => void;
        onCarUpdate?: () => void;
        onAuctionCreated?: (auction: any) => void;
    }
) => {
    const { echo } = useRealtime();
    const callbacksRef = useRef(callbacks);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        console.log('🛡️ Listening to Admin Dashboard updates...');
        const channel = echo.private('admin.dashboard');

        channel.listen('admin.auction.stats_updated', (event: any) => {
            console.log('📊 Stats Updated:', event.data);
            if (callbacksRef.current.onStatsUpdate) {
                callbacksRef.current.onStatsUpdate(event.data);
            }
        });

        channel.listen('admin.car.updated', (event: any) => {
            console.log('🚗 Car Updated:', event);
            if (callbacksRef.current.onCarUpdate) {
                callbacksRef.current.onCarUpdate();
            }
        });

        channel.listen('admin.auction.created', (event: any) => {
            console.log('🔨 Auction Created (Admin):', event);
            if (callbacksRef.current.onAuctionCreated) {
                callbacksRef.current.onAuctionCreated(event.data);
            }
        });

        return () => {
            channel.stopListening('admin.auction.stats_updated');
            channel.stopListening('admin.car.updated');
            channel.stopListening('admin.auction.created');
            // echo.leave('admin.dashboard');
        };
    }, [echo]);
};
