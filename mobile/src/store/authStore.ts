import { create } from 'zustand';
import { secureStorage } from '@/utils/secureStorage';

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

            const { token, user } = response.data;

            // CRITICAL: Check if response contains error (nginx/proxy may convert 403 to 200)
            // If there's an error message but no token, treat as login failure
            if (!token && (response.data.error || response.data.message)) {
                const errorMessage = response.data.message || response.data.error || 'Login failed';
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: errorMessage,
                });
                // Throw error with the backend message
                throw new Error(errorMessage);
            }

            // Validate response data
            if (!user || !token) {
                throw new Error('Invalid response from server');
            }

            // Save token and user to secure storage
            await secureStorage.setItem('authToken', token);
            await secureStorage.setItem('user', JSON.stringify(user));

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
            await secureStorage.removeItem('authToken');
            await secureStorage.removeItem('user');
            await secureStorage.removeItem('refreshToken');

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
            const token = await secureStorage.getItem('authToken');
            const userJson = await secureStorage.getItem('user');

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
