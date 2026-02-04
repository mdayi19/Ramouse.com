import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Calendar, Gauge, Settings, Phone, MessageCircle, Heart, Navigation, Eye } from 'lucide-react';

interface EnhancedCarCardProps {
    id: number;
    title: string;
    price: string;
    year: number;
    mileage: string;
    city: string;
    brand?: string;
    model?: string;
    image?: string;
    url: string;
    condition: string;
    transmission: string;
    phone?: string;
    whatsapp?: string;
    distance?: number; // Distance in km
    rating?: number;
    views?: number;
}

/**
 * EnhancedCarCard Component
 * Car listing card with quick action buttons (call, WhatsApp, save, directions)
 */
export const EnhancedCarCard: React.FC<EnhancedCarCardProps> = ({
    id,
    title,
    price,
    year,
    mileage,
    city,
    brand,
    model,
    image,
    url,
    condition,
    transmission,
    phone,
    whatsapp,
    distance,
    rating,
    views
}) => {
    const [isSaved, setIsSaved] = useState(false);

    const conditionLabels: Record<string, string> = {
        new: 'جديد',
        used: 'مستعمل',
        certified_pre_owned: 'مستعمل معتمد'
    };

    const transmissionLabels: Record<string, string> = {
        automatic: 'أوتوماتيك',
        manual: 'عادي'
    };

    /**
     * Handle call action
     */
    const handleCall = (e: React.MouseEvent) => {
        e.preventDefault();
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    /**
     * Handle WhatsApp action
     */
    const handleWhatsApp = (e: React.MouseEvent) => {
        e.preventDefault();
        if (whatsapp) {
            const message = encodeURIComponent(`مرحباً، أنا مهتم بـ ${title}`);
            window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
        }
    };

    /**
     * Handle save/favorite toggle
     */
    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsSaved(!isSaved);
        // TODO: Integrate with backend to save favorite
    };

    /**
     * Handle get directions
     */
    const handleDirections = (e: React.MouseEvent) => {
        e.preventDefault();
        // Open Google Maps with car location
        window.open(`https://www.google.com/maps/search/${encodeURIComponent(city)}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-lg"
        >
            {/* Car Image */}
            <div className="relative h-48 bg-slate-100 dark:bg-slate-900 overflow-hidden group/image">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                        🚗
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {condition === 'new' && (
                        <span className="px-2 py-1 rounded-lg bg-green-500 text-white text-xs font-bold shadow-lg">
                            جديد
                        </span>
                    )}
                    {distance !== undefined && (
                        <span className="px-2 py-1 rounded-lg bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {distance} كم
                        </span>
                    )}
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    aria-label={isSaved ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
                >
                    <Heart
                        className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-slate-600 dark:text-slate-300'}`}
                    />
                </button>
            </div>

            {/* Car Details */}
            <div className="p-4 space-y-3">
                {/* Title & Price */}
                <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1 line-clamp-2">
                        {title}
                    </h4>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {price}
                    </div>
                </div>

                {/* Specs */}
                <div className="flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs">
                        <Calendar className="w-3 h-3" />
                        {year}
                    </span>
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs">
                        <Gauge className="w-3 h-3" />
                        {mileage}
                    </span>
                    {transmission && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs">
                            <Settings className="w-3 h-3" />
                            {transmissionLabels[transmission] || transmission}
                        </span>
                    )}
                    {city && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 text-xs">
                            <MapPin className="w-3 h-3" />
                            {city}
                        </span>
                    )}
                </div>

                {/* Stats */}
                {(rating || views) && (
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {rating && (
                            <span className="flex items-center gap-1">
                                ⭐ {rating.toFixed(1)}
                            </span>
                        )}
                        {views && (
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {views} مشاهدة
                            </span>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                    {phone && (
                        <button
                            onClick={handleCall}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <Phone className="w-4 h-4" />
                            اتصل
                        </button>
                    )}

                    {whatsapp && (
                        <button
                            onClick={handleWhatsApp}
                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            <MessageCircle className="w-4 h-4" />
                            واتساب
                        </button>
                    )}

                    <button
                        onClick={handleDirections}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <Navigation className="w-4 h-4" />
                        اتجاهات
                    </button>

                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-4 h-4" />
                        التفاصيل
                    </a>
                </div>
            </div>
        </motion.div>
    );
};
