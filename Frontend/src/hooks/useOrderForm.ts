import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderFormData, Customer } from '../types';

const initialFormData: OrderFormData = {
    category: '', brand: '', brandManual: '', model: '', year: '', vin: '', engineType: '', transmission: '',
    additionalDetails: '', partTypes: [], partDescription: '', partNumber: '', images: [], video: null,
    voiceNote: null, contactMethod: 'whatsapp', city: '',
};

export const useOrderForm = (isAuthenticated: boolean, showToast: (msg: string, type: 'success' | 'error' | 'info') => void, setShowLogin: (show: boolean) => void, userProfile?: Customer | null) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<OrderFormData>(initialFormData);
    const [orderNumber, setOrderNumber] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStartNewOrder = useCallback((prefillData?: Partial<OrderFormData>) => {
        if (isAuthenticated) {
            setFormData(prev => ({ ...initialFormData, ...prefillData }));
            setCurrentStep(1);
            navigate('/order');
        } else {
            showToast('الرجاء تسجيل الدخول أولاً.', 'info');
            setShowLogin(true);
        }
    }, [isAuthenticated, showToast, navigate, setShowLogin]);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setCurrentStep(0);
        setOrderNumber('');
        navigate('/');
    }, [navigate]);

    const updateFormData = useCallback((update: Partial<OrderFormData>) => {
        setFormData((prev) => ({ ...prev, ...update }));
    }, []);

    const nextStep = useCallback(() => setCurrentStep(prev => prev + 1), []);
    const prevStep = useCallback(() => setCurrentStep(prev => prev - 1), []);
    const goToStep = useCallback((step: number) => setCurrentStep(step), []);

    const submitForm = useCallback(async () => {
        setIsSubmitting(true);

        try {
            // Import ordersAPI dynamically to avoid circular dependency
            const { ordersAPI } = await import('../lib/api');

            // Call API to create order (handles file uploads internally)
            const submissionData = {
                ...formData,
                customerName: userProfile?.name,
                customerAddress: userProfile?.address,
                customerPhone: userProfile?.phone ? String(userProfile.phone) : undefined
            };
            const response = await ordersAPI.create(submissionData);

            // Extract order number from response
            const newOrderNumber = response.data.data.order_number;
            setOrderNumber(newOrderNumber);

            // Show success message
            showToast('تم إرسال طلبك بنجاح!', 'success');

            // Move to success step
            nextStep();
        } catch (error: any) {
            console.error('Error submitting order:', error);

            let errorMessage = 'فشل في إرسال الطلب. حاول مرة أخرى.';
            let targetStep = 0;

            if (error.response) {
                const { status, data } = error.response;

                if (status === 403 && data.error === 'unauthorized_role') {
                    // Provider trying to submit order
                    errorMessage = 'المزودون غير مسموح لهم بتقديم طلبات. هذه الخاصية متاحة للعملاء والفنيين فقط.';
                } else if (status === 422 && data.errors) {
                    // Handle Validation Errors
                    const errors = data.errors;
                    const firstField = Object.keys(errors)[0];
                    const firstError = errors[firstField][0];

                    // Map fields to steps and Arabic names
                    const fieldMap: { [key: string]: { step: number, label: string } } = {
                        category: { step: 1, label: 'فئة السيارة' },
                        brand: { step: 2, label: 'الشركة المصنعة' },
                        model: { step: 3, label: 'الموديل' },
                        year: { step: 3, label: 'سنة الصنع' },
                        vin: { step: 3, label: 'رقم الهيكل' },
                        engineType: { step: 3, label: 'نوع المحرك' },
                        transmission: { step: 3, label: 'ناقل الحركة' },
                        partTypes: { step: 4, label: 'نوع القطعة' },
                        partDescription: { step: 5, label: 'وصف القطعة' },
                        contactMethod: { step: 5, label: 'طريقة التواصل' },
                        city: { step: 5, label: 'المدينة' },
                    };

                    if (fieldMap[firstField]) {
                        targetStep = fieldMap[firstField].step;
                        errorMessage = `الرجاء التحقق من ${fieldMap[firstField].label}: ${translateValidationError(firstError)}`;
                    } else {
                        errorMessage = translateValidationError(firstError || data.message);
                    }
                } else {
                    errorMessage = data.message || errorMessage;
                }
            }

            showToast(errorMessage, 'error');

            if (targetStep > 0) {
                setCurrentStep(targetStep);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, nextStep, showToast, userProfile]);

    // Helper to translate common validation messages
    const translateValidationError = (msg: string) => {
        if (msg.includes('required')) return 'هذا الحقل مطلوب';
        if (msg.includes('must be a string')) return 'يجب أن يكون نصاً';
        if (msg.includes('must be an array')) return 'يجب أن يكون قائمة';
        if (msg.includes('max')) return 'القيمة كبيرة جداً';
        if (msg.includes('at least')) return 'يجب أن يكون 10 أحرف على الأقل';
        return msg;
    };

    return {
        formData, setFormData,
        orderNumber, setOrderNumber,
        currentStep, setCurrentStep,
        isSubmitting, setIsSubmitting,
        handleStartNewOrder,
        resetForm,
        updateFormData,
        nextStep, prevStep, goToStep,
        submitForm
    };
};
