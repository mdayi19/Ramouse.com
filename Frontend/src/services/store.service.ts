import { api } from '../lib/api';

export const StoreService = {
    // Public endpoints
    getProducts: async (params?: { category?: string; is_flash?: boolean; target_audience?: string }) => {
        const response = await api.get('/store/products', { params });
        return response.data;
    },

    getProduct: async (id: string) => {
        const response = await api.get(`/store/products/${id}`);
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/store/categories');
        return response.data;
    },

    // Protected endpoints
    purchase: async (purchaseData: any) => {
        const response = await api.post('/store/purchase', purchaseData);
        return response.data;
    },

    getMyOrders: async () => {
        const response = await api.get('/store/orders');
        return response.data;
    },

    addReview: async (productId: string, review: { rating: number; comment: string }) => {
        const response = await api.post(`/store/products/${productId}/review`, review);
        return response.data;
    },

    cancelOrder: async (orderId: string) => {
        const response = await api.post(`/store/orders/${orderId}/cancel`);
        return response.data;
    },

    getSavedAddress: async () => {
        const response = await api.get('/store/saved-address');
        return response.data;
    }
};
