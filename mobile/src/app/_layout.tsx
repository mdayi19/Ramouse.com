import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/authStore';

// Create React Query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        },
    },
});

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

    // Check authentication on app start
    useEffect(() => {
        checkAuth();
    }, []);

    // Handle navigation based on auth state
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup && segments[0] !== undefined) {
            // If trying to access protected routes (customer, etc), redirect to Welcome (/) or Login
            // But if we are already at root (/), do nothing.
            // segments is empty [] for root.
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
                switch (user?.role) {
                    case 'customer':
                        router.replace('/(customer)');
                        break;
                    case 'car_provider':
                        router.replace('/(car-provider)');
                        break;
                    case 'technician':
                        router.replace('/(technician)');
                        break;
                    case 'tow_truck':
                        router.replace('/(tow-truck)');
                        break;
                    case 'admin':
                        router.replace('/(admin)');
                        break;
                    default:
                        router.replace('/(customer)');
                }
            }, 0);
        }
    }, [isAuthenticated, isLoading, segments, user?.role]);



    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <PaperProvider>
                    <SafeAreaProvider>
                        <StatusBar style="auto" />
                        <Slot />
                    </SafeAreaProvider>
                </PaperProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
