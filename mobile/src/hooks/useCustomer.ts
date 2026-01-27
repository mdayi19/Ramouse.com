import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService } from '@/services/customer.service';
import type { CarListing } from '@/types';

/**
 * Hook to fetch customer favorites
 */
export function useFavorites() {
    return useQuery({
        queryKey: ['favorites'],
        queryFn: () => CustomerService.getFavorites(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to add car to favorites
 */
export function useAddFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (carId: number) => CustomerService.addFavorite(carId),
        onSuccess: (data) => {
            // Update favorites cache
            queryClient.setQueryData(['favorites'], data.favorites);

            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

/**
 * Hook to remove car from favorites
 */
export function useRemoveFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (carId: number) => CustomerService.removeFavorite(carId),
        onSuccess: (data) => {
            // Update favorites cache
            queryClient.setQueryData(['favorites'], data.favorites);

            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

/**
 * Hook to toggle favorite status
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (carId: number) => CustomerService.toggleFavorite(carId),
        onSuccess: (data) => {
            // Update favorites cache
            queryClient.setQueryData(['favorites'], data.favorites);

            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });
}

/**
 * Hook to check if car is favorited
 */
export function useIsFavorite(carId: number) {
    const { data: favorites = [] } = useFavorites();
    return favorites.some((car: CarListing) => car.id === carId);
}

/**
 * Hook to fetch customer garage
 */
export function useGarage() {
    return useQuery({
        queryKey: ['garage'],
        queryFn: () => CustomerService.getGarage(),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to add vehicle to garage
 */
export function useAddToGarage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (vehicleData: any) => CustomerService.addToGarage(vehicleData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['garage'] });
        },
    });
}

/**
 * Hook to remove vehicle from garage
 */
export function useRemoveFromGarage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (vehicleId: string) => CustomerService.removeFromGarage(vehicleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['garage'] });
        },
    });
}

/**
 * Hook to fetch wallet balance
 */
export function useWalletBalance() {
    return useQuery({
        queryKey: ['wallet-balance'],
        queryFn: () => CustomerService.getWalletBalance(),
        staleTime: 1 * 60 * 1000, // 1 minute
    });
}

/**
 * Hook to fetch transactions
 */
export function useTransactions() {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: () => CustomerService.getTransactions(),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to fetch customer orders
 */
export function useOrders() {
    return useQuery({
        queryKey: ['orders'],
        queryFn: () => CustomerService.getOrders(),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to fetch customer profile
 */
export function useCustomerProfile() {
    return useQuery({
        queryKey: ['customer-profile'],
        queryFn: () => CustomerService.getProfile(),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to update customer profile
 */
export function useUpdateCustomerProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => CustomerService.updateProfile(data),
        onSuccess: (data) => {
            // Update profile cache
            queryClient.setQueryData(['customer-profile'], data);

            // Invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
        },
    });
}

// ========== WALLET HOOKS ==========

/**
 * Hook to fetch deposit requests
 */
export function useDeposits() {
    return useQuery({
        queryKey: ['deposits'],
        queryFn: () => CustomerService.getDeposits(),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to fetch withdrawal requests
 */
export function useWithdrawals() {
    return useQuery({
        queryKey: ['withdrawals'],
        queryFn: () => CustomerService.getWithdrawals(),
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Hook to submit deposit
 */
export function useSubmitDeposit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ amount, paymentMethodId, paymentMethodName, receipt }: {
            amount: number;
            paymentMethodId: string;
            paymentMethodName: string;
            receipt: any;
        }) => CustomerService.submitDeposit(amount, paymentMethodId, paymentMethodName, receipt),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['deposits'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
        },
    });
}

/**
 * Hook to submit withdrawal
 */
export function useSubmitWithdrawal() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ amount, paymentMethodId, paymentMethodName, details }: {
            amount: number;
            paymentMethodId: string;
            paymentMethodName: string;
            details: string;
        }) => CustomerService.submitWithdrawal(amount, paymentMethodId, paymentMethodName, details),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
        },
    });
}

/**
 * Hook to fetch saved payment methods
 */
export function useSavedPaymentMethods() {
    return useQuery({
        queryKey: ['payment-methods'],
        queryFn: () => CustomerService.getPaymentMethods(),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to delete payment method
 */
export function useDeletePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (methodId: string) => CustomerService.deletePaymentMethod(methodId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}
