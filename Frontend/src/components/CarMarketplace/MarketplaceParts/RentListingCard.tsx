import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Share2, MapPin, Gauge, GitFork, Calendar,
    Fuel, Car, Eye, CheckCircle, Clock, ShieldCheck
} from 'lucide-react';
import { CarListing, CarProviderService } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion } from 'framer-motion';
import { OptimizedImage } from './OptimizedImage';

interface RentListingCardProps {
    listing: CarListing;
    viewMode: 'grid' | 'list';
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const RentListingCard: React.FC<RentListingCardProps> = ({ listing, viewMode, showToast }) => {
    const navigate = useNavigate();
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Get images ensuring at least one exists
    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : (listing.images && listing.images.length > 0)
            ? listing.images
            : ['/placeholder-car.jpg'];

    const handleView = (e: React.MouseEvent) => {
        // Prevent navigation if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        // Navigate to the RENT specific detail page
        navigate(`/rent-car/${listing.slug}`);
    };

    const handleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
            showToast?.(isFavorited ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة', 'success');
        } catch (error) {
            console.error('Favorite error:', error);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = `${window.location.origin}/rent-car/${listing.slug}`;

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
                                <span className="bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded text-teal-700 dark:text-teal-300">
                                    {getBrandName()}
                                </span>
                            )}
                            {getModelName() && <span>{getModelName()}</span>}
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 text-lg group-hover:text-teal-600 transition-colors">
                            {listing.title}
                        </h3>
                    </div>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-teal-600">
                            {formatPrice(listing.daily_rate || listing.price)}
                        </span>
                        <span className="text-xs text-slate-500">/ يومياً</span>
                    </div>
                    {(listing.weekly_rate || listing.monthly_rate) && (
                        <div className="flex gap-3 text-xs text-slate-400">
                            {listing.monthly_rate && <span>{formatPrice(listing.monthly_rate)} / شهرياً</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Rent Features / Badges */}
            <div className="px-4 py-2 flex flex-wrap gap-2">
                {listing.features && listing.features.slice(0, 3).map((feature, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-3 h-3" /> {feature}
                    </span>
                ))}
                {(() => {
                    const terms = listing.rental_terms;
                    if (!terms) return null;
                    const termsList = Array.isArray(terms) ? terms : (terms as any).terms || [];
                    // Also add security deposit if exists as a badge? Maybe too detailed.
                    // Just show first 2 terms for now.
                    return termsList.slice(0, 2).map((term: string, idx: number) => (
                        <span key={`term-${idx}`} className="text-[10px] px-2 py-1 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center gap-1 text-teal-600 dark:text-teal-300">
                            <ShieldCheck className="w-3 h-3" /> {term}
                        </span>
                    ));
                })()}
            </div>

            {/* Footer: Location & Provider */}
            <div className="mt-auto p-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate max-w-[60%] text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{listing.city || listing.address || 'سوريا'}</span>
                </div>
                <button className="text-xs font-bold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors">
                    احجز الآن
                </button>
            </div>
        </div>
    );

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-500/30 transition-all cursor-pointer flex flex-col sm:flex-row h-auto sm:h-52"
                onClick={handleView}
            >
                {/* Image Section */}
                <div className="w-full sm:w-72 h-48 sm:h-full relative flex-shrink-0 overflow-hidden">
                    <OptimizedImage
                        src={images[0]}
                        alt={listing.title}
                        className="group-hover:scale-110 transition-transform duration-700"
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
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-teal-600 transition-colors">{listing.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 flex-wrap">
                                {listing.features && listing.features.slice(0, 3).map((feature, idx) => (
                                    <span key={idx} className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" /> {feature}
                                    </span>
                                ))}
                                {(() => {
                                    const terms = listing.rental_terms;
                                    if (!terms) return null;
                                    const termsList = Array.isArray(terms) ? terms : (terms as any).terms || [];
                                    return termsList.slice(0, 2).map((term: string, idx: number) => (
                                        <span key={`term-${idx}`} className="bg-teal-50 dark:bg-teal-900/30 px-2 py-1 rounded-md flex items-center gap-1 text-teal-600 dark:text-teal-300">
                                            <ShieldCheck className="w-3 h-3" /> {term}
                                        </span>
                                    ));
                                })()}
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="text-xl font-bold text-teal-600">{formatPrice(listing.daily_rate || listing.price)}</div>
                            <div className="text-xs text-slate-400">يومياً</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
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
                        <button className="px-6 py-2 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20">
                            احجز الآن
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Grid View
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
            onClick={handleView}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setActiveImageIndex(0); }}
        >
            {/* Image Container */}
            <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                <OptimizedImage
                    src={images[activeImageIndex]}
                    alt={listing.title}
                    aspectRatio="aspect-[16/10]"
                    className="group-hover:scale-110 transition-transform duration-700"
                />
                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-20">
                    {listing.is_sponsored && (
                        <span className="px-2.5 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                            <span>★</span> مميز
                        </span>
                    )}
                </div>

                {/* Top Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <button
                        onClick={handleFavorite}
                        className={`p-2 rounded-full backdrop-blur-md shadow-lg transition-all ${isFavorited ? 'bg-white text-red-500' : 'bg-black/20 text-white hover:bg-white hover:text-red-500'}`}
                    >
                        <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-white hover:text-blue-600 shadow-lg transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Listing Type Badge */}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur text-white text-[10px] rounded flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> إيجار
                </div>
            </div>

            <CardContent />
        </motion.div>
    );
};
