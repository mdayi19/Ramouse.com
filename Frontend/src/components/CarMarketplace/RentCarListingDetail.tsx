import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, GitFork, Share2, Heart, ArrowLeft,
    Phone, MessageSquare, ShieldCheck, Star, User, Clock,
    CheckCircle2, AlertCircle, Info, ChevronRight, MessageCircle, Shield,
    Eye
} from 'lucide-react';
import { CarProviderService, CarListing, RentalTerms } from '../../services/carprovider.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../hooks/useAppState';
import CarGallery from './ListingParts/CarGallery';
import ProviderSidebar from './ListingParts/ProviderSidebar';
import SimilarListings from './ListingParts/SimilarListings';
import ReportListingModal from './ListingParts/ReportListingModal';
import QuickSpecsBar from './ListingParts/QuickSpecsBar';
import PriceCard from './ListingParts/PriceCard';
import SpecificationsTabs from './ListingParts/SpecificationsTabs';
import FeaturesShowcase from './ListingParts/FeaturesShowcase';
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

const RentCarListingDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { showToast, isAuthenticated, setShowLogin } = useAppState();

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
        } catch (error: any) {
            console.error('Failed to load listing:', error);
            setError(error.message || 'فشل تحميل تفاصيل السيارة');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!listing) return;

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
        if (!listing) return;

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

        if (!listing) return;

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
                `السعر: ${dailyRate ? safePrice(dailyRate) : 'اتصل للسعر'} (يومي)\n` +
                `الرابط: ${window.location.href}`
            );

            const whatsappUrl = `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleReportSubmit = async (reason: string, details: string) => {
        if (!listing) return;
        try {
            await CarProviderService.reportListing(listing.id, { reason, details });
            showToast('تم إرسال البلاغ بنجاح', 'success');
        } catch (error) {
            showToast('فشل إرسال البلاغ', 'error');
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


    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 lg:pb-0"
        >
            {/* Header Navigation */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
                <div className="w-full px-4 md:px-8 sm:px-6 py-4 flex justify-between items-center">
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

            <div className="w-full px-4 md:px-8 sm:px-6 py-4">

                {/* Gallery */}
                <div className="mb-8">
                    <CarGallery
                        images={images}
                        title={listing.title}
                        isSponsored={listing.is_sponsored}
                        isFeatured={listing.is_featured}
                        isRent={listing.listing_type === 'rent'}
                        videoUrl={listing.video_url}
                        t={t}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Main Content Column (8 cols) */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Title Section */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">
                                    {t.ui.rent}
                                </span>
                                {listing.is_sponsored && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold">
                                        <Star className="w-3 h-3 fill-current" />
                                        {t.ui.sponsored}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                {listing.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                {(listing.city || listing.address || listing.location) && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>
                                            {listing.city}
                                            {listing.city && listing.address && '، '}
                                            {listing.address}
                                            {!listing.city && listing.location}
                                        </span>
                                    </div>
                                )}
                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {safeDate(listing.created_at)}
                                </span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full hidden sm:block"></span>
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-4 h-4 text-gray-400" />
                                    {listing.views_count || 0} {t.ui.view_count}
                                </span>
                            </div>
                        </div>

                        {/* Mobile Price Card */}
                        <div className="lg:hidden">
                            <PriceCard listing={listing} className="shadow-sm border-0 bg-transparent p-0" />
                        </div>

                        {/* Quick Specs */}
                        <QuickSpecsBar listing={listing} />

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.description_title}</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">
                                {listing.description}
                            </p>
                        </div>

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
                                                <ShieldCheck className="w-6 h-6" />
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
                                                <User className="w-6 h-6" />
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

                        {/* Rental Terms / Conditions */}
                        {hasConditions && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="w-6 h-6 text-teal-600" />
                                    {t.ui.rental_terms}
                                </h2>

                                {termsList.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {termsList.map((term, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                                <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">{term}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {structuredTerms.custom_terms && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">شروط اضافية</h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                            {structuredTerms.custom_terms}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Features */}
                        <FeaturesShowcase listing={listing} />

                        {/* Detailed Specs Tabs */}
                        <SpecificationsTabs listing={listing} />

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

            {/* Mobile Sticky Footer */}
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

export default RentCarListingDetail;
