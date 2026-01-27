import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

/**
 * Hook to handle user login
 */
export function useLogin() {
    const login = useAuthStore((state) => state.login);
    const router = useRouter();

    return useMutation({
        mutationFn: ({ phone, password }: { phone: string; password: string }) =>
            login(phone, password),
        onSuccess: () => {
            // Navigation is handled by authStore and _layout.tsx
        },
    });
}

/**
 * Hook to handle user logout
 */
export function useLogout() {
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: () => logout(),
        onSuccess: () => {
            // Clear all cached data
            queryClient.clear();

            // Navigate to login
            router.replace('/(auth)/login');
        },
    });
}

/**
 * Hook to check if phone exists
 */
export function useCheckPhone() {
    return useMutation({
        mutationFn: (phone: string) => AuthService.checkPhone(phone),
    });
}

/**
 * Hook to send OTP
 */
export function useSendOtp() {
    return useMutation({
        mutationFn: (phone: string) => AuthService.sendOtp(phone),
    });
}

/**
 * Hook to verify OTP
 */
export function useVerifyOtp() {
    return useMutation({
        mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
            AuthService.verifyOtp(phone, otp),
    });
}

/**
 * Hook to reset password
 */
export function useResetPassword() {
    return useMutation({
        mutationFn: ({ phone, password }: { phone: string; password: string }) =>
            AuthService.resetPassword(phone, password),
    });
}

/**
 * Hook to register customer
 */
export function useRegisterCustomer() {
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);
    const router = useRouter();

    return useMutation({
        mutationFn: (data: any) => AuthService.registerCustomer(data),
        onSuccess: (response) => {
            setToken(response.token);
            setUser(response.user);
            // Navigation handled by _layout.tsx
        },
    });
}

/**
 * Hook to register technician
 */
export function useRegisterTechnician() {
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);

    return useMutation({
        mutationFn: (data: any) => AuthService.registerTechnician(data),
        onSuccess: (response) => {
            setToken(response.token);
            setUser(response.user);
        },
    });
}

/**
 * Hook to register tow truck
 */
export function useRegisterTowTruck() {
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);

    return useMutation({
        mutationFn: (data: any) => AuthService.registerTowTruck(data),
        onSuccess: (response) => {
            setToken(response.token);
            setUser(response.user);
        },
    });
}

/**
 * Hook to register car provider
 * Note: Car providers require admin approval, so no token is returned
 */
export function useRegisterCarProvider() {
    return useMutation({
        mutationFn: (data: any) => AuthService.registerCarProvider(data),
        // Don't auto-login - car providers need admin approval first
        onSuccess: (response) => {
            // Registration successful, but user needs to wait for approval
            // Success handling is done in the component
        },
    });
}

/**
 * Hook to get current user
 */
export function useCurrentUser() {
    return useAuthStore((state) => state.user);
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
    return useAuthStore((state) => state.isAuthenticated);
}

/**
 * Hook to check user role
 */
export function useHasRole(role: string) {
    const hasRole = useAuthStore((state) => state.hasRole);
    return hasRole(role as any);
}

/**
 * Hook to check user permission
 */
export function useHasPermission(permission: string) {
    const hasPermission = useAuthStore((state) => state.hasPermission);
    return hasPermission(permission);
}
