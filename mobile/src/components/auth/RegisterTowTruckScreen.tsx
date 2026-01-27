import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Input, Button, Card, OtpInput } from '../shared';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRY_CODES } from '@/constants/countries';
import { SYRIAN_CITIES } from '@/constants/cities';
import { useSendOtp, useVerifyOtp, useRegisterTowTruck } from '@/hooks';
import { MediaUpload } from '../shared/MediaUpload';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInRight, FadeOutLeft, Layout, LinearTransition } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const DEFAULT_TOW_TRUCK_TYPES = [
    { id: '1', name: 'سطحة عادية' },
    { id: '2', name: 'سطحة هيدروليك' },
    { id: '3', name: 'سطحة مغلقة' },
    { id: '4', name: 'ونش' },
    { id: '5', name: 'نقل سيارات فارهة' },
];

interface RegisterTowTruckScreenProps {
    onBack: () => void;
    onSuccess?: () => void;
}

const ReviewRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.reviewRow}>
        <Text style={styles.reviewLabel}>{label}:</Text>
        <Text style={styles.reviewValue}>{value}</Text>
    </View>
);

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <View style={styles.headerContainer}>
            <View style={styles.stepCountContainer}>
                <Text style={styles.stepCountText}>الخطوة {currentStep} من {totalSteps}</Text>
            </View>
            <View style={styles.progressBarBg}>
                <Animated.View
                    style={[styles.progressBarFill, { width: `${progress}%` }]}
                    layout={LinearTransition.springify()}
                />
            </View>
        </View>
    );
};

