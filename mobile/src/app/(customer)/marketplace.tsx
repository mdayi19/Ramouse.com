import { MarketplaceScreen } from '@/components/marketplace/MarketplaceScreen';
import { useRouter } from 'expo-router';

export default function MarketplacePage() {
    const router = useRouter();

    return (
        <MarketplaceScreen
            onBack={() => router.back()}
            onCarPress={(carId) => router.push(`/(customer)/car/${carId}`)}
        />
    );
}
