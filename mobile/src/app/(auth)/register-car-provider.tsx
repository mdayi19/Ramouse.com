import { RegisterCarProviderScreen } from '@/components/auth';
import { useRouter } from 'expo-router';

export default function Page() {
    const router = useRouter();

    const handleBack = () => {
        // Navigate to login screen
        router.replace('/(auth)/login');
    };

    const handleSuccess = () => {
        // Navigation is handled automatically by auth hooks
    };

    return (
        <RegisterCarProviderScreen
            onBack={handleBack}
            onSuccess={handleSuccess}
        />
    );
}
