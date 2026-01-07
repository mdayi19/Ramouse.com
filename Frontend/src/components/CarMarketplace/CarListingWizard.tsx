import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Check, Car, ShoppingCart, RefreshCw,
    Tag, Settings, Wrench, Camera, CheckCircle, DollarSign,
    Calendar, Gauge, Zap, Fuel, Droplets, Star, DoorOpen, Users, Rocket
} from 'lucide-react';
import Icon from '../Icon';
import { CarProviderService } from '../../services/carprovider.service';
import { IconCard } from './IconCard';
import { PhotoUploader } from './PhotoUploader';
import { NumberSelector } from './NumberSelector';
import { ColorPicker } from './ColorPicker';
import { ConditionPresets } from './ConditionPresets';

interface CarListingWizardProps {
    onComplete: () => void;
    onCancel: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    userPhone: string;
    editingListing?: any;
}

export const CarListingWizard: React.FC<CarListingWizardProps> = ({
    onComplete,
    onCancel,
    showToast,
    userPhone,
    editingListing
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedPresetId, setSelectedPresetId] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        listing_type: 'sale' as 'sale' | 'rent',
        price: '',
        rent_period: 'daily' as 'daily' | 'weekly' | 'monthly',
        category_id: '',
        brand_id: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: '',
        transmission: 'automatic' as 'automatic' | 'manual',
        fuel_type: 'gasoline' as 'gasoline' | 'diesel' | 'electric' | 'hybrid',
        color: 'white',
        doors: 4,
        seats: 5,
        condition: 'used' as 'new' | 'used' | 'certified_pre_owned',
        body_condition: '{"front": "good", "rear": "good", "left": "good", "right": "good"}',
        features: [] as string[],
        photos: [] as File[],
        video_url: '',
        description: '',
        city: '',
        phone_visible: true
    });

    const totalSteps = 6;
    const stepTitles = [
        'المعلومات الأساسية',
        'الفئة والموديل',
        'المواصفات',
        'الحالة والميزات',
        'الصور والفيديو',
        'المراجعة والنشر'
    ];

    const stepIcons = [Car, Tag, Settings, Wrench, Camera, CheckCircle];

    // Load categories and brands on mount
    useEffect(() => {
        loadCategoriesAndBrands();
    }, []);

    // Populate form when editing
    useEffect(() => {
        if (editingListing) {
            setFormData({
                title: editingListing.title || '',
                listing_type: editingListing.listing_type || 'sale',
                price: editingListing.price?.toString() || '',
                rent_period: editingListing.rent_period || 'daily',
                category_id: editingListing.car_listing_category_id?.toString() || '',
                brand_id: editingListing.brand_id?.toString() || '',
                model: editingListing.model || '',
                year: editingListing.year || new Date().getFullYear(),
                mileage: editingListing.mileage?.toString() || '',
                transmission: editingListing.transmission || 'automatic',
                fuel_type: editingListing.fuel_type || 'gasoline',
                color: editingListing.exterior_color || 'white',
                doors: editingListing.doors_count || 4,
                seats: editingListing.seats_count || 5,
                condition: editingListing.condition || 'used',
                body_condition: editingListing.body_condition ? JSON.stringify(editingListing.body_condition) : '{"front": "good", "rear": "good", "left": "good", "right": "good"}',
                features: editingListing.features || [],
                photos: [],
                video_url: editingListing.video_url || '',
                description: editingListing.description || '',
                city: editingListing.city || '',
                phone_visible: !!editingListing.contact_phone
            });
        }
    }, [editingListing]);

    const loadCategoriesAndBrands = async () => {
        setLoadingData(true);
        try {
            const [categoriesRes, brandsRes] = await Promise.all([
                CarProviderService.getCategories(),
                CarProviderService.getBrands()
            ]);
            setCategories(categoriesRes.categories || []);
            setBrands(brandsRes.brands || []);
        } catch (error) {
            console.error('Failed to load categories/brands:', error);
            showToast('فشل تحميل البيانات', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            console.log('🚀 Starting submission...', formData);

            // Upload photos
            let photoUrls: string[] = editingListing?.photos || [];
            if (formData.photos.length > 0) {
                showToast('جاري رفع الصور...', 'info');
                const uploadRes = await import('../../services/upload.service').then(m => m.uploadMultipleFiles(formData.photos));
                const newUrls = uploadRes.urls || uploadRes.paths || [];
                photoUrls = [...photoUrls, ...newUrls];
                console.log('📸 Photos uploaded:', photoUrls);
            }

            // Prepare payload
            const payload = {
                ...formData,
                photos: photoUrls,
                price: Number(formData.price),
                year: Number(formData.year),
                mileage: Number(formData.mileage),
                car_listing_category_id: Number(formData.category_id),
                doors_count: Number(formData.doors),
                seats_count: Number(formData.seats),
                exterior_color: formData.color,
                contact_phone: formData.phone_visible ? userPhone : null,
                category_id: undefined,
                doors: undefined,
                seats: undefined,
                color: undefined
            };

            if (formData.brand_id) {
                (payload as any).brand_id = Number(formData.brand_id);
            }

            console.log('📦 Payload prepared:', payload);

            if (editingListing) {
                // Update expects same format as create - JSON object
                const response = await CarProviderService.updateListing(editingListing.id, payload as any);
                console.log('✅ Update response:', response);
                showToast('تم تحديث السيارة بنجاح!', 'success');
            } else {
                const response = await CarProviderService.createListing(payload);
                console.log('✅ Create response:', response);
                showToast('تم نشر السيارة بنجاح!', 'success');
            }

            // Wait a bit for user to see success toast
            await new Promise(resolve => setTimeout(resolve, 500));
            onComplete();
        } catch (error: any) {
            console.error('❌ Listing submission failed:', error);
            console.error('Error response:', error.response?.data);
            showToast(error.response?.data?.message || 'فشل نشر السيارة', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <Car className="w-8 h-8" />
                        {editingListing ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
                    </h2>
                    <p className="text-white/80 mt-2">
                        الخطوة {currentStep} من {totalSteps}: {stepTitles[currentStep - 1]}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>

                    {/* Step Icons */}
                    <div className="flex justify-between mt-4">
                        {stepIcons.map((StepIcon, i) => (
                            <div key={i} className={`flex flex-col items-center ${currentStep > i + 1 ? 'text-white' : currentStep === i + 1 ? 'text-white' : 'text-white/40'}`}>
                                <StepIcon className="w-5 h-5" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <Step1BasicInfo formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 2 && (
                            <Step2CategoryBrand
                                formData={formData}
                                updateField={updateField}
                                categories={categories}
                                brands={brands}
                                loading={loadingData}
                            />
                        )}
                        {currentStep === 3 && (
                            <Step3Specs formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 4 && (
                            <Step4Condition
                                formData={formData}
                                updateField={updateField}
                                selectedPresetId={selectedPresetId}
                                setSelectedPresetId={setSelectedPresetId}
                            />
                        )}
                        {currentStep === 5 && (
                            <Step5Media formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 6 && (
                            <Step6Review formData={formData} brands={brands} categories={categories} updateField={updateField} />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        إلغاء
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                            >
                                <ChevronRight className="w-5 h-5" />
                                السابق
                            </button>
                        )}
                        {currentStep < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                التالي
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-bold"
                            >
                                <Rocket className="w-5 h-5" />
                                🚀 نشر الإعلان
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Step 1: Basic Info with IconCards
const Step1BasicInfo: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                عنوان الإعلان *
            </label>
            <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="مثال: تويوتا كامري 2020"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نوع الإعلان *
            </label>
            <div className="grid grid-cols-2 gap-6">
                <IconCard
                    icon={ShoppingCart}
                    label="للبيع"
                    subtitle="بيع السيارة بشكل نهائي"
                    selected={formData.listing_type === 'sale'}
                    onClick={() => updateField('listing_type', 'sale')}
                />
                <IconCard
                    icon={RefreshCw}
                    label="للإيجار"
                    subtitle="تأجير السيارة"
                    selected={formData.listing_type === 'rent'}
                    onClick={() => updateField('listing_type', 'rent')}
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    سنة الصنع *
                </label>
                <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => updateField('year', parseInt(e.target.value))}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Gauge className="w-4 h-4" />
                    الكيلومترات *
                </label>
                <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => updateField('mileage', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                المدينة *
            </label>
            <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="دمشق"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>
    </motion.div>
);

// Step 2: Category & Brand with IconCard Grid
const Step2CategoryBrand: React.FC<any> = ({ formData, updateField, categories, brands, loading }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        {loading ? (
            <div className="flex justify-center py-8">
                <Icon name="Loader" className="w-8 h-8 animate-spin text-primary" />
            </div>
        ) : (
            <>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        الفئة *
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {categories.map((cat: any) => (
                            <IconCard
                                key={cat.id}
                                icon={Tag}
                                label={cat.name_ar || cat.name}
                                selected={formData.category_id === String(cat.id)}
                                onClick={() => updateField('category_id', String(cat.id))}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        الماركة *
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                        {brands.map((brand: any) => (
                            <IconCard
                                key={brand.id}
                                icon={Tag}
                                label={brand.name_ar || brand.name}
                                selected={formData.brand_id === String(brand.id)}
                                onClick={() => updateField('brand_id', String(brand.id))}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        الموديل *
                    </label>
                    <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => updateField('model', e.target.value)}
                        placeholder="كامري"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                        required
                    />
                </div>
            </>
        )}
    </motion.div>
);

// Step 3: Specs with IconCards and NumberSelector
const Step3Specs: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                ناقل الحركة *
            </label>
            <div className="grid grid-cols-2 gap-4">
                <IconCard
                    icon={Zap}
                    label="أوتوماتيك"
                    selected={formData.transmission === 'automatic'}
                    onClick={() => updateField('transmission', 'automatic')}
                />
                <IconCard
                    icon={Settings}
                    label="يدوي"
                    selected={formData.transmission === 'manual'}
                    onClick={() => updateField('transmission', 'manual')}
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                نوع الوقود *
            </label>
            <div className="grid grid-cols-4 gap-3">
                <IconCard icon={Fuel} label="بنزين" selected={formData.fuel_type === 'gasoline'} onClick={() => updateField('fuel_type', 'gasoline')} />
                <IconCard icon={Droplets} label="ديزل" selected={formData.fuel_type === 'diesel'} onClick={() => updateField('fuel_type', 'diesel')} />
                <IconCard icon={Zap} label="كهرباء" selected={formData.fuel_type === 'electric'} onClick={() => updateField('fuel_type', 'electric')} />
                <IconCard icon={Star} label="هايبرد" selected={formData.fuel_type === 'hybrid'} onClick={() => updateField('fuel_type', 'hybrid')} />
            </div>
        </div>

        <NumberSelector
            label="عدد الأبواب"
            value={formData.doors}
            options={[2, 4, 5]}
            onChange={(v) => updateField('doors', v)}
            icon={<DoorOpen className="w-4 h-4" />}
        />

        <NumberSelector
            label="عدد المقاعد"
            value={formData.seats}
            options={[2, 4, 5, 7, 8]}
            onChange={(v) => updateField('seats', v)}
            icon={<Users className="w-4 h-4" />}
        />

        <ColorPicker
            label="اللون الخارجي"
            selectedColor={formData.color}
            onChange={(color) => updateField('color', color)}
        />
    </motion.div>
);

// Step 4: Condition with Presets
const Step4Condition: React.FC<any> = ({ formData, updateField, selectedPresetId, setSelectedPresetId }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <ConditionPresets
            onSelect={(preset) => {
                updateField('condition', preset.condition);
                updateField('body_condition', preset.bodyCondition);
                setSelectedPresetId(preset.id);
            }}
            selectedId={selectedPresetId}
        />

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                وصف الحالة (اختياري)
            </label>
            <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="اذكر أي تفاصيل إضافية عن حالة السيارة..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            />
        </div>
    </motion.div>
);

// Step 5: Media with PhotoUploader
const Step5Media: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <PhotoUploader
            photos={formData.photos}
            onPhotosChange={(photos) => updateField('photos', photos)}
            maxPhotos={15}
        />

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                رابط فيديو (اختياري)
            </label>
            <input
                type="url"
                value={formData.video_url}
                onChange={(e) => updateField('video_url', e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
            />
        </div>
    </motion.div>
);

// Step 6: Review
const Step6Review: React.FC<any> = ({ formData, brands, categories, updateField }) => {
    const selectedBrand = brands.find((b: any) => String(b.id) === formData.brand_id);
    const selectedCategory = categories.find((c: any) => String(c.id) === formData.category_id);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
        >
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-primary" />
                    <span className="font-bold">العنوان:</span>
                    <span>{formData.title}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-primary" />
                    <span className="font-bold">السيارة:</span>
                    <span>{selectedBrand?.name_ar || selectedBrand?.name} {formData.model} {formData.year}</span>
                </div>
                <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-primary" />
                    <span className="font-bold">السعر:</span>
                    <span>{formData.price} ل.س</span>
                </div>
                <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-primary" />
                    <span className="font-bold">الصور:</span>
                    <span>{formData.photos.length} صور</span>
                </div>
                <div className="flex items-center gap-3">
                    <Gauge className="w-5 h-5 text-primary" />
                    <span className="font-bold">الكيلومترات:</span>
                    <span>{formData.mileage} كم</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    السعر *
                </label>
                <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                />
            </div>
        </motion.div>
    );
};
