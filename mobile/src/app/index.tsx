import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import WelcomeScreen from '@/components/screens/WelcomeScreen';

export default function Index() {
    const { isAuthenticated } = useAuthStore();

    // If already authenticated, _layout.tsx will handle the redirect to dashboard.
    // If not, we show the Welcome Screen.
    // However, _layout logic might need to be slightly adjusted if we want this screen to be visible 
    // strictly when isAuthenticated is false, without auto-redirecting to login.

    if (isAuthenticated) {
        return <Redirect href="/(customer)" />; // Fallback, usually handled by _layout
    }

    return <WelcomeScreen />;
}
