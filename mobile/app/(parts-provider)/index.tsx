import { DashboardScreen } from '@/components/parts-provider/DashboardScreen';
import { useRouter } from 'expo-router';

export default function ProviderDashboardPage() {
    const router = useRouter();

    const handleNavigate = (screen: string) => {
        switch (screen) {
            case 'available-orders':
                router.push('/(parts-provider)/available-orders');
                break;
            case 'my-bids':
                router.push('/(parts-provider)/my-bids');
                break;
            case 'accepted-orders':
                router.push('/(parts-provider)/accepted-orders');
                break;
            case 'wallet':
                router.push('/(parts-provider)/wallet');
                break;
            case 'settings':
                router.push('/(parts-provider)/settings');
                break;
            default:
                break;
        }
    };

    return <DashboardScreen providerName="مكتب النخبة لقطع الغيار" onNavigate={handleNavigate} />;
}
