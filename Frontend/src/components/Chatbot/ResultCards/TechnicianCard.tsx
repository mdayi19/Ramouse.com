import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Calendar, Star, MapPin, Navigation, Wrench, Clock, DollarSign } from 'lucide-react';

interface TechnicianCardProps {
    id: number;
    name: string;
    service_types: string[];
    rating: number;
    reviews_count: number;
    price_range: string;
    distance: number;
    availability: string;
    phone: string;
    whatsapp: string;
    photo?: string;
    city: string;
    description?: string;
    verified?: boolean;
}

/**
 * TechnicianCard Component
 * Technician listing card with quick action buttons
 */
export const TechnicianCard: React.FC<TechnicianCardProps> = ({
    id,
    name,
    service_types,
    rating,
    reviews_count,
    price_range,
    distance,
    availability,
    phone,
    whatsapp,
    photo,
    city,
    description,
    verified = false
}) => {
    const [showBooking, setShowBooking] = useState(false);

    const serviceTypeLabels: Record<string, { label: string; icon: string }> = {
        general: { label: 'صيانة عامة', icon: '🔧' },
        electrical: { label: 'كهرباء', icon: '⚡' },
        mechanical: { label: 'ميكانيك', icon: '⚙️' },
        ac: { label: 'تكييف', icon: '❄️' },
        paint: { label: 'دهان', icon: '🎨' },
        inspection: { label: 'فحص', icon: '🔍' }
    };

    const availabilityLabels: Record<string, { label: string; color: string }> = {
        now: { label: 'متاح الآن', color: 'bg-green-500' },
        today: { label: 'متاح اليوم', color: 'bg-blue-500' },
        '24h': { label: 'خلال 24 ساعة', color: 'bg-yellow-500' },
        any: { label: 'حسب الموعد', color: 'bg-slate-500' }
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
        const message = encodeURIComponent(`مرحباً، أحتاج خدمة صيانة`);
        window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    };

    /**
     * Handle book appointment
     */
    const handleBookAppointment = () => {
        const message = encodeURIComponent(
            `مرحباً ${name}، أود حجز موعد للصيانة. هل لديك وقت متاح؟`
        );
        window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
    };

    /**
     * Handle get directions
     */
    const handleDirections = () => {
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(city)}`, '_blank');
    };

    /**
     * Render star rating
     */
    const renderStars = () => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${i < Math.floor(rating)
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
            className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-orange-300 dark:hover:border-orange-700 transition-all hover:shadow-lg"
        >
            {/* Header with Photo */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-b border-orange-100 dark:border-orange-800">
                <div className="flex items-start gap-3">
                    {/* Photo */}
                    <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-2 ring-orange-300 dark:ring-orange-700">
                            {photo ? (
                                <img
                                    src={photo}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                    👨‍🔧
                                </div>
                            )}
                        </div>
                        {verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                                <span className="text-white text-xs">✓</span>
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                                    {name}
                                    {verified && (
                                        <span className="text-blue-500 mr-1" title="موثق">✓</span>
                                    )}
                                </h4>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex gap-0.5">
                                        {renderStars()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        {rating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        ({reviews_count} تقييم)
                                    </span>
                                </div>
                            </div>

                            {/* Availability Badge */}
                            <div className={`px-2 py-1 rounded-lg ${availabilityLabels[availability]?.color || 'bg-slate-500'} text-white text-xs font-bold flex items-center gap-1 whitespace-nowrap`}>
                                <Clock className="w-3 h-3" />
                                {availabilityLabels[availability]?.label || availability}
                            </div>
                        </div>

                        {/* Distance & City */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {distance.toFixed(1)} كم • {city}
                            </span>
                            <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {price_range}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
                {/* Service Types */}
                <div>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        الخدمات المقدمة:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {service_types.map((type) => {
                            const serviceInfo = serviceTypeLabels[type] || { label: type, icon: '🔧' };
                            return (
                                <span
                                    key={type}
                                    className="px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-medium flex items-center gap-1"
                                >
                                    <span>{serviceInfo.icon}</span>
                                    {serviceInfo.label}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {description}
                    </p>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        onClick={handleCall}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <Phone className="w-4 h-4" />
                        اتصل الآن
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <MessageCircle className="w-4 h-4" />
                        واتساب
                    </button>

                    <button
                        onClick={handleBookAppointment}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <Calendar className="w-4 h-4" />
                        احجز موعد
                    </button>

                    <button
                        onClick={handleDirections}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <Navigation className="w-4 h-4" />
                        اتجاهات
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
