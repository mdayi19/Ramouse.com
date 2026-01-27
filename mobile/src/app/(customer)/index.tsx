import { DashboardScreen } from '@/components/customer/DashboardScreen';
import { useRouter } from 'expo-router';

export default function CustomerDashboardPage() {
    const router = useRouter();

    const handleNavigate = (screen: string) => {
        // Handle dynamic routes (e.g., order/123)
        if (screen.startsWith('order/')) {
            router.push(`/(customer)/${screen}`);
            return;
        }

        // Navigate to different screens based on the screen parameter
        switch (screen) {
            case 'orders':
                router.push('/(customer)/orders');
                break;
            case 'wallet':
                router.push('/(customer)/wallet');
                break;
            case 'favorites':
                router.push('/(customer)/favorites');
                break;
            case 'garage':
                router.push('/(customer)/garage');
                break;
            case 'new-order':
                router.push('/(customer)/order/new');
                break;
            case 'marketplace':
                router.push('/(customer)/marketplace');
                break;
            case 'auctions':
                router.push('/(customer)/auctions');
                break;
            case 'store':
                router.push('/(customer)/store');
                break;
            default:
                break;
        }
    };

    return <DashboardScreen userName="أحمد محمد" onNavigate={handleNavigate} />;
}
