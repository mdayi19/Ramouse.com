import { api } from '../lib/api';

export interface CarListing {
    id: number;
    slug: string;
    title: string;
    description: string;
    location?: string;
    price: number;
    listing_type: 'sale' | 'rent';
    seller_type: 'individual' | 'provider';
    year: number;
    mileage: number;
    condition: 'new' | 'used' | 'certified_pre_owned';
    transmission: string;
    fuel_type: string;
    photos: string[];
    images?: string[];
    is_sponsored: boolean;
    is_featured: boolean;
    views_count: number;
    owner: any;
    provider?: any;
    category: {
        id: number;
        name: string;
        name_ar?: string;
        name_en?: string;
    };
    brand: {
        id: number | string;
        name: string;
        name_ar?: string;
        logo?: string;
    };
    model: string;
    created_at: string;
}

export interface MarketplaceFilters {
    listing_type?: 'sale' | 'rent';
    category_id?: number;
    brand_id?: number;
    min_price?: number;
    max_price?: number;
    min_year?: number;
    max_year?: number;
    transmission?: string;
    fuel_type?: string;
    condition?: string;
    seller_type?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
}

export class CarProviderService {
    static async getMarketplace(filters: MarketplaceFilters = {}) {
        const response = await api.get('/car-marketplace', { params: filters });
        return response.data;
    }

    static async getRentCars(filters: MarketplaceFilters = {}) {
        const response = await api.get('/rent-car', { params: { ...filters, listing_type: 'rent' } });
        return response.data;
    }

    static async getListingBySlug(slug: string) {
        const response = await api.get(`/car-listings/${slug}`);
        return response.data.data;
    }

    static async getListing(slug: string) {
        const response = await api.get(`/car-marketplace/${slug}`);
        return response.data;
    }

    static async searchListings(query: string) {
        const response = await api.post('/car-marketplace/search', { q: query });
        return response.data;
    }

    static async getCategories() {
        const response = await api.get('/car-categories');
        return response.data;
    }

    static async getBrands() {
        try {
            const response = await api.get('/vehicle/data');
            // Backend returns: { brands: [], categories: [], models: [], ... }
            return {
                success: true,
                brands: response.data.brands || [],
                models: response.data.models || {}
            };
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            // Fallback to empty if fails
            return {
                success: true,
                brands: [],
                models: {}
            };
        }
    }

    static async trackEvent(listingId: number, eventType: string, metadata: any = {}) {
        await api.post('/analytics/track', {
            car_listing_id: listingId,
            event_type: eventType,
            metadata
        });
    }

    static async toggleFavorite(listingId: number) {
        const response = await api.post(`/favorites/${listingId}/toggle`);
        return response.data;
    }

    static async checkFavorite(listingId: number) {
        const response = await api.get(`/favorites/${listingId}/check`);
        return response.data.is_favorited || false;
    }

    // Alias for trackEvent - used by CarListingDetail
    static async trackAnalytics(listingId: number, eventType: string, metadata: any = {}) {
        return this.trackEvent(listingId, eventType, metadata);
    }

    static async getMyFavorites() {
        const response = await api.get('/favorites');
        return response.data;
    }

    // Provider Dashboard Methods
    static async getProviderStats() {
        const response = await api.get('/car-provider/stats');
        return response.data;
    }

    static async getProviderAnalytics(days: number = 30) {
        const response = await api.get('/car-provider/analytics', { params: { days } });
        return response.data;
    }

    static async getMyListings() {
        const response = await api.get('/car-provider/listings');
        return response.data;
    }

    static async createListing(data: any) {
        const response = await api.post('/car-provider/listings', data);
        return response.data;
    }

    static async updateListing(id: number, data: FormData) {
        const response = await api.put(`/car-provider/listings/${id}`, data);
        return response.data;
    }

    static async deleteListing(id: number) {
        const response = await api.delete(`/car-provider/listings/${id}`);
        return response.data;
    }

    static async toggleListingVisibility(id: number) {
        const response = await api.patch(`/car-provider/listings/${id}/toggle`);
        return response.data;
    }

    // Public Provider Profile Methods
    static async getPublicProfile(providerId: number) {
        const response = await api.get(`/car-providers/${providerId}`);
        return response.data.data || response.data;
    }

    static async getProviderListings(providerId: number, filters: any = {}) {
        const response = await api.get(`/car-providers/${providerId}/listings`, { params: filters });
        return response.data;
    }

    // Registration
    static async registerProvider(data: FormData) {
        const response = await api.post('/auth/register-car-provider', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
}
