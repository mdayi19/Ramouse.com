import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Share2, MapPin, Gauge, GitFork, Calendar,
    Fuel, Car, Eye, CheckCircle, Clock, ShieldCheck, User
} from 'lucide-react';
import { CarListing, CarProviderService, RentalTerms } from '../../../services/carprovider.service';
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

    const getRentalInfo = (listing: CarListing) => {
        const terms = listing.rental_terms;

        // Always try to get rates from top level if available, as fallback or primary
        let dailyRate = listing.daily_rate;
        let weeklyRate = listing.weekly_rate;
        let monthlyRate = listing.monthly_rate;

        if (terms) {
            const isObject = typeof terms === 'object' && !Array.isArray(terms);
            const structuredTerms = isObject ? (terms as RentalTerms) : {};
            const termsList = Array.isArray(terms) ? terms : (terms as any).terms || [];

            // If rates are in terms, prefer them (or vice versa? User said "use ... from rental_terms")
            // Assuming rental_terms is the source of truth for RENT listings constructed via wizard
            if (isObject) {
                if (structuredTerms.daily_rate) dailyRate = structuredTerms.daily_rate;
                if (structuredTerms.weekly_rate) weeklyRate = structuredTerms.weekly_rate;
                if (structuredTerms.monthly_rate) monthlyRate = structuredTerms.monthly_rate;
            }

            return {
                deposit: structuredTerms.security_deposit,
                minAge: structuredTerms.min_renter_age,
                terms: termsList,
                dailyRate,
                weeklyRate,
                monthlyRate
            };
        }

        return {
            deposit: undefined,
            minAge: undefined,
            terms: [],
            dailyRate,
            weeklyRate,
            monthlyRate
        };
    };

    const handleDetailsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/rent-car/${listing.slug}`);
    };

    const rentalInfo = getRentalInfo(listing);

    // Card Content for reuse in Grid/List layouts
    const CardContent = () => (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800">
            {/* 2. Year / Brand / Model */}
            <div className="p-4 pb-2">
                <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                                {listing.year}
                            </span>
                            {getBrandName() && (
                                <span className="text-teal-600 dark:text-teal-400">
                                    {getBrandName()}
                                </span>
                            )}
                            {getModelName() && <span>{getModelName()}</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{listing.city || listing.address || 'سوريا'}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Rates Prices */}
                {/* 3. Rates & Conditions Merged Card */}
                <div className="flex flex-col gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    {/* Rates Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs text-slate-500">يومي</span>
                            <span className="font-bold text-teal-600 text-lg">
                                {(() => {
                                    const dailyRate = rentalInfo?.dailyRate || listing.daily_rate;
                                    return dailyRate ? formatPrice(dailyRate) : 'اتصل للسعر';
                                })()}
                            </span>
                        </div>
                        {(() => {
                            const weeklyRate = rentalInfo?.weeklyRate || listing.weekly_rate;
                            const monthlyRate = rentalInfo?.monthlyRate || listing.monthly_rate;

                            if (!weeklyRate && !monthlyRate) return null;

                            return (
                                <>
                                    {weeklyRate && (
                                        <div className="flex items-baseline justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                                            <span className="text-xs text-slate-500">أسبوعي</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{formatPrice(weeklyRate)}</span>
                                        </div>
                                    )}
                                    {monthlyRate && (
                                        <div className="flex items-baseline justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                                            <span className="text-xs text-slate-500">شهري</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{formatPrice(monthlyRate)}</span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Conditions Section (Merged) */}
                    {(rentalInfo?.deposit || rentalInfo?.minAge) && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">شروط الإيجار</h4>
                            <div className="flex flex-wrap gap-2">
                                {rentalInfo?.deposit ? (
                                    <span className="text-[10px] px-2 py-1 bg-orange-50 dark:bg-orange-900/30 rounded-full flex items-center gap-1 text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-800/30">
                                        <ShieldCheck className="w-3 h-3" /> تأمين: {formatPrice(rentalInfo.deposit)}
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center gap-1 text-green-600 dark:text-green-300 border border-green-100 dark:border-green-800/30">
                                        <ShieldCheck className="w-3 h-3" /> بدون تأمين
                                    </span>
                                )}
                                {rentalInfo?.minAge && (
                                    <span className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center gap-1 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/30">
                                        <User className="w-3 h-3" /> عمر {rentalInfo.minAge}+
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 5. Show Details Button & Actions */}
            <div className="mt-auto p-4 pt-2 flex items-center justify-between gap-2">
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
                <button
                    onClick={handleDetailsClick}
                    className="flex-1 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-100 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 touch-manipulation"
                >
                    <Eye className="w-4 h-4" />
                    عرض التفاصيل
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
                className="group relative bg-white dark:bg-slate-800 rounded-none md:rounded-2xl overflow-hidden border-y md:border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-teal-500/30 transition-all cursor-pointer flex flex-row h-auto sm:h-52 items-stretch"
                onClick={handleView}
            >
                {/* Image Section */}
                <div className="w-32 sm:w-72 relative flex-shrink-0 overflow-hidden">
                    <OptimizedImage
                        src={images[0]}
                        alt={`${listing.title} ${listing.year} - ${listing.city || 'سوريا'}`}
                        className="h-full group-hover:scale-110 transition-transform duration-700 absolute inset-0 w-full object-cover"
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
                <div className="flex-1 flex flex-col justify-between p-2 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                            {/* 2. Year / Brand / Model */}
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">{listing.year}</span>
                                <span className="text-teal-600 dark:text-teal-400 font-medium">{getBrandName()}</span>
                                <span>{getModelName()}</span>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1 text-slate-400">
                                    <MapPin className="w-3 h-3" />
                                    <span>{listing.city || listing.address || 'سوريا'}</span>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-teal-600 transition-colors">{listing.title}</h3>

                            {/* 4. Rental Requirements */}

                        </div>

                        {/* 3. Rates Prices */}
                        <div className="text-left bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[140px]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="text-xs text-slate-500">يومي</span>
                                    <span className="font-bold text-teal-600">
                                        {(() => {
                                            const dailyRate = rentalInfo?.dailyRate || listing.daily_rate;
                                            return dailyRate ? formatPrice(dailyRate) : 'اتصل';
                                        })()}
                                    </span>
                                </div>
                                {(() => {
                                    const weeklyRate = rentalInfo?.weeklyRate || listing.weekly_rate;
                                    const monthlyRate = rentalInfo?.monthlyRate || listing.monthly_rate;
                                    if (!weeklyRate && !monthlyRate) return null;
                                    return (
                                        <>
                                            {weeklyRate && (
                                                <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                                                    <span className="text-[10px] text-slate-500">أسبوعي</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatPrice(weeklyRate)}</span>
                                                </div>
                                            )}
                                            {monthlyRate && (
                                                <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                                                    <span className="text-[10px] text-slate-500">شهري</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{formatPrice(monthlyRate)}</span>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Conditions Section (Merged for List View) */}
                            {(rentalInfo?.deposit || rentalInfo?.minAge) && (
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-1 text-right">شروط الإيجار</h4>
                                    <div className="flex flex-col gap-1 items-end">
                                        {rentalInfo?.deposit ? (
                                            <span className="text-[10px] text-orange-600 dark:text-orange-300 whitespace-nowrap">
                                                تأمين: {formatPrice(rentalInfo.deposit)}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-green-600 dark:text-green-300 whitespace-nowrap">
                                                بدون تأمين
                                            </span>
                                        )}
                                        {rentalInfo?.minAge && (
                                            <span className="text-[10px] text-blue-600 dark:text-blue-300 whitespace-nowrap">
                                                عمر {rentalInfo.minAge}+
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
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
                        {/* 5. Show Details Button */}
                        <button
                            onClick={handleDetailsClick}
                            className="px-6 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            عرض التفاصيل
                        </button>
                    </div>
                </div>
            </motion.article>
        );
    }

    // Grid View
    return (
        <motion.article
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white dark:bg-slate-800 rounded-none md:rounded-2xl overflow-hidden border-y md:border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 hover:border-teal-500/30 transition-all duration-300 cursor-pointer h-full flex flex-col"
            onClick={handleView}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setActiveImageIndex(0); }}
        >
            {/* Image Container */}
            <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                <OptimizedImage
                    src={images[activeImageIndex]}
                    alt={`${listing.title} ${listing.year} - ${listing.city || 'سوريا'} - صورة ${activeImageIndex + 1}`}
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
        </motion.article>
    );
};
