import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Header } from '../../layout';
import { Button } from '../../shared';
import { Step1Category } from './Step1Category';
import { Step2Brand } from './Step2Brand';
import { Step3Model } from './Step3Model';
import { Step4PartType } from './Step4PartType';
import { Step5Details } from './Step5Details';
import { Step6Review } from './Step6Review';
import { Step7Success } from './Step7Success';
import * as ImagePicker from 'expo-image-picker';

interface OrderWizardProps {
    onComplete: () => void;
    onCancel: () => void;
}

export const OrderWizard: React.FC<OrderWizardProps> = ({
    onComplete,
    onCancel,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        category: '',
        brand: '',
        model: '',
        year: '',
        transmission: 'auto' as 'auto' | 'manual',
        partTypes: [] as string[],
        description: '',
        partNumber: '',
        images: [] as string[],
        city: '',
        contactMethod: 'phone' as 'phone' | 'whatsapp',
    });

    const handleNext = () => {
        if (currentStep < 7) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        } else {
            onCancel();
        }
    };

    const handlePartTypeToggle = (partType: string) => {
        const newPartTypes = formData.partTypes.includes(partType)
            ? formData.partTypes.filter((p) => p !== partType)
            : [...formData.partTypes, partType];
        setFormData({ ...formData, partTypes: newPartTypes });
    };

    const handleAddImage = async () => {
        try {
            const permissionResult =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                alert('يجب السماح بالوصول إلى المعرض لإضافة الصور');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const newImages = [...formData.images, result.assets[0].uri];
                setFormData({ ...formData, images: newImages });
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('حدث خطأ أثناء اختيار الصورة');
        }
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({ ...formData, images: newImages });
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // TODO: Integrate with OrderService
            // const orderData = {
            //   category: formData.category,
            //   brand: formData.brand,
            //   model: formData.model,
            //   year: formData.year,
            //   transmission: formData.transmission,
            //   partTypes: formData.partTypes,
            //   description: formData.description,
            //   partNumber: formData.partNumber,
            //   images: formData.images,
            //   city: formData.city,
            //   contactMethod: formData.contactMethod,
            // };
            // await OrderService.createOrder(orderData);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Show success
            setCurrentStep(7);
        } catch (error) {
            console.error('Order submission failed:', error);
            alert('فشل إرسال الطلب. يرجى المحاولة مرة أخرى.');
        } finally {
            setSubmitting(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return formData.category !== '';
            case 2:
                return formData.brand !== '';
            case 3:
                return formData.model !== '' && formData.year !== '';
            case 4:
                return formData.partTypes.length > 0;
            case 5:
                return formData.description.trim() !== '';
            case 6:
                return formData.city !== '';
            default:
                return false;
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1Category
                        selectedCategory={formData.category}
                        onSelect={(category) => setFormData({ ...formData, category })}
                    />
                );
            case 2:
                return (
                    <Step2Brand
                        selectedBrand={formData.brand}
                        category={formData.category}
                        onSelect={(brand) => setFormData({ ...formData, brand })}
                    />
                );
            case 3:
                return (
                    <Step3Model
                        model={formData.model}
                        year={formData.year}
                        transmission={formData.transmission}
                        onUpdate={(field, value) =>
                            setFormData({ ...formData, [field]: value })
                        }
                    />
                );
            case 4:
                return (
                    <Step4PartType
                        selectedParts={formData.partTypes}
                        onToggle={handlePartTypeToggle}
                    />
                );
            case 5:
                return (
                    <Step5Details
                        description={formData.description}
                        partNumber={formData.partNumber}
                        images={formData.images}
                        onUpdate={(field, value) =>
                            setFormData({ ...formData, [field]: value })
                        }
                        onAddImage={handleAddImage}
                        onRemoveImage={handleRemoveImage}
                    />
                );
            case 6:
                return (
                    <Step6Review
                        data={{
                            category: formData.category,
                            brand: formData.brand,
                            model: formData.model,
                            year: formData.year,
                            transmission: formData.transmission,
                            parts: formData.partTypes,
                            description: formData.description,
                            partNumber: formData.partNumber,
                        }}
                        city={formData.city}
                        contactMethod={formData.contactMethod}
                        onUpdate={(field, value) =>
                            setFormData({ ...formData, [field]: value })
                        }
                        onSubmit={handleSubmit}
                        loading={submitting}
                    />
                );
            case 7:
                return (
                    <Step7Success
                        onViewOrders={onComplete}
                        onGoHome={onComplete}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            {currentStep < 7 && (
                <Header
                    title={`خطوة ${currentStep} من 6`}
                    showBack
                    onBack={handleBack}
                />
            )}

            <View style={styles.content}>{renderStep()}</View>

            {currentStep > 0 && currentStep < 6 && (
                <View style={styles.footer}>
                    <Button
                        title="التالي"
                        onPress={handleNext}
                        disabled={!canProceed()}
                        variant="primary"
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
    },
    footer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
});
