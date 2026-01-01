import { useState, useEffect } from 'react';
import * as watchlistService from '../services/watchlist.service';

export const useWatchlist = () => {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadWatchlist();
    }, []);

    const loadWatchlist = async () => {
        try {
            setLoading(true);
            const items = await watchlistService.getWatchlist();
            setWatchlist(items.map(item => item.auction_id));
        } catch (error) {
            console.error('Failed to load watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToWatchlist = async (auctionId: string) => {
        try {
            await watchlistService.addToWatchlist(auctionId);
            setWatchlist(prev => [...prev, auctionId]);
            return true;
        } catch (error) {
            console.error('Failed to add to watchlist:', error);
            return false;
        }
    };

    const removeFromWatchlist = async (auctionId: string) => {
        try {
            await watchlistService.removeFromWatchlist(auctionId);
            setWatchlist(prev => prev.filter(id => id !== auctionId));
            return true;
        } catch (error) {
            console.error('Failed to remove from watchlist:', error);
            return false;
        }
    };

    const toggleWatchlist = async (auctionId: string) => {
        if (watchlist.includes(auctionId)) {
            return await removeFromWatchlist(auctionId);
        } else {
            return await addToWatchlist(auctionId);
        }
    };

    const isInWatchlist = (auctionId: string) => {
        return watchlist.includes(auctionId);
    };

    return {
        watchlist,
        loading,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isInWatchlist,
        refresh: loadWatchlist,
    };
};
