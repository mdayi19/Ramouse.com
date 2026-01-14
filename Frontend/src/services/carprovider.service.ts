import { api } from '../lib/api';
import { CarProvider } from '../types';

export interface CarListing {
    id: number;
    slug: string;
    title: string;
    description: string;
    location?: string;
    address?: string;
    city?: string;
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
    is_negotiable?: boolean;
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
    video_url?: string;
    features?: string[];
    exterior_color?: string;
    interior_color?: string;
    doors_count?: number;
    seats_count?: number;
    engine_size?: string;
    horsepower?: number;
    body_condition?: string;
    warranty?: string;
    contact_phone?: string;
    contact_whatsapp?: string;
    // Rental-specific fields
    // Rental-specific fields
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    rental_terms?: RentalTerms | string[]; // Backwards compatibility
    custom_rental_terms?: string;
    // Additional fields
    car_category_id?: string;
    license_plate?: string;
    chassis_number?: string;
    previous_owners?: number;
    drive_type?: string;
    engine_type?: string;
}

export interface RentalTerms {
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    terms?: string[];
    km_limit?: number;
    custom_terms?: string;
    security_deposit?: number;
    min_license_age?: number;
    min_renter_age?: number;
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
    features?: string[];
    rental_terms?: string[];
    city?: string;
    min_deposit?: number;
    max_deposit?: number;
    min_renter_age?: number;
    min_license_age?: number;
}

export class CarProviderService {
    static async getMarketplace(filters: MarketplaceFilters = {}) {
        const response = await api.get('/car-listings', { params: filters });
        return response.data;
    }

    static async getRentCars(filters: MarketplaceFilters = {}) {
        const response = await api.get('/rent-car', { params: { ...filters, listing_type: 'rent' } });
        return response.data;
    }

    static async updateProfile(data: any): Promise<CarProvider> {
        let payload = data;
        let headers = {};

        // If 'data' is a plain object but needs to include files, convert to FormData
        // However, if the component already sends FormData, we just use it.
        // Or if the component sends a plain object but we need to support files now, we should ensure the component handles FormData creation.
        // Based on the plan, the component will send FormData.

        if (!(data instanceof FormData)) {
            // Fallback for legacy calls
        }
        // Explicitly set multipart/form-data to override the default application/json
        // Axios/Browser will automatically append the boundary
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await api.post('/car-provider/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.provider;
        } else {
            const response = await api.put('/car-provider/profile', data);
            return response.data.provider;
        }
    }

    static async getListingBySlug(slug: string): Promise<CarListing> {
        const response = await api.get(`/car-listings/${slug}`);
        return response.data.listing;
    }

    static async getListing(slug: string) {
        const response = await api.get(`/car-listings/${slug}`);
        return response.data;
    }

    static async searchListings(query: string) {
        const response = await api.post('/car-listings/search', { q: query });
        return response.data;
    }

    static async getCategories() {
        const response = await api.get('/car-categories');
        return response.data;
    }

    static async getBrands() {
        try {
            const response = await api.get('/vehicle/data');
            return {
                success: true,
                brands: response.data.brands || [],
                models: response.data.models || {}
            };
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            return {
                success: true,
                brands: [],
                models: {}
            };
        }
    }

    static async getCountries() {
        try {
            const response = await api.get('/vehicle/data');
            const brands = response.data.brands || [];

            // Extract unique countries from brands
            const countries = brands
                .map((brand: any) => ({
                    id: brand.country,
                    name: brand.country_ar || brand.country,
                    code: brand.country
                }))
                .filter((country: any, index: number, self: any[]) =>
                    index === self.findIndex((c) => c.id === country.id)
                )
                .filter((country: any) => country.id); // Filter out undefined countries

            return {
                success: true,
                countries
            };
        } catch (error) {
            console.error('Failed to fetch countries:', error);
            return {
                success: true,
                countries: []
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

    static async getProfile() {
        const response = await api.get('/car-provider/profile');
        return response.data.provider;
    }

    static async getPhones() {
        const response = await api.get('/car-provider/phones');
        return response.data.phones || [];
    }

    static async getMyListings() {
        const response = await api.get('/car-provider/listings');
        return response.data;
    }

    static async createListing(data: any) {
        const response = await api.post('/car-provider/listings', data);
        return response.data;
    }

    static async updateListing(id: number, data: FormData | Record<string, any>) {
        // Handle both FormData and plain objects
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await api.post(`/car-provider/listings/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } else {
            // Plain object - send as JSON with PUT method
            const response = await api.put(`/car-provider/listings/${id}`, data);
            return response.data;
        }
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
    static async getPublicProfile(identifier: string | number) {
        const response = await api.get(`/car-providers/${identifier}`);
        return response.data.data;
    }

    static async getProviderListings(identifier: string | number, filters: any = {}) {
        const response = await api.get(`/car-providers/${identifier}/listings`, { params: filters });
        return response.data.data;
    }

    // Registration
    static async registerProvider(data: FormData) {
        const response = await api.post('/auth/register-car-provider', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    // Bulk Actions
    static async bulkHide(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-hide', { listing_ids: listingIds });
        return response.data;
    }

    static async bulkShow(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-show', { listing_ids: listingIds });
        return response.data;
    }

    static async bulkDelete(listingIds: number[]) {
        const response = await api.post('/car-provider/listings/bulk-delete', { listing_ids: listingIds });
        return response.data;
    }

    // Quick Edit
    static async quickEditListing(id: number, data: {
        price?: number;
        daily_rate?: number;
        weekly_rate?: number;
        monthly_rate?: number;
        is_negotiable?: boolean;
        is_hidden?: boolean
    }) {
        const response = await api.patch(`/car-provider/listings/${id}/quick-edit`, data);
        return response.data;
    }

    // Duplicate Listing
    static async duplicateListing(id: number) {
        const response = await api.post(`/car-provider/listings/${id}/duplicate`);
        return response.data;
    }

    // Listing Analytics
    static async getListingAnalytics(listingId: number, days: number = 30) {
        const response = await api.get(`/car-analytics/listing/${listingId}`, { params: { days } });
        return response.data;
    }

    // Reporting
    static async reportListing(id: number, data: { reason: string; details: string }) {
        const response = await api.post(`/car-listings/${id}/report`, data);
        return response.data;
    }
}
