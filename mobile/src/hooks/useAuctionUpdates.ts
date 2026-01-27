import { useEffect, useRef } from 'react';
import { useRealtime } from './useRealtime';
import { Auction } from '@/types/auction';

export const useAuctionUpdates = (
    auctionIds: string[],
    onUpdate: (auctionId: string, data: Partial<Auction>) => void
) => {
    const { echo } = useRealtime();
    const onUpdateRef = useRef(onUpdate);

    useEffect(() => {
        onUpdateRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!echo || auctionIds.length === 0) return;

        const channels = auctionIds.map(id => {
            return echo.channel(`auction-updates.${id}`)
                .listen('.bid.placed', (event: any) => {
                    console.log(`💰 Bid placed on ${id}:`, event);
                    onUpdateRef.current(id, {
                        current_bid: event.auction.currentBid,
                        bid_count: event.auction.bidCount,
                        minimum_bid: event.auction.minimumBid,
                        // time_remaining: event.auction.timeRemaining, // Handling locally or via separate hook
                    });
                })
                .listen('.auction.started', (event: any) => {
                    console.log(`🔴 Auction ${id} started:`, event);
                    onUpdateRef.current(id, {
                        status: 'live',
                        actual_start: event.auction.actualStart,
                        is_live: true,
                    });
                })
                .listen('.auction.ended', (event: any) => {
                    console.log(`🏁 Auction ${id} ended:`, event);
                    onUpdateRef.current(id, {
                        status: 'ended',
                        is_live: false,
                        winner_name: event.auction.winnerName,
                        final_price: event.auction.finalPrice,
                    });
                });
        });

        return () => {
            auctionIds.forEach(id => {
                echo.leave(`auction-updates.${id}`);
            });
        };
    }, [JSON.stringify(auctionIds), echo]);
};
