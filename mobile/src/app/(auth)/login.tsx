import { LoginScreen } from '@/components/auth';
import { useRouter } from 'expo-router';

export default function LoginPage() {
    const router = useRouter();

    const handleRegisterTechnician = () => {
        router.push('/(auth)/register-technician');
    };

    const handleRegisterTowTruck = () => {
        router.push('/(auth)/register-tow-truck');
    };

    const handleRegisterCarProvider = () => {
        router.push('/(auth)/register-car-provider');
    };

    return (
        <LoginScreen
            onRegisterTechnician={handleRegisterTechnician}
            onRegisterTowTruck={handleRegisterTowTruck}
            onRegisterCarProvider={handleRegisterCarProvider}
        />
    );
}
