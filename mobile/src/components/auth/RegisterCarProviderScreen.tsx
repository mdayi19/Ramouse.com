import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Button, Card, MediaUpload } from '../shared';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRY_CODES } from '@/constants/countries';
import { SYRIAN_CITIES } from '@/constants/cities';
import { useRegisterCarProvider } from '@/hooks';

type RegistrationStep = 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_STEPS = 6;

interface RegisterCarProviderScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

export const RegisterCarProviderScreen: React.FC<RegisterCarProviderScreenProps> = ({
    onBack,
    onSuccess,
}) => {
    const [currentStep, setCurrentStep] = useState<RegistrationStep>(1);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [countryCode, setCountryCode] = useState('+963');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [profilePhotos, setProfilePhotos] = useState<string[]>([]);
    const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        phone: '',
        password: '',
        confirmPassword: '',
        business_name: '',
        business_type: 'dealership' as 'dealership' | 'individual' | 'rental_agency',
        business_license: '',
        email: '',
        city: 'دمشق',
        address: '',
        description: '',
        socials: { facebook: '', instagram: '', whatsapp: '' },
    });

    const selectedCountry = useMemo(
        () => COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0],
        [countryCode]
    );

    const registerCarProvider = useRegisterCarProvider();

    const validatePhoneNumber = (code: string, number: string): boolean => {
        const country = COUNTRY_CODES.find(c => c.code === code);
        if (!country) return false;
        return country.pattern.test(number);
    };

    const handlePhoneChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        setPhoneNumber(cleaned);

        const fullPhone = countryCode + cleaned;
        const whatsappNumber = countryCode.replace('+', '') + cleaned;

        setFormData(p => ({
            ...p,
            phone: fullPhone,
            socials: { ...p.socials, whatsapp: whatsappNumber }
        }));

        if (cleaned.length > 0) {
            if (validatePhoneNumber(countryCode, cleaned)) {
                setPhoneError('');
            } else {
                const country = COUNTRY_CODES.find(c => c.code === countryCode);
                setPhoneError(`الرقم غير صحيح لـ ${country?.name}`);
            }
        } else {
            setPhoneError('');
        }
    };

    const handleCountryCodeChange = (code: string) => {
        setCountryCode(code);
        const fullPhone = code + phoneNumber;
        const whatsappNumber = code.replace('+', '') + phoneNumber;

        setFormData(p => ({
            ...p,
            phone: fullPhone,
            socials: { ...p.socials, whatsapp: whatsappNumber }
        }));
        setShowCountryPicker(false);

        if (phoneNumber.length > 0) {
            if (!validatePhoneNumber(code, phoneNumber)) {
                const country = COUNTRY_CODES.find(c => c.code === code);
                setPhoneError(`الرقم غير صحيح لـ ${country?.name}`);
            } else {
                setPhoneError('');
            }
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = () => {
        setErrors({});
        setIsLoading(true);

        if (currentStep === 1) {
            if (!phoneNumber) {
                setErrors({ phone: 'يرجى إدخال رقم الهاتف.' });
                setIsLoading(false);
                return false;
            }
            if (!validatePhoneNumber(countryCode, phoneNumber)) {
                setErrors({ phone: 'رقم الهاتف غير صحيح.' });
                setIsLoading(false);
                return false;
            }

            if (!formData.password || formData.password.length < 6) {
                setErrors({ password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.' });
                setIsLoading(false);
                return false;
            }

            if (formData.password !== formData.confirmPassword) {
                setErrors({ confirmPassword: 'كلمات المرور غير متطابقة.' });
                setIsLoading(false);
                return false;
            }
        }

        if (currentStep === 2) {
            if (!formData.business_name) {
                setErrors({ business_name: 'يرجى إدخال اسم العمل.' });
                setIsLoading(false);
                return false;
            }
        }

        if (currentStep === 3) {
            if (!formData.city || !formData.address) {
                setErrors({ address: 'يرجى إدخال المدينة والعنوان.' });
                setIsLoading(false);
                return false;
            }
        }

        if (currentStep === 6) {
            if (!acceptedTerms) {
                setErrors({ terms: 'يرجى الموافقة على الشروط والأحكام.' });
                setIsLoading(false);
                return false;
            }
        }

        setCurrentStep(prev => (prev + 1) as RegistrationStep);
        setIsLoading(false);
        return true;
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1) as RegistrationStep);

    const handleSubmit = async () => {
        setIsLoading(true);
        setErrors({});

        try {
            // Create FormData for multipart upload
            const data = new FormData();

            // Append required fields
            data.append('phone', formData.phone);
            data.append('password', formData.password);
            data.append('business_name', formData.business_name);
            data.append('business_type', formData.business_type);
            data.append('city', formData.city);
            data.append('address', formData.address);

            // Append optional fields
            if (formData.business_license) data.append('business_license', formData.business_license);
            if (formData.email) data.append('email', formData.email);
            if (formData.description) data.append('description', formData.description);

            // Append socials
            if (formData.socials.facebook) data.append('socials[facebook]', formData.socials.facebook);
            if (formData.socials.instagram) data.append('socials[instagram]', formData.socials.instagram);
            if (formData.socials.whatsapp) data.append('socials[whatsapp]', formData.socials.whatsapp);

            // Handle file uploads differently for web vs native
            if (Platform.OS === 'web') {
                // On web, convert blob URL to File object
                if (profilePhotos.length > 0) {
                    try {
                        const uri = profilePhotos[0];
                        const response = await fetch(uri);
                        const blob = await response.blob();
                        const filename = uri.split('/').pop() || 'profile.jpg';
                        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                        data.append('profile_photo', file);
                    } catch (error) {
                        console.warn('Failed to upload profile photo:', error);
                    }
                }

                if (galleryPhotos.length > 0) {
                    for (let i = 0; i < galleryPhotos.length; i++) {
                        try {
                            const uri = galleryPhotos[i];
                            const response = await fetch(uri);
                            const blob = await response.blob();
                            const filename = uri.split('/').pop() || `gallery-${i}.jpg`;
                            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                            data.append('gallery', file);
                        } catch (error) {
                            console.warn(`Failed to upload gallery photo ${i}:`, error);
                        }
                    }
                }
            } else {
                // On native, append as {uri, name, type}
                if (profilePhotos.length > 0) {
                    const uri = profilePhotos[0];
                    const filename = uri.split('/').pop() || 'profile.jpg';
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : 'image/jpeg';

                    data.append('profile_photo', {
                        uri,
                        name: filename,
                        type,
                    } as any);
                }

                if (galleryPhotos.length > 0) {
                    galleryPhotos.forEach((uri, index) => {
                        const filename = uri.split('/').pop() || `gallery-${index}.jpg`;
                        const match = /\.(\w+)$/.exec(filename);
                        const type = match ? `image/${match[1]}` : 'image/jpeg';

                        data.append('gallery', {
                            uri,
                            name: filename,
                            type,
                        } as any);
                    });
                }
            }

            await registerCarProvider.mutateAsync(data as any);

            // Show success screen instead of auto-login
            setRegistrationSuccess(true);
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل التسجيل' });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1: Account
    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="person-circle-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>معلومات الحساب</Text>
                <Text style={styles.stepSubtitle}>أنشئ حسابك الجديد للبدء</Text>
            </View>

            <Text style={styles.label}>رقم الهاتف <Text style={styles.required}>*</Text></Text>
            <View style={styles.phoneInputRow}>
                <TouchableOpacity
                    style={styles.countrySelector}
                    onPress={() => setShowCountryPicker(!showCountryPicker)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Ionicons name="chevron-down" size={18} color="#007AFF" />
                </TouchableOpacity>

                <Input
                    placeholder={selectedCountry.placeholder}
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    error={errors.phone || phoneError}
                    keyboardType="phone-pad"
                    maxLength={selectedCountry.length}
                    containerStyle={styles.phoneInput}
                />
            </View>

            {showCountryPicker && (
                <ScrollView style={styles.countryPicker} nestedScrollEnabled>
                    {COUNTRY_CODES.map((country) => (
                        <TouchableOpacity
                            key={country.code}
                            style={styles.countryOption}
                            onPress={() => handleCountryCodeChange(country.code)}
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

            <Input
                label={<>كلمة المرور <Text style={styles.required}>*</Text></>}
                placeholder="••••••••"
                value={formData.password}
                onChangeText={(text) => updateField('password', text)}
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
                label={<>تأكيد كلمة المرور <Text style={styles.required}>*</Text></>}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChangeText={(text) => updateField('confirmPassword', text)}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                rightElement={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#666" />
                    </TouchableOpacity>
                }
            />
        </View>
    );

    // Step 2: Business Info
    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="business-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>معلومات العمل</Text>
                <Text style={styles.stepSubtitle}>تفاصيل المعرض والنشاط التجاري</Text>
            </View>

            <Input
                label={<>اسم العمل (المعرض) <Text style={styles.required}>*</Text></>}
                placeholder="مثال: معرض الشام للسيارات"
                value={formData.business_name}
                onChangeText={(text) => updateField('business_name', text)}
                error={errors.business_name}
            />

            <Text style={styles.label}>نوع العمل <Text style={styles.required}>*</Text></Text>
            <View style={styles.businessTypeRow}>
                {[
                    { value: 'dealership' as const, label: 'معرض', icon: 'car-sport-outline' },
                    { value: 'individual' as const, label: 'فردي', icon: 'person-outline' },
                    { value: 'rental_agency' as const, label: 'تأجير', icon: 'key-outline' }
                ].map(type => (
                    <TouchableOpacity
                        key={type.value}
                        onPress={() => updateField('business_type', type.value)}
                        style={[
                            styles.businessTypeButton,
                            formData.business_type === type.value && styles.businessTypeButtonActive
                        ]}
                    >
                        <Ionicons
                            name={type.icon as any}
                            size={24}
                            color={formData.business_type === type.value ? '#007AFF' : '#666'}
                        />
                        <Text style={[
                            styles.businessTypeLabel,
                            formData.business_type === type.value && styles.businessTypeLabelActive
                        ]}>{type.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Input
                label="رقم الترخيص (اختياري)"
                placeholder="رقم السجل التجاري"
                value={formData.business_license}
                onChangeText={(text) => updateField('business_license', text)}
            />

            <Input
                label="البريد الإلكتروني (اختياري)"
                placeholder="example@domain.com"
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
            />
        </View>
    );

    // Step 3: Location
    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="location-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>الموقع والتفاصيل</Text>
                <Text style={styles.stepSubtitle}>أين يقع المعرض؟</Text>
            </View>

            <Text style={styles.label}>المدينة <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
                onPress={() => setShowCityPicker(true)}
                style={styles.cityPickerButton}
                activeOpacity={0.7}
            >
                <Text style={styles.cityPickerText}>{formData.city}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {/* City Picker Modal */}
            <Modal visible={showCityPicker} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>اختر المدينة</Text>
                            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.cityList}>
                            {SYRIAN_CITIES.map((city) => (
                                <TouchableOpacity
                                    key={city}
                                    style={styles.cityOption}
                                    onPress={() => {
                                        updateField('city', city);
                                        setShowCityPicker(false);
                                    }}
                                    activeOpacity={0.6}
                                >
                                    <Text style={styles.cityOptionText}>{city}</Text>
                                    {formData.city === city && (
                                        <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Input
                label={<>العنوان بالتفصيل <Text style={styles.required}>*</Text></>}
                placeholder="مثال: دمشق - المزة - جانب..."
                value={formData.address}
                onChangeText={(text) => updateField('address', text)}
                error={errors.address}
                multiline
                numberOfLines={2}
            />

            <Input
                label="نبذة تعريفية (اختياري)"
                placeholder="اكتب نبذة عن المعرض..."
                value={formData.description}
                onChangeText={(text) => updateField('description', text)}
                multiline
                numberOfLines={3}
                style={styles.textArea}
            />
        </View>
    );

    // Step 4: Socials
    const renderStep4 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="share-social-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>روابط التواصل</Text>
                <Text style={styles.stepSubtitle}>سهل الوصول إليك عبر السوشيال ميديا</Text>
            </View>

            <Input
                label={
                    <View style={styles.socialLabel}>
                        <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                        <Text> فيسبوك (اختياري)</Text>
                    </View>
                }
                placeholder="https://facebook.com/..."
                value={formData.socials.facebook}
                onChangeText={(text) => setFormData(p => ({ ...p, socials: { ...p.socials, facebook: text } }))}
                autoCapitalize="none"
            />

            <Input
                label={
                    <View style={styles.socialLabel}>
                        <Ionicons name="logo-instagram" size={16} color="#E4405F" />
                        <Text> انستغرام (اختياري)</Text>
                    </View>
                }
                placeholder="username"
                value={formData.socials.instagram}
                onChangeText={(text) => setFormData(p => ({ ...p, socials: { ...p.socials, instagram: text } }))}
                autoCapitalize="none"
            />

            <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                    رقم الواتساب سيكون نفس رقم هاتفك المسجل ({formData.phone}).
                </Text>
            </View>
        </View>
    );

    // Step 5: Media
    const renderStep5 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="camera-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>الصور والوسائط</Text>
                <Text style={styles.stepSubtitle}>أضف شعار المعرض وصور للمعرض</Text>
            </View>

            <View style={styles.mediaSection}>
                <Text style={styles.mediaLabel}>شعار المعرض (صورة البروفايل)</Text>
                <Text style={styles.mediaHint}>اختياري - يمكنك إضافة صورة واحدة</Text>
                <MediaUpload maxFiles={1} files={profilePhotos} setFiles={setProfilePhotos} />
            </View>

            <View style={styles.mediaSection}>
                <Text style={styles.mediaLabel}>صور المعرض</Text>
                <Text style={styles.mediaHint}>اختياري - يمكنك إضافة حتى 5 صور</Text>
                <MediaUpload maxFiles={5} files={galleryPhotos} setFiles={setGalleryPhotos} />
            </View>
        </View>
    );

    // Step 6: Review
    const renderStep6 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#007AFF" />
                <Text style={styles.stepTitle}>المراجعة النهائية</Text>
                <Text style={styles.stepSubtitle}>تأكد من صحة بياناتك</Text>
            </View>

            <View style={styles.reviewBox}>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>اسم العمل:</Text>
                    <Text style={styles.reviewValue}>{formData.business_name}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>نوع العمل:</Text>
                    <Text style={styles.reviewValue}>{formData.business_type}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>رقم الهاتف:</Text>
                    <Text style={styles.reviewValue}>{formData.phone}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>المدينة:</Text>
                    <Text style={styles.reviewValue}>{formData.city}</Text>
                </View>
                <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>العنوان:</Text>
                    <Text style={styles.reviewValue}>{formData.address}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.termsContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.7}
            >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms && <Ionicons name="checkmark" size={18} color="#FFF" />}
                </View>
                <View style={styles.termsTextContainer}>
                    <Text style={styles.termsTitle}>أوافق على الشروط والأحكام</Text>
                    <Text style={styles.termsSubtitle}>
                        أتعهد بأن جميع البيانات المدخلة صحيحة وأتحمل المسؤولية القانونية عنها.
                    </Text>
                </View>
            </TouchableOpacity>

            {errors.terms && (
                <Text style={styles.errorText}>{errors.terms}</Text>
            )}
        </View>
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
                            <Ionicons name="business" size={56} color="#007AFF" />
                        </View>
                        <Text style={styles.title}>رامووس</Text>
                        <Text style={styles.subtitle}>تسجيل معرض سيارات</Text>
                    </View>

                    {/* Show Success Screen or Registration Form */}
                    {registrationSuccess ? (
                        <Card style={styles.successCard}>
                            <View style={styles.successContent}>
                                <View style={styles.successIconContainer}>
                                    <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                                </View>

                                <Text style={styles.successTitle}>تم التسجيل بنجاح!</Text>
                                <Text style={styles.successMessage}>
                                    شكراً لتسجيلك في رامووس
                                </Text>

                                <View style={styles.approvalNotice}>
                                    <Ionicons name="time-outline" size={24} color="#F59E0B" />
                                    <Text style={styles.approvalTitle}>في انتظار الموافقة</Text>
                                </View>

                                <Text style={styles.approvalText}>
                                    سيقوم فريقنا بمراجعة طلبك والموافقة عليه في أقرب وقت ممكن. سنتواصل معك عبر رقم الهاتف المسجل.
                                </Text>

                                <View style={styles.approvalInfoBox}>
                                    <Ionicons name="information-circle" size={20} color="#007AFF" />
                                    <Text style={styles.approvalInfoText}>
                                        عادةً ما تستغرق عملية المراجعة من 24 إلى 48 ساعة
                                    </Text>
                                </View>

                                <Button
                                    title="العودة لتسجيل الدخول"
                                    onPress={onBack}
                                    style={styles.backToLoginButton}
                                />
                            </View>
                        </Card>
                    ) : (
                        <>
                            {/* Progress Header */}
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressText}>الخطوة {currentStep} من {TOTAL_STEPS}</Text>
                                <View style={styles.progressBarContainer}>
                                    <View style={[styles.progressBar, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
                                </View>
                            </View>

                            {/* Form Card */}
                            <Card style={styles.formCard}>
                                {errors.general && (
                                    <Text style={styles.errorTextGeneral}>{errors.general}</Text>
                                )}

                                {currentStep === 1 && renderStep1()}
                                {currentStep === 2 && renderStep2()}
                                {currentStep === 3 && renderStep3()}
                                {currentStep === 4 && renderStep4()}
                                {currentStep === 5 && renderStep5()}
                                {currentStep === 6 && renderStep6()}

                                {/* Navigation Buttons */}
                                <View style={styles.navigationButtons}>
                                    <Button
                                        title={currentStep === 1 ? 'إلغاء' : 'السابق'}
                                        onPress={currentStep === 1 ? onBack : prevStep}
                                        style={styles.backButton}
                                    />

                                    {currentStep < TOTAL_STEPS ? (
                                        <Button
                                            title={isLoading ? 'جاري التحقق...' : 'التالي'}
                                            onPress={validateStep}
                                            loading={isLoading}
                                            disabled={isLoading}
                                            style={styles.nextButton}
                                        />
                                    ) : (
                                        <Button
                                            title={isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                                            onPress={handleSubmit}
                                            loading={isLoading || registerCarProvider.isPending}
                                            disabled={isLoading || !acceptedTerms || registerCarProvider.isPending}
                                            style={styles.submitButton}
                                        />
                                    )}
                                </View>
                            </Card>

                            {/* Progress Dots */}
                            <View style={styles.progressContainer}>
                                {[1, 2, 3, 4, 5, 6].map(step => (
                                    <View
                                        key={step}
                                        style={[
                                            styles.progressDot,
                                            currentStep >= step && styles.progressDotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </>
                    )}
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
    progressHeader: {
        marginBottom: 20,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 4,
    },
    formCard: {
        marginBottom: 24,
    },
    stepContainer: {
        width: '100%',
    },
    stepHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 12,
        textAlign: 'center',
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    required: {
        color: '#FF3B30',
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
    countryCodeText: {
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
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    // Business Type Styles
    businessTypeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    businessTypeButton: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderWidth: 2,
        borderColor: '#DDD',
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF',
    },
    businessTypeButtonActive: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F7FF',
    },
    businessTypeLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    businessTypeLabelActive: {
        color: '#007AFF',
    },
    // Social Labels
    socialLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    // Info Box
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#F0F7FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D0E7FF',
        marginTop: 16,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#007AFF',
        lineHeight: 18,
    },
    // Media Step
    placeholderText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 40,
    },
    // Review Step
    reviewBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    reviewRow: {
        marginBottom: 12,
    },
    reviewLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    reviewValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    // Terms
    termsContainer: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginTop: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#DDD',
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    termsTextContainer: {
        flex: 1,
    },
    termsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    termsSubtitle: {
        fontSize: 12,
        color: '#666',
        lineHeight: 16,
    },
    // Navigation Buttons
    navigationButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    backButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    nextButton: {
        flex: 2,
    },
    submitButton: {
        flex: 2,
        backgroundColor: '#10B981',
    },
    // Error Messages
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 8,
        textAlign: 'center',
    },
    errorTextGeneral: {
        fontSize: 13,
        color: '#FF3B30',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        textAlign: 'center',
    },
    // Progress Dots
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
    // Legacy styles (can be removed if not used elsewhere)
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
    // City Picker Styles
    cityPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#FFF',
        marginBottom: 16,
    },
    cityPickerText: {
        fontSize: 16,
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    cityList: {
        maxHeight: 400,
    },
    cityOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    cityOptionText: {
        fontSize: 16,
        color: '#333',
    },
    // Media Upload Styles
    mediaSection: {
        marginBottom: 24,
    },
    mediaLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    mediaHint: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    // Success Screen Styles
    successCard: {
        padding: 24,
        alignItems: 'center',
    },
    successContent: {
        alignItems: 'center',
        width: '100%',
    },
    successIconContainer: {
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    approvalNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FEF3C7',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 16,
        width: '100%',
    },
    approvalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#92400E',
    },
    approvalText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 20,
    },
    approvalInfoBox: {
        flexDirection: 'row',
        gap: 8,
        padding: 16,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        marginBottom: 32,
        width: '100%',
    },
    approvalInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#007AFF',
        lineHeight: 18,
    },
    backToLoginButton: {
        width: '100%',
    },
});
