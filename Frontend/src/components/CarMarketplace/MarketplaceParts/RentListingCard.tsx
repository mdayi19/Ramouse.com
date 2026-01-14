import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Heart, Share2, MapPin, Gauge, GitFork, Calendar,
    Fuel, Car, Eye, CheckCircle, Clock, ShieldCheck, User, Star
} from 'lucide-react';
import { CarListing, CarProviderService } from '../../../services/carprovider.service';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from './OptimizedImage';

interface RentListingCardProps {
    listing: CarListing;
    viewMode: 'grid' | 'list';
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated?: boolean;
    onLoginClick?: () => void;
}

// --- Helper: Rental Terms Translations ---
const rentalTermsTranslations: { [key: string]: string } = {
    insurance_required: 'التأمين مطلوب',
    valid_license: 'رخصة قيادة سارية',
    min_age: 'الحد الأدنى للعمر',
    credit_card: 'بطاقة ائتمان مطلوبة',
    notarized_contract: 'عقد موثق',
    km_limit: 'حد أقصى للكيلومترات',
    no_smoking: 'ممنوع التدخين',
    no_pets: 'ممنوع الحيوانات الأليفة',
    families_only: 'للعائلات فقط',
    insurance_waiver: 'إعفاء التأمين',
    additional_driver: 'سائق إضافي مسموح',
    fuel_on_renter: 'الوقود على عاتق المستأجر'
};

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

const translateRentalTerm = (term: string): string =>
    rentalTermsTranslations[term] || rentalTermsTranslations[term.toLowerCase().replace(/\s+/g, '_')] || term;

const translateSpec = (term: string | undefined): string => {
    if (!term) return '';
    const cleanTerm = term.trim().toLowerCase().replace(/_/g, ' ');
    // Try exact match first then replace spaces with underscores for keys
    return specTranslations[cleanTerm] ||
        specTranslations[cleanTerm.replace(/\s+/g, '_')] ||
        specTranslations[cleanTerm.split(' ')[0]] || // Try first word 'auto' from 'auto gear'
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

// --- Sub-Component: Spec Badge ---
const SpecBadge = ({ label, value, icon: Icon, colorClass }: { label: string; value: string | number; icon?: any; colorClass?: string }) => (
    <div className={cn("flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300", colorClass)}>
        {Icon && <Icon className="w-3 h-3 text-slate-400" />}
        <span className="font-medium">{value}</span>
    </div>
);

// --- Sub-Component: Specs Row ---
const SpecsRow = ({ listing }: { listing: CarListing }) => {
    // Robust Brand Extraction
    const getBrandName = () => {
        if (!listing.brand) return '';
        if (typeof listing.brand === 'object') {
            return listing.brand.name_ar || listing.brand.name || '';
        }
        return listing.brand; // string case
    };

    const brandName = getBrandName();

    return (
        <div className="flex flex-nowrap items-center gap-1.5 text-[10px] text-slate-500 mb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Brand - Only show if exists */}
            {brandName && (
                <span className="font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md">
                    {brandName}
                </span>
            )}
            {/* Model - Only show if exists */}
            {listing.model && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                    {listing.model}
                </span>
            )}
            {/* Year */}
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-300">
                {listing.year}
            </span>
            {/* Transmission */}
            {listing.transmission && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
                    {translateSpec(listing.transmission)}
                </span>
            )}
            {/* Fuel */}
            {listing.fuel_type && (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
                    {translateSpec(listing.fuel_type)}
                </span>
            )}
        </div>
    );
};

// --- Sub-Component: Rental Price Grid ---
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

