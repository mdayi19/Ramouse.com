import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCreateOrder } from '@/hooks/useOrders';

// Steps
import Step1Category from './new_order/Step1Category';
import Step2Brand from './new_order/Step2Brand';
import Step3Model from './new_order/Step3Model';
import Step4PartType from './new_order/Step4PartType';
import Step5Details from './new_order/Step5Details';
import Step6Review from './new_order/Step6Review';
import Step7Success from './new_order/Step7Success';

import AsyncStorage from '@react-native-async-storage/async-storage';

// ...

export default function NewOrderScreen() {
    const router = useRouter();
    const DRAFT_KEY = 'new_order_draft';

    const createOrder = useCreateOrder({
        onSuccess: async () => {
            await AsyncStorage.removeItem(DRAFT_KEY);
            setCurrentStep(7);
        }
    });

    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 6; // Success is 7 but progress counts to 6

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        brand: '',
        model: '',
        year: '',
        transmission: 'auto' as 'auto' | 'manual', // Default
        parts: [] as string[],
        description: '',
        partNumber: '',
        images: [] as string[],
        city: '',
        contactMethod: 'phone' as 'phone' | 'whatsapp',
    });

    // Load Draft
    React.useEffect(() => {
        const loadDraft = async () => {
            try {
                const draft = await AsyncStorage.getItem(DRAFT_KEY);
                if (draft) {
                    const parsed = JSON.parse(draft);
                    setFormData(parsed);

                    // Optional: Restore step if valuable, but safest to start at 1 or infer from data
                    if (parsed.category) setCurrentStep(1);
                }
            } catch (e) {
                console.log('Failed to load draft');
            }
        };
        loadDraft();
    }, []);

    // Save Draft
    React.useEffect(() => {
        const saveDraft = async () => {
            try {
                // Determine if form has data worth saving
                const hasData = formData.category || formData.brand || formData.model;
                if (hasData) {
                    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
                }
            } catch (e) {
                console.log('Failed to save draft');
            }
        };
        // Simple debounce could be added here if performant issues arise, but for simple Objects it's fine
        const timeout = setTimeout(saveDraft, 1000); // 1s debounce
        return () => clearTimeout(timeout);
    }, [formData]);

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            router.back();
        }
    };

    // Handlers
    const handleCategorySelect = (cat: string) => {
        updateForm('category', cat);
        nextStep();
    };

    const handleBrandSelect = (brand: string) => {
        updateForm('brand', brand);
        nextStep();
    };

    const handleModelSubmit = () => {
        if (!formData.model || !formData.year) {
            Alert.alert('تنبيه', 'يرجى تعبئة الموديل والسنة');
            return;
        }
        nextStep(); // To parts
    };

    const handlePartsSubmit = () => {
        if (formData.parts.length === 0) {
            Alert.alert('تنبيه', 'يرجى اختيار قطعة واحدة على الأقل');
            return;
        }
        nextStep(); // To details
    };

    const handleDetailsSubmit = () => {
        if (!formData.description) {
            Alert.alert('تنبيه', 'يرجى كتابة وصف المشكلة');
            return;
        }
        nextStep(); // To Review
    };

    const handleFinalSubmit = async () => {
        try {
            await createOrder.mutateAsync({
                category: formData.category,
                brand: formData.brand,
                model: formData.model,
                year: formData.year,
                transmission: formData.transmission,
                partTypes: formData.parts,
                partDescription: formData.description,
                partNumber: formData.partNumber,
                city: formData.city,
                contactMethod: formData.contactMethod,
                // TODO: Handle Image Uploads with Api
            });
            // Success handled by hook callback
        } catch (error) {
            Alert.alert('خطأ', 'فشل في إرسال الطلب، يرجى المحاولة لاحقاً');
        }
    };

    // Dev Helper: Auto-fill
    const fillTestData = () => {
        setFormData({
            category: 'sedan',
            brand: 'Toyota',
            model: 'Camry',
            year: '2023',
            transmission: 'auto',
            parts: ['engine', 'brakes'],
            description: 'Test order description for verification.',
            partNumber: '123-ABC',
            images: [],
            city: 'Riyadh',
            contactMethod: 'phone', // Default
        });
        setCurrentStep(6); // Jump to Review, or logic to just fill?
        // Let's just fill data, user can tap Next. Or better, just fill data.
        // Actually, jumping to step 6 might get confusing if intermediate logic skipped validation.
        // Let's just fill data.
    };

    // Render Logic
    const renderStep = () => {
        // ... (existing switch)
        switch (currentStep) {
            case 1:
                return <Step1Category selectedCategory={formData.category} onSelect={handleCategorySelect} />;
            case 2:
                return (
                    <Step2Brand
                        selectedBrand={formData.brand}
                        category={formData.category}
                        onSelect={handleBrandSelect}
                    />
                );
            case 3:
                return (
                    <View style={{ flex: 1 }}>
                        <Step3Model
                            model={formData.model}
                            year={formData.year}
                            transmission={formData.transmission}
                            onUpdate={updateForm}
                        />
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={handleModelSubmit} style={styles.nextBtn}>
                                <Text style={styles.nextText}>التالي</Text>
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={{ flex: 1 }}>
                        <Step4PartType
                            selectedParts={formData.parts}
                            onToggle={(part) => {
                                const newParts = formData.parts.includes(part)
                                    ? formData.parts.filter(p => p !== part)
                                    : [...formData.parts, part];
                                updateForm('parts', newParts);
                            }}
                        />
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={handlePartsSubmit} style={styles.nextBtn}>
                                <Text style={styles.nextText}>التالي</Text>
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 5:
                return (
                    <View style={{ flex: 1 }}>
                        <Step5Details
                            description={formData.description}
                            partNumber={formData.partNumber}
                            images={formData.images}
                            onUpdate={updateForm}


                            // ... (inside component)

                            onAddImage={async () => {
                                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                                if (status !== 'granted') {
                                    Alert.alert('عذراً', 'نحتاج صلاحية الوصول للصور لإرفاق صور القطعة');
                                    return;
                                }

                                const result = await ImagePicker.launchImageLibraryAsync({
                                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                                    allowsEditing: true,
                                    quality: 0.7,
                                });

                                if (!result.canceled && result.assets[0].uri) {
                                    const newImgs = [...formData.images, result.assets[0].uri];
                                    updateForm('images', newImgs);
                                }
                            }}
                            onRemoveImage={(idx) => {
                                const newImgs = [...formData.images];
                                newImgs.splice(idx, 1);
                                updateForm('images', newImgs);
                            }}
                        />
                        <View style={styles.footer}>
                            <TouchableOpacity onPress={handleDetailsSubmit} style={styles.nextBtn}>
                                <Text style={styles.nextText}>مراجعة الطلب</Text>
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            case 6:
                return <Step6Review
                    data={formData as any}
                    city={formData.city}
                    contactMethod={formData.contactMethod}
                    onUpdate={updateForm}
                    onSubmit={handleFinalSubmit}
                    loading={createOrder.isPending}
                />;
            case 7:
                return <Step7Success />;
            default:
                return null;
        }
    };

    // If Success Step, hide header/progress
    if (currentStep === 7) {
        return (
            <SafeAreaView style={styles.container}>
                <Step7Success />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={prevStep} style={styles.backButton}>
                    <Ionicons name="arrow-forward" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>طلب قطعة جديدة</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Progress */}
            <ProgressBar
                progress={currentStep / totalSteps}
                color="#3b82f6"
                style={styles.progress}
            />

            {/* Dev Helper */}
            {/* __DEV__ && (
                <TouchableOpacity 
                    onPress={fillTestData} 
                    style={{ alignSelf: 'center', padding: 8, backgroundColor: '#fef3c7' }}
                >
                    <Text style={{ fontSize: 10, color: '#d97706' }}>[DEV] Auto-Fill Data</Text>
                </TouchableOpacity>
            ) */}
            <TouchableOpacity
                onPress={fillTestData}
                style={{ alignSelf: 'center', padding: 4, backgroundColor: '#fef3c7', marginVertical: 4 }}
            >
                <Text style={{ fontSize: 10, color: '#d97706' }}>[TEST] Auto-Fill Form</Text>
            </TouchableOpacity>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {renderStep()}
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    backButton: {
        padding: 4,
    },
    progress: {
        height: 4,
        backgroundColor: '#e2e8f0',
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    nextBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
