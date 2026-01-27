import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TechnicianService } from '@/services/technician.service';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { ProviderProfileForm, ProfileField } from '@/components/ProviderProfileForm';

export default function TechnicianProfileScreen() {
    const { user, setUser, logout } = useAuthStore();
    const router = useRouter();
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        if (user) {
            setInitialData({
                profilePhoto: user.profilePhoto, // Ensure photo is passed
                name: user.name,
                specialty: user.specialty,
                city: user.city,
                description: user.description,
                workshopAddress: user.workshopAddress,
                socials: user.socials || { facebook: '', whatsapp: '' }
            });
        }
    }, [user]);

    const handleSave = async (data: any) => {
        try {
            // Only send necessary fields or full object depending on API
            const updated = await TechnicianService.updateProfile(user.id, data);
            setUser({ ...user, ...updated });
            Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح');
        } catch (error) {
            console.error('Update failed:', error);
            Alert.alert('خطأ', 'فشل تحديث الملف الشخصي');
            throw error; // Propagate to component to stop loading state if needed
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const fields: ProfileField[] = [
        { key: 'name', label: 'الاسم الكامل' },
        { key: 'specialty', label: 'التخصص', editable: false }, // Read-only
        { key: 'city', label: 'المدينة' },
        { key: 'workshopAddress', label: 'عنوان الورشة' },
        { key: 'description', label: 'نبذة تعريفية', multiline: true },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ProviderProfileForm
                initialData={initialData}
                fields={fields}
                onSave={handleSave}
                onLogout={handleLogout}
                photoLabel="تغيير الصورة"
            />
        </SafeAreaView>
    );
}
