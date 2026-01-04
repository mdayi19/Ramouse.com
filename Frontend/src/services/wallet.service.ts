import { api } from '../lib/api';
import type {
    UserWalletBalance,
    UserWalletTransaction,
    UserDepositRequest,
    UserWithdrawalRequest
} from '../types';

// ======== WALLET API SERVICE ========

/**
 * Get wallet balance (current, available, held)
 */
export const getWalletBalance = async (forceRefresh = false): Promise<UserWalletBalance> => {
    const response = await api.get('/wallet/balance' + (forceRefresh ? `?_t=${Date.now()}` : ''));
    return response.data;
};

/**
 * Get transaction history
 */
export const getWalletTransactions = async (page: number = 1, forceRefresh = false): Promise<{
    data: UserWalletTransaction[];
    current_page: number;
    last_page: number;
    total: number;
}> => {
    const url = `/wallet/transactions?page=${page}` + (forceRefresh ? `&_t=${Date.now()}` : '');
    const response = await api.get(url);
    return response.data;
};

/**
 * Get deposit request history
 */
export const getDeposits = async (forceRefresh = false): Promise<{ data: UserDepositRequest[] }> => {
    const response = await api.get('/wallet/deposits' + (forceRefresh ? `?_t=${Date.now()}` : ''));
    return response.data;
};

/**
 * Get withdrawal request history
 */
export const getWithdrawals = async (forceRefresh = false): Promise<{ data: UserWithdrawalRequest[] }> => {
    const response = await api.get('/wallet/withdrawals' + (forceRefresh ? `?_t=${Date.now()}` : ''));
    return response.data;
};

/**
 * Submit a deposit request with receipt
 */
export const submitDeposit = async (
    amount: number,
    paymentMethodId: string,
    paymentMethodName: string,
    receiptFile: File
): Promise<{ message: string; deposit: UserDepositRequest }> => {
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('paymentMethodId', paymentMethodId);
    formData.append('paymentMethodName', paymentMethodName);
    formData.append('receipt', receiptFile);

    const response = await api.post('/wallet/deposit', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * Submit a withdrawal request
 */
export const submitWithdrawal = async (
    amount: number,
    paymentMethodId: string,
    paymentMethodName: string,
    paymentMethodDetails: string
): Promise<{ message: string; withdrawal: UserWithdrawalRequest }> => {
    const response = await api.post('/wallet/withdraw', {
        amount,
        paymentMethodId,
        paymentMethodName,
        paymentMethodDetails,
    });
    return response.data;
};

/**
 * Pay from wallet (for future auction/order integration)
 */
export const payFromWallet = async (
    amount: number,
    referenceType: string,
    referenceId: string,
    description: string
): Promise<{ message: string; newBalance: number }> => {
    const response = await api.post('/wallet/pay', {
        amount,
        referenceType,
        referenceId,
        description,
    });
    return response.data;
};

// ======== ADMIN WALLET API SERVICE ========

/**
 * [Admin] List all user deposits
 */
export const listUserDeposits = async (status?: string): Promise<{
    data: UserDepositRequest[];
    current_page: number;
    last_page: number;
}> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/user-deposits${params}`);
    return response.data;
};

/**
 * [Admin] Approve a user deposit
 */
export const approveUserDeposit = async (
    depositId: string,
    notes?: string
): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/user-deposits/${depositId}/approve`, { notes });
    return response.data;
};

/**
 * [Admin] Reject a user deposit
 */
export const rejectUserDeposit = async (
    depositId: string,
    reason?: string
): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/user-deposits/${depositId}/reject`, { reason });
    return response.data;
};

/**
 * [Admin] List all user withdrawals
 */
export const listUserWithdrawals = async (status?: string): Promise<{
    data: UserWithdrawalRequest[];
    current_page: number;
    last_page: number;
}> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/user-withdrawals${params}`);
    return response.data;
};

/**
 * [Admin] Approve a user withdrawal
 */
export const approveUserWithdrawal = async (
    withdrawalId: string,
    notes?: string,
    receiptFile?: File | null
): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    if (notes) formData.append('notes', notes);
    if (receiptFile) formData.append('receipt', receiptFile);

    const response = await api.post(`/admin/user-withdrawals/${withdrawalId}/approve`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

/**
 * [Admin] Reject a user withdrawal
 */
export const rejectUserWithdrawal = async (
    withdrawalId: string,
    reason?: string
): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/admin/user-withdrawals/${withdrawalId}/reject`, { reason });
    return response.data;
};

/**
 * [Admin] List all user transactions
 */
export const listUserTransactions = async (userType?: string): Promise<{
    data: UserWalletTransaction[];
    current_page: number;
    last_page: number;
}> => {
    const params = userType ? `?user_type=${userType}` : '';
    const response = await api.get(`/admin/user-transactions${params}`);
    return response.data;
};

/**
 * [Admin] Add funds to user wallet
 */
export const addUserFunds = async (
    userId: number,
    userType: 'customer' | 'technician' | 'tow_truck',
    amount: number,
    description?: string
): Promise<{ success: boolean; message: string; new_balance: number }> => {
    const response = await api.post(`/admin/users/${userId}/add-funds`, {
        userType,
        amount,
        description,
    });
    return response.data;
};

// ======== PAYMENT METHODS MANAGEMENT ========

/**
 * Get user's saved payment methods
 */
export const getUserPaymentMethods = async (): Promise<{ paymentMethods: any[] }> => {
    const response = await api.get('/wallet/payment-methods');
    return response.data;
};

/**
 * Add new payment method
 */
export const addUserPaymentMethod = async (methodName: string, details: string): Promise<{ message: string; paymentMethod: any }> => {
    const response = await api.post('/wallet/payment-methods', {
        methodName,
        details,
    });
    return response.data;
};

/**
 * Update payment method
 */
export const updateUserPaymentMethod = async (methodId: string, details: string): Promise<{ message: string }> => {
    const response = await api.put(`/wallet/payment-methods/${methodId}`, {
        details,
    });
    return response.data;
};

/**
 * Delete payment method
 */
export const deleteUserPaymentMethod = async (methodId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/wallet/payment-methods/${methodId}`);
    return response.data;
};

/**
 * Set primary payment method
 */
export const setUserPrimaryPaymentMethod = async (methodId: string): Promise<{ message: string }> => {
    const response = await api.post(`/wallet/payment-methods/${methodId}/set-primary`);
    return response.data;
};
