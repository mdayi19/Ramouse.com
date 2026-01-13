import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Share2, MapPin, Gauge, GitFork, Calendar,
    Fuel, Car, Eye, CheckCircle, GitCompare
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
}

export const CarListingCard: React.FC<CarListingCardProps> = ({ listing, viewMode, showToast }) => {
    const navigate = useNavigate();
    const { addItem, removeItem, isInComparison, items } = useComparison();
    const [isFavorited, setIsFavorited] = useState(false); // In real app, init from props/store
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const inComparison = isInComparison(listing.id);

    // Get images ensuring at least one exists
    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : (listing.images && listing.images.length > 0)
            ? listing.images
            : ['/placeholder-car.jpg'];

    const handleView = (e: React.MouseEvent) => {
        // Prevent navigation if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        navigate(`/car-listings/${listing.slug}`);
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
            showToast?.(isFavorited ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة', 'success');
        } catch (error) {
            console.error('Favorite error:', error);
            // Optimistic update fallback or error toast could go here
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/car-listings/${listing.slug}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: listing.description,
                    url: url,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            showToast?.('تم نسخ الرابط', 'success');
        }
    };

    const handleCompare = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', {
            style: 'currency',
            currency: 'SYP',
            maximumFractionDigits: 0
        }).format(price);
    };

    // Helper to get Brand/Model text safely
    const getBrandName = () => {
        if (typeof listing.brand === 'object') return listing.brand.name_ar || listing.brand.name;
        return listing.brand || '';
    };

    const getModelName = () => {
        return listing.model || '';
    };

    //Card Content for reuse in Grid/List layouts
    const CardContent = () => (
        <div className="flex flex-col h-full">
            {/* Header: Title, Price, Brand */}
            <div className="p-4 pb-2">
                <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-base mb-2 group-hover:text-primary transition-colors">
                    {listing.title}
                </h3>

                {/* Badges - Similar to CarListingDetail */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {getBrandName() && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-md font-semibold text-xs border border-blue-100 dark:border-blue-800">
                            <Car className="w-2.5 h-2.5" />
                            {getBrandName()}
                        </span>
                    )}
                    {getModelName() && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-md font-semibold text-xs border border-violet-100 dark:border-violet-800">
                            {getModelName()}
                        </span>
                    )}
                    {listing.year && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-md font-semibold text-xs border border-amber-100 dark:border-amber-800">
                            {listing.year}
                        </span>
                    )}
                    {listing.mileage && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-md font-semibold text-xs border border-emerald-100 dark:border-emerald-800">
                            {listing.mileage >= 1000 ? `${(listing.mileage / 1000).toFixed(0)}k كم` : `${listing.mileage} كم`}
                        </span>
                    )}
                    {listing.transmission && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 rounded-md font-semibold text-xs border border-teal-100 dark:border-teal-800">
                            {listing.transmission}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">
                        {formatPrice(listing.price)}
                    </span>
                    {listing.listing_type === 'rent' && (
                        <span className="text-xs text-slate-500">/ يوم</span>
                    )}
                </div>
            </div>



            {/* Footer: Location, Provider & Compare Button */}
            <div className="p-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{listing.city || listing.address || 'سوريا'}</span>
                </div>
                <button
                    onClick={handleCompare}
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-xs font-medium flex-shrink-0",
                        inComparison
                            ? "bg-primary text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-primary hover:text-white"
                    )}
                    title={inComparison ? "إزالة من المقارنة" : "إضافة للمقارنة"}
                >
                    <GitCompare className="w-3.5 h-3.5" />
                    {inComparison && <span className="hidden sm:inline">({items.length})</span>}
                </button>
            </div>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <motion.article
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    borderColor: "var(--primary-color, #3b82f6)",
                    scale: 1.01
                }}
                transition={{ duration: 0.2 }}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex flex-row h-32 sm:h-48 items-stretch mb-4 shadow-sm"
                onClick={handleView}
            >
                {/* Image Section (Left/Top) */}
                <div className="w-32 sm:w-64 relative flex-shrink-0 overflow-hidden group/image">
                    <OptimizedImage
                        src={images[0]}
                        alt={`${listing.title} ${listing.year} - ${listing.city || 'سوريا'}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 absolute inset-0"
                    />

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white/20 font-black text-xl sm:text-3xl -rotate-45 select-none font-sans whitespace-nowrap"
                            style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                            RAMOUSE.COM
                        </span>
                    </div>

                    <div className="absolute top-2 left-2 flex gap-1 z-20">
                        {listing.is_sponsored && (
                            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded shadow-sm">
                                مميز
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between p-2 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">{listing.title}</h3>

                            {/* Badges - Same as grid view */}
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {getBrandName() && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-md font-semibold text-xs border border-blue-100 dark:border-blue-800">
                                        <Car className="w-2.5 h-2.5" />
                                        {getBrandName()}
                                    </span>
                                )}
                                {getModelName() && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-md font-semibold text-xs border border-violet-100 dark:border-violet-800">
                                        {getModelName()}
                                    </span>
                                )}
                                {listing.year && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-md font-semibold text-xs border border-amber-100 dark:border-amber-800">
                                        {listing.year}
                                    </span>
                                )}
                                {listing.mileage && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-md font-semibold text-xs border border-emerald-100 dark:border-emerald-800">
                                        {listing.mileage >= 1000 ? `${(listing.mileage / 1000).toFixed(0)}k كم` : `${listing.mileage} كم`}
                                    </span>
                                )}
                                {listing.transmission && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 rounded-md font-semibold text-xs border border-teal-100 dark:border-teal-800">
                                        {listing.transmission}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <div className="text-lg sm:text-xl font-bold text-primary">{formatPrice(listing.price)}</div>
                            {listing.listing_type === 'rent' && (
                                <span className="text-xs text-slate-500">/ يوم</span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex gap-2">
                            <button
                                onClick={handleFavorite}
                                className={`p-2 rounded-full border ${isFavorited ? 'bg-red-50 border-red-200 text-red-500' : 'border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCompare}
                                className={cn(
                                    "p-2 rounded-full border transition-colors",
                                    inComparison
                                        ? "bg-primary border-primary text-white"
                                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <GitCompare className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-xs sm:text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" /> {listing.city}
                        </span>
                    </div>
                </div>
            </motion.article>
        );
    }

    // Grid View (Default)
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -5,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                borderColor: "var(--primary-color, #3b82f6)"
            }}
            whileTap={{ scale: 0.98 }}
            transition={{
                duration: 0.2,
                ease: "easeOut"
            }}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer h-full flex flex-col"
            onClick={handleView}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setActiveImageIndex(0); }}
        >
            {/* Image Container with Hover Slider */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 group/image">
                <img
                    src={images[activeImageIndex]}
                    alt={`${listing.title} ${listing.year} - ${listing.city || 'سوريا'} - صورة ${activeImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-white/20 font-black text-4xl -rotate-45 select-none font-sans whitespace-nowrap"
                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                        RAMOUSE.COM
                    </span>
                </div>

                {/* Image Navigation Hints (if multiple images) */}
                {isHovered && images.length > 1 && (
                    <div className="absolute inset-0 flex">
                        <div
                            className="w-1/2 h-full cursor-w-resize z-10"
                            onMouseEnter={() => setActiveImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)}
                        // simpler approach: just cycle on hover move or keep it simple with auto-play? 
                        // let's stick to simple "hover adds visual interest" for now. 
                        />
                        <div
                            className="w-1/2 h-full cursor-e-resize z-10"
                            onMouseEnter={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                        />
                    </div>
                )}

                {/* Overlay Gradient - Stronger on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Top Left Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-20">
                    {listing.is_sponsored && (
                        <span className="px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                            <span>★</span> مميز
                        </span>
                    )}
                    {listing.condition === 'new' && (
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-lg shadow-sm">
                            جديد
                        </span>
                    )}
                </div>

                {/* Bottom Left: Photo Count */}
                {images.length > 1 && (
                    <div className="absolute bottom-3 left-3 z-20">
                        <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {images.length}
                        </span>
                    </div>
                )}

                {/* Top Right Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={handleFavorite}
                        className={cn(
                            "p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all",
                            isFavorited
                                ? 'bg-white text-red-500'
                                : 'bg-black/20 text-white hover:bg-white hover:text-red-500'
                        )}
                        title="أضف للمفضلة"
                        aria-label={isFavorited ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                    >
                        <Heart className={`w-4.5 h-4.5 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleCompare}
                        className={cn(
                            "p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all relative",
                            inComparison
                                ? 'bg-white text-primary'
                                : 'bg-black/20 text-white hover:bg-white hover:text-primary'
                        )}
                        title={inComparison ? "إزالة من المقارنة" : "إضافة للمقارنة"}
                        aria-label="مقارنة السيارات"
                    >
                        <GitCompare className="w-4.5 h-4.5" />
                        {inComparison && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {items.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2.5 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-blue-600 shadow-lg transition-all"
                        title="مشاركة"
                        aria-label="مشاركة الإعلان"
                    >
                        <Share2 className="w-4.5 h-4.5" />
                    </button>
                </div>

                {/* Image Dots (if hovered) */}
                {isHovered && images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
                        {images.slice(0, 5).map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeImageIndex ? 'bg-white' : 'bg-white/40'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <CardContent />
        </motion.article>
    );
};
