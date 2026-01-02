import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import { AuctionCar } from '../../types';
import * as auctionService from '../../services/auction.service';
import {
    Loader2, Image, Car, Settings,
    DollarSign, Check, ChevronRight, ChevronLeft
} from 'lucide-react';
import { format, addDays } from 'date-fns';

// New sub-components
import { AuctionFormBasic } from './AuctionFormBasic';
import { AuctionFormSpecs } from './AuctionFormSpecs';
import { AuctionFormMedia } from './AuctionFormMedia';
import { AuctionFormPricing } from './AuctionFormPricing';

type FormStep = 'basic' | 'specs' | 'media' | 'pricing';

interface AuctionCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: AuctionCar | null;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    mode?: 'admin' | 'user';
}

const AuctionCarModal: React.FC<AuctionCarModalProps> = ({
    isOpen, onClose, onSuccess, initialData, showToast, mode = 'admin'
}) => {
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState<FormStep>('basic');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        // Basic Info
        title: '',
        description: '',
        condition: 'used' as 'new' | 'used',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        vin: '',
        // Specifications
        body_type: '',
        mileage: 0,
        engine_type: '',
        transmission: '',
        fuel_type: '',
        // Appearance
        exterior_color: '',
        interior_color: '',
        features: [] as string[],
        // Location
        location: '',
        // Media
        media: {
            images: [] as string[],
            videos: [] as string[],
        },
        // Pricing
        starting_price: 0,
        reserve_price: 0,
        buy_now_price: 0,
        deposit_amount: 0,
        // Scheduling
        schedule_auction: true,
        start_immediately: false,
        scheduled_start: format(addDays(new Date(), 1), "yyyy-MM-dd'T'10:00"),
        scheduled_end: format(addDays(new Date(), 3), "yyyy-MM-dd'T'10:00"),
        bid_increment: 100,
        auto_extend: true,
        extension_minutes: 5,
        max_extensions: 3
    });

    const [uploadingImages, setUploadingImages] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || '',
                description: initialData.description || '',
                condition: initialData.condition || 'used',
                brand: initialData.brand || '',
                model: initialData.model || '',
                year: initialData.year || new Date().getFullYear(),
                vin: initialData.vin || '',
                body_type: initialData.body_type || '',
                mileage: initialData.mileage || 0,
                engine_type: initialData.engine_type || '',
                transmission: initialData.transmission || '',
                fuel_type: initialData.fuel_type || '',
                exterior_color: initialData.exterior_color || '',
                interior_color: initialData.interior_color || '',
                features: initialData.features || [],
                location: initialData.location || '',
                media: {
                    images: initialData.media?.images || [],
                    videos: initialData.media?.videos || [],
                },
                starting_price: initialData.starting_price || 0,
                reserve_price: initialData.reserve_price || 0,
                buy_now_price: initialData.buy_now_price || 0,
                deposit_amount: initialData.deposit_amount || 0,
                schedule_auction: false,
                start_immediately: false,
                scheduled_start: initialData.scheduled_start || format(addDays(new Date(), 1), "yyyy-MM-dd'T'10:00"),
                scheduled_end: initialData.scheduled_end || format(addDays(new Date(), 3), "yyyy-MM-dd'T'10:00"),
                bid_increment: 100,
                auto_extend: true,
                extension_minutes: 5,
                max_extensions: 3
            });
        }
    }, [initialData, isOpen]);

    const updateFormData = (newData: any) => {
        setFormData(newData);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.brand || !formData.model || !formData.year) {
            showToast('يرجى تعبئة المعلومات الأساسية للسيارة', 'error');
            return;
        }
        if (formData.starting_price < 1) {
            showToast('يرجى تحديد سعر بداية للمزاد', 'error');
            return;
        }

        const isUserMode = mode === 'user';

        if (isUserMode && formData.media.images.length < 3) {
            showToast('يجب تحميل 3 صور على الأقل للسيارة', 'error');
            return;
        }

        if (formData.vin && formData.vin.length < 10) {
            showToast('رقم الهيكل (VIN) يبدو قصيراً جداً', 'info');
        }

        setLoading(true);
        try {
            const carData = {
                ...formData,
                status: initialData?.status || 'approved',
            };

            let carId: string | undefined;

            if (isUserMode) {
                const result = await auctionService.submitCarForSale(carData);
                carId = result.car?.id || result.id;
                showToast('تم إرسال سيارتك للمراجعة بنجاح', 'success');
            } else {
                const savedCarResponse = await auctionService.saveAuctionCar(carData, initialData?.id);

                // Robust ID extraction
                carId = initialData?.id ||
                    savedCarResponse.id ||
                    savedCarResponse.car?.id ||
                    savedCarResponse.data?.id ||
                    savedCarResponse.data?.car?.id;

                if (formData.schedule_auction && !initialData) {
                    if (!carId) {
                        console.error("CRITICAL ERROR: Car ID missing in response. Inspecting:", JSON.stringify(savedCarResponse, null, 2));
                        showToast('تم حفظ السيارة ولكن فشل الحصول على رقم المعرف لجدولة المزاد. يرجى مراجعة المسؤول.', 'error');
                        // Stop scheduling if no ID
                        onSuccess();
                        onClose();
                        return;
                    }

                    const auctionData = {
                        auction_car_id: carId,
                        title: formData.title,
                        scheduled_start: formData.scheduled_start,
                        scheduled_end: formData.scheduled_end,
                        starting_bid: formData.starting_price,
                        bid_increment: formData.bid_increment,
                        auto_extend: formData.auto_extend,
                        extension_minutes: formData.extension_minutes,
                        max_extensions: formData.max_extensions,
                        // If starting immediately, force status to live and set actual_start
                        ...(formData.start_immediately && {
                            status: 'live',
                            actual_start: formData.scheduled_start,
                            is_live: true
                        })
                    };
                    await auctionService.saveAuction(auctionData);
                    showToast(formData.start_immediately ? 'تم نشر المزاد وبدءه فوراً' : 'تم حفظ السيارة وجدولة المزاد بنجاح', 'success');
                } else {
                    showToast('تم حفظ بيانات السيارة بنجاح', 'success');
                }
            }

            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Save error full object:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstField = Object.keys(errors)[0];
                const firstError = errors[firstField][0];
                showToast(`خطأ في البيانات: ${firstError}`, 'error');
            } else {
                const errorMsg = error.response?.data?.error ||
                    error.response?.data?.message ||
                    error.message ||
                    'فشل العملية. يرجى التأكد من البيانات.';
                showToast(`Error: ${errorMsg}`, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const processFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        setUploadingImages(true);
        const newUrls: string[] = [];
        let failCount = 0;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                if (!file.type.startsWith('image/')) {
                    showToast(`تم تجاهل الملف ${file.name} لأنه ليس صورة`, 'info');
                    continue;
                }

                if (file.size > 20 * 1024 * 1024) {
                    showToast(`الملف ${file.name} حجمه كبير جداً (20MB+)`, 'error');
                    continue;
                }

                try {
                    const uploaded = await auctionService.uploadMedia(file, 'image');
                    if (uploaded.url) newUrls.push(uploaded.url);
                } catch (err) {
                    failCount++;
                }
            }

            if (newUrls.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    media: {
                        ...prev.media,
                        images: [...prev.media.images, ...newUrls]
                    }
                }));
            }

            if (failCount > 0) {
                showToast(`فشل رفع ${failCount} ملفات`, 'error');
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء رفع الصور';
            showToast(`فشل الرفع: ${errorMsg}`, 'error');
        } finally {
            setUploadingImages(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            media: {
                ...prev.media,
                images: prev.media.images.filter((_, i) => i !== index)
            }
        }));
    };

    const toggleFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const steps: { id: FormStep; label: string; icon: React.ReactNode }[] = [
        { id: 'basic', label: 'الأساسية', icon: <Car size={18} /> },
        { id: 'specs', label: 'المواصفات', icon: <Settings size={18} /> },
        { id: 'media', label: 'الوسائط', icon: <Image size={18} /> },
        { id: 'pricing', label: 'التسعير', icon: <DollarSign size={18} /> },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'تعديل بيانات السيارة' : 'إضافة سيارة جديدة للمزاد'}
            size="3xl"
        >
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 dark:bg-slate-800 -z-10" />
                    {steps.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        return (
                            <button
                                key={step.id}
                                type="button"
                                className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2 cursor-pointer focus:outline-none"
                                onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110' :
                                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400'
                                    }`}>
                                    {isCompleted ? <Check size={18} strokeWidth={3} /> : step.icon}
                                </div>
                                <span className={`text-xs font-bold transition-colors ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                                    }`}>
                                    {step.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); }} className="min-h-[450px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                    >
                        {currentStep === 'basic' && (
                            <AuctionFormBasic
                                formData={formData}
                                updateFormData={updateFormData}
                            />
                        )}

                        {currentStep === 'specs' && (
                            <AuctionFormSpecs
                                formData={formData}
                                updateFormData={updateFormData}
                                toggleFeature={toggleFeature}
                            />
                        )}

                        {currentStep === 'media' && (
                            <AuctionFormMedia
                                formData={formData}
                                updateFormData={updateFormData}
                                handleRemoveImage={handleRemoveImage}
                                fileInputRef={fileInputRef}
                                handleImageChange={handleImageChange}
                                handleDragOver={handleDragOver}
                                handleDragLeave={handleDragLeave}
                                handleDrop={handleDrop}
                                isDragging={isDragging}
                                uploadingImages={uploadingImages}
                                mode={mode}
                            />
                        )}

                        {currentStep === 'pricing' && (
                            <AuctionFormPricing
                                formData={formData}
                                updateFormData={updateFormData}
                                mode={mode}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </form>

            <div className="flex justify-between items-center pt-6 mt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => {
                        const idx = steps.findIndex(s => s.id === currentStep);
                        if (idx > 0) setCurrentStep(steps[idx - 1].id);
                        else onClose();
                    }}
                    className="px-6 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                    {currentStep === 'basic' ? 'إلغاء' : <><ChevronRight size={18} /> السابق</>}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        const idx = steps.findIndex(s => s.id === currentStep);
                        if (idx < steps.length - 1) {
                            setCurrentStep(steps[idx + 1].id);
                        } else {
                            handleSubmit();
                        }
                    }}
                    disabled={loading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading && <Loader2 className="animate-spin" size={18} />}
                    {currentStep === 'pricing' ? 'حفظ ونشر' : <>{'التالي'} <ChevronLeft size={18} /></>}
                </button>
            </div>
        </Modal>
    );
};

export default AuctionCarModal;
