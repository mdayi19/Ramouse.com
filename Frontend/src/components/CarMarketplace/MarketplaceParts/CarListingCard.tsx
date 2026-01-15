import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Share2, MapPin, GitFork, Fuel, Eye, Star, GitCompare, Gauge
} from 'lucide-react';
import { CarListing, CarProviderService } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { OptimizedImage } from './OptimizedImage';
import { useComparison } from '../../../hooks/useComparison';

interface CarListingCardProps {
    listing: CarListing;
    viewMode: 'grid' | 'list';
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
    isSponsoredInjection?: boolean;
}

// --- Helper: Translations ---
const specTranslations: { [key: string]: string } = {
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

// --- Helper: Price Formatting ---
const formatPrice = (price: number | undefined): string => {
    if (!price) return 'اتصل';
    return new Intl.NumberFormat('ar-SY', {
        style: 'currency',
        currency: 'SYP',
        maximumFractionDigits: 0
    }).format(price);
};

// --- Sub-Component: Specs Row ---
const SpecsRow = ({ listing }: { listing: CarListing }) => {
    // Robust Brand Extraction
    const getBrandName = () => {
        if (!listing.brand) return '';
        if (typeof listing.brand === 'object') {
            return listing.brand.name_ar || listing.brand.name || '';
        }
        return listing.brand;
    };

    const brandName = getBrandName();

    return (
        <div className="flex flex-nowrap items-center gap-1.5 text-[10px] text-slate-500 mb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Brand */}
            {brandName && (
                <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {brandName}
                </span>
            )}
            {/* Model */}
            {listing.model && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {listing.model}
                </span>
            )}
            {/* Year */}
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {listing.year}
            </span>
            {/* Mileage */}
            {listing.mileage && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                    {listing.mileage.toLocaleString()} km
                </span>
            )}
            {/* Transmission */}
            {listing.transmission && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {translateSpec(listing.transmission)}
                </span>
            )}
            {/* Fuel */}
            {listing.fuel_type && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {translateSpec(listing.fuel_type)}
                </span>
            )}
        </div>
    );
};

// --- Main Component ---
export const CarListingCard: React.FC<CarListingCardProps> = ({
    listing,
    viewMode,
    showToast,
    isAuthenticated,
    onLoginClick,
    isSponsoredInjection
}) => {
    const navigate = useNavigate();
    const { addItem, removeItem, isInComparison, items } = useComparison();
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const inComparison = isInComparison(listing.id);

    // Ensure images exist
    const images = useMemo(() => {
        const imgs = listing.photos?.length ? listing.photos : listing.images;
        return imgs?.length ? imgs : ['/placeholder-car.jpg'];
    }, [listing]);

    // Handlers
    const handleView = () => navigate(`/car-listings/${listing.slug}`);

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            showToast?.('الرجاء تسجيل الدخول لحفظ الإعلانات', 'info');
            onLoginClick?.();
            return;
        }
        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
            showToast?.(isFavorited ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة', 'success');
        } catch { }
    };

    const handleCompare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            showToast?.('الرجاء تسجيل الدخول لإضافة للمقارنة', 'info');
            onLoginClick?.();
            return;
        }
        if (inComparison) {
            removeItem(listing.id);
            showToast?.('تم الإزالة من المقارنة', 'info');
        } else {
            if (items.length >= 4) {
                showToast?.('لا يمكن مقارنة أكثر من 4 سيارات', 'error');
                return;
            }
            addItem(listing);
            showToast?.('تم الإضافة للمقارنة', 'success');
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/car-listings/${listing.slug}`;
        if (navigator.share) {
            try { await navigator.share({ title: listing.title, text: listing.description, url }); }
            catch { }
        } else {
            navigator.clipboard.writeText(url);
            showToast?.('تم نسخ الرابط', 'success');
        }
    };

    // Shared Image Component
    const ListingImage = ({ className }: { className?: string }) => (
        <div className={cn("relative overflow-hidden group/image", className)}>
            <OptimizedImage
                src={images[activeImageIndex]}
                alt={listing.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-2 left-2 flex gap-1 z-10">
                {(listing.is_sponsored || isSponsoredInjection) && (
                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> مميز
                    </span>
                )}
                <span className="px-2 py-0.5 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-medium rounded-full shadow-sm">
                    بيع
                </span>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] rounded-full flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {images.length}
                    </span>
                </div>
            )}
        </div>
    );

    // Shared Actions Component
    const ActionButtons = ({ className }: { className?: string }) => (
        <div className={cn("flex items-center gap-1.5", className)}>
            <button
                onClick={handleFavorite}
                className={cn(
                    "p-2 rounded-full transition-all border",
                    isFavorited ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50 bg-white dark:bg-slate-800 dark:border-slate-700"
                )}
                title="مفضلة"
            >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </button>
            <button
                onClick={handleCompare}
                className={cn(
                    "p-2 rounded-full border transition-all",
                    inComparison ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-slate-50 bg-white dark:bg-slate-800 dark:border-slate-700"
                )}
                title="مقارنة"
            >
                <GitCompare className="w-4 h-4" />
            </button>
            <button
                onClick={handleShare}
                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 hover:bg-slate-50 bg-white dark:bg-slate-800 transition-all"
                title="مشاركة"
            >
                <Share2 className="w-4 h-4" />
            </button>
        </div>
    );

    // --- GRID VIEW RENDER ---
    if (viewMode === 'grid') {
        return (
            <motion.article
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "group flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 h-full cursor-pointer relative",
                    isSponsoredInjection
                        ? "border-yellow-400 dark:border-yellow-600 shadow-md ring-1 ring-yellow-400/30"
                        : "border-slate-200 dark:border-slate-700"
                )}
                onClick={handleView}
            >
                {/* Optional "Sponsored" Label overlay for injected cards specifically if needed, 
                    but the image badge usually suffices. Let's add a subtle background tint for injection. */}
                {isSponsoredInjection && (
                    <div className="absolute inset-0 bg-yellow-50/30 dark:bg-yellow-900/10 pointer-events-none z-0" />
                )}

                {/* Image Area - Aspect 16:10 */}
                <ListingImage className="w-full aspect-[16/10] z-10" />

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-4 gap-3">
                    {/* Header */}
                    <div>
                        <SpecsRow listing={listing} />
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                        </h3>
                    </div>

                    {/* Price - Push to bottom */}
                    <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {formatPrice(listing.price)}
                        </div>
                        <ActionButtons />
                    </div>
                </div>
            </motion.article>
        );
    }

    // --- LIST VIEW RENDER ---
    return (
        <motion.article
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group flex flex-row bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer w-full mb-3"
            onClick={handleView}
        >
            {/* Image Area - Fixed Width */}
            <ListingImage className="w-32 sm:w-64 flex-shrink-0" />

            {/* Content Area */}
            <div className="flex flex-col flex-1 p-3 sm:p-4 gap-2 sm:gap-3 min-w-0">

                {/* Header Row */}
                <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 w-full overflow-hidden">
                        <SpecsRow listing={listing} />
                        <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {listing.title}
                        </h3>
                    </div>
                </div>

                {/* Price Display */}
                <div className="mt-1">
                    <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatPrice(listing.price)}
                    </span>
                    {listing.is_negotiable && (
                        <span className="text-[10px] text-slate-400 mr-2">قابل للتفاوض</span>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="hidden sm:flex justify-between items-end mt-auto pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{listing.city}</span>
                    </div>
                    <ActionButtons />
                </div>

                {/* Mobile Footer */}
                <div className="flex sm:hidden items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <ActionButtons className="gap-1 scale-90 origin-right" />
                    <button className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                        التفاصيل
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
