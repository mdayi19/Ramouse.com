import { RegisterTechnicianScreen } from '@/components/auth';
import { useRouter } from 'expo-router';

export default function Page() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleSuccess = () => {
        // Navigation is handled automatically by auth hooks
    };

    return (
        <RegisterTechnicianScreen
            onBack={handleBack}
            onSuccess={handleSuccess}
        />
    );
}
