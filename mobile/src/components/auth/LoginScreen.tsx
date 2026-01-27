import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Button, Card, OtpInput } from '../shared';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRY_CODES } from '@/constants/countries';
import { useLogin, useCheckPhone, useSendOtp, useVerifyOtp, useResetPassword, useRegisterCustomer } from '@/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginMode = 'enterPhone' | 'loginWithPassword' | 'verifyNewUser' | 'forgotPasswordVerify' | 'resetPassword';

interface LoginScreenProps {
    onRegisterTechnician?: () => void;
    onRegisterTowTruck?: () => void;
    onRegisterCarProvider?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
    onRegisterTechnician,
    onRegisterTowTruck,
    onRegisterCarProvider,
}) => {
    const [mode, setMode] = useState<LoginMode>('enterPhone');
    const [countryCode, setCountryCode] = useState('+966');
    const [localPhone, setLocalPhone] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const [rememberMe, setRememberMe] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const login = useLogin();
    const checkPhone = useCheckPhone();
    const sendOtp = useSendOtp();
    const verifyOtp = useVerifyOtp();
    const resetPassword = useResetPassword();
    const registerCustomer = useRegisterCustomer();

    const fullPhone = useMemo(() => countryCode + localPhone, [countryCode, localPhone]);
    const selectedCountry = useMemo(
        () => COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0],
        [countryCode]
    );

    // Load saved phone on mount
    useEffect(() => {
        const loadSavedPhone = async () => {
            const saved = await AsyncStorage.getItem('savedUserPhone');
            if (saved) {
                const foundCode = COUNTRY_CODES.find((c) => saved.startsWith(c.code));
                if (foundCode) {
                    setCountryCode(foundCode.code);
                    setLocalPhone(saved.substring(foundCode.code.length));
                } else {
                    setLocalPhone(saved);
                }
                setRememberMe(true);
            }
        };
        loadSavedPhone();
    }, []);

    const resetToPhoneInput = () => {
        setMode('enterPhone');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtp(Array(6).fill(''));
        setError('');
        setSuccessMessage('');
    };

    // Handle phone submission (check if user exists)
    const handlePhoneSubmit = async () => {
        if (!selectedCountry.pattern.test(localPhone)) {
            setError(`الرجاء إدخال رقم هاتف صحيح (${selectedCountry.length} أرقام)`);
            return;
        }

        setError('');
        setSuccessMessage('');

        try {
            const result = await checkPhone.mutateAsync(fullPhone);

            if (result.exists) {
                // Existing user - show password login
                setMode('loginWithPassword');
            } else {
                // New user - send OTP
                await sendOtp.mutateAsync(fullPhone);
                setSuccessMessage('تم إرسال رمز التحقق عبر واتساب');
                setMode('verifyNewUser');
            }
        } catch (err: any) {
            setError('حدث خطأ. يرجى المحاولة مرة أخرى.');
        }
    };

    // Handle password login
    const handlePasswordLogin = async () => {
        setError('');

        try {
            await login.mutateAsync({ phone: fullPhone, password });

            if (rememberMe) {
                await AsyncStorage.setItem('savedUserPhone', fullPhone);
            } else {
                await AsyncStorage.removeItem('savedUserPhone');
            }
        } catch (err: any) {
            // Extract error message from various possible locations
            const errorMessage =
                err.response?.data?.error ||
                err.response?.data?.message ||
                err.message ||
                'كلمة المرور غير صحيحة';
            setError(errorMessage);
        }
    };

    // Handle forgot password
    const handleForgotPassword = async () => {
        setError('');

        try {
            await sendOtp.mutateAsync(fullPhone);
            setSuccessMessage('تم إرسال رمز التحقق عبر واتساب');
            setMode('forgotPasswordVerify');
        } catch (err: any) {
            setError('فشل إرسال رمز التحقق');
        }
    };

    // Handle OTP verification for forgot password
    const handleForgotPasswordVerify = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }

        setError('');

        try {
            await verifyOtp.mutateAsync({ phone: fullPhone, otp: code });
            setSuccessMessage('تم التحقق بنجاح!');
            setMode('resetPassword');
        } catch (err: any) {
            setError('رمز التحقق غير صحيح');
        }
    };

    // Handle new user verification and registration
    const handleVerifyAndRegister = async () => {
        const code = otp.join('');
        if (code.length !== 6) {
            setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }

        if (newPassword.length < 6) {
            setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل');
            return;
        }

        setError('');

        try {
            await verifyOtp.mutateAsync({ phone: fullPhone, otp: code });
            await registerCustomer.mutateAsync({ phone: fullPhone, password: newPassword });

            if (rememberMe) {
                await AsyncStorage.setItem('savedUserPhone', fullPhone);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل التسجيل');
        }
    };

    // Handle password reset
    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('كلمات المرور غير متطابقة');
            return;
        }

        setError('');

        try {
            await resetPassword.mutateAsync({ phone: fullPhone, password: newPassword });
            // Auto-login after password reset
            await login.mutateAsync({ phone: fullPhone, password: newPassword });

            if (rememberMe) {
                await AsyncStorage.setItem('savedUserPhone', fullPhone);
            }
        } catch (err: any) {
            setError('فشل تحديث كلمة المرور');
        }
    };

    const isLoading =
        login.isPending ||
        checkPhone.isPending ||
        sendOtp.isPending ||
        verifyOtp.isPending ||
        resetPassword.isPending ||
        registerCustomer.isPending;

    // Render phone entry mode
    const renderPhoneEntry = () => (
        <View style={styles.formContainer}>
            <Text style={styles.label}>رقم الهاتف</Text>

            <View style={styles.phoneInputRow}>
                {/* Country Code Selector */}
                <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(!showCountryPicker)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={18} color="#007AFF" />
                </TouchableOpacity>

                {/* Phone Input */}
                <Input
                    value={localPhone}
                    onChangeText={(text) => setLocalPhone(text.replace(/\D/g, ''))}
                    placeholder={selectedCountry.placeholder}
                    keyboardType="phone-pad"
                    maxLength={selectedCountry.length}
                    containerStyle={styles.phoneInput}
                />
            </View>

            {/* Country Picker Dropdown */}
            {showCountryPicker && (
                <ScrollView style={styles.countryPicker} nestedScrollEnabled>
                    {COUNTRY_CODES.map((country) => (
                        <TouchableOpacity
                            key={country.code}
                            style={styles.countryOption}
                            onPress={() => {
                                setCountryCode(country.code);
                                setShowCountryPicker(false);
                            }}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.countryFlag}>{country.flag}</Text>
                            <View style={styles.countryInfo}>
                                <Text style={styles.countryName}>{country.name}</Text>
                                <Text style={styles.countryCodeSmall}>{country.code}</Text>
                            </View>
                            {countryCode === country.code && (
                                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            <Button
                title={isLoading ? 'جاري التحقق...' : 'متابعة'}
                onPress={handlePhoneSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
            />

            {/* Registration Links */}
            <View style={styles.registrationLinks}>
                <Text style={styles.orText}>أو سجل كـ</Text>

                <View style={styles.registrationButtonsRow}>
                    <TouchableOpacity
                        style={[styles.registrationChip, { borderColor: '#3B82F6' }]}
                        onPress={onRegisterTechnician}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="construct" size={16} color="#3B82F6" />
                        <Text style={[styles.registrationChipText, { color: '#3B82F6' }]}>فني</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registrationChip, { borderColor: '#F59E0B' }]}
                        onPress={onRegisterTowTruck}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="car" size={16} color="#F59E0B" />
                        <Text style={[styles.registrationChipText, { color: '#F59E0B' }]}>سطحة</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registrationChip, { borderColor: '#10B981' }]}
                        onPress={onRegisterCarProvider}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="storefront" size={16} color="#10B981" />
                        <Text style={[styles.registrationChipText, { color: '#10B981' }]}>معرض</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    // Render password login mode
    const renderPasswordLogin = () => (
        <View style={styles.formContainer}>
            <View style={styles.phoneDisplay}>
                <Text style={styles.welcomeText}>أهلاً بك!</Text>
                <Text style={styles.phoneNumber}>{fullPhone}</Text>
                <Text style={styles.subtitle}>الرجاء إدخال كلمة المرور للمتابعة</Text>
            </View>

            <Input
                label="كلمة المرور"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="أدخل كلمة المرور"
                rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                    </TouchableOpacity>
                }
            />

            <View style={styles.optionsRow}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setRememberMe(!rememberMe)}
                >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                        {rememberMe && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </View>
                    <Text style={styles.checkboxLabel}>تذكرني</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>نسيت كلمة المرور؟</Text>
                </TouchableOpacity>
            </View>

            <Button
                title={isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                onPress={handlePasswordLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
            />

            <Button
                title="تغيير الرقم"
                onPress={resetToPhoneInput}
                variant="outline"
                style={styles.secondaryButton}
            />
        </View>
    );

    // Render OTP verification for new user
    const renderVerifyNewUser = () => (
        <View style={styles.formContainer}>
            {successMessage ? (
                <View style={styles.successBanner}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.successText}>{successMessage}</Text>
                </View>
            ) : null}

            <Text style={styles.otpTitle}>تحقق من رقم الهاتف</Text>
            <Text style={styles.otpSubtitle}>الرجاء إدخال الرمز المرسل إلى</Text>
            <Text style={styles.phoneNumber}>{fullPhone}</Text>

            <View style={styles.otpContainer}>
                <Text style={styles.label}>رمز التحقق (6 أرقام)</Text>
                <OtpInput value={otp} onChange={setOtp} />
            </View>

            <Input
                label="كلمة مرور جديدة"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="6 أحرف على الأقل"
                rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                    </TouchableOpacity>
                }
            />

            <Button
                title={isLoading ? 'جاري التسجيل...' : 'تسجيل وإنشاء حساب'}
                onPress={handleVerifyAndRegister}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
            />

            <Button
                title="تغيير الرقم"
                onPress={resetToPhoneInput}
                variant="outline"
                style={styles.secondaryButton}
            />
        </View>
    );

    // Render OTP verification for forgot password
    const renderForgotPasswordVerify = () => (
        <View style={styles.formContainer}>
            <Text style={styles.otpTitle}>تحقق من رقم الهاتف</Text>
            <Text style={styles.otpSubtitle}>تم إرسال رمز التحقق عبر واتساب إلى</Text>
            <Text style={styles.phoneNumber}>{fullPhone}</Text>

            <View style={styles.otpContainer}>
                <Text style={styles.label}>رمز التحقق (6 أرقام)</Text>
                <OtpInput value={otp} onChange={setOtp} />
            </View>

            <Button
                title={isLoading ? 'جاري التحقق...' : 'تحقق ومتابعة'}
                onPress={handleForgotPasswordVerify}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
            />

            <Button
                title="العودة"
                onPress={resetToPhoneInput}
                variant="outline"
                style={styles.secondaryButton}
            />
        </View>
    );

    // Render reset password mode
    const renderResetPassword = () => (
        <View style={styles.formContainer}>
            <Text style={styles.subtitle}>الرجاء إدخال كلمة المرور الجديدة</Text>

            <Input
                label="كلمة المرور الجديدة"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="6 أحرف على الأقل"
                rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                    </TouchableOpacity>
                }
            />

            <Input
                label="تأكيد كلمة المرور"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholder="أعد كتابة كلمة المرور"
            />

            <Button
                title={isLoading ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
                onPress={handleResetPassword}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
            />

            <Button
                title="العودة"
                onPress={resetToPhoneInput}
                variant="outline"
                style={styles.secondaryButton}
            />
        </View>
    );

    const getModeTitle = () => {
        switch (mode) {
            case 'verifyNewUser':
                return 'تأكيد الحساب الجديد';
            case 'resetPassword':
                return 'إعادة تعيين كلمة المرور';
            default:
                return 'تسجيل الدخول';
        }
    };

    return (
        <LinearGradient
            colors={['#EBF4FF', '#FFFFFF', '#F9FAFB']}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>رامووس</Text>
                        <Text style={styles.modeTitle}>{getModeTitle()}</Text>
                    </View>

                    {/* Form Card */}
                    <Card style={styles.formCard}>
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {mode === 'enterPhone' && renderPhoneEntry()}
                        {mode === 'loginWithPassword' && renderPasswordLogin()}
                        {mode === 'verifyNewUser' && renderVerifyNewUser()}
                        {mode === 'forgotPasswordVerify' && renderForgotPasswordVerify()}
                        {mode === 'resetPassword' && renderResetPassword()}
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 8px 16px rgba(0, 122, 255, 0.15)',
            },
            default: {
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
            },
        }),
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    modeTitle: {
        fontSize: 18,
        color: '#64748B',
        fontWeight: '600',
    },
    formCard: {
        marginBottom: 24,
        padding: 20,
        ...Platform.select({
            web: {
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            },
        }),
    },
    formContainer: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    phoneInputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    countrySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#FFF',
        minWidth: 100,
    },
    countryFlag: {
        fontSize: 24,
    },
    countryCode: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    phoneInput: {
        flex: 1,
        marginBottom: 0,
    },
    countryPicker: {
        marginTop: -8,
        marginBottom: 16,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        maxHeight: 200,
    },
    countryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    countryCodeSmall: {
        fontSize: 12,
        color: '#666',
    },
    phoneDisplay: {
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007AFF',
        marginVertical: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 16,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#DDD',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#333',
    },
    forgotPassword: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    otpTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 8,
    },
    otpSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    otpContainer: {
        marginVertical: 24,
    },
    registrationLinks: {
        marginTop: 24,
        gap: 12,
    },
    orText: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    registrationButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    registrationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        backgroundColor: '#FFFFFF',
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            },
        }),
    },
    registrationChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    primaryButton: {
        marginTop: 16,
    },
    secondaryButton: {
        marginTop: 8,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorText: {
        flex: 1,
        fontSize: 14,
        color: '#dc2626',
        fontWeight: '500',
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#DCFCE7',
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    successText: {
        flex: 1,
        fontSize: 14,
        color: '#16a34a',
        fontWeight: '500',
    },
});
