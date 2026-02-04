import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Heart, Share2, MapPin, Calendar, Gauge, Settings,
    Phone, MessageCircle, ExternalLink, Eye, Star
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface SaleCarCardProps {
    id: number;
    title: string;
    price?: number | string;
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
    condition?: string;
    transmission?: string;
    fuel_type?: string;
    phone?: string;
    whatsapp?: string;
    is_sponsored?: boolean;
    is_negotiable?: boolean;
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

const formatPrice = (price: number | string | undefined): string => {
    if (!price) return 'اتصل';

    // If already formatted (contains '$'), return as-is
    if (typeof price === 'string' && price.includes('$')) {
        return price;
    }

    // Handle European format: "13.000" -> 13000
    let numPrice: number;
    if (typeof price === 'string') {
        // Remove dots and commas (thousands separators) then parse
        const cleaned = price.replace(/[.,]/g, '');
        numPrice = parseFloat(cleaned);
    } else {
        numPrice = price;
    }

    if (isNaN(numPrice)) return 'اتصل';
    return new Intl.NumberFormat('en-US').format(numPrice) + ' $';
};

/**
 * SaleCarCard - Premium chatbot result card for sale cars
 * Matches the design of CarListingCard from CarMarketplacePage
 */
export const SaleCarCard: React.FC<SaleCarCardProps> = ({
    id,
    title,
    price,
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
    condition,
    transmission,
    fuel_type,
    phone,
    whatsapp,
    is_sponsored,
    is_negotiable
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

    // Build URL - use backend URL if available, fallback to slug
    const carUrl = url || (slug ? `/car-listings/${slug}` : '#');

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
            const message = encodeURIComponent(`مرحباً، أنا مهتم بـ ${title}`);
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
                    ? "border-yellow-400 dark:border-yellow-600 ring-1 ring-yellow-400/30"
                    : "border-slate-200 dark:border-slate-700"
            )}
            onClick={handleView}
        >
            {/* Sponsored Tint */}
            {is_sponsored && (
                <div className="absolute inset-0 bg-yellow-50/30 dark:bg-yellow-900/10 pointer-events-none z-0" />
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
                    <span className="px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-medium rounded-full shadow-sm">
                        بيع
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
                            <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md whitespace-nowrap">
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
                        {mileage && (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                                {mileage.toLocaleString()} km
                            </span>
                        )}
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
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{city || 'سوريا'}</span>
                    </div>
                </div>

                {/* Price & Actions */}
                <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {formatPrice(price)}
                            </div>
                            {is_negotiable && (
                                <span className="text-[10px] text-slate-400">قابل للتفاوض</span>
                            )}
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
                                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:bg-slate-50 bg-white dark:bg-slate-800 transition-all"
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
                        className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        عرض التفاصيل
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
