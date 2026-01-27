import apiClient from '@/api/client';
import { secureStorage } from '@/utils/secureStorage';

export interface LoginCredentials {
    phone: string;
    password: string;
}

export interface RegisterCustomerData {
    phone: string;
    password: string;
    name?: string;
}

export interface RegisterTechnicianData {
    phone: string;
    password: string;
    name: string;
    city: string;
    specialties: string[];
    profile_photo?: string;
    gallery?: string[];
    description?: string;
}

export interface RegisterTowTruckData {
    phone: string;
    password: string;
    name: string;
    city: string;
    vehicleType: string; // Changed from truck_type to match web
    truck_type?: string; // Keep for backward compatibility if needed, or remove? Web executes `vehicleType`. Let's keep both or map correctly.
    profile_photo?: string;
    gallery?: any[]; // Web sends objects
    description?: string;
    serviceArea?: string;
    location?: { latitude: number; longitude: number };
    socials?: { facebook?: string; instagram?: string; whatsapp?: string };
}

export interface RegisterCarProviderData {
    phone: string;
    password: string;
    name: string;
    business_type: string;
    city: string;
    address: string;
    profile_photo?: string;
    gallery?: string[];
    description?: string;
    email?: string;
}

export interface AuthResponse {
    token: string;
    user: any;
    role: string;
}

export interface OtpResponse {
    message: string;
    success: boolean;
}

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const AuthService = {
    /**
     * Login with phone and password
     */
    async login(phone: string, password: string): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/login', { phone, password });
        return response.data;
    },

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        await apiClient.post('/auth/logout');
        await secureStorage.removeItem('authToken');
        await secureStorage.removeItem('user');
    },

    /**
     * Check if phone number exists
     */
    async checkPhone(phone: string): Promise<{
        exists: boolean;
        role?: string;
        is_active?: boolean;
        is_verified?: boolean;
    }> {
        const response = await apiClient.post('/auth/check-phone', { phone });
        return response.data;
    },

    /**
     * Send OTP to phone number
     */
    async sendOtp(phone: string): Promise<OtpResponse> {
        const response = await apiClient.post('/auth/otp/send', { phone });
        return response.data;
    },

    /**
     * Verify OTP code
     */
    async verifyOtp(phone: string, otp: string): Promise<OtpResponse> {
        const response = await apiClient.post('/auth/otp/verify', { phone, otp });
        return response.data;
    },

    /**
     * Reset password
     */
    async resetPassword(phone: string, password: string): Promise<{ message: string }> {
        const response = await apiClient.post('/auth/reset-password', { phone, password });
        return response.data;
    },

    /**
     * Register new customer
     */
    async registerCustomer(data: RegisterCustomerData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/register/customer', data);
        return response.data;
    },

    /**
     * Register new technician
     */
    async registerTechnician(data: RegisterTechnicianData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/register-technician', data);
        return response.data;
    },

    /**
     * Register new tow truck
     */
    async registerTowTruck(data: FormData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/register/tow-truck', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Register new car provider
     */
    async registerCarProvider(data: FormData): Promise<AuthResponse> {
        const response = await apiClient.post('/auth/register-car-provider', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get current user profile
     */
    async getProfile(): Promise<any> {
        const response = await apiClient.get('/user');
        return response.data;
    },

    /**
     * Update user profile
     */
    async updateProfile(data: any): Promise<any> {
        const response = await apiClient.put('/profile', data);
        return response.data;
    },
};
