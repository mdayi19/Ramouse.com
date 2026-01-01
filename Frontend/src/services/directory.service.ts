import { api } from '../lib/api';

export const DirectoryService = {
    getTechnicians: async (params?: { city?: string; specialty?: string; lat?: number; lng?: number; sort?: string; search?: string }) => {
        const response = await api.get('/technicians', { params });
        return response.data;
    },

    getTechnician: async (id: string) => {
        const response = await api.get(`/technicians/${id}`);
        return response.data;
    },

    getTowTrucks: async (params?: { city?: string; vehicle_type?: string; lat?: number; lng?: number }) => {
        const response = await api.get('/tow-trucks', { params });
        return response.data;
    },

    getTowTruck: async (id: string) => {
        const response = await api.get(`/tow-trucks/${id}`);
        return response.data;
    }
};
