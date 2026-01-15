import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, Fuel, Settings, Phone,
    Heart, Share2, ChevronRight, CheckCircle, Star, Eye, MessageCircle,
    Globe, Hash, User, Shield,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getImageUrl } from '../../utils/helpers';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';
import { useAppState } from '../../hooks/useAppState';
import { useSEO, generateStructuredData, injectStructuredData } from '../../hooks/useSEO';
import SEO from '../SEO';
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

interface CarListingDetailProps {
    isAuthenticated?: boolean;
    setShowLogin?: (show: boolean) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const CarListingDetail: React.FC<CarListingDetailProps> = (props) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const appState = useAppState();

    // Use props if provided, fallback to useAppState
    const isAuthenticated = props.isAuthenticated ?? appState.isAuthenticated;
    const setShowLogin = props.setShowLogin ?? appState.setShowLogin;
    const showToast = props.showToast ?? appState.showToast;

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

    // SEO Integration - Using existing useSEO hook
    useEffect(() => {
        if (listing) {
            // Call useSEO with listing data
            const seoData = {
                title: listing.title,
                description: listing.description || `${listing.title} - ${listing.year} ${listing.mileage ? `${listing.mileage} كم` : ''}`,
                image: listing.photos?.[0] || listing.images?.[0],
                url: window.location.href,
                type: 'product' as const,
                price: listing.price,
                currency: 'SYP',
                availability: 'in stock' as const
            };

            // Generate and inject structured data
            const structuredData = generateStructuredData(listing);
            injectStructuredData(structuredData);
        }
    }, [listing]);

    const handleFavoriteToggle = async () => {
        if (!listing) return;

        // Check authentication first
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول لحفظ الإعلانات', 'info');
            if (setShowLogin) {
                setShowLogin(true);
            } else {
                // Fallback: redirect to login
                setTimeout(() => navigate('/'), 1000);
            }
            return;
        }

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

    const handleContact = async (type: 'phone' | 'email' | 'whatsapp') => {
        // Check authentication first
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول للتواصل مع البائع', 'info');
            if (setShowLogin) {
                setShowLogin(true);
            } else {
                // Fallback: redirect to login
                setTimeout(() => navigate('/'), 1000);
            }
            return;
        }

        if (!listing) return;

        const phone = listing.contact_phone || (listing.provider || listing.owner?.car_provider)?.phone;
        const email = (listing.provider || listing.owner?.car_provider)?.email;
        const whatsapp = listing.contact_whatsapp || phone;

        if (type === 'phone') {
            if (!phone) {
                showToast('رقم الهاتف غير متوفر', 'error');
                return;
            }
            // Track phone contact
            try {
                await CarProviderService.trackAnalytics(listing.id, 'contact_phone');
            } catch (error) {
                console.error('Failed to track phone contact:', error);
            }
            window.location.href = `tel:${phone}`;
        } else if (type === 'email') {
            if (!email) {
                showToast('البريد الإلكتروني غير متوفر', 'error');
                return;
            }
            try {
                await CarProviderService.trackAnalytics(listing.id, 'contact_email');
            } catch (error) {
                console.error('Failed to track email contact:', error);
            }
            window.location.href = `mailto:${email}`;
        } else if (type === 'whatsapp') {
            if (!whatsapp) {
                showToast('رقم الواتساب غير متوفر', 'error');
                return;
            }
            // Track WhatsApp contact
            try {
                await CarProviderService.trackAnalytics(listing.id, 'contact_whatsapp');
            } catch (error) {
                console.error('Failed to track WhatsApp contact:', error);
            }
            const message = `مرحباً، أنا مهتم بسيارتك ${listing.title}\nالسعر: ${safePrice(listing.price)}\nالرابط: ${window.location.href}`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodedMessage}`, '_blank');
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
                        onClick={() => navigate('/car-listings')}
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
            {/* 1. Header Navigation & Breadcrumbs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="w-full px-2 md:px-8 sm:px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors gap-2"
                    >
                        <ChevronRight className="w-5 h-5" />
                        <span className="font-medium">عودة</span>
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                            title="مشاركة"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleFavoriteToggle}
                            className={`p-2 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                            title="حفظ"
                        >
                            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-6 lg:px-8 py-4">

                {/* 1. Gallery First (Full Width or Grid Top) */}
                <div className="mb-8">
                    <CarGallery
                        images={images}
                        title={listing.title}
                        isSponsored={listing.is_sponsored}
                        isFeatured={listing.is_featured}
                        isRent={listing.listing_type === 'rent'}
                        videoUrl={listing.video_url || undefined}
                        t={t}
                    />

