import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, Fuel, Settings, Phone,
    Heart, Share2, ChevronRight, Star, Eye, MessageCircle, DollarSign,
    Clock, Shield, Users, CheckCircle, AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getImageUrl } from '../../utils/helpers';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing, RentalTerms } from '../../services/carprovider.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../hooks/useAppState';
import { generateRentalSchema } from '../../utils/structuredData';
import SEO from '../SEO';

import CarGallery from './ListingParts/CarGallery';
import ProviderSidebar from './ListingParts/ProviderSidebar';
import SimilarListings from './ListingParts/SimilarListings';
import ReportListingModal from './ListingParts/ReportListingModal';
import QuickSpecsBar from './ListingParts/QuickSpecsBar';
import PriceCard from './ListingParts/PriceCard';
import SpecificationsTabs from './ListingParts/SpecificationsTabs';

import SponsoredListings from './ListingParts/SponsoredListings';
import { CarBodyDiagram } from './CarBodyDiagram';

// Helper for translations (aligned with CarListingDetail)
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

// Rental Terms Translation
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

const translateRentalTerm = (term: string): string => {
    if (!term) return '';
    // Try exact match first
    if (rentalTermsTranslations[term]) {
        return rentalTermsTranslations[term];
    }
    // Try lowercase match
    const lowerTerm = term.toLowerCase().replace(/\s+/g, '_');
    if (rentalTermsTranslations[lowerTerm]) {
        return rentalTermsTranslations[lowerTerm];
    }
    // Return original if no translation found
    return term;
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
        return new Intl.NumberFormat('en-US').format(price) + ' $';
    } catch (e) {
        return `${price} $`;
    }
};

