import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Input, Button, Card } from '../shared';
import { Ionicons } from '@expo/vector-icons';
import { useSendOtp, useVerifyOtp, useRegisterCustomer } from '@/hooks';

type RegistrationStep = 'phone' | 'otp' | 'details';

interface RegisterCustomerScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

export const RegisterCustomerScreen: React.FC<RegisterCustomerScreenProps> = ({
    onBack,
    onSuccess,
}) => {
    const [step, setStep] = useState<RegistrationStep>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const sendOtp = useSendOtp();
    const verifyOtp = useVerifyOtp();
    const registerCustomer = useRegisterCustomer();

    // Validation Functions
    const validatePhone = () => {
        const newErrors: Record<string, string> = {};

        if (!phone.trim()) {
            newErrors.phone = 'رقم الجوال مطلوب';
        } else if (!/^05\d{8}$/.test(phone)) {
            newErrors.phone = 'رقم الجوال غير صحيح (مثال: 0512345678)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOtp = () => {
        const newErrors: Record<string, string> = {};

        if (!otp.trim()) {
            newErrors.otp = 'رمز التحقق مطلوب';
        } else if (otp.length !== 6) {
            newErrors.otp = 'رمز التحقق يجب أن يكون 6 أرقام';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateDetails = () => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = 'الاسم مطلوب';
        } else if (name.trim().length < 3) {
            newErrors.name = 'الاسم يجب أن يكون 3 أحرف على الأقل';
        }

        if (!password.trim()) {
            newErrors.password = 'كلمة المرور مطلوبة';
        } else if (password.length < 6) {
            newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
        }

        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Step Handlers
    const handleSendOtp = async () => {
        if (!validatePhone()) return;

        try {
            await sendOtp.mutateAsync(phone);
            setStep('otp');
        } catch (error: any) {
            setErrors({ phone: error.response?.data?.message || 'فشل إرسال رمز التحقق' });
        }
    };

    const handleVerifyOtp = async () => {
        if (!validateOtp()) return;

        try {
            await verifyOtp.mutateAsync({ phone, otp });
            setStep('details');
        } catch (error: any) {
            setErrors({ otp: error.response?.data?.message || 'رمز التحقق غير صحيح' });
        }
    };

    const handleRegister = async () => {
        if (!validateDetails()) return;

        try {
            await registerCustomer.mutateAsync({
                phone,
                password,
                name,
            });
            onSuccess?.();
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل التسجيل' });
        }
    };

    // Step 1: Phone Entry
    const renderPhoneStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>تسجيل حساب جديد</Text>
            <Text style={styles.stepSubtitle}>أدخل رقم جوالك للبدء</Text>

            <Input
                label="رقم الجوال"
                placeholder="05xxxxxxxx"
                value={phone}
                onChangeText={(text) => {
                    setPhone(text);
                    setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                error={errors.phone}
                keyboardType="phone-pad"
                maxLength={10}
                autoCapitalize="none"
            />

            <Button
                title="إرسال رمز التحقق"
                onPress={handleSendOtp}
                loading={sendOtp.isPending}
                disabled={sendOtp.isPending}
                style={styles.button}
            />

            <TouchableOpacity onPress={onBack} style={styles.backLink}>
                <Text style={styles.backLinkText}>العودة لتسجيل الدخول</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 2: OTP Verification
    const renderOtpStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>تحقق من رقم الجوال</Text>
            <Text style={styles.stepSubtitle}>أدخل الرمز المرسل إلى {phone}</Text>

            <Input
                label="رمز التحقق"
                placeholder="000000"
                value={otp}
                onChangeText={(text) => {
                    setOtp(text);
                    setErrors((prev) => ({ ...prev, otp: undefined }));
                }}
                error={errors.otp}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
            />

            <Button
                title="تحقق"
                onPress={handleVerifyOtp}
                loading={verifyOtp.isPending}
                disabled={verifyOtp.isPending}
                style={styles.button}
            />

            <TouchableOpacity
                onPress={handleSendOtp}
                disabled={sendOtp.isPending}
                style={styles.backLink}
            >
                <Text style={styles.backLinkText}>إعادة إرسال الرمز</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep('phone')} style={styles.backLink}>
                <Text style={styles.backLinkText}>تغيير رقم الجوال</Text>
            </TouchableOpacity>
        </View>
    );

    // Step 3: Complete Details
    const renderDetailsStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>أكمل بياناتك</Text>
            <Text style={styles.stepSubtitle}>أدخل اسمك وكلمة المرور</Text>

            <Input
                label="الاسم الكامل"
                placeholder="أدخل اسمك"
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                autoCapitalize="words"
            />

            <View style={styles.passwordContainer}>
                <Input
                    label="كلمة المرور"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    error={errors.password}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={24}
                        color="#666"
                    />
                </TouchableOpacity>
            </View>

            <Input
                label="تأكيد كلمة المرور"
                placeholder="أعد إدخال كلمة المرور"
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
            />

            {errors.general && (
                <Text style={styles.errorText}>{errors.general}</Text>
            )}

            <Button
                title="إنشاء الحساب"
                onPress={handleRegister}
                loading={registerCustomer.isPending}
                disabled={registerCustomer.isPending}
                style={styles.button}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Ionicons name="person-add" size={48} color="#007AFF" />
                    </View>
                    <Text style={styles.title}>رامووس</Text>
                    <Text style={styles.subtitle}>إنشاء حساب عميل</Text>
                </View>

                {/* Form Card */}
                <Card style={styles.formCard}>
                    {step === 'phone' && renderPhoneStep()}
                    {step === 'otp' && renderOtpStep()}
                    {step === 'details' && renderDetailsStep()}
                </Card>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressDot, step === 'phone' && styles.progressDotActive]} />
                    <View style={[styles.progressDot, step === 'otp' && styles.progressDotActive]} />
                    <View style={[styles.progressDot, step === 'details' && styles.progressDotActive]} />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    formCard: {
        marginBottom: 24,
    },
    stepContainer: {
        width: '100%',
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 40,
        padding: 8,
    },
    button: {
        marginTop: 8,
    },
    backLink: {
        alignSelf: 'center',
        marginTop: 12,
        padding: 8,
    },
    backLinkText: {
        color: '#007AFF',
        fontSize: 14,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginBottom: 12,
        textAlign: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#DDD',
    },
    progressDotActive: {
        backgroundColor: '#007AFF',
        width: 24,
    },
});
