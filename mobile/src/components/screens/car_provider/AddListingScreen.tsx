import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CarProviderService } from '@/services/carprovider.service';
import * as ImagePicker from 'expo-image-picker';

export default function AddCarListingScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data Loading
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        listing_type: 'sale', // sale, rent
        price: '',
        year: new Date().getFullYear().toString(),
        mileage: '',
        city: 'دمشق',
        category_id: '',
        brand_id: '',
        model: '',
        description: '',
        contact_phone: '',
        photos: [] as string[] // base64 strings
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [cats, brnds] = await Promise.all([
                CarProviderService.getCategories(),
                CarProviderService.getBrands()
            ]);
            setCategories(cats.categories || []);
            setBrands(brnds.brands || []);
        } catch (error) {
            console.error('Failed to load form data:', error);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData(prev => ({ ...prev, photos: [...prev.photos, base64Img] }));
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const validateStep1 = () => {
        if (!formData.title || !formData.price || !formData.city) {
            Alert.alert('تنبيه', 'يرجى ملء الحقول الأساسية (العنوان، السعر، المدينة)');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.category_id || !formData.brand_id || !formData.model) {
            Alert.alert('تنبيه', 'يرجى اختيار الفئة والماركة والموديل');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!formData.photos.length) {
            Alert.alert('تنبيه', 'يجب إضافة صورة واحدة على الأقل');
            return;
        }

        setLoading(true);
        try {
            // Adapt payload to match backend expectations roughly
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                year: parseInt(formData.year),
                mileage: parseInt(formData.mileage),
            };

            await CarProviderService.createListing(payload);
            Alert.alert('نجاح', 'تم إضافة السيارة بنجاح!', [
                { text: 'تم', onPress: () => router.replace('/(car-provider)/listings') }
            ]);
        } catch (error) {
            console.error('Submission failed:', error);
            Alert.alert('خطأ', 'فشل إضافة السيارة. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>معلومات أساسية</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>عنوان الإعلان</Text>
                <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={t => setFormData({ ...formData, title: t })}
                    placeholder="مثال: كيا ريو 2018 نظيفة"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>السعر ($)</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.price}
                        onChangeText={t => setFormData({ ...formData, price: t })}
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>المدينة</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.city}
                        onChangeText={t => setFormData({ ...formData, city: t })}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>نوع الإعلان</Text>
                <View style={styles.typeSelector}>
                    <TouchableOpacity
                        style={[styles.typeBtn, formData.listing_type === 'sale' && styles.typeBtnActive]}
                        onPress={() => setFormData({ ...formData, listing_type: 'sale' })}
                    >
                        <Text style={[styles.typeBtnText, formData.listing_type === 'sale' && styles.typeBtnTextActive]}>للبيع</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeBtn, formData.listing_type === 'rent' && styles.typeBtnActive]}
                        onPress={() => setFormData({ ...formData, listing_type: 'rent' })}
                    >
                        <Text style={[styles.typeBtnText, formData.listing_type === 'rent' && styles.typeBtnTextActive]}>للإيجار</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>مواصفات السيارة</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>الفئة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.chip, formData.category_id === cat.id.toString() && styles.chipActive]}
                            onPress={() => setFormData({ ...formData, category_id: cat.id.toString() })}
                        >
                            <Text style={[styles.chipText, formData.category_id === cat.id.toString() && styles.chipTextActive]}>
                                {cat.name_ar || cat.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>الماركة</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                    {brands.map(brand => (
                        <TouchableOpacity
                            key={brand.id}
                            style={[styles.chip, formData.brand_id === brand.id.toString() && styles.chipActive]}
                            onPress={() => setFormData({ ...formData, brand_id: brand.id.toString() })}
                        >
                            <Text style={[styles.chipText, formData.brand_id === brand.id.toString() && styles.chipTextActive]}>
                                {brand.name_ar || brand.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>الموديل</Text>
                <TextInput
                    style={styles.input}
                    value={formData.model}
                    onChangeText={t => setFormData({ ...formData, model: t })}
                    placeholder="مثال: ريو، سيراتو"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>سنة الصنع</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.year}
                        onChangeText={t => setFormData({ ...formData, year: t })}
                        keyboardType="numeric"
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>الكيلومترات</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.mileage}
                        onChangeText={t => setFormData({ ...formData, mileage: t })}
                        keyboardType="numeric"
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>الصور والتفاصيل</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>الصور</Text>
                <View style={styles.photosGrid}>
                    <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                        <Ionicons name="camera" size={32} color="#94a3b8" />
                        <Text style={styles.addPhotoText}>إضافة</Text>
                    </TouchableOpacity>
                    {formData.photos.map((photo, index) => (
                        <View key={index} style={styles.photoWrapper}>
                            <Image source={{ uri: photo }} style={styles.thumbnail} />
                            <TouchableOpacity style={styles.removePhoto} onPress={() => removeImage(index)}>
                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>الوصف وتفاصيل إضافية</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={t => setFormData({ ...formData, description: t })}
                    multiline
                    numberOfLines={4}
                    placeholder="اكتب وصفاً تفصيلياً عن حالة السيارة والمميزات..."
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>رقم للتواصل</Text>
                <TextInput
                    style={styles.input}
                    value={formData.contact_phone}
                    onChangeText={t => setFormData({ ...formData, contact_phone: t })}
                    keyboardType="phone-pad"
                    placeholder="مثال: 0912345678"
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>إضافة سيارة ({step}/3)</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressBar}>
                <View style={[styles.progressIndicator, { width: `${(step / 3) * 100}%` }]} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>

            <View style={styles.footer}>
                {step > 1 && (
                    <TouchableOpacity
                        style={styles.prevButton}
                        onPress={() => setStep(step - 1)}
                        disabled={loading}
                    >
                        <Text style={styles.prevButtonText}>السابق</Text>
                    </TouchableOpacity>
                )}

                {step < 3 ? (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => {
                            if (step === 1 && validateStep1()) setStep(2);
                            if (step === 2 && validateStep2()) setStep(3);
                        }}
                    >
                        <Text style={styles.nextButtonText}>التالي</Text>
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.nextButton, styles.submitButton]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>نشر الإعلان</Text>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    backButton: {
        padding: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#f1f5f9',
        flexDirection: 'row-reverse', // Arabic RTL progress
    },
    progressIndicator: {
        height: '100%',
        backgroundColor: '#2563eb',
    },
    content: {
        padding: 24,
    },
    stepContainer: {
        gap: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'left',
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        textAlign: 'left',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#0f172a',
        textAlign: 'right',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    typeBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    typeBtnActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    typeBtnText: {
        fontSize: 16,
        color: '#64748b',
    },
    typeBtnTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    chipsScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    chipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    chipText: {
        fontSize: 14,
        color: '#475569',
    },
    chipTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    addPhotoBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    addPhotoText: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    photoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 12,
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removePhoto: {
        position: 'absolute',
        top: -8,
        right: -8,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: 12,
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    submitButton: {
        backgroundColor: '#16a34a',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    prevButton: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
    },
    prevButtonText: {
        color: '#64748b',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
