import { api } from '../lib/api';

// ======== AUCTION CARS ========

export const getAuctionCars = async (params?: {
    status?: string;
    seller_type?: string;
    search?: string;
    per_page?: number;
    page?: number;
}) => {
    const response = await api.get('/admin/auctions/cars', { params });
    return response.data;
};

export const saveAuctionCar = async (data: any, id?: string) => {
    if (id) {
        const response = await api.put(`/admin/auctions/cars/${id}`, data);
        return response.data;
    }
    const response = await api.post('/admin/auctions/cars', data);
    return response.data;
};

export const deleteAuctionCar = async (id: string) => {
    const response = await api.delete(`/admin/auctions/cars/${id}`);
    return response.data;
};

export const approveAuctionCar = async (id: string, notes?: string) => {
    const response = await api.post(`/admin/auctions/cars/${id}/approve`, { admin_notes: notes });
    return response.data;
};

export const rejectAuctionCar = async (id: string, reason: string) => {
    const response = await api.post(`/admin/auctions/cars/${id}/reject`, { reason });
    return response.data;
};

// ======== AUCTIONS (ADMIN) ========

export const getAdminAuctions = async (params?: {
    status?: string;
    per_page?: number;
    page?: number;
}) => {
    const response = await api.get('/admin/auctions', { params });
    return response.data;
};

export const saveAuction = async (data: any, id?: string) => {
    if (id) {
        const response = await api.put(`/admin/auctions/${id}`, data);
        return response.data;
    }
    const response = await api.post('/admin/auctions', data);
    return response.data;
};

export const getAuctionDetails = async (id: string) => {
    const response = await api.get(`/admin/auctions/${id}`);
    return response.data;
};

export const deleteAuction = async (id: string) => {
    const response = await api.delete(`/admin/auctions/${id}`);
    return response.data;
};

export const buyNow = async (id: string) => {
    const response = await api.post(`/auctions/${id}/buy-now`);
    return response.data;
};

export const startAuction = async (id: string) => {
    const response = await api.post(`/admin/auctions/${id}/start`);
    return response.data;
};

export const endAuction = async (id: string) => {
    const response = await api.post(`/admin/auctions/${id}/end`);
    return response.data;
};

export const updateAuctionPayment = async (id: string, data: { payment_status: string; payment_notes?: string }) => {
    const response = await api.patch(`/admin/auctions/${id}/payment`, data);
    return response.data;
};

export const cancelAuction = async (id: string, reason: string) => {
    const response = await api.post(`/admin/auctions/${id}/cancel`, { reason });
    return response.data;
};

export const extendAuction = async (id: string, minutes: number) => {
    const response = await api.post(`/admin/auctions/${id}/extend`, { minutes });
    return response.data;
};

export const pauseAuction = async (id: string, reason?: string) => {
    const response = await api.post(`/admin/auctions/${id}/pause`, { reason });
    return response.data;
};

export const resumeAuction = async (id: string, additionalMinutes?: number) => {
    const response = await api.post(`/admin/auctions/${id}/resume`, { additional_minutes: additionalMinutes });
    return response.data;
};

export const announceAuction = async (id: string, message: string, type: 'info' | 'warning' | 'going_once' | 'going_twice' | 'sold' = 'info') => {
    const response = await api.post(`/admin/auctions/${id}/announce`, { message, type });
    return response.data;
};

export const getAuctionStats = async () => {
    const response = await api.get('/admin/auctions/stats');
    return response.data;
};

// ======== AUCTIONS (PUBLIC) ========

export const getPublicAuctions = async (params?: {
    status?: 'upcoming' | 'live' | 'ended';
    per_page?: number;
    page?: number;
}) => {
    const response = await api.get('/auctions', { params });
    return response.data;
};

export const getPublicAuction = async (id: string) => {
    const response = await api.get(`/auctions/${id}`);
    return response.data;
};

export const getAuctionBids = async (id: string, params?: { per_page?: number; page?: number }) => {
    const response = await api.get(`/auctions/${id}/bids`, { params });
    return response.data;
};

// ======== AUCTIONS (USER) ========

export const registerForAuction = async (id: string) => {
    const response = await api.post(`/auctions/${id}/register`);
    return response.data;
};

export const setAuctionReminder = async (id: string, minutesBefore: number = 30, channels: string[] = ['push']) => {
    const response = await api.post(`/auctions/${id}/remind`, {
        minutes_before: minutesBefore,
        channels,
    });
    return response.data;
};

export const cancelAuctionReminder = async (id: string) => {
    const response = await api.delete(`/auctions/${id}/remind`);
    return response.data;
};

/**
 * Place a bid on an auction with retry logic for network failures
 * Critical operation that deserves resilience
 */
export const placeBid = async (
    id: string,
    amount: number,
    max_auto_bid?: number,
    options?: { maxRetries?: number }
) => {
    const maxRetries = options?.maxRetries ?? 2;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const payload: any = { amount };
            if (max_auto_bid) {
                payload.max_auto_bid = max_auto_bid;
            }
            const response = await api.post(`/auctions/${id}/bid`, payload);
            return response.data;
        } catch (error: any) {
            lastError = error;

            // Don't retry on client errors (4xx) - these are intentional rejections
            if (error.response?.status >= 400 && error.response?.status < 500) {
                throw error;
            }

            // Retry on network errors or server errors (5xx)
            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s...
                await new Promise(resolve => setTimeout(resolve, delay));
                console.log(`🔄 Retrying bid (attempt ${attempt + 2}/${maxRetries + 1})...`);
            }
        }
    }

    throw lastError;
};

export const payAuction = async (id: string) => {
    const response = await api.post(`/auctions/${id}/pay`);
    return response.data;
};

export const checkAuctionStatus = async (id: string) => {
    const response = await api.post(`/auctions/${id}/check-status`);
    return response.data;
};

export const getMyAuctions = async (params?: { per_page?: number; page?: number }) => {
    const response = await api.get('/auctions/my-auctions', { params });
    return response.data;
};

// ======== WATCHLIST ========

export const getWatchlist = async () => {
    const response = await api.get('/auctions/watchlist');
    return response.data;
};

export const checkWatchlist = async (id: string) => {
    const response = await api.get(`/auctions/watchlist/${id}/check`);
    return response.data;
};

export const addToWatchlist = async (id: string) => {
    const response = await api.post(`/auctions/watchlist/${id}`);
    return response.data;
};

export const removeFromWatchlist = async (id: string) => {
    const response = await api.delete(`/auctions/watchlist/${id}`);
    return response.data;
};

// ======== USER CAR SUBMISSION ========

export const submitCarForSale = async (data: any) => {
    const response = await api.post('/sell-car', data);
    return response.data;
};

export const uploadMedia = async (file: File, type: 'image' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/auctions/cars/upload-media', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
