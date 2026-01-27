import client from '../api/client';
import { TowTruck } from '../types';

export const TowTruckService = {
    /**
     * Get all tow trucks from the directory
     */
    getAll: async () => {
        const response = await client.get('/directory/tow-trucks');
        return response.data;
    },

    /**
     * Get a specific tow truck by ID
     */
    getById: async (id: string) => {
        const response = await client.get(`/directory/tow-trucks/${id}`);
        return response.data;
    },

    /**
     * Update tow truck profile
     */
    updateProfile: async (truckId: string, data: Partial<TowTruck>) => {
        const payload: any = {};

        // Basic fields
        if (data.name !== undefined) payload.name = data.name;
        if (data.vehicleType !== undefined) payload.vehicleType = data.vehicleType;
        if (data.city !== undefined) payload.city = data.city;
        if (data.serviceArea !== undefined) payload.serviceArea = data.serviceArea;
        if (data.description !== undefined) payload.description = data.description;

        // Profile photo (base64 or URL)
        if (data.profilePhoto !== undefined) {
            payload.profilePhoto = data.profilePhoto;
        }

        // Gallery items
        if (data.gallery !== undefined) {
            payload.gallery = data.gallery;
        }

        // Social media links
        if (data.socials !== undefined) {
            payload.socials = data.socials;
        }

        // Location
        if (data.location !== undefined) {
            payload.location = data.location;
        }

        // Password update
        if (data.password !== undefined && data.password) {
            payload.password = data.password;
        }

        const response = await client.put('/profile', payload);
        return response.data;
    },

    /**
     * Get dashboard stats (for logged in tow truck)
     */
    getDashboardStats: async () => {
        const response = await client.get('/tow-truck/stats');
        return response.data;
    },

    /**
     * Get requests (for logged in tow truck)
     */
    getRequests: async () => {
        const response = await client.get('/tow-truck/requests');
        return response.data;
    },

    /**
     * Search tow trucks
     */
    search: async (filters: {
        city?: string;
        vehicleType?: string;
        searchTerm?: string;
        isVerified?: boolean;
    }) => {
        const response = await client.get('/directory/tow-trucks/search', { params: filters });
        return response.data;
    }
};
