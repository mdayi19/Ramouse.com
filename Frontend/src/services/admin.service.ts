import { api } from '../lib/api';

export const AdminService = {
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Settings
    getSettings: async () => {
        const response = await api.get('/admin/settings');
        return response.data;
    },

    updateSettings: async (settings: any) => {
        const response = await api.put('/admin/settings', settings);
        return response.data;
    },

    testWhatsapp: async (to: string, message: string) => {
        const response = await api.post('/notifications/test-whatsapp', { to, message });
        return response.data;
    },


    // Vehicle Data
    getVehicleData: async () => {
        const response = await api.get('/admin/vehicle/data');
        return response.data;
    },

    saveCategory: async (data: any) => {
        // Transform camelCase to snake_case for backend compatibility
        const backendData = {
            id: data.id,
            name: data.name,
            flag: data.flag,
            brands: data.brands,
            telegram_bot_token: data.telegramBotToken,
            telegram_channel_id: data.telegramChannelId,
            telegram_notifications_enabled: data.telegramNotificationsEnabled,
        };
        const response = await api.post('/admin/vehicle/categories', backendData);
        // Map back to camelCase
        const saved = response.data;
        return {
            ...saved,
            telegramBotToken: saved.telegram_bot_token,
            telegramChannelId: saved.telegram_channel_id,
            telegramNotificationsEnabled: saved.telegram_notifications_enabled
        };
    },

    deleteCategory: async (id: string) => {
        const response = await api.delete(`/admin/vehicle/categories/${id}`);
        return response.data;
    },

    saveBrand: async (data: any) => {
        const response = await api.post('/admin/vehicle/brands', data);
        return response.data;
    },

    deleteBrand: async (id: string) => {
        const response = await api.delete(`/admin/vehicle/brands/${id}`);
        return response.data;
    },

    saveModel: async (data: any) => {
        const response = await api.post('/admin/vehicle/models', data);
        return response.data;
    },

    deleteModel: async (id: string | number) => {
        const response = await api.delete(`/admin/vehicle/models/${id}`);
        return response.data;
    },

    savePartType: async (data: any) => {
        const response = await api.post('/admin/vehicle/part-types', data);
        return response.data;
    },

    deletePartType: async (id: string) => {
        const response = await api.delete(`/admin/vehicle/part-types/${id}`);
        return response.data;
    },

    saveSpecialty: async (data: any) => {
        const response = await api.post('/admin/technicians/specialties', data);
        return response.data;
    },

    deleteSpecialty: async (id: string) => {
        const response = await api.delete(`/admin/technicians/specialties/${id}`);
        return response.data;
    },

    // Financials
    getWithdrawals: async () => {
        const response = await api.get('/admin/withdrawals');
        return response.data;
    },

    approveWithdrawal: async (id: string, receiptUrl?: string) => {
        const response = await api.post(`/admin/withdrawals/${id}/approve`, { receiptUrl });
        return response.data;
    },

    rejectWithdrawal: async (id: string, reason: string) => {
        const response = await api.post(`/admin/withdrawals/${id}/reject`, { reason });
        return response.data;
    },

    getTransactions: async () => {
        const response = await api.get('/admin/transactions');
        return response.data;
    },

    addFunds: async (providerId: string, amount: number, description: string) => {
        const response = await api.post(`/admin/providers/${providerId}/add-funds`, { amount, description });
        return response.data;
    },

    // Products
    createProduct: async (productData: FormData) => {
        const response = await api.post('/admin/products', productData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // Store
    createStoreCategory: async (category: any) => {
        const response = await api.post('/admin/store/categories', category);
        return response.data;
    },

    getAllStoreOrders: async () => {
        const response = await api.get('/admin/store/orders');
        return response.data;
    },

    updateStoreOrder: async (id: string, data: any) => {
        const response = await api.patch(`/admin/store/orders/${id}`, data);
        return response.data;
    },

    // Content
    getBlogPosts: async () => {
        const response = await api.get('/blog');
        return response.data;
    },

    createBlogPost: async (post: any) => {
        const response = await api.post('/admin/blog', post);
        return response.data;
    },

    updateBlogPost: async (id: string, post: any) => {
        const response = await api.put(`/admin/blog/${id}`, post);
        return response.data;
    },

    deleteBlogPost: async (id: string) => {
        const response = await api.delete(`/admin/blog/${id}`);
        return response.data;
    },

    createFaq: async (faq: any) => {
        const response = await api.post('/admin/faq', faq);
        return response.data;
    },

    createAnnouncement: async (announcement: any) => {
        const response = await api.post('/admin/announcements', announcement);
        return response.data;
    },

    // User management
    updateProviderStatus: async (id: string, is_active: boolean) => {
        const response = await api.patch(`/admin/providers/${id}/status`, { is_active });
        return response.data;
    },

    verifyTechnician: async (id: string, is_verified: boolean) => {
        const response = await api.patch(`/admin/technicians/${id}/verify`, { is_verified });
        return response.data;
    },

    verifyTowTruck: async (id: string, is_verified: boolean) => {
        const response = await api.patch(`/admin/tow-trucks/${id}/verify`, { is_verified });
        return response.data;
    },
};
