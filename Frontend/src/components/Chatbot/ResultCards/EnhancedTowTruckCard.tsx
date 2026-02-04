import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, AlertCircle, MapPin, Navigation, Truck, Clock, DollarSign, Star } from 'lucide-react';

interface EnhancedTowTruckCardProps {
    id: number;
    provider_name: string;
    truck_type: string;
    service_types: string[];
    availability: string;
    distance: number;
    price_estimate: string;
    rating: number;
    reviews_count?: number;
    phone: string;
    whatsapp: string;
    emergency_available: boolean;
    city: string;
    response_time?: string;
}

/**
 * EnhancedTowTruckCard Component
 * Tow truck provider card with emergency request capability
 */
export const EnhancedTowTruckCard: React.FC<EnhancedTowTruckCardProps> = ({
    id,
    provider_name,
    truck_type,
    service_types,
    availability,
    distance,
    price_estimate,
    rating,
    reviews_count = 0,
    phone,
    whatsapp,
    emergency_available,
    city,
    response_time
}) => {
    const [requestingEmergency, setRequestingEmergency] = useState(false);

    const truckTypeLabels: Record<string, { label: string; icon: string }> = {
        small: { label: 'سطحة صغيرة', icon: '🚗' },
        medium: { label: 'سطحة متوسطة', icon: '🚙' },
        large: { label: 'سطحة كبيرة', icon: '🚛' },
        hydraulic: { label: 'سطحة هيدروليك', icon: '⚙️' }
    };

    const serviceTypeLabels: Record<string, string> = {
        standard: 'سطحة عادية',
        winch: 'ونش',
        emergency: 'طوارئ 24/7'
    };

    const availabilityLabels: Record<string, { label: string; color: string }> = {
        now: { label: 'متاح الآن', color: 'bg-green-500' },
        today: { label: 'متاح اليوم', color: 'bg-blue-500' },
        any: { label: 'حسب الحاجة', color: 'bg-slate-500' }
    };

    /**
     * Handle emergency request
     */
    const handleEmergencyRequest = () => {
        setRequestingEmergency(true);
        // Get user location and send request
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // TODO: Send emergency request to backend
                    console.log('Emergency request:', { provider_id: id, latitude, longitude });
                    // For now, call directly
                    window.location.href = `tel:${phone}`;
                },
                () => {
                    // Fallback to direct call if location fails
                    window.location.href = `tel:${phone}`;
                }
            );
        } else {
            window.location.href = `tel:${phone}`;
        }
    };

    /**
     * Handle call action
     */
    const handleCall = () => {
        window.location.href = `tel:${phone}`;
    };

    /**
     * Handle WhatsApp action
     */
    const handleWhatsApp = () => {
        const message = encodeURIComponent(`مرحباً، أحتاج خدمة سطحة`);
        window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    };

    /**
     * Handle share location
     */
    const handleShareLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    const message = encodeURIComponent(`موقعي الحالي: ${locationUrl}`);
                    window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
                },
                () => {
                    alert('لم نتمكن من الحصول على موقعك');
                }
            );
        } else {
            alert('المتصفح لا يدعم خدمة الموقع');
        }
    };

    /**
     * Render star rating
     */
    const renderStars = () => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
            />
        ));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-red-300 dark:hover:border-red-700 transition-all hover:shadow-lg"
        >
            {/* Emergency Banner (if available) */}
            {emergency_available && (
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                        <span className="font-bold text-sm">متاح للطوارئ 24/7</span>
                    </div>
                    {response_time && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">
                            وقت الاستجابة: {response_time}
                        </span>
                    )}
                </div>
            )}

            {/* Header */}
            <div className="p-4 space-y-3">
                {/* Title & Rating */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                            {provider_name}
                        </h4>

                        {/* Rating */}
                        {reviews_count > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    {renderStars()}
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {rating.toFixed(1)}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    ({reviews_count})
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Availability Badge */}
                    <div className={`px-2 py-1 rounded-lg ${availabilityLabels[availability]?.color || 'bg-slate-500'} text-white text-xs font-bold flex items-center gap-1 whitespace-nowrap`}>
                        <Clock className="w-3 h-3" />
                        {availabilityLabels[availability]?.label || availability}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Truck Type */}
                    <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                نوع السطحة
                            </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <span>{truckTypeLabels[truck_type]?.icon || '🚛'}</span>
                            {truckTypeLabels[truck_type]?.label || truck_type}
                        </div>
                    </div>

                    {/* Distance */}
                    <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900/50">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                المسافة
                            </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {distance.toFixed(1)} كم • {city}
                        </div>
                    </div>
                </div>

                {/* Price Estimate */}
                <div className="px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                السعر التقريبي:
                            </span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                            {price_estimate}
                        </span>
                    </div>
                </div>

                {/* Service Types */}
                <div className="flex flex-wrap gap-1.5">
                    {service_types.map((type) => (
                        <span
                            key={type}
                            className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium"
                        >
                            {serviceTypeLabels[type] || type}
                        </span>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                    {/* Emergency Request Button */}
                    {emergency_available && (
                        <button
                            onClick={handleEmergencyRequest}
                            disabled={requestingEmergency}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            <AlertCircle className="w-5 h-5" />
                            {requestingEmergency ? 'جاري الطلب...' : '🚨 طلب سطحة الآن'}
                        </button>
                    )}

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={handleCall}
                            className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <Phone className="w-3.5 h-3.5" />
                            اتصل
                        </button>

                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            واتساب
                        </button>

                        <button
                            onClick={handleShareLocation}
                            className="flex items-center justify-center gap-1 px-2 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            موقعي
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
