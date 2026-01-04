import { api } from '@/lib/api';

export interface Watchlist {
    id: string;
    user_id: string;
    auction_id: string;
    created_at: string;
    auction?: any;
}

/**
 * Add auction to watchlist
 */
export const addToWatchlist = async (auctionId: string): Promise<Watchlist> => {
    const response = await api.post(`/watchlist/${auctionId}`);
    return response.data;
};

/**
 * Remove auction from watchlist
 */
export const removeFromWatchlist = async (auctionId: string): Promise<void> => {
    await api.delete(`/watchlist/${auctionId}`);
};

/**
 * Get user's watchlist
 */
export const getWatchlist = async (): Promise<Watchlist[]> => {
    try {
        const response = await api.get('/watchlist');
        // Handle different response structures
        return response.data.data || response.data || [];
    } catch (error) {
        console.error('Failed to fetch watchlist:', error);
        throw error;
    }
};

/**
 * Check if auction is in watchlist
 */
export const isInWatchlist = async (auctionId: string): Promise<boolean> => {
    try {
        const response = await api.get(`/watchlist/${auctionId}/check`);
        return response.data.in_watchlist;
    } catch {
        return false;
    }
};
