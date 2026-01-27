import apiClient from '@/api/client';
import type { CarListing } from '@/types';

export interface FavoriteResponse {
    message: string;
    favorites: CarListing[];
}

/**
 * Customer Service
 * Handles customer-specific API calls
 */
export const CustomerService = {
    /**
     * Get customer favorites
     */
    async getFavorites(): Promise<CarListing[]> {
        const response = await apiClient.get('/favorites/');
        return response.data.favorites || response.data;
    },

    /**
     * Add car to favorites
     */
    async addFavorite(carId: number): Promise<FavoriteResponse> {
        const response = await apiClient.post(`/favorites/${carId}/toggle`);
        return response.data;
    },

    /**
     * Remove car from favorites
     */
    async removeFavorite(carId: number): Promise<FavoriteResponse> {
        const response = await apiClient.post(`/favorites/${carId}/toggle`);
        return response.data;
    },

    /**
     * Toggle favorite status
     */
    async toggleFavorite(carId: number): Promise<FavoriteResponse> {
        const response = await apiClient.post(`/favorites/${carId}/toggle`);
        return response.data;
    },

    /**
     * Get customer garage (saved vehicles)
     */
    async getGarage(): Promise<any[]> {
        const response = await apiClient.get('/customer/garage');
        return response.data.garage || response.data;
    },

    /**
     * Add vehicle to garage
     */
    async addToGarage(vehicleData: any): Promise<any> {
        const response = await apiClient.post('/customer/garage', vehicleData);
        return response.data;
    },

    /**
     * Remove vehicle from garage
     */
    async removeFromGarage(vehicleId: string): Promise<any> {
        const response = await apiClient.delete(`/customer/garage/${vehicleId}`);
        return response.data;
    },

    /**
     * Get customer wallet balance
     */
    async getWalletBalance(): Promise<{ balance: number }> {
        const response = await apiClient.get('/wallet/balance');
        return response.data;
    },

    /**
     * Get customer transactions
     */
    async getTransactions(): Promise<any[]> {
        const response = await apiClient.get('/wallet/transactions');
        return response.data.transactions || response.data;
    },

    /**
     * Get customer orders
     */
    async getOrders(): Promise<any[]> {
        const response = await apiClient.get('/orders');
        return response.data.orders || response.data;
    },

    /**
     * Get customer profile
     */
    async getProfile(): Promise<any> {
        const response = await apiClient.get('/user');
        return response.data;
    },

    /**
     * Update customer profile
     */
    async updateProfile(data: any): Promise<any> {
        const response = await apiClient.put('/profile', data);
        return response.data;
    },

    // ========== WALLET METHODS ==========

    /**
     * Get deposit requests
     */
    async getDeposits(): Promise<any[]> {
        const response = await apiClient.get('/wallet/deposits');
        return response.data.deposits || response.data;
    },

    /**
     * Get withdrawal requests
     */
    async getWithdrawals(): Promise<any[]> {
        const response = await apiClient.get('/wallet/withdrawals');
        return response.data.withdrawals || response.data;
    },

    /**
     * Submit deposit request
     */
    async submitDeposit(amount: number, paymentMethodId: string, paymentMethodName: string, receipt: any): Promise<any> {
        const formData = new FormData();
        formData.append('amount', amount.toString());
        formData.append('payment_method_id', paymentMethodId);
        formData.append('payment_method_name', paymentMethodName);

        if (receipt) {
            formData.append('receipt', receipt);
        }

        const response = await apiClient.post('/wallet/deposit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Submit withdrawal request
     */
    async submitWithdrawal(amount: number, paymentMethodId: string, paymentMethodName: string, details: string): Promise<any> {
        const response = await apiClient.post('/wallet/withdraw', {
            amount,
            payment_method_id: paymentMethodId,
            payment_method_name: paymentMethodName,
            details,
        });
        return response.data;
    },

    /**
     * Get saved payment methods
     */
    async getPaymentMethods(): Promise<any[]> {
        const response = await apiClient.get('/wallet/payment-methods');
        return response.data.paymentMethods || response.data;
    },

    /**
     * Add new payment method
     */
    async addPaymentMethod(methodName: string, details: string): Promise<any> {
        const response = await apiClient.post('/wallet/payment-methods', {
            method_name: methodName,
            details,
        });
        return response.data;
    },

    /**
     * Delete payment method
     */
    async deletePaymentMethod(methodId: string): Promise<any> {
        const response = await apiClient.delete(`/wallet/payment-methods/${methodId}`);
        return response.data;
    },
};
