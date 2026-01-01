
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../Modal';
import { AuctionCar } from '../../types';
import * as auctionService from '../../services/auction.service';
import {
    Loader2, X, Upload, Image, Video, Car, Settings,
    DollarSign, Check, ChevronRight, ChevronLeft, MapPin
} from 'lucide-react';
import { format, addDays } from 'date-fns';

type FormStep = 'basic' | 'specs' | 'media' | 'pricing';

const BODY_TYPES = [
    { id: 'sedan', label: 'سيدان' },
    { id: 'suv', label: 'دفع رباعي' },
    { id: 'hatchback', label: 'هاتشباك' },
    { id: 'coupe', label: 'كوبيه' },
    { id: 'convertible', label: 'مكشوفة' },
    { id: 'pickup', label: 'بيك أب' },
    { id: 'van', label: 'فان' },
    { id: 'wagon', label: 'ستيشن' },
];

const TRANSMISSIONS = [
    { id: 'automatic', label: 'أوتوماتيك' },
    { id: 'manual', label: 'يدوي' },
    { id: 'cvt', label: 'CVT' },
];

const FUEL_TYPES = [
    { id: 'petrol', label: 'بنزين' },
    { id: 'diesel', label: 'ديزل' },
    { id: 'hybrid', label: 'هايبرد' },
    { id: 'electric', label: 'كهربائي' },
    { id: 'lpg', label: 'غاز' },
];

const COLORS = [
    { id: 'white', label: 'أبيض', hex: '#FFFFFF' },
    { id: 'black', label: 'أسود', hex: '#1a1a1a' },
    { id: 'silver', label: 'فضي', hex: '#C0C0C0' },
    { id: 'gray', label: 'رمادي', hex: '#808080' },
    { id: 'red', label: 'أحمر', hex: '#DC2626' },
    { id: 'blue', label: 'أزرق', hex: '#2563EB' },
    { id: 'green', label: 'أخضر', hex: '#16A34A' },
    { id: 'brown', label: 'بني', hex: '#92400E' },
    { id: 'beige', label: 'بيج', hex: '#D4A574' },
    { id: 'gold', label: 'ذهبي', hex: '#D4AF37' },
];

