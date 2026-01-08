import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, Fuel, Settings, Phone,
    Heart, Share2, ChevronRight, CheckCircle, Star, Eye, MessageCircle,
    Globe, Hash, User,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getImageUrl } from '../../utils/helpers';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';
import CarGallery from './ListingParts/CarGallery';
import ProviderSidebar from './ListingParts/ProviderSidebar';
import SimilarListings from './ListingParts/SimilarListings';
import ReportListingModal from './ListingParts/ReportListingModal';
import QuickSpecsBar from './ListingParts/QuickSpecsBar';
import PriceCard from './ListingParts/PriceCard';
import SpecificationsTabs from './ListingParts/SpecificationsTabs';
import FeaturesShowcase from './ListingParts/FeaturesShowcase';
import { CarBodyDiagram } from './CarBodyDiagram';

// Helper for translations
const t = {
    specs: {
        year: 'السنة',
        mileage: 'الممشى',
        transmission: 'ناقل الحركة',
        fuel_type: 'الوقود',
        engine_size: 'حجم المحرك',
        horsepower: 'قوة المحرك',
        exterior_color: 'اللون الخارجي',
        interior_color: 'اللون الداخلي',
        body_style: 'نمط الهيكل',
        body_condition: 'حالة الهيكل',
        doors_count: 'عدد الأبواب',
        seats_count: 'عدد المقاعد',
        warranty: 'الضمان',
        license_plate: 'رقم اللوحة',
        vin_number: 'رقم الهيكل',
        previous_owners: 'عدد الملاك السابقين',
        car_category: 'المنشأ',
        address: 'العنوان',
    },
    values: {
        automatic: 'أوتوماتيك',
        manual: 'عادي',
        gasoline: 'بنزين',
        diesel: 'ديزل',
        electric: 'كهرباء',
        hybrid: 'هجين',
        new: 'جديدة',
        used: 'مستعملة',
        certified_pre_owned: 'مستعملة معتمدة',
    },
    ui: {
        sponsored: 'مميزة',
        featured: 'مختارة',
        rent: 'للإيجار',
        sale: 'للبيع',
        negotiable: 'قابل للتفاوض',
        video: 'فيديو توضيحي',
        specs_title: 'المواصفات',
        vehicle_info: 'معلومات السيارة',
        additional_info: 'معلومات إضافية',
        rental_rates: 'أسعار الإيجار',
        daily_rate: 'يومي',
        weekly_rate: 'أسبوعي',
        monthly_rate: 'شهري',
        rental_terms: 'شروط الإيجار',
        features_title: 'المميزات',
        description_title: 'الوصف',
        view_count: 'مشاهدة',
        km: 'كم',
        call: 'اتصال',
        whatsapp: 'واتساب',
        view_profile: 'زيارة المعرض',
        report: 'إبلاغ عن محتوى مخالف',
        verified: 'موثّق',
        hp: 'حصان',
        owner: 'مالك',
    }
};

const translateValue = (val: string | undefined): string => {
    if (!val) return '';
    return (t.values as any)[val.toLowerCase()] || val;
};

const safeDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString('ar-SA');
    } catch (e) {
        return '';
    }
};

const safePrice = (price: number | undefined) => {
    if (typeof price !== 'number') return '';
    try {
        return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
    } catch (e) {
        return `${price} SYP`;
    }
};

const SpecItem: React.FC<{ icon: any; label: string; value: string | number | undefined | null | any }> = ({ icon: Icon, label, value }) => {
    if (value === undefined || value === null || value === '' || typeof value === 'object') return null;
    return (
        <div className="flex items-center gap-3 group">
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize line-clamp-1">{typeof value === 'string' ? translateValue(value) : value}</p>
            </div>
        </div>
    );
};

const CarListingDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [listing, setListing] = useState<CarListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        loadListing();
    }, [slug]);

    const loadListing = async () => {
        if (!slug) return;

        try {
            setLoading(true);
            const data = await CarProviderService.getListingBySlug(slug);
            setListing(data);

            // Track view event
            if (data.id) {
                await CarProviderService.trackAnalytics(data.id, 'view');
            }

            // Check if favorited
            const favoriteStatus = await CarProviderService.checkFavorite(data.id);
            setIsFavorited(favoriteStatus);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load listing');
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!listing) return;

        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
        } catch (err) {
            console.error('Failed to toggle favorite:', err);
        }
    };

    const handleReportSubmit = async (reason: string, details: string) => {
        if (!listing) return;
        await CarProviderService.reportListing(listing.id, { reason, details });
    };

    const handleContact = (type: 'phone' | 'email' | 'whatsapp') => {
        if (!listing) return;

        // Track the click
        CarProviderService.trackAnalytics(listing.id, 'contact_click');

        const phone = listing.contact_phone || (listing.provider || listing.owner?.car_provider)?.phone;
        const email = (listing.provider || listing.owner?.car_provider)?.email;
        const whatsapp = listing.contact_whatsapp || phone;

        if (type === 'phone' && phone) {
            window.location.href = `tel:${phone}`;
        } else if (type === 'email' && email) {
            window.location.href = `mailto:${email}`;
        } else if (type === 'whatsapp' && whatsapp) {
            window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
        }
    };

    const handleShare = async () => {
        if (!listing) return;

        await CarProviderService.trackAnalytics(listing.id, 'share');

        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: listing.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            // Replace with toast ideally, but alert for now
            alert('تم نسخ الرابط!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">القائمة غير موجودة</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'ربما تم حذف هذه القائمة.'}</p>
                    <button
                        onClick={() => navigate('/car-marketplace')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        العودة للسوق
                    </button>
                </div>
            </div>
        );
    }

    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : (listing.images && listing.images.length > 0)
            ? listing.images
            : ['/placeholder-car.jpg'];

    const provider = listing.provider || listing.owner?.car_provider;
    const hasWhatsapp = listing.contact_whatsapp || (provider?.phone);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 lg:pb-0"
        >
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 ml-1" />
                        عودة
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-6"
                    >

                        {/* New Gallery Component */}
                        <CarGallery
                            images={images}
                            title={listing.title}
                            isSponsored={listing.is_sponsored}
                            isFeatured={listing.is_featured}
                            isRent={listing.listing_type === 'rent'}
                            t={t}
                        />

                        {/* Quick Specs Bar */}
                        <QuickSpecsBar listing={listing} />

                        {/* Premium Title & Price Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
                        >
                            {/* Premium Badges Row */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {listing.is_sponsored && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-md">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        {t.ui.sponsored}
                                    </span>
                                )}
                                {listing.is_featured && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold shadow-md">
                                        💎 {t.ui.featured}
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${listing.listing_type === 'rent'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    }`}>
                                    {listing.listing_type === 'rent' ? '🔑' : '💰'}
                                    {listing.listing_type === 'rent' ? t.ui.rent : t.ui.sale}
                                </span>
                            </div>

                            {/* Title & Actions */}
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                                        {listing.title}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        {listing.location && (
                                            <span className="flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{listing.location}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Eye className="w-4 h-4" />
                                            {listing.views_count || 0} {t.ui.view_count}
                                        </span>
                                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Calendar className="w-4 h-4" />
                                            {safeDate(listing.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={handleFavoriteToggle}
                                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg ${isFavorited
                                            ? 'bg-gradient-to-br from-red-50 to-pink-50 text-red-500 dark:from-red-900/30 dark:to-pink-900/30'
                                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavorited ? 'fill-current' : ''}`} />
                                    </motion.button>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        whileHover={{ scale: 1.05 }}
                                        onClick={handleShare}
                                        className="p-3 sm:p-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-xl sm:rounded-2xl transition-all shadow-md hover:shadow-lg"
                                    >
                                        <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Enhanced Price Card */}
                            <PriceCard listing={listing} />
                            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 sm:p-6 mb-6 border border-blue-100 dark:border-blue-800/30">
                                <div className="flex items-end justify-between gap-4 flex-wrap">
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">السعر</p>
                                        <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                                            <span className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                                {safePrice(listing.price)}
                                            </span>
                                            {listing.listing_type === 'rent' && (
                                                <span className="text-gray-600 dark:text-gray-400 text-base sm:text-lg font-medium">/ يوم</span>
                                            )}
                                        </div>
                                        {listing.is_negotiable && (
                                            <motion.span
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-bold shadow-sm"
                                            >
                                                ✓ {t.ui.negotiable}
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rental Rates for Rent Listings */}
                            {listing.listing_type === 'rent' && (listing.daily_rate || listing.weekly_rate || listing.monthly_rate) && (
                                <div className="mb-6 p-5 sm:p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl border border-cyan-100 dark:border-cyan-800/30">
                                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                        🔑 {t.ui.rental_rates}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {listing.daily_rate && (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center shadow-sm">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.ui.daily_rate}</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {new Intl.NumberFormat('ar-SY').format(listing.daily_rate)}
                                                </p>
                                            </div>
                                        )}
                                        {listing.weekly_rate && (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center shadow-sm">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.ui.weekly_rate}</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {new Intl.NumberFormat('ar-SY').format(listing.weekly_rate)}
                                                </p>
                                            </div>
                                        )}
                                        {listing.monthly_rate && (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl text-center shadow-sm">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.ui.monthly_rate}</p>
                                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {new Intl.NumberFormat('ar-SY').format(listing.monthly_rate)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Condition & Warranty Badges */}
                            <div className="flex flex-wrap gap-3">
                                {listing.condition && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800/30 shadow-sm">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span className="text-gray-900 dark:text-white font-bold capitalize text-sm">
                                            {translateValue(listing.condition)}
                                        </span>
                                    </div>
                                )}
                                {listing.warranty && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800/30 shadow-sm">
                                        <Star className="w-5 h-5 text-blue-500 fill-current" />
                                        <span className="text-gray-900 dark:text-white font-bold text-sm">
                                            {t.specs.warranty}: {listing.warranty}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Car Body Diagram */}
                        {listing.body_condition && typeof listing.body_condition === 'object' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200 dark:border-slate-700"
                            >
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <Car className="w-6 h-6 text-primary" />
                                    حالة الهيكل
                                </h2>
                                <CarBodyDiagram
                                    value={listing.body_condition}
                                    onChange={() => { }}
                                />
                            </motion.div>
                        )}

                        {/* Video Section */}
                        {listing.video_url && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.video}</h2>
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                    <iframe
                                        src={listing.video_url.replace('watch?v=', 'embed/')}
                                        title="Car Video"
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}

                        {/* Enhanced Specifications Tabs */}
                        <SpecificationsTabs listing={listing} />

                        {/* Rental Terms for Rent Listings */}
                        {listing.listing_type === 'rent' && listing.rental_terms && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.rental_terms}</h2>
                                <div className="space-y-2">
                                    {Array.isArray(listing.rental_terms) && listing.rental_terms.map((term: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                            <span>{term}</span>
                                        </div>
                                    ))}
                                    {typeof listing.rental_terms === 'object' && !Array.isArray(listing.rental_terms) && (
                                        <p className="text-gray-700 dark:text-gray-300">{JSON.stringify(listing.rental_terms)}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Features Showcase */}
                        <FeaturesShowcase listing={listing} />

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.description_title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                {listing.description}
                            </p>
                        </div>

                        {/* Similar Listings */}
                        <SimilarListings
                            currentListingId={listing.id}
                            categoryId={listing.category?.id}
                            brandId={listing.brand?.id}
                            t={t}
                        />
                    </motion.div>

                    {/* Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="hidden lg:block space-y-6"
                    >
                        <ProviderSidebar
                            provider={provider}
                            listing={listing}
                            t={t}
                            onContact={handleContact}
                            onReport={() => setShowReportModal(true)}
                        />
                    </motion.div>
                </div >
            </div >

            {/* Mobile Sticky Contact Bar */}
            < motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="lg:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-40"
            >
                <div className="flex gap-3">
                    <button
                        onClick={() => handleContact('phone')}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
                    >
                        <Phone className="w-5 h-5" />
                        {t.ui.call}
                    </button>
                    {hasWhatsapp && (
                        <button
                            onClick={() => handleContact('whatsapp')}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-sm"
                        >
                            <MessageCircle className="w-5 h-5" />
                            {t.ui.whatsapp}
                        </button>
                    )}
                </div>
            </motion.div >

            <ReportListingModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportSubmit}
                t={t}
            />

        </motion.div >
    );
};

export default CarListingDetail;
