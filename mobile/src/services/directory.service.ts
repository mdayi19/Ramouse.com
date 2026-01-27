import client from '../api/client';
import { Technician, TowTruck } from '../types';

export const DirectoryService = {
    getTechnicians: async (params?: { city?: string; specialty?: string; lat?: number; lng?: number; sort?: string; search?: string }) => {
        const response = await client.get<{ data: Technician[], meta: any }>('/technicians', { params });
        return response.data;
    },

    getTechnician: async (id: string) => {
        const response = await client.get<Technician>(`/technicians/${id}`);
        return response.data;
    },

    getTowTrucks: async (params?: { city?: string; vehicle_type?: string; lat?: number; lng?: number }) => {
        const response = await client.get<{ data: TowTruck[], meta: any }>('/tow-trucks', { params });
        return response.data;
    },

    getTowTruck: async (id: string) => {
        const response = await client.get<TowTruck>(`/tow-trucks/${id}`);
        return response.data;
    }
};
