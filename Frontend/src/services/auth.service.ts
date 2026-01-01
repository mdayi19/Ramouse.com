import { api } from '../lib/api';
import { AuthResponse, Customer, Provider, Technician, TowTruck } from '../types';

export const AuthService = {
    checkPhone: async (phone: string) => {
        const response = await api.post('/auth/check-phone', { phone });
        return response.data;
    },

    login: async (phone: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { phone, password });

        if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('userPhone', phone);
            localStorage.setItem('isAuthenticated', 'true');

            // Store role information for page refresh persistence
            localStorage.setItem('isAdmin', response.data.is_admin ? 'true' : 'false');
            localStorage.setItem('userType', response.data.user_type || response.data.role || 'customer');

            // Store complete user object including user_id for notifications
            const userToStore = {
                ...response.data.user,
                user_id: response.data.user_id // Ensure user_id is explicitly correctly stored
            };
            localStorage.setItem('currentUser', JSON.stringify(userToStore));

            // Store user_id directly for easy access by real-time listeners
            if (response.data.user_id) {
                localStorage.setItem('user_id', String(response.data.user_id));
            }
        }

        return response.data;
    },

    registerCustomer: async (data: Partial<Customer>) => {
        const response = await api.post<AuthResponse>('/auth/register/customer', data);
        return response.data;
    },

    registerTechnician: async (data: Partial<Technician>) => {
        // FormData needed for file uploads usually
        return api.post('/auth/register/technician', data);
    },

    registerTowTruck: async (data: Partial<TowTruck>) => {
        return api.post('/auth/register/tow-truck', data);
    },

    sendOtp: async (phone: string) => {
        return api.post('/auth/otp/send', { phone });
    },

    verifyOtp: async (phone: string, otp: string) => {
        return api.post('/auth/otp/verify', { phone, otp });
    },

    resetPassword: async (phone: string, password: string) => {
        return api.post('/auth/reset-password', { phone, password });
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) {
            console.error("Logout failed on server", e);
        } finally {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userPhone');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('isAdmin');  // Clear role on logout
            localStorage.removeItem('userType');  // Clear role on logout
            localStorage.removeItem('user_id');  // Clear user_id for real-time listeners
            localStorage.removeItem('currentUser');  // Clear user object
            window.location.href = '/';
        }
    },

    getProfile: async () => {
        const response = await api.get('/user');
        const user = response.data;
        if (user.notification_settings) {
            user.notificationSettings = user.notification_settings;
        }
        return user;
    },

    updateProfile: async (data: any) => {
        const payload = { ...data };
        if (payload.notificationSettings) {
            payload.notification_settings = payload.notificationSettings;
            delete payload.notificationSettings;
        }
        const response = await api.put('/profile', payload);
        return response.data;
    }
};