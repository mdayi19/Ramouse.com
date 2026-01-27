import apiClient from '@/api/client';
import type { CarListing } from '@/types';

export interface MarketplaceFilters {
    listing_type?: 'sale' | 'rent';
    category?: string;
    brand?: string;
    model?: string;
    year_from?: number;
    year_to?: number;
    price_from?: number;
    price_to?: number;
    city?: string;
    engine_type?: string;
    transmission?: string;
    search?: string;
    sort_by?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'created_desc';
    page?: number;
    per_page?: number;
}

export interface MarketplaceResponse {
    data: CarListing[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface CarDetailResponse {
    car: CarListing;
    provider: any;
    similar_cars?: CarListing[];
}

/**
 * Marketplace Service
 * Handles marketplace and car listing API calls
 */
export const MarketplaceService = {
    /**
     * Get car listings with filters
     */
    async getListings(filters?: MarketplaceFilters): Promise<MarketplaceResponse> {
        const response = await apiClient.get('/car-listings/', { params: filters });
        return response.data;
    },

    /**
     * Get sale listings
     */
    async getSaleListings(filters?: Omit<MarketplaceFilters, 'listing_type'>): Promise<MarketplaceResponse> {
        const response = await apiClient.get('/car-listings/', { params: { ...filters, listing_type: 'sale' } });
        return response.data;
    },

    /**
     * Get rent listings
     */
    async getRentListings(filters?: Omit<MarketplaceFilters, 'listing_type'>): Promise<MarketplaceResponse> {
        const response = await apiClient.get('/car-listings/', { params: { ...filters, listing_type: 'rent' } });
        return response.data;
    },

    /**
     * Get car listing by ID
     */
    async getListingById(id: number): Promise<CarDetailResponse> {
        const response = await apiClient.get(`/car-listings/${id}`);
        return response.data;
    },

    /**
     * Search car listings
     */
    async searchListings(query: string, filters?: MarketplaceFilters): Promise<MarketplaceResponse> {
        const response = await apiClient.post('/car-listings/search', {
            query,
            ...filters
        });
        return response.data;
    },

    /**
     * Get featured listings
     */
    async getFeaturedListings(): Promise<CarListing[]> {
        const response = await apiClient.get('/car-listings/', { params: { featured: true } });
        return response.data.data || response.data;
    },

    /**
     * Get latest listings
     */
    async getLatestListings(limit: number = 10): Promise<CarListing[]> {
        const response = await apiClient.get('/car-listings/', {
            params: { limit, sort_by: 'created_desc' },
        });
        return response.data.data || response.data;
    },

    /**
     * Get categories
     */
    async getCategories(): Promise<any[]> {
        const response = await apiClient.get('/car-categories');
        return response.data;
    },

    /**
     * Get brands
     */
    async getBrands(category?: string): Promise<any[]> {
        const response = await apiClient.get('/vehicle/data');
        return response.data.brands || [];
    },

    /**
     * Get models by brand
     */
    async getModels(brand: string): Promise<string[]> {
        const response = await apiClient.get('/vehicle/data');
        const brandData = response.data.brands?.find((b: any) => b.name === brand);
        return brandData?.models || [];
    },

    /**
     * Get cities
     */
    async getCities(): Promise<string[]> {
        const response = await apiClient.get('/vehicle/data');
        return response.data.cities || [];
    },

    /**
     * Get car provider listings
     */
    async getProviderListings(providerId: string): Promise<CarListing[]> {
        const response = await apiClient.get(`/car-providers/${providerId}/listings`);
        return response.data.data || response.data;
    },

    /**
     * Get car provider profile
     */
    async getProviderProfile(providerId: string): Promise<any> {
        const response = await apiClient.get(`/car-providers/${providerId}`);
        return response.data;
    },
};
