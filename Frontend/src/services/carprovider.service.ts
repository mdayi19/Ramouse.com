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
    sponsored_until?: string | null;
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
    body_condition?: string | { [key: string]: 'pristine' | 'scratched' | 'dented' | 'painted' | 'replaced' };
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
    car_category_id?: number | string; // Origin (e.g. American, Japanese via Country ID)
    brand_id?: number;
    model?: string;
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
    min_mileage?: number;
    max_mileage?: number;
}

export class CarProviderService {
    static async getMarketplace(filters: MarketplaceFilters = {}) {
        const response = await api.get('/car-listings', { params: filters });
        return response.data;
    }

    static async getRentCars(filters: MarketplaceFilters = {}) {
        const response = await api.get('/car-listings', { params: { ...filters, listing_type: 'rent' } });
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
            // Check both direct and nested data structures
            const data = response.data.data || response.data;
            let brands = data.brands || [];
            const models = data.models || {};
            const categories = data.categories || [];

            // Enrich brands with country (origin) ID by matching logic
            // This mirrors the logic in Step2CountryBrandModel.tsx
            if (categories.length > 0) {
                brands = brands.map((brand: any) => {
                    // Find which category (Original) this brand belongs to
                    const origin = categories.find((cat: any) => {
                        const catBrandNames = cat.brands || [];
                        return catBrandNames.includes(brand.name) ||
                            catBrandNames.includes(brand.name_ar) ||
                            catBrandNames.some((cb: string) => brand.name.includes(cb) || brand.name_ar?.includes(cb));
                    });

                    return {
                        ...brand,
                        country: origin ? origin.id : brand.country // Fallback to existing if any
                    };
                });
            }

            console.log('DEBUG: getBrands extracted', { brandsCount: brands.length, modelsCount: Object.keys(models).length });

            return {
                success: true,
                brands: brands,
                models: models
            };
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            return {
                success: false,
                brands: [],
                models: {}
            };
        }
    }

    static async getCountries() {
        try {
            // Optimally we should cache this response or pass it from getBrands to avoid second call
            const response = await api.get('/vehicle/data');
            const data = response.data.data || response.data;

            // In the Wizard, 'categories' are used as Origins (German, Japanese, etc.)
            // We should use these as the 'countries' list for the filter.
            const categories = data.categories || [];
            const brands = data.brands || [];

            // If categories have counts, great. If not, we can try to aggregate from brands
            // using the same matching logic
            const countries = categories.map((cat: any) => {
                let count = cat.listings_count ?? cat.count ?? 0;

                // If count is 0, try to sum from brands
                // Match brands to this category
                const catBrandNames = cat.brands || [];
                const brandsInCat = brands.filter((brand: any) =>
                    catBrandNames.includes(brand.name) ||
                    catBrandNames.includes(brand.name_ar) ||
                    catBrandNames.some((cb: string) => brand.name.includes(cb) || brand.name_ar?.includes(cb))
                );

                if (count === 0 && brandsInCat.length > 0) {
                    const brandsCount = brandsInCat.reduce((sum: number, b: any) => sum + (b.listings_count ?? b.count ?? 0), 0);
                    count = Math.max(count, brandsCount);
                }

                return {
                    id: cat.id,
                    name: cat.name_ar || cat.name,
                    // Keep original object props just in case
                    ...cat,
                    count: count
                };
            });

            return {
                success: true,
                countries: countries
            };
        } catch (error) {
            console.error('Failed to fetch countries/origins:', error);
            // Fallback to empty
            return {
                success: false,
                countries: []
            };
        }
    }

    static async getListingCounts(listingType: 'sale' | 'rent' = 'sale') {
        try {
            const endpoint = listingType === 'rent' ? '/rent-car' : '/car-listings';
            // Fetch all listings to calculate counts
            const response = await api.get(endpoint, {
                params: {
                    listing_type: listingType,
                    limit: 1000
                }
            });

            const listings = response.data.listings?.data || response.data.data || [];

            const originCounts: Record<string | number, number> = {};
            const brandCounts: Record<string | number, number> = {};
            const modelCounts: Record<string, number> = {};
            const cityCounts: Record<string, number> = {};
            const modelsByBrand: Record<string | number, string[]> = {};

            listings.forEach((car: any) => {
                // Count Origins
                if (car.car_category_id) {
                    originCounts[car.car_category_id] = (originCounts[car.car_category_id] || 0) + 1;
                }

                // Count Brands
                if (car.brand_id) {
                    brandCounts[car.brand_id] = (brandCounts[car.brand_id] || 0) + 1;

                    // Collect Models
                    if (car.model) {
                        const modelName = car.model.trim();
                        if (!modelsByBrand[car.brand_id]) {
                            modelsByBrand[car.brand_id] = [];
                        }
                        if (!modelsByBrand[car.brand_id].includes(modelName)) {
                            modelsByBrand[car.brand_id].push(modelName);
                        }
                    }
                }

                // Count Models
                if (car.model) {
                    const modelName = car.model.trim();
                    modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
                }

                // Count Cities
                if (car.city) {
                    cityCounts[car.city] = (cityCounts[car.city] || 0) + 1;
                }
            });

            return {
                originCounts,
                brandCounts,
                modelCounts,
                cityCounts,
                modelsByBrand
            };
        } catch (error) {
            console.error('Failed to calculate listing counts:', error);
            return {
                originCounts: {},
                brandCounts: {},
                modelCounts: {},
                cityCounts: {}
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

    static async getDetailedAnalytics(page: number = 1, perPage: number = 10, days: number = 30) {
        const response = await api.get('/car-provider/analytics/detailed', {
            params: { page, per_page: perPage, days }
        });
        return response.data;
    }

    static async exportAnalytics(days: number = 30, format: 'csv' | 'json' = 'csv') {
        const response = await api.get('/car-provider/analytics/export', {
            params: { days, format },
            responseType: format === 'csv' ? 'blob' : 'json'
        });

        if (format === 'csv') {
            // Create download link for CSV
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            return { success: true };
        }

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

    static async createUserListing(apiPrefix: string, data: any) {
        // Ensure apiPrefix does not end with slash
        const prefix = apiPrefix.endsWith('/') ? apiPrefix.slice(0, -1) : apiPrefix;
        const response = await api.post(`${prefix}/listings`, data);
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

    static async updateUserListing(apiPrefix: string, id: number, data: FormData | Record<string, any>) {
        const prefix = apiPrefix.endsWith('/') ? apiPrefix.slice(0, -1) : apiPrefix;

        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await api.post(`${prefix}/listings/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } else {
            const response = await api.put(`${prefix}/listings/${id}`, data);
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
        const response = await api.get(`/car-provider/listings/${listingId}/analytics`, { params: { days } });
        return response.data;
    }

    // User Listings (for customers, technicians, tow_trucks)
    static async getUserListingStats(apiPrefix: string) {
        const response = await api.get(`${apiPrefix}/stats`);
        return response.data;
    }

    static async getUserListings(apiPrefix: string, params: any = {}) {
        const response = await api.get(`${apiPrefix}/listings`, { params });
        return response.data;
    }

    static async deleteUserListing(apiPrefix: string, id: number) {
        const response = await api.delete(`${apiPrefix}/listings/${id}`);
        return response.data;
    }

    static async toggleUserListingVisibility(apiPrefix: string, id: number) {
        const response = await api.patch(`${apiPrefix}/listings/${id}/toggle`);
        return response.data;
    }

    static async quickEditUserListing(apiPrefix: string, id: number, data: any) {
        const prefix = apiPrefix.endsWith('/') ? apiPrefix.slice(0, -1) : apiPrefix;
        const response = await api.patch(`${prefix}/listings/${id}/quick-edit`, data);
        return response.data;
    }

    static async unsponsorUserListing(apiPrefix: string, id: number) {
        const response = await api.post(`${apiPrefix}/listings/${id}/unsponsor`);
        return response.data;
    }

    // Reporting
    static async reportListing(id: number, data: { reason: string; details: string }) {
        const response = await api.post(`/car-listings/${id}/report`, data);
        return response.data;
    }
}
