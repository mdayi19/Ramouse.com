import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'customer' | 'technician' | 'car_provider' | 'tow_truck' | 'admin';

export interface User {
    id: number;
    phone: string;
    name: string;
    email?: string;
    role: UserRole;
    is_active: boolean;
    is_verified: boolean;
    profile?: any; // Specific profile based on role
}

interface AuthState {
    // State
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (phone: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    hasRole: (role: UserRole) => boolean;
    hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Setters
    setUser: (user) => set({ user, isAuthenticated: !!user }),
    setToken: (token) => set({ token }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    // Login
    login: async (phone: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const { default: apiClient } = await import('@/api/client');

            const response = await apiClient.post('/auth/login', {
                phone,
                password,
            });

            const { token, user, role, is_active, is_verified } = response.data;

            // Check if user is active and verified (for service providers)
            if (!is_active) {
                throw new Error('Your account has been deactivated. Please contact support.');
            }

            if (!is_verified && role !== 'customer') {
                throw new Error('Your account is pending admin approval.');
            }

            // Save token and user to secure storage
            await SecureStore.setItemAsync('authToken', token);
            await SecureStore.setItemAsync('user', JSON.stringify(user));

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Login failed';
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: errorMessage,
            });
            throw error;
        }
    },

    // Logout
    logout: async () => {
        try {
            // Call logout endpoint
            const { default: apiClient } = await import('@/api/client');
            await apiClient.post('/auth/logout').catch(() => {
                // Ignore logout API errors
            });
        } finally {
            // Clear secure storage
            await SecureStore.deleteItemAsync('authToken');
            await SecureStore.deleteItemAsync('user');
            await SecureStore.deleteItemAsync('refreshToken');

            // Reset state
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    // Check authentication status on app start
    checkAuth: async () => {
        set({ isLoading: true });

        try {
            const token = await SecureStore.getItemAsync('authToken');
            const userJson = await SecureStore.getItemAsync('user');

            if (token && userJson) {
                const user = JSON.parse(userJson);
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            set({ isLoading: false });
        }
    },

    // Role-based access control
    hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
    },

    hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;

        // Define permissions per role
        const rolePermissions: Record<UserRole, string[]> = {
            customer: ['marketplace.view', 'favorites.manage', 'orders.create', 'wallet.view', 'listings.create_limited'],
            technician: ['profile.manage', 'reviews.view', 'wallet.view', 'listings.create_limited'],
            car_provider: ['profile.manage', 'listings.manage', 'analytics.view', 'sponsorship.manage', 'wallet.view'],
            tow_truck: ['profile.manage', 'location.track', 'reviews.view', 'wallet.view', 'listings.create_limited'],
            admin: ['admin.dashboard', 'admin.verify', 'admin.manage'],
        };

        return rolePermissions[user.role]?.includes(permission) || false;
    },
}));
