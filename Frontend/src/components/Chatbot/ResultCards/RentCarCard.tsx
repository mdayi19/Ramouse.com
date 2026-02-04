import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Heart, Share2, MapPin, Calendar, Gauge, Settings,
    Phone, MessageCircle, ExternalLink, Eye, Star,
    ShieldCheck, User
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface RentCarCardProps {
    id: number;
    title: string;
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    rental_terms?: any;
    year: number;
    mileage?: number;
    city: string;
    brand?: string | { name?: string; name_ar?: string };
    model?: string;
    image?: string;
    images?: string[];
    photos?: string[];
    url: string;
    slug?: string;
    transmission?: string;
    fuel_type?: string;
    phone?: string;
    whatsapp?: string;
    is_sponsored?: boolean;
}

// Translations
const specTranslations: Record<string, string> = {
    automatic: 'أوتوماتيك',
    manual: 'عادي',
    petrol: 'بنزين',
    diesel: 'ديزل',
    electric: 'كهرباء',
    hybrid: 'هجين',
    gas: 'غاز',
    plug_in_hybrid: 'هجين بلقبس',
    gasoline: 'بنزين',
    auto: 'أوتوماتيك',
    manual_gear: 'عادي'
};

const translateSpec = (term: string | undefined): string => {
    if (!term) return '';
    const cleanTerm = term.trim().toLowerCase().replace(/_/g, ' ');
    return specTranslations[cleanTerm] ||
        specTranslations[cleanTerm.replace(/\s+/g, '_')] ||
        specTranslations[cleanTerm.split(' ')[0]] ||
        term;
};

const formatPrice = (price: number | undefined): string => {
    if (!price) return 'اتصل';
    return new Intl.NumberFormat('en-US').format(price) + ' $';
};

// Rental Price Grid Component
const RentalPriceGrid = ({ daily, weekly, monthly }: { daily?: number; weekly?: number; monthly?: number }) => (
    <div className="grid grid-cols-3 gap-2 w-full">
        {/* Daily */}
        <div className="group flex flex-col items-center justify-center p-2 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl border border-teal-100 dark:border-teal-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mb-0.5">يومي</span>
            <span className="text-xs font-bold text-teal-800 dark:text-teal-200">{formatPrice(daily)}</span>
        </div>
        {/* Weekly */}
        {weekly ? (
            <div className="group flex flex-col items-center justify-center p-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mb-0.5">أسبوعي</span>
                <span className="text-xs font-bold text-blue-800 dark:text-blue-200">{formatPrice(weekly)}</span>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-50">
                <span className="text-[10px] text-slate-400">-</span>
            </div>
        )}
        {/* Monthly */}
        {monthly ? (
            <div className="group flex flex-col items-center justify-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl border border-purple-100 dark:border-purple-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium mb-0.5">شهري</span>
                <span className="text-xs font-bold text-purple-800 dark:text-purple-200">{formatPrice(monthly)}</span>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-50">
                <span className="text-[10px] text-slate-400">-</span>
            </div>
        )}
    </div>
);

/**
 * RentCarCard - Premium chatbot result card for rental cars
 * Matches the design of RentListingCard from RentCarPage
 */
