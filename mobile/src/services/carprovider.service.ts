import client from '../api/client';
import { CarProvider } from '../types';

export const CarProviderService = {
    getMarketplace: async (filters: any = {}) => {
        const response = await client.get('/car-listings', { params: filters });
        return response.data;
    },

    getRentCars: async (filters: any = {}) => {
        const response = await client.get('/car-listings', { params: { ...filters, listing_type: 'rent' } });
        return response.data;
    },

    updateProfile: async (data: any) => {
        let response;
        if (data instanceof FormData) {
            // Append _method PUT for Laravel to handle FormData updates
            // but check if client supports this middleware or if we need to do it manually.
            // Assuming client.post works with FormData.
            // For updates via FormData in Laravel, often used Post with _method=PUT
            data.append('_method', 'PUT');
            response = await client.post('/car-provider/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            response = await client.put('/car-provider/profile', data);
        }
        return response.data?.provider;
    },

    getListingBySlug: async (slug: string) => {
        const response = await client.get(`/car-listings/${slug}`);
        return response.data.listing;
    },

    getListing: async (slug: string) => {
        const response = await client.get(`/car-listings/${slug}`);
        return response.data;
    },

    getCategories: async () => {
        const response = await client.get('/car-categories');
        return response.data;
    },

    getBrands: async () => {
        try {
            const response = await client.get('/vehicle/data');
            const data = response.data.data || response.data;
            return {
                success: true,
                brands: data.brands || [],
                models: data.models || {}
            };
        } catch (error) {
            console.error('Failed to fetch brands:', error);
            return { success: false, brands: [], models: {} };
        }
    },

    getMyListings: async (page: number = 1) => {
        const response = await client.get(`/car-provider/listings?page=${page}`);
        return response.data;
    },

    createListing: async (data: any) => {
        const response = await client.post('/car-provider/listings', data, {
            headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
        });
        return response.data;
    },

    updateListing: async (id: number, data: any) => {
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await client.post(`/car-provider/listings/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } else {
            const response = await client.put(`/car-provider/listings/${id}`, data);
            return response.data;
        }
    },

    deleteListing: async (id: number) => {
        const response = await client.delete(`/car-provider/listings/${id}`);
        return response.data;
    },

    getProviderStats: async () => {
        const response = await client.get('/car-provider/stats');
        return response.data;
    },

    toggleFavorite: async (listingId: number) => {
        const response = await client.post(`/favorites/${listingId}/toggle`);
        return response.data;
    },

    getPublicProfile: async (identifier: string | number) => {
        const response = await client.get(`/car-providers/${identifier}`);
        return response.data.data;
    },

    getProviderListings: async (identifier: string | number, filters: any = {}) => {
        const response = await client.get(`/car-providers/${identifier}/listings`, { params: filters });
        return response.data.data;
    }
};