// --- Main Component ---
export const RentListingCard: React.FC<RentListingCardProps> = ({ listing, viewMode, showToast, isAuthenticated, onLoginClick }) => {
    const navigate = useNavigate();
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Ensure images exist
    const images = useMemo(() => {
        const imgs = listing.photos?.length ? listing.photos : listing.images;
        return imgs?.length ? imgs : ['/placeholder-car.jpg'];
    }, [listing]);

    // Parse Rental Terms
    const rentalInfo = useMemo(() => {
        const terms = listing.rental_terms;
        const isObj = typeof terms === 'object' && !Array.isArray(terms);
        const structured = isObj ? (terms as any) : {};
        return {
            dailyRate: structured.daily_rate || listing.daily_rate,
            weeklyRate: structured.weekly_rate || listing.weekly_rate,
            monthlyRate: structured.monthly_rate || listing.monthly_rate,
            deposit: structured.security_deposit,
            minAge: structured.min_renter_age,
            terms: Array.isArray(terms) ? terms : structured.terms || []
        };
    }, [listing]);

    // Handlers
    const handleView = () => navigate(`/rent-car/${listing.slug}`);

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
        } catch (error) {
            console.error('Favorite error:', error);
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: listing.description,
                    url: `${window.location.origin}/rent-car/${listing.slug}`,
                });
            } catch { } // Ignore cancel
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/rent-car/${listing.slug}`);
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
                {listing.is_sponsored && (
                    <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" /> مميز
                    </span>
                )}
                <span className="px-2 py-0.5 bg-teal-600/90 backdrop-blur-sm text-white text-[10px] font-medium rounded-full shadow-sm">
                    إيجار
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
        <div className={cn("flex items-center gap-2", className)}>
            <button
                onClick={handleFavorite}
                className={cn(
                    "p-2 rounded-full transition-all border",
                    isFavorited ? "bg-red-50 border-red-200 text-red-500" : "border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50 bg-white dark:bg-slate-800 dark:border-slate-700"
                )}
            >
                <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
            </button>
            <button
                onClick={handleShare}
                className="p-2 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-teal-600 hover:bg-slate-50 bg-white dark:bg-slate-800 transition-all"
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
                className="group flex flex-col bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 h-full cursor-pointer"
                onClick={handleView}
            >
                {/* Image Area - Aspect 16:10 */}
                <ListingImage className="w-full aspect-[16/10]" />

                {/* Content Area */}
                <div className="flex flex-col flex-1 p-4 gap-4">
                    {/* Header */}
                    <div>
                        <SpecsRow listing={listing} />
                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                            {listing.title}
                        </h3>
                    </div>

                    {/* Pricing Grid */}
                    <div className="mt-auto">
                        <RentalPriceGrid
                            daily={rentalInfo.dailyRate}
                            weekly={rentalInfo.weeklyRate}
                            monthly={rentalInfo.monthlyRate}
                        />
                    </div>

                    {/* Footer / Location */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {listing.city}
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
                        <h3 className="font-bold text-sm sm:text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 transition-colors">
                            {listing.title}
                        </h3>
                    </div>
                    {/* Desktop Actions */}
                    <div className="hidden sm:block flex-shrink-0">
                        <ActionButtons />
                    </div>
                </div>

                {/* Pricing Grid - Flexible */}
                <div className="mt-1">
                    <RentalPriceGrid
                        daily={rentalInfo.dailyRate}
                        weekly={rentalInfo.weeklyRate}
                        monthly={rentalInfo.monthlyRate}
                    />
                </div>

                {/* Requirements Row (Optional) */}
                {(rentalInfo.deposit || rentalInfo.minAge) && (
                    <div className="hidden sm:flex flex-wrap gap-2 mt-auto">
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

                {/* Mobile Footer */}
                <div className="flex sm:hidden items-center justify-between mt-auto pt-2 border-t border-slate-50 dark:border-slate-800/50">
                    <ActionButtons className="gap-1 scale-90 origin-right" />
                    <button className="px-3 py-1 bg-teal-600 text-white text-[10px] font-bold rounded-lg shadow-sm">
                        التفاصيل
                    </button>
                </div>
            </div>
        </motion.article>
    );
};
