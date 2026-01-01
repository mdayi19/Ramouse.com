import { api } from '../lib/api';
import { Order, ApiResponse, Quote } from '../types';

export const OrderService = {
    getAll: async (): Promise<Order[]> => {
        const response = await api.get<{ data: Order[] }>('/orders');
        return response.data.data;
    },

    create: async (orderData: any): Promise<ApiResponse<Order>> => {
        // If orderData contains files, ensure it's FormData
        // If it's a plain object and we need to send files, we must convert it
        // For now, assuming orderData is prepared FormData or JSON based on the endpoint requirement
        return (await api.post('/orders', orderData)).data;
    },

    getById: async (orderNumber: string): Promise<Order> => {
        const response = await api.get<{ data: Order }>(`/orders/${orderNumber}`);
        return response.data.data;
    },

    submitQuote: async (orderNumber: string, quoteData: FormData): Promise<ApiResponse<Quote>> => {
        const response = await api.post(`/orders/${orderNumber}/quotes`, quoteData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    acceptQuote: async (orderNumber: string, quoteId: string, paymentData: any): Promise<ApiResponse<Order>> => {
        const response = await api.post(`/orders/${orderNumber}/accept`, { quote_id: quoteId, ...paymentData });
        return response.data;
    },

    updateStatus: async (orderNumber: string, status: string): Promise<ApiResponse<Order>> => {
        const response = await api.patch(`/orders/${orderNumber}/status`, { status });
        return response.data;
    }
};