const FEATURES = [
    'كاميرا خلفية', 'نظام ملاحة', 'فتحة سقف', 'مقاعد جلد',
    'تحكم مناخي', 'بلوتوث', 'مثبت سرعة', 'حساسات ركن',
    'شاشة لمس', 'نظام صوتي متطور', 'مقاعد مُدفأة', 'ريموت ستارت'
];

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

                // Log response for debugging


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
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />
                    {steps.map((step, index) => {
                        const isActive = index === currentStepIndex;
                        const isCompleted = index < currentStepIndex;
                        return (
                            <button
                                key={step.id}
                                type="button"
                                className="flex flex-col items-center gap-2 bg-white px-2 cursor-pointer focus:outline-none"
                                onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 scale-110' :
                                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        'bg-white border-gray-200 text-gray-400'
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
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">عنوان الإعلان</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all font-medium"
                                            placeholder="مثال: مرسيدس S-Class 2023 فل كامل"
                                            autoFocus
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">الماركة</label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
                                            placeholder="Mercedes"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">الموديل</label>
                                        <input
                                            type="text"
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
                                            placeholder="S500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">سنة الصنع</label>
                                        <input
                                            type="number"
                                            value={formData.year}
                                            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">رقم الهيكل (VIN)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={formData.vin}
                                                onChange={e => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all uppercase font-mono tracking-widest"
                                                placeholder="WDB..."
                                            />
                                            {formData.vin.length === 17 && (
                                                <Check className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">الحالة</label>
                                        <div className="flex p-1 bg-gray-100 rounded-xl">
                                            {(['new', 'used'] as const).map(condition => (
                                                <button
                                                    key={condition}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, condition })}
                                                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${formData.condition === condition
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {condition === 'new' ? '✨ جديدة' : '🔄 مستعملة'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">الوصف</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all resize-none"
                                            placeholder="اكتب أبرز مواصفات وعيوب السيارة..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 'specs' && (
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">نوع الهيكل</label>
                                    <div className="flex flex-wrap gap-2">
                                        {BODY_TYPES.map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, body_type: type.id })}
                                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${formData.body_type === type.id
                                                    ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">الممشى (كم)</label>
                                        <input
                                            type="number"
                                            value={formData.mileage}
                                            onChange={e => setFormData({ ...formData, mileage: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">الموقع</label>
                                        <div className="relative">
                                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all"
                                                placeholder="المدينة، المنطقة"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">ناقل الحركة</label>
                                        <div className="flex rounded-xl bg-gray-50 p-1">
                                            {TRANSMISSIONS.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, transmission: t.id })}
                                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${formData.transmission === t.id
                                                        ? 'bg-white text-blue-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">الوقود</label>
                                        <div className="flex flex-wrap gap-2">
                                            {FUEL_TYPES.map(f => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, fuel_type: f.id })}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${formData.fuel_type === f.id
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">اللون الخارجي</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLORS.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, exterior_color: c.id })}
                                                    className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${formData.exterior_color === c.id
                                                        ? 'ring-2 ring-blue-500 ring-offset-2'
                                                        : 'border-gray-200'
                                                        }`}
                                                    style={{ backgroundColor: c.hex }}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-3">اللون الداخلي</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COLORS.slice(0, 6).map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, interior_color: c.id })}
                                                    className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${formData.interior_color === c.id
                                                        ? 'ring-2 ring-blue-500 ring-offset-2'
                                                        : 'border-gray-200'
                                                        }`}
                                                    style={{ backgroundColor: c.hex }}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">المميزات الإضافية</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {FEATURES.map(feature => (
                                            <button
                                                key={feature}
                                                type="button"
                                                onClick={() => toggleFeature(feature)}
                                                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 justify-center border ${formData.features.includes(feature)
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                {formData.features.includes(feature) && <Check size={14} className="text-green-600" />}
                                                {feature}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 'media' && (
                            <div className="space-y-6">
                                <div
                                    className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${isDragging
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {uploadingImages ? (
                                            <Loader2 className="animate-spin text-blue-600" size={28} />
                                        ) : (
                                            <Upload className="text-blue-600" size={28} />
                                        )}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">
                                        {isDragging ? 'أفلت الصور هنا' : 'اضغط للرفع أو اسحب الصور'}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        الحد الأقصى 20 ميجابايت • JPG, PNG
                                        {mode === 'user' && <span className="text-red-500 mr-1 block mt-1 font-medium">* مطلوب 3 صور على الأقل</span>}
                                    </p>
                                </div>

                                {formData.media.images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-500">
                                        {formData.media.images.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                                <img
                                                    src={url}
                                                    alt={`Car ${idx}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                {idx === 0 && (
                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-sm">
                                                        الرئيسية
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5">رابط فيديو يوتيوب (اختياري)</label>
                                    <div className="relative">
                                        <Video className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="url"
                                            value={formData.media.videos?.[0] || ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                media: { ...formData.media, videos: e.target.value ? [e.target.value] : [] }
                                            })}
                                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-50/50 transition-all font-mono text-sm"
                                            placeholder="https://youtu.be/..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 'pricing' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-6 flex items-center gap-2 text-lg">
                                        <DollarSign className="w-6 h-6" />
                                        تــفــاصــيــل الــمــزاد
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">سعر البداية (Starting Bid) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.starting_price}
                                                    onChange={e => setFormData({ ...formData, starting_price: parseFloat(e.target.value) })}
                                                    className="w-full pl-8 pr-4 py-4 text-xl font-bold text-blue-700 bg-white rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">مقدار الزيادة (Bid Increment) *</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.bid_increment}
                                                    onChange={e => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) || 100 })}
                                                    className="w-full pl-8 pr-4 py-4 text-xl font-bold text-indigo-700 bg-white rounded-xl border border-blue-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                                                    placeholder="100"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">الحد الأدنى للبيع (Reserve)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.reserve_price || ''}
                                                    onChange={e => setFormData({ ...formData, reserve_price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-700 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                                                    placeholder="اختياري"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1.5">لن تباع السيارة بأقل من هذا السعر</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">سعر الشراء الفوري (Buy Now)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={formData.buy_now_price || ''}
                                                    onChange={e => setFormData({ ...formData, buy_now_price: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-8 pr-4 py-3 text-lg font-bold text-gray-700 bg-white rounded-xl border border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all"
                                                    placeholder="اختياري"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">التأمين المطلوب للمشاركة</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={formData.deposit_amount}
                                                onChange={e => setFormData({ ...formData, deposit_amount: parseFloat(e.target.value) })}
                                                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all"
                                                placeholder="500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {mode === 'admin' && (
                                    <div className="mt-8 pt-6 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-6">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.schedule_auction ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.schedule_auction ? 'translate-x-0' : '-translate-x-6'}`} />
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.schedule_auction}
                                                    onChange={e => setFormData({ ...formData, schedule_auction: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">جدولة المزاد الآن؟</span>
                                            </label>
                                        </div>

                                        <AnimatePresence>
                                            {formData.schedule_auction && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-5 mt-4">
                                                        {/* Start Immediately Checkbox */}
                                                        <label className="flex items-center gap-2 cursor-pointer w-fit">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.start_immediately}
                                                                onChange={(e) => {
                                                                    const isImmediate = e.target.checked;
                                                                    const now = new Date();
                                                                    setFormData({
                                                                        ...formData,
                                                                        start_immediately: isImmediate,
                                                                        scheduled_start: isImmediate ? format(now, "yyyy-MM-dd'T'HH:mm") : formData.scheduled_start
                                                                    });
                                                                }}
                                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-bold text-gray-700">بدء المزاد فوراً</span>
                                                        </label>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                                                                    يبدأ في <span className="text-gray-400 font-normal">(بتوقيت دمشق)</span>
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={formData.scheduled_start}
                                                                    onChange={e => setFormData({ ...formData, scheduled_start: e.target.value })}
                                                                    disabled={formData.start_immediately}
                                                                    className={`w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm dir-ltr ${formData.start_immediately ? 'bg-gray-100 text-gray-400' : ''}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                                                                    ينتهي في <span className="text-gray-400 font-normal">(بتوقيت دمشق)</span>
                                                                </label>
                                                                <input
                                                                    type="datetime-local"
                                                                    value={formData.scheduled_end}
                                                                    onChange={e => setFormData({ ...formData, scheduled_end: e.target.value })}
                                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 text-sm dir-ltr"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
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
