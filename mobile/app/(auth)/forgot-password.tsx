import { ForgotPasswordScreen } from '@/components/auth';
import { useRouter } from 'expo-router';

export default function Page() {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const handleSuccess = () => {
        // Password reset successful, navigate to login
        router.replace('/(auth)/login');
    };

    return (
        <ForgotPasswordScreen
            onBack={handleBack}
            onSuccess={handleSuccess}
        />
    );
}
