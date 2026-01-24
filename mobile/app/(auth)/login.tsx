import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Surface } from 'react-native-paper';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { login, isLoading, error } = useAuthStore();

    const handleLogin = async () => {
        try {
            await login(phone, password);
        } catch (err) {
            // Error is handled in the store
            console.error('Login error:', err);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Surface style={styles.surface}>
                    <Text variant="headlineLarge" style={styles.title}>
                        مرحباً بك في رموس
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        سوق السيارات والقطع الأول في سوريا
                    </Text>

                    <TextInput
                        label="رقم الهاتف"
                        value={phone}
                        onChangeText={setPhone}
                        mode="outlined"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        style={styles.input}
                        right={<TextInput.Icon icon="phone" />}
                    />

                    <TextInput
                        label="كلمة المرور"
                        value={password}
                        onChangeText={setPassword}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        textContentType="password"
                        style={styles.input}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'}
                                onPress={() => setShowPassword(!showPassword)}
                            />
                        }
                    />

                    {error && (
                        <Text variant="bodySmall" style={styles.error}>
                            {error}
                        </Text>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading || !phone || !password}
                        style={styles.button}
                    >
                        تسجيل الدخول
                    </Button>

                    <Button
                        mode="text"
                        onPress={() => {
                            // Navigate to register
                            console.log('Navigate to register');
                        }}
                        style={styles.registerButton}
                    >
                        ليس لديك حساب؟ سجل الآن
                    </Button>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    surface: {
        padding: 24,
        borderRadius: 12,
        elevation: 4,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        color: '#666',
    },
    input: {
        marginBottom: 16,
    },
    button: {
        marginTop: 8,
        paddingVertical: 6,
    },
    registerButton: {
        marginTop: 16,
    },
    error: {
        color: '#d32f2f',
        textAlign: 'center',
        marginBottom: 16,
    },
});
