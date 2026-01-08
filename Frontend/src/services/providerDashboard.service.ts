/**
 * Provider Dashboard Service
 * Handles all provider dashboard operations including analytics, bulk actions, and listing management
 */

import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface ListingAnalytics {
    listing_id: number;
    views: number;
    favorites: number;
    contacts: number;
    shares: number;
    views_trend: number;
    conversion_rate: number;
}

export interface ProviderStats {
    total_listings: number;
    active_listings: number;
    sponsored_listings: number;
    total_views: number;
    this_month_listings: number;
    wallet_balance: number;
    average_rating: number;
    is_verified: boolean;
    is_trusted: boolean;
}

export const ProviderDashboardService = {
    /**
     * Get dashboard statistics
     */
    async getStats(): Promise<ProviderStats> {
        const response = await api.get('/car-provider/stats');
        return response.data.stats;
    },

    /**
     * Get detailed analytics with daily breakdown
     */
    async getAnalytics(days: number = 30) {
        const response = await api.get(`/car-provider/analytics?days=${days}`);
        return response.data.analytics;
    },

    /**
     * Get analytics for a specific listing
     */
    async getListingAnalytics(listingId: number, days: number = 30): Promise<ListingAnalytics> {
        const response = await api.get(`/car-analytics/listing/${listingId}?days=${days}`);
        return response.data.analytics;
    },

    /**
     * Track an analytics event
     */
    async trackEvent(listingId: number, eventType: 'view' | 'contact_phone' | 'contact_whatsapp' | 'favorite' | 'share') {
        const response = await api.post('/car-analytics/track', {
            car_listing_id: listingId,
            event_type: eventType
        });
        return response.data;
    },

    /**
     * Bulk hide listings
     */
    async bulkHide(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-hide', {
            listing_ids: listingIds
        });
        return response.data;
    },

    /**
     * Bulk show listings
     */
    async bulkShow(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-show', {
            listing_ids: listingIds
        });
        return response.data;
    },

    /**
     * Bulk delete listings
     */
    async bulkDelete(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-delete', {
            listing_ids: listingIds
        });
        return response.data;
    },

    /**
     * Quick edit a listing field
     */
    async quickEdit(listingId: number, field: string, value: any) {
        const response = await api.patch(`/car-provider/listings/${listingId}/quick-edit`, {
            field,
            value
        });
        return response.data;
    },

    /**
     * Duplicate a listing
     */
    async duplicateListing(listingId: number) {
        const response = await api.post(`/car-provider/listings/${listingId}/duplicate`);
        return response.data;
    },

    /**
     * Get provider's own listings
     */
    async getMyListings(page: number = 1) {
        const response = await api.get(`/car-provider/listings?page=${page}`);
        return response.data;
    }
};

export default ProviderDashboardService;
