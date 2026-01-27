import apiClient from '@/api/client';
import { Auction } from '@/types/auction';

export const AuctionService = {
    // ======== PUBLIC/USER ========

    getAuctions: async (params?: {
        status?: 'upcoming' | 'live' | 'ended';
        per_page?: number;
        page?: number;
    }) => {
        const response = await apiClient.get('/auctions', { params });
        return response.data;
    },

    getAuction: async (id: string) => {
        const response = await apiClient.get(`/auctions/${id}`);
        return response.data;
    },

    getAuctionBids: async (id: string, params?: { per_page?: number; page?: number }) => {
        const response = await apiClient.get(`/auctions/${id}/bids`, { params });
        return response.data;
    },

    placeBid: async (id: string, amount: number) => {
        const response = await apiClient.post(`/auctions/${id}/bid`, { amount });
        return response.data;
    },

    setReminder: async (id: string, minutesBefore: number = 30) => {
        const response = await apiClient.post(`/auctions/${id}/remind`, {
            minutes_before: minutesBefore,
            channels: ['push'],
        });
        return response.data;
    },

    // ======== WATCHLIST ========

    toggleWatchlist: async (id: string) => {
        // This is a toggle logic usually handled in the frontend by checking state, 
        // but here we just have separate add/remove endpoints in the example service.
        // We'll implement individual calls.
    },

    addToWatchlist: async (id: string) => {
        const response = await apiClient.post(`/auctions/watchlist/${id}`);
        return response.data;
    },

    removeFromWatchlist: async (id: string) => {
        const response = await apiClient.delete(`/auctions/watchlist/${id}`);
        return response.data;
    },

    getWatchlist: async () => {
        const response = await apiClient.get('/auctions/watchlist');
        return response.data;
    },
};
