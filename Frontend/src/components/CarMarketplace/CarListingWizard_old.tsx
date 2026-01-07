import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Check, Car, ShoppingCart, RefreshCw,
    Tag, Tags, Settings, Wrench, Camera, CheckCircle, DollarSign,
    Calendar, Gauge, Zap, Fuel, Droplets, Star, Upload, Image,
    DoorOpen, Users, Palette, Rocket
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
        transmission: 'automatic',
        fuel_type: 'gasoline',
        color: '',
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
        'Ïğ┘ä┘àÏ╣┘ä┘ê┘àÏğÏ¬ Ïğ┘äÏúÏ│ÏğÏ│┘èÏ®',
        'Ïğ┘ä┘üÏĞÏ® ┘êÏğ┘ä┘à┘êÏ»┘è┘ä',
        'Ïğ┘ä┘à┘êÏğÏÁ┘üÏğÏ¬',
        'Ïğ┘äÏ¡Ïğ┘äÏ® ┘êÏğ┘ä┘à┘èÏ▓ÏğÏ¬',
        'Ïğ┘äÏÁ┘êÏ▒ ┘êÏğ┘ä┘ü┘èÏ»┘è┘ê',
        'Ïğ┘ä┘àÏ▒ÏğÏ¼Ï╣Ï® ┘êÏğ┘ä┘åÏ┤Ï▒'
    ];

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
            // 1. Upload photos first
            let photoUrls: string[] = [];
            if (formData.photos.length > 0) {
                showToast('Ï¼ÏğÏ▒┘è Ï▒┘üÏ╣ Ïğ┘äÏÁ┘êÏ▒...', 'info');
                const uploadRes = await import('../../services/upload.service').then(m => m.uploadMultipleFiles(formData.photos));
                photoUrls = uploadRes.urls || uploadRes.paths || []; // Adjust based on UploadController response
            }

            // 2. Prepare payload
            const payload = {
                ...formData,
                photos: photoUrls,
                // Ensure numbers are numbers
                price: Number(formData.price),
                year: Number(formData.year),
                mileage: Number(formData.mileage),
                // Map frontend keys to backend expected keys
                car_listing_category_id: Number(formData.category_id),
                doors_count: Number(formData.doors),
                seats_count: Number(formData.seats),
                contact_phone: formData.phone_visible ? userPhone : null,
                // Remove keys that shouldn't be sent or are renamed
                category_id: undefined, // transformed to car_listing_category_id
                doors: undefined,       // transformed to doors_count
                seats: undefined,       // transformed to seats_count
            };

            // Explicitly set brand_id correctly (handle empty string)
            if (formData.brand_id) {
                (payload as any).brand_id = Number(formData.brand_id);
            } else {
                // If required by backend, this might fail validation, but we handle it in UI
                (payload as any).brand_id = null;
            }

            await CarProviderService.createListing(payload);
            showToast('Ï¬┘à ┘åÏ┤Ï▒ Ïğ┘äÏ│┘èÏğÏ▒Ï® Ï¿┘åÏ¼ÏğÏ¡!', 'success');
            onComplete();
        } catch (error: any) {
            console.error('Listing creation failed:', error);
            showToast(error.response?.data?.message || '┘üÏ┤┘ä ┘åÏ┤Ï▒ Ïğ┘äÏ│┘èÏğÏ▒Ï®', 'error');
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
                        ÏÑÏÂÏğ┘üÏ® Ï│┘èÏğÏ▒Ï® Ï¼Ï»┘èÏ»Ï®
                    </h2>
                    <p className="text-white/80 mt-2">
                        Ïğ┘äÏ«ÏÀ┘êÏ® {currentStep} ┘à┘å {totalSteps}: {stepTitles[currentStep - 1]}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-4 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white rounded-full h-2 transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <Step1BasicInfo formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 2 && (
                            <Step2CategoryBrand formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 3 && (
                            <Step3Specs formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 4 && (
                            <Step4Condition formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 5 && (
                            <Step5Media formData={formData} updateField={updateField} />
                        )}
                        {currentStep === 6 && (
                            <Step6Review formData={formData} />
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        ÏÑ┘äÏ║ÏğÏí
                    </button>

                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                <ChevronRight className="w-5 h-5" />
                                Ïğ┘äÏ│ÏğÏ¿┘é
                            </button>
                        )}

                        {currentStep < totalSteps ? (
                            <button
                                onClick={nextStep}
                                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                Ïğ┘äÏ¬Ïğ┘ä┘è
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2 font-bold"
                            >
                                <Check className="w-5 h-5" />
                                ┘åÏ┤Ï▒ Ïğ┘äÏ│┘èÏğÏ▒Ï®
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Step 1: Basic Info
const Step1BasicInfo: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ï╣┘å┘êÏğ┘å Ïğ┘äÏÑÏ╣┘äÏğ┘å *
            </label>
            <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="┘àÏ½Ïğ┘ä: Ï¬┘ê┘è┘êÏ¬Ïğ ┘âÏğ┘àÏ▒┘è 2020"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ┘å┘êÏ╣ Ïğ┘äÏÑÏ╣┘äÏğ┘å *
            </label>
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => updateField('listing_type', 'sale')}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === 'sale'
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                >
                    <div className="font-bold">┘ä┘äÏ¿┘èÏ╣</div>
                </button>
                <button
                    onClick={() => updateField('listing_type', 'rent')}
                    className={`p-4 rounded-xl border-2 transition-all ${formData.listing_type === 'rent'
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                >
                    <div className="font-bold">┘ä┘äÏÑ┘èÏ¼ÏğÏ▒</div>
                </button>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {formData.listing_type === 'sale' ? 'Ïğ┘äÏ│Ï╣Ï▒ (┘ä.Ï│) *' : 'Ïğ┘äÏ│Ï╣Ï▒ (┘ä.Ï│) *'}
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

        {formData.listing_type === 'rent' && (
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ┘üÏ¬Ï▒Ï® Ïğ┘äÏÑ┘èÏ¼ÏğÏ▒
                </label>
                <select
                    value={formData.rent_period}
                    onChange={(e) => updateField('rent_period', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value="daily">┘è┘ê┘à┘è</option>
                    <option value="weekly">ÏúÏ│Ï¿┘êÏ╣┘è</option>
                    <option value="monthly">Ï┤┘çÏ▒┘è</option>
                </select>
            </div>
        )}

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ïğ┘ä┘àÏ»┘è┘åÏ® *
            </label>
            <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Ï»┘àÏ┤┘é"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>
    </motion.div>
);

// Step 2: Category & Brand (simplified - you'll need to fetch categories/brands)
const Step2CategoryBrand: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ïğ┘ä┘üÏĞÏ® *
            </label>
            <select
                value={formData.category_id}
                onChange={(e) => updateField('category_id', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            >
                <option value="">ÏğÏ«Ï¬Ï▒ Ïğ┘ä┘üÏĞÏ®</option>
                <option value="1">Ï│┘èÏ»Ïğ┘å</option>
                <option value="2">SUV</option>
                <option value="3">Ï┤ÏğÏ¡┘åÏ®</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Ïğ┘ä┘à┘êÏ»┘è┘ä *
            </label>
            <input
                type="text"
                value={formData.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="┘âÏğ┘àÏ▒┘è"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                required
            />
        </div>
    </motion.div>
);

// Step 3: Vehicle Specifications
const Step3Specs: React.FC<any> = ({ formData, updateField }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Year */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ï│┘åÏ® Ïğ┘äÏÁ┘åÏ╣ *
                </label>
                <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => updateField('year', parseInt(e.target.value))}
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                    required
                />
            </div>

            {/* Mileage */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ïğ┘ä┘â┘è┘ä┘ê┘àÏ¬Ï▒ÏğÏ¬ Ïğ┘ä┘à┘éÏÀ┘êÏ╣Ï® *
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

            {/* Transmission */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ┘åÏğ┘é┘ä Ïğ┘äÏ¡Ï▒┘âÏ® *
                </label>
                <select
                    value={formData.transmission}
                    onChange={(e) => updateField('transmission', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value="automatic">Ïú┘êÏ¬┘ê┘àÏğÏ¬┘è┘â</option>
                    <option value="manual">┘èÏ»┘ê┘è</option>
                    <option value="cvt">CVT</option>
                </select>
            </div>

            {/* Fuel Type */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    ┘å┘êÏ╣ Ïğ┘ä┘ê┘é┘êÏ» *
                </label>
                <select
                    value={formData.fuel_type}
                    onChange={(e) => updateField('fuel_type', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value="gasoline">Ï¿┘åÏ▓┘è┘å</option>
                    <option value="diesel">Ï»┘èÏ▓┘ä</option>
                    <option value="hybrid">┘çÏğ┘èÏ¿Ï▒Ï»</option>
                    <option value="electric">┘â┘çÏ▒Ï¿ÏğÏĞ┘è</option>
                </select>
            </div>

            {/* Color */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ïğ┘ä┘ä┘ê┘å
                </label>
                <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => updateField('color', e.target.value)}
                    placeholder="ÏúÏ¿┘èÏÂÏî ÏúÏ│┘êÏ»Ïî ┘üÏÂ┘è..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
            </div>

            {/* Doors */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ï╣Ï»Ï» Ïğ┘äÏúÏ¿┘êÏğÏ¿
                </label>
                <select
                    value={formData.doors}
                    onChange={(e) => updateField('doors', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                </select>
            </div>

            {/* Seats */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ï╣Ï»Ï» Ïğ┘ä┘à┘éÏğÏ╣Ï»
                </label>
                <select
                    value={formData.seats}
                    onChange={(e) => updateField('seats', parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                >
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={8}>8</option>
                </select>
            </div>
        </div>

        {/* Description */}
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ┘êÏÁ┘ü Ïğ┘äÏ│┘èÏğÏ▒Ï®
            </label>
            <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="ÏúÏÂ┘ü Ï¬┘üÏğÏÁ┘è┘ä ÏÑÏÂÏğ┘ü┘èÏ® Ï╣┘å Ïğ┘äÏ│┘èÏğÏ▒Ï®..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 resize-none"
            />
        </div>
    </motion.div>
);

const Step4Condition: React.FC<any> = ({ formData, updateField }) => {
    const features = [
        { id: 'leather_seats', label: '┘à┘éÏğÏ╣Ï» Ï¼┘äÏ»' },
        { id: 'sunroof', label: '┘üÏ¬Ï¡Ï® Ï│┘é┘ü' },
        { id: 'navigation', label: '┘åÏ©Ïğ┘à ┘à┘äÏğÏ¡Ï®' },
        { id: 'backup_camera', label: '┘âÏğ┘à┘èÏ▒Ïğ Ï«┘ä┘ü┘èÏ®' },
        { id: 'parking_sensors', label: 'Ï¡Ï│ÏğÏ│ÏğÏ¬ Ï▒┘â┘å' },
        { id: 'cruise_control', label: '┘àÏ½Ï¿Ï¬ Ï│Ï▒Ï╣Ï®' },
        { id: 'bluetooth', label: 'Ï¿┘ä┘êÏ¬┘êÏ½' },
        { id: 'usb', label: 'USB' },
        { id: 'keyless_entry', label: 'Ï»Ï«┘ê┘ä Ï¿Ï»┘ê┘å ┘à┘üÏ¬ÏğÏ¡' },
        { id: 'push_start', label: 'Ï¬Ï┤Ï║┘è┘ä Ï¿ÏÁ┘àÏ®' },
        { id: 'heated_seats', label: '┘à┘éÏğÏ╣Ï» ┘àÏ»┘üÏúÏ®' },
        { id: 'led_lights', label: 'ÏÑÏÂÏğÏíÏ® LED' },
    ];

    const toggleFeature = (featureId: string) => {
        const current = formData.features || [];
        const updated = current.includes(featureId)
            ? current.filter((f: string) => f !== featureId)
            : [...current, featureId];
        updateField('features', updated);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Condition */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Ï¡Ïğ┘äÏ® Ïğ┘äÏ│┘èÏğÏ▒Ï® *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        type="button"
                        onClick={() => updateField('condition', 'new')}
                        className={`p-4 rounded-xl border-2 transition-all ${formData.condition === 'new'
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white">Ï¼Ï»┘èÏ»Ï®</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">┘ä┘à Ï¬Ï│Ï¬Ï«Ï»┘à</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => updateField('condition', 'used')}
                        className={`p-4 rounded-xl border-2 transition-all ${formData.condition === 'used'
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white">┘àÏ│Ï¬Ï╣┘à┘äÏ®</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">Ï¡Ïğ┘äÏ® Ï¼┘èÏ»Ï®</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => updateField('condition', 'certified_pre_owned')}
                        className={`p-4 rounded-xl border-2 transition-all ${formData.condition === 'certified_pre_owned'
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : 'border-slate-300 dark:border-slate-600 hover:border-purple-400'
                            }`}
                    >
                        <div className="font-bold text-slate-900 dark:text-white">┘àÏ╣Ï¬┘àÏ»Ï®</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">┘üÏ¡ÏÁ ┘âÏğ┘à┘ä</div>
                    </button>
                </div>
            </div>

            {/* Features */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Ïğ┘ä┘à┘èÏ▓ÏğÏ¬ (ÏğÏ«Ï¬Ï▒ ┘àÏğ ┘è┘åÏÀÏ¿┘é)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {features.map(feature => (
                        <button
                            key={feature.id}
                            type="button"
                            onClick={() => toggleFeature(feature.id)}
                            className={`p-3 rounded-lg border transition-all text-sm ${(formData.features || []).includes(feature.id)
                                ? 'border-primary bg-primary/10 text-primary font-medium'
                                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary/50'
                                }`}
                        >
                            {feature.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Phone Visibility */}
            <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-700 rounded-xl">
                <input
                    type="checkbox"
                    id="phone_visible"
                    checked={formData.phone_visible}
                    onChange={(e) => updateField('phone_visible', e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="phone_visible" className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                    ÏÑÏ©┘çÏğÏ▒ Ï▒┘é┘à Ïğ┘ä┘çÏğÏ¬┘ü ┘ü┘è Ïğ┘äÏÑÏ╣┘äÏğ┘å
                </label>
            </div>
        </motion.div>
    );
};

const Step5Media: React.FC<any> = ({ formData, updateField }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        updateField('photos', [...formData.photos, ...files]);
    };

    const removePhoto = (index: number) => {
        const updated = formData.photos.filter((_: any, i: number) => i !== index);
        updateField('photos', updated);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Image Upload */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    ÏÁ┘êÏ▒ Ïğ┘äÏ│┘èÏğÏ▒Ï® (Ï¡Ï¬┘ë 10 ÏÁ┘êÏ▒) *
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-primary transition-colors">
                    <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="photo-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Image className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">ÏğÏÂÏ║ÏÀ ┘äÏ▒┘üÏ╣ Ïğ┘äÏÁ┘êÏ▒</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                JPG, PNG, WEBP (Ï¡Ï» Ïú┘éÏÁ┘ë 5MB ┘ä┘â┘ä ÏÁ┘êÏ▒Ï®)
                            </p>
                        </div>
                    </label>
                </div>

                {/* Preview Images */}
                {formData.photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {formData.photos.map((file: File, index: number) => (
                            <div key={index} className="relative group">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    ├ù
                                </button>
                                {index === 0 && (
                                    <span className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                                        Ïğ┘äÏÁ┘êÏ▒Ï® Ïğ┘äÏ▒ÏĞ┘èÏ│┘èÏ®
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video URL (Optional) */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Ï▒ÏğÏ¿ÏÀ ┘ü┘èÏ»┘è┘ê (ÏğÏ«Ï¬┘èÏğÏ▒┘è)
                </label>
                <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => updateField('video_url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    ┘è┘à┘â┘å┘â ÏÑÏÂÏğ┘üÏ® Ï▒ÏğÏ¿ÏÀ ┘ü┘èÏ»┘è┘ê ┘à┘å YouTube Ïú┘ê Vimeo
                </p>
            </div>
        </motion.div>
    );
};

const Step6Review: React.FC<any> = ({ formData }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6"
    >
        <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-4">┘àÏ╣Ïğ┘è┘åÏ® Ïğ┘äÏÑÏ╣┘äÏğ┘å</h3>
            <div className="space-y-2">
                <p><strong>Ïğ┘äÏ╣┘å┘êÏğ┘å:</strong> {formData.title}</p>
                <p><strong>Ïğ┘äÏ│Ï╣Ï▒:</strong> {formData.price} ┘ä.Ï│</p>
                <p><strong>Ïğ┘ä┘å┘êÏ╣:</strong> {formData.listing_type === 'sale' ? '┘ä┘äÏ¿┘èÏ╣' : '┘ä┘äÏÑ┘èÏ¼ÏğÏ▒'}</p>
            </div>
        </div>
    </motion.div>
);
