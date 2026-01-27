import { RegisterTowTruckScreen } from '@/components/auth';
import { useRouter } from 'expo-router';

export default function RegisterTowTruckPage() {
    const router = useRouter();

    return (
        <RegisterTowTruckScreen
            onBack={() => router.back()}
            onSuccess={() => {
                // Auth hooks handle auto-navigation after successful registration
            }}
        />
    );
}
