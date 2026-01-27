import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Avatar, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser, useUpdateCustomerProfile } from '@/hooks';
import { LoadingState } from '@/components';

export default function EditProfileScreen() {
    const router = useRouter();
    const user = useCurrentUser();
    const updateProfile = useUpdateCustomerProfile();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [address, setAddress] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!user) {
        return <LoadingState message="جاري التحميل..." />;
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!name || name.length < 3) {
            newErrors.name = 'يرجى إدخال الاسم (3 أحرف على الأقل)';
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;

        try {
            await updateProfile.mutateAsync({
                name,
                email: email || undefined,
                address: address || undefined,
            });
            router.back();
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل تحديث الملف الشخصي' });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text variant="headlineMedium" style={styles.title}>
                            ✏️ تعديل الملف الشخصي
                        </Text>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <Avatar.Text
                            size={100}
                            label={name?.charAt(0) || 'U'}
                            style={styles.avatar}
                        />
                        <Button mode="text" onPress={() => {
                            // TODO: Change avatar
                        }}>
                            تغيير الصورة
                        </Button>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <TextInput
                            label="الاسم الكامل"
                            value={name}
                            onChangeText={setName}
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.name}
                            left={<TextInput.Icon icon="account" />}
                        />
                        <HelperText type="error" visible={!!errors.name}>
                            {errors.name}
                        </HelperText>

                        <TextInput
                            label="رقم الهاتف"
                            value={user.phone}
                            mode="outlined"
                            style={styles.input}
                            disabled
                            left={<TextInput.Icon icon="phone" />}
                        />
                        <HelperText type="info" visible={true}>
                            لا يمكن تغيير رقم الهاتف
                        </HelperText>

                        <TextInput
                            label="البريد الإلكتروني (اختياري)"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            mode="outlined"
                            style={styles.input}
                            error={!!errors.email}
                            left={<TextInput.Icon icon="email" />}
                        />
                        <HelperText type="error" visible={!!errors.email}>
                            {errors.email}
                        </HelperText>

                        <TextInput
                            label="العنوان (اختياري)"
                            value={address}
                            onChangeText={setAddress}
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            style={styles.input}
                            left={<TextInput.Icon icon="map-marker" />}
                        />

                        {errors.general && (
                            <HelperText type="error" visible={true}>
                                {errors.general}
                            </HelperText>
                        )}

                        <View style={styles.buttons}>
                            <Button
                                mode="contained"
                                onPress={handleSave}
                                loading={updateProfile.isPending}
                                disabled={updateProfile.isPending}
                                style={styles.saveButton}
                            >
                                حفظ التغييرات
                            </Button>

                            <Button
                                mode="outlined"
                                onPress={() => router.back()}
                                disabled={updateProfile.isPending}
                                style={styles.cancelButton}
                            >
                                إلغاء
                            </Button>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        padding: 16,
        backgroundColor: '#f8f9fa',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatar: {
        backgroundColor: '#6366f1',
        marginBottom: 12,
    },
    form: {
        padding: 16,
    },
    input: {
        marginBottom: 4,
    },
    buttons: {
        marginTop: 24,
        gap: 12,
    },
    saveButton: {
        paddingVertical: 6,
    },
    cancelButton: {
        paddingVertical: 6,
    },
});
