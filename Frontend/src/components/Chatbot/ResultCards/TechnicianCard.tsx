import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Phone, MessageCircle, MapPin, Star, BadgeCheck,
    Wrench, Heart, Share2, Eye, User
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TechnicianCardProps {
    id: number | string;
    name: string;
    specialty: string;
    rating?: number;
    city: string;
    distance?: string;
    isVerified: boolean | number;
    phone: string;
    whatsapp?: string;
    description?: string;
    profile_photo?: string;
    cover_image?: string;
    // Note: years_experience removed - field doesn't exist in database
    url?: string;
}

/**
 * PremiumTechnicianCard - Enhanced chatbot result card for technicians
 * Matches the premium design of SaleCarCard and RentCarCard
 */
export const PremiumTechnicianCard: React.FC<TechnicianCardProps> = ({
    id,
    name,
    specialty,
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
            const message = encodeURIComponent(`مرحباً، أنا بحاجة لخدمات ${specialty}`);
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
                    ? "border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30"
                    : "border-slate-200 dark:border-slate-700"
            )}
            onClick={handleView}
        >
            {/* Cover Image */}
            <div className="relative w-full h-24 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-900/30 dark:to-teal-900/30 overflow-hidden">
                {cover_image ? (
                    <img
                        src={cover_image}
                        alt="Workshop"
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                {/* Distance Badge */}
                {distance && (
                    <div className="absolute top-2 left-2 bg-emerald-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md backdrop-blur-sm">
                        <MapPin className="w-3 h-3" />
                        {distance}
                    </div>
                )}

                {/* Verified Badge */}
                {verified && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">موثوق</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3 gap-3 relative -mt-10">
                {/* Profile Section */}
                <div className="flex items-end gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink0">
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
                            "w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-lg",
                            profile_photo && "hidden"
                        )}>
                            <Wrench className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
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

                {/* Name & Specialty */}
                <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium">{specialty}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <MapPin className="w-3 h-3" />
                        <span>{city}</span>
                    </div>
                </div>

                {/* Description */}
                {description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                )}

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    {/* Actions Row */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>اضغط للتفاصيل</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleFavorite}
                                className={cn(
                                    "p-2 rounded-full transition-all border",
                                    isFavorited
                                        ? "bg-red-50 border-red-200 text-red-500"
                                        : "border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50 bg-white dark:bg-slate-800 dark:border-slate-700"
                                )}
                                aria-label="مفضلة"
                            >
                                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 bg-white dark:bg-slate-800 transition-all"
                                aria-label="مشاركة"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Contact Buttons */}
                    {(phone || whatsapp) && (
                        <div className="grid grid-cols-2 gap-2">
                            {phone && (
                                <button
                                    onClick={handleCall}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    اتصل
                                </button>
                            )}
                            {(whatsapp || phone) && (
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-semibold shadow-sm transition-all"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    واتساب
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </motion.article>
    );
};

// Keep backward compatibility with old export
export const TechnicianCard = PremiumTechnicianCard;
