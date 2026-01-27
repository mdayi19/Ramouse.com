import client from '../api/client';
import { Technician } from '../types';

export const TechnicianService = {
    /**
     * Get all technicians from the directory
     */
    getAll: async () => {
        const response = await client.get('/directory/technicians');
        return response.data;
    },

    /**
     * Get a specific technician by ID
     */
    getById: async (id: string) => {
        const response = await client.get(`/directory/technicians/${id}`);
        return response.data;
    },

    /**
     * Update technician profile
     */
    updateProfile: async (techId: string, data: Partial<Technician>) => {
        // Similar payload construction as TowTruck, adjust fields as necessary for Technician
        const payload: any = { ...data };

        // Ensure strictly typed fields if needed, but spreading data works for general updates
        // assuming data matches API expectations

        const response = await client.put('/profile', payload);
        return response.data;
    },

    /**
     * Get dashboard stats (for logged in technician)
     */
    getDashboardStats: async () => {
        const response = await client.get('/technician/stats');
        return response.data;
    },

    /**
     * Get jobs (for logged in technician)
     */
    getJobs: async () => {
        const response = await client.get('/technician/jobs');
        return response.data;
    },

    /**
     * Toggle availability
     */
    toggleAvailability: async () => {
        const response = await client.post('/technician/availability/toggle');
        return response.data;
    }
};
