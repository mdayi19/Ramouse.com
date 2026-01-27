import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Button, Card, OtpInput } from '../shared';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRY_CODES } from '@/constants/countries';
import { useSendOtp, useVerifyOtp, useRegisterTechnician } from '@/hooks';

type RegistrationStep = 'phone' | 'otp' | 'details';

const SPECIALTIES = [
    'ميكانيكا عامة',
    'كهرباء',
    'تكييف',
    'فرامل',
    'تعليق',
    'محركات',
    'جير',
    'دهان',
    'تنجيد',
];

interface RegisterTechnicianScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

export const RegisterTechnicianScreen: React.FC<RegisterTechnicianScreenProps> = ({
    onBack,
    onSuccess,
}) => {
    const [step, setStep] = useState<RegistrationStep>('phone');
    const [countryCode, setCountryCode] = useState('+966');
    const [localPhone, setLocalPhone] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
    const [name, setName] = useState('');
    const [city, setCity] = useState('');
    const [specialties, setSpecialties] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const fullPhone = useMemo(() => countryCode + localPhone, [countryCode, localPhone]);
    const selectedCountry = useMemo(
        () => COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0],
        [countryCode]
    );

    const sendOtp = useSendOtp();
    const verifyOtp = useVerifyOtp();
    const registerTechnician = useRegisterTechnician();

    // Toggle specialty selection
    const toggleSpecialty = (specialty: string) => {
        if (specialties.includes(specialty)) {
            setSpecialties(specialties.filter((s) => s !== specialty));
        } else {
            setSpecialties([...specialties, specialty]);
        }
        setErrors((prev) => ({ ...prev, specialties: undefined }));
    };

    // Validation Functions
    const validatePhone = () => {
        const newErrors: Record<string, string> = {};

        if (!localPhone.trim()) {
            newErrors.phone = 'رقم الجوال مطلوب';
        } else if (!selectedCountry.pattern.test(localPhone)) {
            newErrors.phone = `الرقم غير صحيح لـ ${selectedCountry.name} (${selectedCountry.length} أرقام)`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateOtp = () => {
        const newErrors: Record<string, string> = {};
        const otpCode = otp.join('');

        if (!otpCode.trim()) {
            newErrors.otp = 'رمز التحقق مطلوب';
        } else if (otpCode.length !== 6) {
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

        if (!city.trim()) {
            newErrors.city = 'المدينة مطلوبة';
        }

        if (specialties.length === 0) {
            newErrors.specialties = 'يرجى اختيار تخصص واحد على الأقل';
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
            await sendOtp.mutateAsync(fullPhone);
            setStep('otp');
        } catch (error: any) {
            setErrors({ phone: error.response?.data?.message || 'فشل إرسال رمز التحقق' });
        }
    };

    const handleVerifyOtp = async () => {
        if (!validateOtp()) return;
        const otpCode = otp.join('');

        try {
            await verifyOtp.mutateAsync({ phone: fullPhone, otp: otpCode });
            setStep('details');
        } catch (error: any) {
            setErrors({ otp: error.response?.data?.message || 'رمز التحقق غير صحيح' });
        }
    };

    const handleRegister = async () => {
        if (!validateDetails()) return;

        try {
            await registerTechnician.mutateAsync({
                phone: fullPhone,
                password,
                name,
                city,
                specialties,
                description: description || undefined,
            });
            onSuccess?.();
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل التسجيل' });
        }
    };

    // Step 1: Phone Entry
    const renderPhoneStep = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>تسجيل فني</Text>
            <Text style={styles.stepSubtitle}>أدخل رقم جوالك للبدء</Text>

            <Text style={styles.label}>رقم الجوال</Text>
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
                    placeholder={selectedCountry.placeholder}
                    value={localPhone}
                    onChangeText={(text: string) => {
                        setLocalPhone(text.replace(/\D/g, ''));
                        setErrors((prev) => ({
                            ...prev, phone: undefined
                        }));
                    }}
                    error={errors.phone}
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
            <Text style={styles.stepSubtitle}>أدخل الرمز المرسل إلى {fullPhone}</Text>

            <View style={styles.otpContainer}>
                <OtpInput value={otp} onChange={setOtp} />
            </View>

            {errors.otp && (
                <Text style={styles.errorText}>{errors.otp}</Text>
            )}

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
        <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>معلومات الفني</Text>
                <Text style={styles.stepSubtitle}>أكمل بياناتك المهنية</Text>

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

                <Input
                    label="المدينة"
                    placeholder="أدخل المدينة"
                    value={city}
                    onChangeText={(text) => {
                        setCity(text);
                        setErrors((prev) => ({ ...prev, city: undefined }));
                    }}
                    error={errors.city}
                    autoCapitalize="words"
                />

                {/* Specialties Selection */}
                <View style={styles.specialtiesSection}>
                    <Text style={styles.sectionLabel}>التخصصات</Text>
                    <Text style={styles.sectionHint}>اختر تخصص واحد أو أكثر</Text>
                    <View style={styles.chipsContainer}>
                        {SPECIALTIES.map((specialty) => (
                            <TouchableOpacity
                                key={specialty}
                                style={[
                                    styles.chip,
                                    specialties.includes(specialty) && styles.chipSelected,
                                ]}
                                onPress={() => toggleSpecialty(specialty)}
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        specialties.includes(specialty) && styles.chipTextSelected,
                                    ]}
                                >
                                    {specialty}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.specialties && (
                        <Text style={styles.errorText}>{errors.specialties}</Text>
                    )}
                </View>

                <Input
                    label="نبذة عنك (اختياري)"
                    placeholder="اكتب وصفاً مختصراً عن خبرتك"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                />

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
                    rightElement={
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                        </TouchableOpacity>
                    }
                />

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
                    loading={registerTechnician.isPending}
                    disabled={registerTechnician.isPending}
                    style={styles.button}
                />
            </View>
        </ScrollView>
    );

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
                        <View style={styles.logoCircle}>
                            <Ionicons name="construct" size={56} color="#007AFF" />
                        </View>
                        <Text style={styles.title}>رامووس</Text>
                        <Text style={styles.subtitle}>تسجيل فني</Text>
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
        marginBottom: 40,
    },
    logoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
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
    otpContainer: {
        marginVertical: 24,
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
    detailsScroll: {
        maxHeight: 500,
    },
    specialtiesSection: {
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    sectionHint: {
        fontSize: 12,
        color: '#666',
        marginBottom: 12,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
    },
    chipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    chipText: {
        fontSize: 14,
        color: '#333',
    },
    chipTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
        marginTop: 4,
        marginBottom: 12,
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
