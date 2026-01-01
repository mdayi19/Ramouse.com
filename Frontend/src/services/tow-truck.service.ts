import { api } from '../lib/api';
import { TowTruck } from '../types';

/**
 * TowTruck Service
 * Handles all API interactions for tow truck operations
 */
export const TowTruckService = {
    /**
     * Get all tow trucks from the directory
     */
    getAll: async () => {
        const response = await api.get('/directory/tow-trucks');
        return response.data;
    },

    /**
     * Get a specific tow truck by ID
     */
    getById: async (id: string) => {
        const response = await api.get(`/directory/tow-trucks/${id}`);
        return response.data;
    },

    /**
     * Update tow truck profile
     * Handles profile photo, gallery, socials, location, etc.
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

        // Gallery items (array of {type, data})
        if (data.gallery !== undefined) {
            payload.gallery = data.gallery;
        }

        // Social media links
        if (data.socials !== undefined) {
            payload.socials = data.socials;
        }

        // Location (latitude, longitude)
        if (data.location !== undefined) {
            payload.location = data.location;
        }

        // Password update
        if (data.password !== undefined && data.password) {
            payload.password = data.password;
        }

        const response = await api.put('/profile', payload);
        return response.data;
    },

    /**
     * Rate a tow truck
     */
    rate: async (truckId: string, rating: number, review?: string) => {
        const response = await api.post(`/directory/tow-trucks/${truckId}/rate`, {
            rating,
            review
        });
        return response.data;
    },

    /**
     * Toggle favorite status for a tow truck
     */
    toggleFavorite: async (truckId: string) => {
        const response = await api.post(`/directory/tow-trucks/${truckId}/favorite`);
        return response.data;
    },

    /**
     * Search tow trucks by filters
     */
    search: async (filters: {
        city?: string;
        vehicleType?: string;
        searchTerm?: string;
        isVerified?: boolean;
    }) => {
        const response = await api.get('/directory/tow-trucks/search', { params: filters });
        return response.data;
    }
};