export const RegisterTowTruckScreen: React.FC<RegisterTowTruckScreenProps> = ({
    onBack,
    onSuccess,
}) => {
    const [step, setStep] = useState(1);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const TOTAL_STEPS = 7;

    // Step 1: Phone
    const [countryCode, setCountryCode] = useState('+963');
    const [localPhone, setLocalPhone] = useState('');
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    // Step 2: OTP
    const [otp, setOtp] = useState<string[]>(Array(6).fill(''));

    // Step 3: Account Info
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 4: Professional Details
    const [vehicleType, setVehicleType] = useState(DEFAULT_TOW_TRUCK_TYPES[0].name);
    const [city, setCity] = useState('دمشق');
    const [showCityPicker, setShowCityPicker] = useState(false);
    const [serviceArea, setServiceArea] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Step 5: Media
    const [profilePhoto, setProfilePhoto] = useState<string[]>([]); // max 1
    const [galleryFiles, setGalleryFiles] = useState<string[]>([]); // max 5

    // Step 6: Socials
    const [facebook, setFacebook] = useState('');
    const [instagram, setInstagram] = useState('');

    // Step 7: Review
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    const fullPhone = useMemo(() => countryCode + localPhone, [countryCode, localPhone]);
    const whatsappNumber = useMemo(() => countryCode.replace('+', '') + localPhone, [countryCode, localPhone]);

    const selectedCountry = useMemo(
        () => COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[0],
        [countryCode]
    );

    const sendOtp = useSendOtp();
    const verifyOtp = useVerifyOtp();
    const registerTowTruck = useRegisterTowTruck();

    // Helpers & Actions
    const handleGetLocation = async () => {
        setGettingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('إذن الموقع مطلوب', 'نحتاج إلى إذن للوصول إلى موقعك الحالي');
                setGettingLocation(false);
                return;
            }
            let locationResult = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: locationResult.coords.latitude,
                longitude: locationResult.coords.longitude,
            });
        } catch (error) {
            Alert.alert('خطأ', 'فشل في تحديد الموقع');
        } finally {
            setGettingLocation(false);
        }
    };

    const nextStep = () => {
        setErrors({});
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step < TOTAL_STEPS) setStep(step + 1);
    };

    const prevStep = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (step > 1) setStep(step - 1);
        else onBack();
    };

    const handleNext = async () => {
        setErrors({});
        if (step === 1) {
            if (!localPhone.trim()) return setErrors({ phone: 'رقم الجوال مطلوب' });
            if (!selectedCountry.pattern.test(localPhone)) return setErrors({ phone: `الرقم يجب أن يكون ${selectedCountry.length} أرقام` });
            try {
                await sendOtp.mutateAsync(fullPhone);
                nextStep();
            } catch (error: any) {
                setErrors({ phone: error.response?.data?.message || 'فشل إرسال الرمز' });
            }
        } else if (step === 2) {
            if (otp.join('').length !== 6) return setErrors({ otp: 'رمز التحقق 6 أرقام' });
            try {
                await verifyOtp.mutateAsync({ phone: fullPhone, otp: otp.join('') });
                nextStep();
            } catch (error: any) {
                setErrors({ otp: error.response?.data?.message || 'الرمز غير صحيح' });
            }
        } else if (step === 3) {
            if (!name.trim()) return setErrors({ name: 'الاسم مطلوب' });
            if (password.length < 6) return setErrors({ password: 'كلمة المرور قصيرة' });
            if (password !== confirmPassword) return setErrors({ confirmPassword: 'كلمة المرور غير متطابقة' });
            nextStep();
        } else {
            nextStep();
        }
    };

    const handleSubmit = async () => {
        if (!acceptedTerms) return Alert.alert('تنبيه', 'يجب الموافقة على الشروط والأحكام');

        try {
            const data = new FormData();
            data.append('phone', fullPhone);
            data.append('name', name);
            data.append('password', password);
            data.append('vehicleType', vehicleType);
            data.append('city', city);
            if (serviceArea) data.append('serviceArea', serviceArea);
            if (description) data.append('description', description);
            if (location) {
                data.append('location[latitude]', location.latitude.toString());
                data.append('location[longitude]', location.longitude.toString());
            }
            if (facebook) data.append('socials[facebook]', facebook);
            if (instagram) data.append('socials[instagram]', instagram);
            data.append('socials[whatsapp]', whatsappNumber);

            // Handle Files (Web vs Native)
            if (Platform.OS === 'web') {
                if (profilePhoto.length > 0) {
                    try {
                        const res = await fetch(profilePhoto[0]);
                        const blob = await res.blob();
                        data.append('profile_photo', new File([blob], 'profile.jpg', { type: 'image/jpeg' }));
                    } catch (e) {
                        console.warn('Failed to load profile photo', e);
                    }
                }
                for (let i = 0; i < galleryFiles.length; i++) {
                    try {
                        const res = await fetch(galleryFiles[i]);
                        const blob = await res.blob();
                        data.append('gallery', new File([blob], `gallery-${i}.jpg`, { type: 'image/jpeg' }));
                    } catch (e) {
                        console.warn('Failed to load gallery photo', e);
                    }
                }
            } else {
                if (profilePhoto.length > 0) {
                    const uri = profilePhoto[0];
                    data.append('profile_photo', { uri, name: 'profile.jpg', type: 'image/jpeg' } as any);
                }
                galleryFiles.forEach((uri, i) => {
                    data.append('gallery', { uri, name: `gallery-${i}.jpg`, type: 'image/jpeg' } as any);
                });
            }

            await registerTowTruck.mutateAsync(data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setRegistrationSuccess(true);
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('خطأ', error.response?.data?.message || 'فشل التسجيل');
        }
    };

    const renderTitle = (title: string, subtitle: string) => (
        <View style={{ marginBottom: 24 }}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );

    return (
        <LinearGradient colors={['#F3F4F6', '#FFFFFF', '#F9FAFB']} style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {registrationSuccess ? (
                        <Animated.View entering={FadeInRight} layout={Layout.springify()}>
                            <Card style={styles.successCard}>
                                <View style={styles.successContent}>
                                    <View style={styles.successIconContainer}>
                                        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                                    </View>
                                    <Text style={styles.successTitle}>تم التسجيل بنجاح!</Text>
                                    <Text style={styles.successMessage}>طلبك قيد المراجعة حالياً، سنقوم بإشعارك قريباً.</Text>

                                    <View style={styles.approvalNotice}>
                                        <Ionicons name="time-outline" size={24} color="#F59E0B" />
                                        <Text style={styles.approvalTitle}>في انتظار الموافقة</Text>
                                    </View>

                                    <Text style={styles.approvalText}>سيتم مراجعة الطلب خلال 24-48 ساعة.</Text>
                                    <Button title="العودة" onPress={onBack} style={{ width: '100%', marginTop: 20 }} />
                                </View>
                            </Card>
                        </Animated.View>
                    ) : (
                        <View style={{ flex: 1 }}>
                            <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />

                            <Animated.View
                                key={`step-${step}`} // Key forces re-mount for animation
                                entering={FadeInRight.duration(300)}
                                exiting={FadeOutLeft.duration(300)}
                                style={{ flex: 1 }}
                            >
                                {/* Step 1 */}
                                {step === 1 && (
                                    <>
                                        {renderTitle('أهلاً بك شريكنا', 'سجل شاحنتك وابدأ باستقبال الطلبات')}
                                        <View style={styles.inputGroup}>
                                            <TouchableOpacity style={styles.countrySelect} onPress={() => setShowCountryPicker(!showCountryPicker)}>
                                                <Text style={{ fontSize: 24 }}>{selectedCountry.flag}</Text>
                                                <Ionicons name="chevron-down" size={16} color="#666" />
                                            </TouchableOpacity>
                                            <Input
                                                placeholder="رقم الجوال (بدون 0)"
                                                value={localPhone}
                                                onChangeText={setLocalPhone}
                                                keyboardType="phone-pad"
                                                error={errors.phone}
                                                containerStyle={{ flex: 1, marginBottom: 0 }}
                                                leftElement={<Text style={{ color: '#666', fontWeight: 'bold' }}>{countryCode}</Text>}
                                            />
                                        </View>

                                        {showCountryPicker && (
                                            <View style={styles.pickerContainer}>
                                                {COUNTRY_CODES.map(c => (
                                                    <TouchableOpacity key={c.code} style={styles.pickerItem} onPress={() => { setCountryCode(c.code); setShowCountryPicker(false); }}>
                                                        <Text>{c.flag} {c.name}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                        <Button title="متابعة" onPress={handleNext} loading={sendOtp.isPending} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 2 */}
                                {step === 2 && (
                                    <>
                                        {renderTitle('تأكيد الرقم', `أدخل الرمز المرسل إلى ${fullPhone}`)}
                                        <View style={{ alignItems: 'center', marginBottom: 30 }}>
                                            <OtpInput value={otp} onChange={setOtp} />
                                        </View>
                                        {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
                                        <Button title="تحقق" onPress={handleNext} loading={verifyOtp.isPending} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 3 */}
                                {step === 3 && (
                                    <>
                                        {renderTitle('بيانات الحساب', 'الاسم وكلمة المرور')}
                                        <Card style={styles.formCard}>
                                            <Input label="الاسم الكامل" value={name} onChangeText={setName} error={errors.name} leftElement={<Ionicons name="person-outline" size={20} color="#888" />} />
                                            <Input label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} error={errors.password} leftElement={<Ionicons name="lock-closed-outline" size={20} color="#888" />}
                                                rightElement={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}><Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#888" /></TouchableOpacity>}
                                            />
                                            <Input label="تأكيد كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} error={errors.confirmPassword} leftElement={<Ionicons name="lock-closed-outline" size={20} color="#888" />}
                                                rightElement={<TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}><Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color="#888" /></TouchableOpacity>}
                                            />
                                        </Card>
                                        <Button title="متابعة" onPress={handleNext} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 4 */}
                                {step === 4 && (
                                    <>
                                        {renderTitle('تفاصيل السطحة', 'نوع السطحة ومناطق الخدمة')}

                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                            {DEFAULT_TOW_TRUCK_TYPES.map(t => (
                                                <TouchableOpacity key={t.id} onPress={() => {
                                                    setVehicleType(t.name);
                                                    Haptics.selectionAsync();
                                                }} style={[styles.chip, vehicleType === t.name && styles.chipActive]}>
                                                    <Text style={[styles.chipText, vehicleType === t.name && styles.chipTextActive]}>{t.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>

                                        <TouchableOpacity onPress={() => setShowCityPicker(true)} style={styles.selectBtn}>
                                            <Text style={styles.selectBtnText}>{city}</Text>
                                            <Ionicons name="chevron-down" size={20} color="#666" />
                                        </TouchableOpacity>

                                        <Modal visible={showCityPicker} transparent animationType="slide">
                                            <View style={styles.modalOverlay}>
                                                <View style={styles.modalContent}>
                                                    <View style={styles.modalHeader}>
                                                        <Text style={styles.modalTitle}>اختر المدينة</Text>
                                                        <TouchableOpacity onPress={() => setShowCityPicker(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
                                                    </View>
                                                    <ScrollView>
                                                        {SYRIAN_CITIES.map(c => (
                                                            <TouchableOpacity key={c} style={styles.cityOption} onPress={() => { setCity(c); setShowCityPicker(false); }}>
                                                                <Text style={styles.cityText}>{c}</Text>
                                                                {city === c && <Ionicons name="checkmark" size={20} color="#007AFF" />}
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            </View>
                                        </Modal>

                                        <Input label="منطقة الخدمة" placeholder="مثال: دمشق وريفها، الطريق الدولي" value={serviceArea} onChangeText={setServiceArea} leftElement={<Ionicons name="map-outline" size={20} color="#888" />} />

                                        <TouchableOpacity onPress={handleGetLocation} style={[styles.locationBtn, location && styles.locationBtnActive]}>
                                            <Ionicons name={location ? "navigate" : "navigate-outline"} size={22} color={location ? "#FFF" : "#007AFF"} />
                                            <Text style={[styles.locationBtnText, location && { color: '#FFF' }]}>{location ? 'تم تحديد الموقع' : 'تحديد موقعي الحالي'}</Text>
                                        </TouchableOpacity>

                                        <Input label="نبذة عنك" multiline style={{ height: 80 }} value={description} onChangeText={setDescription} />

                                        <Button title="متابعة" onPress={handleNext} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 5 */}
                                {step === 5 && (
                                    <>
                                        {renderTitle('الصور', 'صورة للمركبة وأعمالك السابقة')}
                                        <Card style={styles.formCard}>
                                            <Text style={styles.label}>صورة السطحة / الملف الشخصي</Text>
                                            <MediaUpload files={profilePhoto} setFiles={setProfilePhoto} maxFiles={1} />

                                            <Text style={[styles.label, { marginTop: 20 }]}>معرض الأعمال (اختياري)</Text>
                                            <MediaUpload files={galleryFiles} setFiles={setGalleryFiles} maxFiles={5} />
                                        </Card>
                                        <Button title="متابعة" onPress={handleNext} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 6 */}
                                {step === 6 && (
                                    <>
                                        {renderTitle('التواصل الاجتماعي', 'دع الزبائن يعرفون المزيد عنك')}
                                        <Card style={styles.formCard}>
                                            <Input label="Facebook" placeholder="رابط..." value={facebook} onChangeText={setFacebook} leftElement={<Ionicons name="logo-facebook" size={20} color="#1877F2" />} />
                                            <Input label="Instagram" placeholder="username" value={instagram} onChangeText={setInstagram} leftElement={<Ionicons name="logo-instagram" size={20} color="#E4405F" />} />
                                            <Input label="WhatsApp" value={whatsappNumber} editable={false} leftElement={<Ionicons name="logo-whatsapp" size={20} color="#25D366" />} />
                                        </Card>
                                        <Button title="متابعة" onPress={handleNext} style={styles.mainBtn} />
                                    </>
                                )}

                                {/* Step 7 */}
                                {step === 7 && (
                                    <>
                                        {renderTitle('مراجعة الطلب', 'تأكد من صحة البيانات')}
                                        <Card style={styles.reviewCard}>
                                            <ReviewRow label="الاسم" value={name} />
                                            <ReviewRow label="الهاتف" value={fullPhone} />
                                            <ReviewRow label="المركبة" value={vehicleType} />
                                            <ReviewRow label="المدينة" value={city} />
                                            <ReviewRow label="الموقع" value={location ? 'محدد' : 'غير محدد'} />
                                        </Card>

                                        <TouchableOpacity style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                                            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
                                                {acceptedTerms && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                            </View>
                                            <Text style={styles.termsText}>أوافق على الشروط والأحكام وسياسة الخصوصية</Text>
                                        </TouchableOpacity>

                                        <Button title="إرسال الطلب" onPress={handleSubmit} loading={registerTowTruck.isPending} style={styles.mainBtn} />
                                    </>
                                )}
                            </Animated.View>

                            <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
                                <Text style={styles.backBtnText}>رجوع</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 50, flexGrow: 1 },
    headerContainer: { marginBottom: 30 },
    stepCountContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
    stepCountText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
    progressBarBg: { height: 6, backgroundColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 10 },

    title: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'right' },
    subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'right', lineHeight: 22 },

    inputGroup: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    countrySelect: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },

    mainBtn: { marginTop: 20, borderRadius: 14, height: 54 },
    backBtn: { alignSelf: 'center', padding: 16, marginTop: 10 },
    backBtnText: { color: '#9CA3AF', fontWeight: '500' },

    formCard: { padding: 20, borderRadius: 16, backgroundColor: '#FFF', marginBottom: 20 },

    chip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FFF', marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    chipActive: { backgroundColor: '#EFF6FF', borderColor: '#007AFF' },
    chipText: { color: '#374151', fontWeight: '500' },
    chipTextActive: { color: '#007AFF', fontWeight: '700' },

    selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
    selectBtnText: { fontSize: 16, color: '#1F2937' },

    locationBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#007AFF', borderStyle: 'dashed', backgroundColor: '#F0F9FF', marginBottom: 20 },
    locationBtnActive: { backgroundColor: '#007AFF', borderStyle: 'solid' },
    locationBtnText: { color: '#007AFF', fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 30 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    cityOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    cityText: { fontSize: 16, color: '#333' },

    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },

    reviewCard: { padding: 20, borderRadius: 16, marginBottom: 24, backgroundColor: '#FFF' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    reviewLabel: { color: '#6B7280' },
    reviewValue: { fontWeight: '600', color: '#111' },

    termsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    termsText: { flex: 1, fontSize: 14, color: '#4B5563' },

    errorText: { color: '#EF4444', fontSize: 13, marginBottom: 10, textAlign: 'center' },
    pickerContainer: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 200, marginTop: 4 },
    pickerItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },

    // Success
    successCard: { padding: 32, alignItems: 'center', borderRadius: 24, backgroundColor: '#FFF' },
    successContent: { alignItems: 'center', width: '100%' },
    successIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 12 },
    successMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
    approvalNotice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFBEB', padding: 14, borderRadius: 12, width: '100%', marginBottom: 16 },
    approvalTitle: { color: '#B45309', fontWeight: '700', fontSize: 16 },
    approvalText: { color: '#9CA3AF', fontSize: 13 },
});