                    {/* Video Button - Outside Gallery */}
                    {listing.video_url && (
                        <button
                            onClick={() => window.open(listing.video_url!, '_blank', 'noopener,noreferrer')}
                            className="mt-4 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl flex items-center justify-center gap-3 text-white font-bold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            <span>مشاهدة الفيديو</span>
                            <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

                    {/* Main Content Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* 2. Title Section (Now inside grid flow or just below gallery) */}
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                {listing.is_sponsored && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {t.ui.sponsored}
                                    </span>
                                )}
                                {listing.is_featured && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-bold">
                                        💎 {t.ui.featured}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                                {listing.title}
                            </h1>

                            {/* Brand & Model Badges */}
                            {(listing.brand || listing.model) && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {listing.brand && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded-md font-semibold text-xs border border-blue-100 dark:border-blue-800">
                                            <Car className="w-3 h-3" />
                                            {typeof listing.brand === 'object' ? listing.brand.name_ar || listing.brand.name : listing.brand}
                                        </span>
                                    )}
                                    {listing.model && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 rounded-md font-semibold text-xs border border-violet-100 dark:border-violet-800">
                                            {listing.model}
                                        </span>
                                    )}
                                    {listing.year && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 rounded-md font-semibold text-xs border border-amber-100 dark:border-amber-800">
                                            {listing.year}
                                        </span>
                                    )}
                                    {listing.mileage && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-md font-semibold text-xs border border-emerald-100 dark:border-emerald-800">
                                            {Number(listing.mileage).toLocaleString()} كم
                                        </span>
                                    )}
                                    {listing.transmission && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 rounded-md font-semibold text-xs border border-teal-100 dark:border-teal-800">
                                            {translateValue(listing.transmission)}
                                        </span>
                                    )}
                                    {listing.fuel_type && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 rounded-md font-semibold text-xs border border-rose-100 dark:border-rose-800">
                                            {translateValue(listing.fuel_type)}
                                        </span>
                                    )}
                                    {listing.horsepower && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 rounded-md font-semibold text-xs border border-indigo-100 dark:border-indigo-800">
                                            {listing.horsepower} حصان
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                                {(listing.city || listing.address || listing.location) && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-gray-400" />
                                        <span>
                                            {listing.city}
                                            {listing.city && listing.address && '، '}
                                            {listing.address}
                                            {!listing.city && listing.location}
                                        </span>
                                    </div>
                                )}
                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                                    {safeDate(listing.created_at)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3 text-gray-400" />
                                    {listing.views_count || 0} {t.ui.view_count}
                                </span>
                            </div>
                        </div>

                        {/* Sponsored Feature Card */}
                        {listing.is_sponsored && listing.sponsored_until && (
                            <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-6 shadow-lg">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-md">
                                        <Star className="w-8 h-8 text-white fill-current" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">إعلان مميز</h3>
                                            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                                                Premium
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                                            هذا الإعلان مرعى ويحصل على أولوية في نتائج البحث وظهور أكبر للمشترين المحتملين
                                        </p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            <span className="text-gray-600 dark:text-gray-400">
                                                مميز حتى: <span className="font-bold text-gray-900 dark:text-white">
                                                    {new Date(listing.sponsored_until).toLocaleDateString('ar-SA', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. Price (Mobile Only) - "price after title" */}
                        <div className="lg:hidden">
                            <PriceCard listing={listing} className="shadow-sm border-0 bg-transparent p-0" />
                        </div>

                        {/* Detailed Specs Tabs */}
                        <SpecificationsTabs listing={listing} />

                        {/* Video - Removed redundant title */}

                        {/* Body Diagram - Read Only mode */}
                        {listing.body_condition && typeof listing.body_condition === 'object' && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.specs.body_condition}</h2>
                                <CarBodyDiagram
                                    value={listing.body_condition}
                                    onChange={() => { }}
                                    readOnly={true}
                                />
                            </div>
                        )}

                        {/* Rental Terms */}
                        {listing.listing_type === 'rent' && listing.rental_terms && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.rental_terms}</h2>
                                <div className="space-y-3">
                                    {Array.isArray(listing.rental_terms) && listing.rental_terms.map((term: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                            <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">{term}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Similar Listings */}
                        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                            <SimilarListings
                                currentListingId={listing.id}
                                categoryId={listing.category?.id}
                                brandId={listing.brand?.id}
                                t={t}
                            />
                        </div>
                    </div>

                    {/* 4. Sticky Sidebar Column (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">

                            {/* Price Card (Desktop Only) */}
                            <div className="hidden lg:block">
                                <PriceCard listing={listing} className="shadow-xl ring-1 ring-black/5" />
                            </div>

                            {/* Main CTAs */}
                            <div className="hidden lg:flex flex-col gap-3">
                                <button
                                    onClick={() => handleContact('phone')}
                                    className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                                >
                                    <Phone className="w-5 h-5" />
                                    {t.ui.call}
                                </button>
                                {hasWhatsapp && (
                                    <button
                                        onClick={() => handleContact('whatsapp')}
                                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        {t.ui.whatsapp}
                                    </button>
                                )}
                            </div>

                            {/* Trust / Safety Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">تسوق بأمان</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        لا تقم بتحويل الأموال قبل معاينة السيارة. افحص السيارة جيداً قبل الشراء.
                                    </p>
                                </div>
                            </div>

                            {/* Provider Info */}
                            <ProviderSidebar
                                provider={provider}
                                listing={listing}
                                t={t}
                                onContact={handleContact}
                                onReport={() => setShowReportModal(true)}
                            />

                            <div className="text-center">
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="text-sm text-gray-400 hover:text-red-500 underline decoration-dotted transition-colors"
                                >
                                    {t.ui.report}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Bar - Only visible on small screens */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40"
            >
                <div className="flex gap-3">
                    <button
                        onClick={() => handleContact('phone')}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-xl font-bold"
                    >
                        <Phone className="w-5 h-5" />
                        {t.ui.call}
                    </button>
                    {hasWhatsapp && (
                        <button
                            onClick={() => handleContact('whatsapp')}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-3.5 rounded-xl font-bold"
                        >
                            <MessageCircle className="w-5 h-5" />
                            {t.ui.whatsapp}
                        </button>
                    )}
                </div>
            </motion.div>

            <ReportListingModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportSubmit}
                t={t}
            />

        </motion.div>
    );
};

export default CarListingDetail;