export const RentCarCard: React.FC<RentCarCardProps> = ({
    id,
    title,
    daily_rate,
    weekly_rate,
    monthly_rate,
    rental_terms,
    year,
    mileage,
    city,
    brand,
    model,
    image,
    images,
    photos,
    url,
    slug,
    transmission,
    fuel_type,
    phone,
    whatsapp,
    is_sponsored
}) => {
    const [isFavorited, setIsFavorited] = useState(false);

    // Get first image
    const displayImage = image || photos?.[0] || images?.[0] || '/placeholder-car.jpg';
    const imageCount = photos?.length || images?.length || (image ? 1 : 0);

    // Extract brand name
    const getBrandName = () => {
        if (!brand) return '';
        if (typeof brand === 'object') {
            return brand.name_ar || brand.name || '';
        }
        return brand;
    };
    const brandName = getBrandName();

    // Parse rental info
    const rentalInfo = useMemo(() => {
        let terms = rental_terms;

        // Try to parse if string
        if (typeof terms === 'string') {
            try {
                terms = JSON.parse(terms);
            } catch (e) {
                console.error("Failed to parse rental terms", e);
                terms = {};
            }
        }

        const isObj = terms && typeof terms === 'object' && !Array.isArray(terms);
        const structured = isObj ? (terms as any) : {};

        return {
            dailyRate: Number(structured.daily_rate || daily_rate),
            weeklyRate: Number(structured.weekly_rate || weekly_rate),
            monthlyRate: Number(structured.monthly_rate || monthly_rate),
            deposit: Number(structured.security_deposit || 0),
            minAge: structured.min_renter_age,
        };
    }, [rental_terms, daily_rate, weekly_rate, monthly_rate]);

    // Build URL - use backend URL if available, fallback to slug
    const carUrl = url || (slug ? `/rent-car/${slug}` : '#');

    // Handlers
    const handleView = () => {
        if (carUrl && carUrl !== '#') {
            window.location.href = carUrl;
        }
    };

    const handleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsFavorited(!isFavorited);
        // TODO: Backend integration
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareUrl = `${window.location.origin}${carUrl}`;
        if (navigator.share) {
            try {
                await navigator.share({ title, url: shareUrl });
            } catch { }
        } else {
            navigator.clipboard.writeText(shareUrl);
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
        if (whatsapp) {
            const message = encodeURIComponent(`مرحباً، أنا مهتم بإيجار ${title}`);
            window.open(`https://wa.me/${whatsapp}?text=${message}`, '_blank');
        }
    };

    return (
        <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group flex flex-col bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer",
                is_sponsored
                    ? "border-teal-400 dark:border-teal-600 ring-1 ring-teal-400/30"
                    : "border-slate-200 dark:border-slate-700"
            )}
            onClick={handleView}
        >
            {/* Sponsored Tint */}
            {is_sponsored && (
                <div className="absolute inset-0 bg-teal-50/30 dark:bg-teal-900/10 pointer-events-none z-0" />
            )}

            {/* Image */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 group/image">
                <img
                    src={displayImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1 z-10">
                    {is_sponsored && (
                        <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> مميز
                        </span>
                    )}
                    <span className="px-2 py-0.5 bg-teal-600/90 backdrop-blur-sm text-white text-[10px] font-medium rounded-full shadow-sm">
                        إيجار
                    </span>
                </div>

                {/* Image Counter */}
                {imageCount > 1 && (
                    <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-full flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {imageCount}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3 gap-3">
                {/* Header */}
                <div>
                    {/* Specs Row */}
                    <div className="flex flex-nowrap items-center gap-1.5 text-[10px] text-slate-500 mb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                        {brandName && (
                            <span className="font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                                {brandName}
                            </span>
                        )}
                        {model && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {model}
                            </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {year}
                        </span>
                        {transmission && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {translateSpec(transmission)}
                            </span>
                        )}
                        {fuel_type && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {translateSpec(fuel_type)}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                        {title}
                    </h3>
                </div>

                {/* Pricing Grid */}
                <div>
                    <RentalPriceGrid
                        daily={rentalInfo.dailyRate}
                        weekly={rentalInfo.weeklyRate}
                        monthly={rentalInfo.monthlyRate}
                    />
                </div>

                {/* Requirements */}
                {(rentalInfo.deposit || rentalInfo.minAge) && (
                    <div className="flex flex-wrap gap-2">
                        {rentalInfo.deposit && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30">
                                <ShieldCheck className="w-3 h-3" /> تأمين: {formatPrice(rentalInfo.deposit)}
                            </span>
                        )}
                        {rentalInfo.minAge && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30">
                                <User className="w-3 h-3" /> العمر: {rentalInfo.minAge}+
                            </span>
                        )}
                    </div>
                )}

                {/* Footer / Location & Actions */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {city}
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
                                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-600 hover:bg-slate-50 bg-white dark:bg-slate-800 transition-all"
                                aria-label="مشاركة"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Contact Actions */}
                    {(phone || whatsapp) && (
                        <div className="grid grid-cols-2 gap-2">
                            {phone && (
                                <button
                                    onClick={handleCall}
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-semibold shadow-sm transition-all"
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                    اتصل
                                </button>
                            )}
                            {whatsapp && (
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

                    {/* View Details Button */}
                    <button
                        onClick={handleView}
                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        عرض التفاصيل
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
