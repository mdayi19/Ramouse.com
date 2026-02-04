import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, MessageCircle, MapPin, Star, BadgeCheck,
    Truck, Heart, Share2, Eye, User, Navigation
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TowTruckCardProps {
    id: number | string;
    name: string;
    vehicleType: string;
    rating?: number;
    city: string;
    distance?: string;
    isVerified: boolean | number;
    phone: string;
    whatsapp?: string;
    description?: string;
    profile_photo?: string;
    cover_image?: string;
    url?: string;
}

/**
 * Premium TowTruck Card Component
 * Matches the premium design of TechnicianCard
 */
export const TowTruckCard: React.FC<TowTruckCardProps> = ({
    id,
    name,
    vehicleType,
    rating = 0,
    city,
    distance,
    isVerified,
    phone,
    whatsapp,
    description,
    profile_photo,
    cover_image,
    url
}) => {
    const [isFavorited, setIsFavorited] = useState(false);
    const verified = Boolean(isVerified);

    // Handlers
    const handleView = () => {
        if (url) {
            window.location.href = url;
        }
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phone) {
            window.location.href = `tel:${phone}`;
        }
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        const number = whatsapp || phone;
        if (number) {
            const message = encodeURIComponent(`مرحباً، أحتاج خدمة سطحة (${vehicleType})`);
            window.open(`https://wa.me/${number.replace(/\D/g, '')}?text=${message}`, '_blank');
        }
    };

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorited(!isFavorited);
        // TODO: Backend integration
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}${url}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: name, url: shareUrl });
            } catch { }
        } else {
            navigator.clipboard.writeText(shareUrl);
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
                verified
                    ? "border-blue-400 dark:border-blue-600 ring-1 ring-blue-400/30"
                    : "border-slate-200 dark:border-slate-700"
            )}
            onClick={handleView}
        >
            {/* Header / Cover Image */}
            <div className="relative h-32 overflow-hidden bg-slate-100 dark:bg-slate-900">
                {cover_image ? (
                    <img
                        src={cover_image}
                        alt="Cover"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-600 to-orange-600 opacity-90" />
                )}

                {/* Overlay Text/Badges */}
                <div className="absolute inset-x-0 top-0 p-3 flex justify-between items-start">
                    {distance ? (
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 shadow-sm border border-white/10">
                            <Navigation className="w-3 h-3" />
                            {distance}
                        </span>
                    ) : <div></div>}

                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleFavorite}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
                        >
                            <Heart className={cn("w-4 h-4", isFavorited ? "fill-red-500 text-red-500" : "")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="relative px-4 pb-4 flex flex-col flex-grow">
                {/* Avatar */}
                <div className="flex justify-between items-end -mt-10 mb-3">
                    <div className="relative">
                        {profile_photo ? (
                            <img
                                src={profile_photo}
                                alt={name}
                                className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg"
                                loading="lazy"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={cn(
                            "w-20 h-20 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/30 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-lg",
                            profile_photo && "hidden"
                        )}>
                            <Truck className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="flex flex-col gap-1 mb-1">
                        {rating > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                    {rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Name & Details */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">
                            {name}
                        </h3>
                        {verified && (
                            <BadgeCheck className="w-5 h-5 text-blue-500" fill="currentColor" color="white" />
                        )}
                    </div>

                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-sm text-slate-500 dark:text-slate-400 mb-2">
                        <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{vehicleType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{city}</span>
                        </div>
                    </div>

                    {/* Description Preview */}
                    {description && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                        onClick={handleCall}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
                    >
                        <Phone className="w-4 h-4" />
                        <span className="hidden sm:inline">اتصال</span>
                        <span className="sm:hidden">اتصال</span>
                    </button>

                    <button
                        onClick={handleWhatsApp}
                        className={cn(
                            "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-bold text-sm transition-colors shadow-sm",
                            whatsapp
                                ? "bg-green-500 hover:bg-green-600 shadow-green-200 dark:shadow-none"
                                : "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none"
                        )}
                    >
                        {whatsapp ? (
                            <>
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">واتساب</span>
                                <span className="sm:hidden">واتساب</span>
                            </>
                        ) : (
                            <>
                                <Phone className="w-4 h-4" />
                                <span>طلب الآن</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
