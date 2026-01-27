import { OrdersScreen } from '@/components/customer/OrdersScreen';
import { useRouter } from 'expo-router';

export default function OrdersPage() {
    const router = useRouter();

    return <OrdersScreen onBack={() => router.back()} />;
}
