import { StoreScreen } from '@/components/store/StoreScreen';
import { useRouter } from 'expo-router';

export default function StorePage() {
    const router = useRouter();

    return (
        <StoreScreen
            onBack={() => router.back()}
            onProductPress={(productId) => router.push(`/(customer)/product/${productId}`)}
        />
    );
}
