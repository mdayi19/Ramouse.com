import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarProviderService } from '@/services/carprovider.service';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { ProviderProfileForm, ProfileField } from '@/components/ProviderProfileForm';

export default function CarProviderProfileScreen() {
    const { user, setUser, logout } = useAuthStore();
    const router = useRouter();
    const [initialData, setInitialData] = useState<any>(null);

    useEffect(() => {
        if (user) {
            setInitialData({
                profilePhoto: user.profilePhoto,
                name: user.name,
                city: user.city,
                description: user.description,
                address: user.address,
                phone: user.phone,
            });
        }
    }, [user]);

    const handleSave = async (data: any) => {
        try {
            const updated = await CarProviderService.updateProfile(data);
            setUser({ ...user, ...updated });
            Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح');
        } catch (error) {
            console.error('Update failed:', error);
            Alert.alert('خطأ', 'فشل تحديث الملف الشخصي');
            throw error;
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    const fields: ProfileField[] = [
        { key: 'name', label: 'اسم المعرض' },
        { key: 'city', label: 'المدينة' },
        { key: 'address', label: 'العنوان التفصيلي' },
        { key: 'phone', label: 'رقم الهاتف', keyboardType: 'phone-pad' },
        { key: 'description', label: 'نبذة عن المعرض', multiline: true },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ProviderProfileForm
                initialData={initialData}
                fields={fields}
                onSave={handleSave}
                onLogout={handleLogout}
                photoLabel="تغيير شعار المعرض"
            />
        </SafeAreaView>
    );
}
