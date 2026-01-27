import { OrderWizard } from '@/components/customer/OrderWizard/OrderWizard';
import { useRouter } from 'expo-router';

export default function NewOrderPage() {
    const router = useRouter();

    return (
        <OrderWizard
            onComplete={() => router.replace('/(customer)/orders')}
            onCancel={() => router.back()}
        />
    );
}
