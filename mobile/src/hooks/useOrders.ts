import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { OrderService, type CreateOrderData, type AcceptQuoteData } from '@/services/order.service';
import { useRouter } from 'expo-router';

/**
 * Hook to create a new order
 */
export function useCreateOrder(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (data: CreateOrderData) => OrderService.createOrder(data),
        onSuccess: () => {
            // Invalidate orders list
            queryClient.invalidateQueries({ queryKey: ['orders'] });

            if (options?.onSuccess) {
                options.onSuccess();
            } else {
                // Navigate to orders screen default
                router.push('/(customer)/orders');
            }
        },
    });
}

/**
 * Hook to get order by ID
 */
export function useOrderById(orderNumber: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['order', orderNumber],
        queryFn: () => OrderService.getOrderById(parseInt(orderNumber)),
        enabled: enabled && !!orderNumber,
    });
}

/**
 * Hook to accept a quote
 */
export function useAcceptQuote() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderNumber, data }: { orderNumber: string; data: AcceptQuoteData }) =>
            OrderService.acceptQuote(orderNumber, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order'] });
        },
    });
}

/**
 * Hook to submit a review
 */
export function useSubmitReview() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ orderNumber, rating, comment }: { orderNumber: string; rating: number; comment: string }) =>
            OrderService.submitReview(orderNumber, rating, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (orderId: number) => OrderService.cancelOrder(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}