interface RentCarListingDetailProps {
    isAuthenticated?: boolean;
    setShowLogin?: (show: boolean) => void;
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const RentCarListingDetail: React.FC<RentCarListingDetailProps> = (props) => {
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
        if (slug) {
            loadListing(slug);
        }
    }, [slug]);

    const loadListing = async (slug: string) => {
        try {
            setLoading(true);
            const data = await CarProviderService.getListingBySlug(slug);
            setListing(data);
            setIsFavorited(false);

            if (data?.id) {
                CarProviderService.checkFavorite(data.id).then(setIsFavorited).catch(console.error);
                CarProviderService.trackAnalytics(data.id, 'view').catch(console.error);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'فشل تحميل الإعلان');
        } finally {
            setLoading(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!listing) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl font-bold mb-4">القائمة غير موجودة</h2>
                <button onClick={() => navigate('/rent-car')} className="text-primary hover:underline">العودة</button>
            </div>
        </div>
    );

    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : (listing.images && listing.images.length > 0)
            ? listing.images
            : ['/placeholder-car.jpg'];

    const provider = listing.provider || listing.owner?.car_provider;
    const hasWhatsapp = listing.contact_whatsapp || (provider?.phone);

    // Rental Terms Parsing
    const rentalTerms = listing.rental_terms;
    const isRentalTermsObject = (terms: any): terms is RentalTerms => {
        return typeof terms === 'object' && !Array.isArray(terms);
    };

    // Convert to structured object if possible
    const structuredTerms: RentalTerms = isRentalTermsObject(rentalTerms) ? rentalTerms : {};
    // Extract terms list
    const termsList: string[] = Array.isArray(rentalTerms)
        ? rentalTerms
        : (rentalTerms as RentalTerms)?.terms || [];

    // Extract rates prioritizing rental_terms, then listing root, ignoring price
    const dailyRate = structuredTerms.daily_rate || listing.daily_rate;
    const weeklyRate = structuredTerms.weekly_rate || listing.weekly_rate;
    const monthlyRate = structuredTerms.monthly_rate || listing.monthly_rate;

    const hasRequirements = !!structuredTerms.security_deposit || !!structuredTerms.min_renter_age || !!structuredTerms.min_license_age;
    const hasConditions = termsList.length > 0 || !!structuredTerms.custom_terms;


    const handleShare = async () => {
        CarProviderService.trackAnalytics(listing.id, 'share').catch(console.error);
        const url = window.location.href;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing.title,
                    text: `Check out this rental car: ${listing.title}`,
                    url: url,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            showToast('تم نسخ الرابط', 'success');
        }
    };

    const handleFavoriteToggle = async () => {
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول للإضافة للمفضلة', 'info');
            if (setShowLogin) {
                setShowLogin(true);
            } else {
                setTimeout(() => navigate('/'), 1000);
            }
            return;
        }

        try {
            await CarProviderService.toggleFavorite(listing.id);
            setIsFavorited(!isFavorited);
            showToast(isFavorited ? 'تم الإزالة من المفضلة' : 'تم الإضافة للمفضلة', 'success');
        } catch (error) {
            showToast('حدث خطأ ما', 'error');
        }
    };

    const handleContact = async (type: 'phone' | 'email' | 'whatsapp') => {
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول للتواصل مع البائع', 'info');
            if (setShowLogin) {
                setShowLogin(true);
            } else {
                setTimeout(() => navigate('/'), 1000);
            }
            return;
        }

        const phone = listing.contact_phone || (listing.provider || listing.owner?.car_provider)?.phone;
        const email = (listing.provider || listing.owner?.car_provider)?.email;
        const whatsapp = listing.contact_whatsapp || phone;

        if (type === 'phone') {
            if (!phone) {
                showToast('رقم الهاتف غير متوفر', 'error');
                return;
            }
            CarProviderService.trackAnalytics(listing.id, 'contact_phone').catch(console.error);
            window.location.href = `tel:${phone}`;
        } else if (type === 'whatsapp') {
            if (!whatsapp) {
                showToast('رقم الواتساب غير متوفر', 'error');
                return;
            }
            CarProviderService.trackAnalytics(listing.id, 'contact_whatsapp').catch(console.error);

            const message = encodeURIComponent(
                `مرحباً، أنا مهتم بسيارتك ${listing.title}\n` +
                `السعر: ${dailyRate ? safePrice(dailyRate) : 'اتصل'} (يومي)\n` +
                `الرابط: ${window.location.href}`
            );

            const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleReportSubmit = async (reason: string, details: string) => {
        try {
            await CarProviderService.reportListing(listing.id, { reason, details });
            showToast('تم إرسال البلاغ بنجاح', 'success');
        } catch (error) {
            showToast('فشل إرسال البلاغ', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 lg:pb-0"
        >
            {/* SEO Component */}
            {/* SEO Component */}
            {listing && (
                <SEO
                    title={`${listing.title} | إيجار سيارات`}
                    description={listing.description || `${listing.title} للإيجار في ${listing.city}. ${listing.year} - ${safePrice(listing.daily_rate || 0)} يومياً.`}
                    openGraph={{
                        title: `${listing.title} | إيجار سيارات`,
                        description: listing.description,
                        image: listing.photos?.[0] || listing.images?.[0],
                        type: 'product'
                    }}
                    schema={{
                        type: 'RentalCarReservation',
                        data: generateRentalSchema(listing)
                    }}
                />
            )}

            {/* Header Navigation */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
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

            <div className="w-full px-2 md:px-8 sm:px-6 py-4">

                {/* Gallery */}
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

                        {/* Title Section */}
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
                            {(listing.brand || listing.model || listing.year || listing.mileage || listing.transmission || listing.fuel_type || listing.horsepower) && (
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

                        {/* Mobile Price Card */}
                        <div className="lg:hidden">
                            <PriceCard listing={listing} className="shadow-sm border-0 bg-transparent p-0" />
                        </div>

                        {/* Detailed Specs Tabs */}
                        <SpecificationsTabs listing={listing} />

                        {/* Rental Terms / Conditions - Enhanced */}
                        {hasConditions && (
                            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl p-6 sm:p-8 shadow-sm border-2 border-teal-200 dark:border-teal-800">
                                <h2 className="text-2xl font-bold text-teal-900 dark:text-teal-100 mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-teal-600 dark:bg-teal-700 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    شروط الإيجار
                                </h2>

                                {termsList.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                        {termsList.map((term, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-teal-100 dark:border-teal-900/50 hover:shadow-md transition-shadow">
                                                <div className="mt-0.5 w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                                                    <CheckCircle className="w-4 h-4" />
                                                </div>
                                                <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{translateRentalTerm(term)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {structuredTerms.custom_terms && (
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border-2 border-amber-200 dark:border-amber-800/50 shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h3 className="font-bold text-amber-900 dark:text-amber-100 text-base">شروط إضافية</h3>
                                        </div>
                                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                            {structuredTerms.custom_terms}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Car Body Diagram */}
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

                        {/* Rental Requirements */}
                        {hasRequirements && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm border border-orange-100 dark:border-orange-900/30">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-orange-600" />
                                    متطلبات الأيجار
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {structuredTerms.security_deposit && (
                                        <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/50">
                                            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-full text-orange-600 shadow-sm">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">مبلغ التأمين</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {safePrice(structuredTerms.security_deposit)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(structuredTerms.min_renter_age || structuredTerms.min_license_age) && (
                                        <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-800/50">
                                            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-full text-orange-600 shadow-sm">
                                                <Users className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الحد الأدنى للعمر / الرخصة</p>
                                                <div className="flex gap-4">
                                                    {structuredTerms.min_renter_age && (
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {structuredTerms.min_renter_age} سنة (عمر)
                                                        </span>
                                                    )}
                                                    {structuredTerms.min_license_age && (
                                                        <span className="font-bold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-600 pr-4 mr-1">
                                                            {structuredTerms.min_license_age} سنة (رخصة)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}



                    </div>

                    {/* Sidebar Column (4 cols) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 space-y-6">

                            {/* Price Card (Desktop) */}
                            <div className="hidden lg:block">
                                <PriceCard listing={listing} className="shadow-xl ring-1 ring-black/5" />
                            </div>

                            {/* Contact Buttons */}
                            <div className="flex flex-col gap-3">
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

                            {/* Safety Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1">سلامة المعاملة</h4>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                        لا تقم بأي تحويلات مالية قبل معاينة السيارة وتوقيع العقد.
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

            {/* Full Width Sections */}
            <div className="w-full px-2 md:px-8 sm:px-6 py-8 space-y-12 max-w-7xl mx-auto">
                {/* Sponsored Listings */}
                <SponsoredListings
                    currentListingId={listing.id}
                    t={t}
                    listingType="rent"
                    showToast={showToast}
                    isAuthenticated={isAuthenticated}
                    onLoginClick={() => setShowLogin && setShowLogin(true)}
                />

                {/* Similar Listings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <SimilarListings
                        currentListingId={listing.id}
                        categoryId={listing.category?.id}
                        brandId={listing.brand?.id}
                        t={t}
                    />
                </div>
            </div>

            {/* Mobile Sticky Bar - Touch Optimized */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40"
                style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
            >
                <div className="flex gap-2">
                    {/* Favorite Button */}
                    <button
                        onClick={handleFavoriteToggle}
                        className={cn(
                            "p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center",
                            isFavorited
                                ? "bg-red-50 border-red-300 text-red-500"
                                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                        )}
                        aria-label="مفضلة"
                    >
                        <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
                    </button>

                    {/* Phone Button */}
                    <button
                        onClick={() => handleContact('phone')}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold touch-manipulation active:scale-[0.98] transition-all min-h-[48px]"
                    >
                        <Phone className="w-5 h-5" />
                        <span className="text-sm sm:text-base">{t.ui.call}</span>
                    </button>

                    {/* WhatsApp Button */}
                    {hasWhatsapp && (
                        <button
                            onClick={() => handleContact('whatsapp')}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold touch-manipulation active:scale-[0.98] transition-all min-h-[48px]"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm sm:text-base">{t.ui.whatsapp}</span>
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

        </motion.div >
    );
};

export default RentCarListingDetail;
