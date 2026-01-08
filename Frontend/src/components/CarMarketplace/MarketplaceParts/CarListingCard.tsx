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

    // Card Content for reuse in Grid/List layouts
    const CardContent = () => (
        <div className="flex flex-col h-full">
            {/* Header: Title, Price, Brand */}
            <div className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                            {getBrandName() && (
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                                    {getBrandName()}
                                </span>
                            )}
                            {getModelName() && <span>{getModelName()}</span>}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg group-hover:text-primary transition-colors">
                            {listing.title}
                        </h3>
                    </div>
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-bold text-primary">
                        {formatPrice(listing.price)}
                    </span>
                    {listing.listing_type === 'rent' && (
                        <span className="text-xs text-slate-500">/ يوم</span>
                    )}
                </div>
            </div>

            {/* Specs Grid */}
            <div className="px-4 py-3 border-y border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 mt-auto">
                <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-white dark:bg-slate-700 shadow-sm text-center">
                        <Calendar className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{listing.year}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-white dark:bg-slate-700 shadow-sm text-center">
                        <Gauge className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200" dir="ltr">
                            {listing.mileage >= 1000 ? `${(listing.mileage / 1000).toFixed(0)}k` : listing.mileage}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-2 rounded bg-white dark:bg-slate-700 shadow-sm text-center">
                        <GitFork className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                            {listing.transmission}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer: Location & Provider */}
            <div className="p-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 truncate max-w-[60%]">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{listing.city || listing.address || 'سوريا'}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate max-w-[40%]">
                    {listing.seller_type === 'provider' && (
                        <>
                            <Car className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{listing.owner?.name || 'معرض'}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row h-auto sm:h-48"
                onClick={handleView}
            >
                {/* Image Section (Left/Top) */}
                <div className="w-full sm:w-64 h-48 sm:h-full relative flex-shrink-0 overflow-hidden">
                    <img
                        src={images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                        {listing.is_sponsored && (
                            <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded shadow-sm">
                                مميز
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">{listing.year}</span>
                                <span>•</span>
                                <span>{getBrandName()}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{listing.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {listing.mileage.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><GitFork className="w-4 h-4" /> {listing.transmission}</span>
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="text-xl font-bold text-primary">{formatPrice(listing.price)}</div>
                            <div className="text-xs text-slate-400 mt-1">{listing.created_at ? new Date(listing.created_at).toLocaleDateString('ar-SY') : ''}</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
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
                        </div>
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                            <MapPin className="w-4 h-4" /> {listing.city}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Grid View (Default)
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col"
            onClick={handleView}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setActiveImageIndex(0); }}
        >
            {/* Image Container with Hover Slider */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                    src={images[activeImageIndex]}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

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

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Top Badges */}
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

                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={handleFavorite}
                        className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all ${isFavorited ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                        title="Add to favorites"
                    >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-blue-600 shadow-lg transition-all"
                        title="Share"
                    >
                        <Share2 className="w-4 h-4" />
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
        </motion.div>
    );
};
