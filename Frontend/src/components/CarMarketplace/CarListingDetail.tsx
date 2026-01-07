import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Car, MapPin, Calendar, Gauge, Fuel, Settings, Phone,
    Mail, Heart, Share2, ChevronLeft, ChevronRight, X,
    CheckCircle, Star, Eye, MessageCircle, ExternalLink, Shield
} from 'lucide-react';
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';

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
        video: 'فيديو توضيحي',
        specs_title: 'المواصفات',
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

const SpecItem: React.FC<{ icon: any; label: string; value: string | number | undefined | null }> = ({ icon: Icon, label, value }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
                <p className="font-medium text-slate-900 dark:text-white capitalize">{typeof value === 'string' ? translateValue(value) : value}</p>
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

    // Gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);

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

    const handleContact = async (type: 'phone' | 'email' | 'whatsapp') => {
        if (!listing) return;

        // Track contact event
        await CarProviderService.trackAnalytics(listing.id, 'contact_click');

        if (type === 'phone' && listing.provider?.phone) {
            window.location.href = `tel:${listing.provider.phone}`;
        } else if (type === 'email' && listing.provider?.email) {
            window.location.href = `mailto:${listing.provider.email}`;
        } else if (type === 'whatsapp' && listing.provider?.phone) {
            window.open(`https://wa.me/${listing.provider.phone.replace(/[^0-9]/g, '')}`, '_blank');
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
            alert('Link copied to clipboard!');
        }
    };

    const nextImage = () => {
        if (!listing?.images || listing.images.length === 0) return;
        setSelectedImageIndex((prev) => (prev + 1) % listing.images!.length);
    };

    const prevImage = () => {
        if (!listing?.images || listing.images.length === 0) return;
        setSelectedImageIndex((prev) => (prev - 1 + listing.images!.length) % listing.images!.length);
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



    // ... inside CarListingDetail component ...
    const images = (listing.photos && listing.photos.length > 0)
        ? listing.photos
        : (listing.images && listing.images.length > 0)
            ? listing.images
            : ['/placeholder-car.jpg'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Gallery */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                            <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                                <img
                                    src={images[selectedImageIndex]}
                                    alt={listing.title}
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => setShowGalleryModal(true)}
                                />

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </>
                                )}

                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    {listing.is_sponsored && (
                                        <span className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">
                                            {t.ui.sponsored}
                                        </span>
                                    )}
                                    {listing.is_featured && (
                                        <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">
                                            {t.ui.featured}
                                        </span>
                                    )}
                                    {listing.listing_type === 'rent' && (
                                        <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                                            {t.ui.rent}
                                        </span>
                                    )}
                                </div>

                                {/* Image Counter */}
                                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                                    {selectedImageIndex + 1} / {images.length}
                                </div>
                            </div>

                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIndex(idx)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                                                ? 'border-blue-500 ring-2 ring-blue-200'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                                }`}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video Section */}
                        {listing.video_url && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.video}</h2>
                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                                    <iframe
                                        src={listing.video_url.replace('watch?v=', 'embed/')}
                                        title="Car Video"
                                        className="w-full h-full"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}

                        {/* Title & Price */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                        {listing.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        {listing.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {listing.location}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <Eye className="w-4 h-4" />
                                            {listing.views_count || 0} {t.ui.view_count}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {safeDate(listing.created_at)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={handleFavoriteToggle}
                                        className={`p-3 rounded-lg transition-colors ${isFavorited
                                            ? 'bg-red-500 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-baseline gap-2 mb-4">
                                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                    {safePrice(listing.price)}
                                </span>
                                {listing.listing_type === 'rent' && (
                                    <span className="text-gray-600 dark:text-gray-400">/ يوم</span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {listing.condition && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span className="text-gray-900 dark:text-white font-medium capitalize">
                                            {translateValue(listing.condition)}
                                        </span>
                                    </div>
                                )}
                                {listing.warranty && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <Star className="w-5 h-5 text-blue-500" />
                                        <span className="text-blue-700 dark:text-blue-300 font-medium">
                                            {t.specs.warranty}: {listing.warranty}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t.ui.specs_title}</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {/* Basic Specs */}
                                <SpecItem icon={Calendar} label={t.specs.year} value={listing.year} />
                                <SpecItem icon={Gauge} label={t.specs.mileage} value={`${listing.mileage.toLocaleString()} ${t.ui.km}`} />
                                <SpecItem icon={Settings} label={t.specs.transmission} value={listing.transmission} />
                                <SpecItem icon={Fuel} label={t.specs.fuel_type} value={listing.fuel_type} />

                                {/* Engine & Performance */}
                                <SpecItem icon={Settings} label={t.specs.engine_size} value={listing.engine_size} />
                                <SpecItem icon={Gauge} label={t.specs.horsepower} value={listing.horsepower ? `${listing.horsepower} ${t.ui.hp}` : undefined} />

                                {/* Exterior/Interior */}
                                <SpecItem icon={Car} label={t.specs.exterior_color} value={listing.exterior_color} />
                                <SpecItem icon={Settings} label={t.specs.interior_color} value={listing.interior_color} />

                                {/* Body & Dimensions */}
                                <SpecItem icon={Car} label={t.specs.body_style} value={listing.category?.name_ar || listing.category?.name} />
                                <SpecItem icon={CheckCircle} label={t.specs.body_condition} value={listing.body_condition} />
                                <SpecItem icon={Settings} label={t.specs.doors_count} value={listing.doors_count} />
                                <SpecItem icon={Settings} label={t.specs.seats_count} value={listing.seats_count} />
                            </div>
                        </div>

                        {/* Features List */}
                        {listing.features && Array.isArray(listing.features) && listing.features.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.features_title}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {listing.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t.ui.description_title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                                {listing.description}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Provider Card */}
                        {(() => {
                            const provider = listing.provider || listing.owner?.car_provider;
                            // Safe render even if no provider
                            if (!provider) return null;

                            return (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4">
                                    <div className="text-center mb-6">
                                        <div className="relative inline-block">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md">
                                                {provider.logo_url ? (
                                                    <img
                                                        src={provider.logo_url}
                                                        alt="Provider Logo"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    provider.business_name?.charAt(0) || 'P'
                                                )}
                                            </div>
                                            {provider.is_verified && (
                                                <div className="absolute bottom-2 right-1/2 translate-x-10 bg-green-500 text-white p-1 rounded-full border-2 border-white dark:border-gray-800" title={t.ui.verified}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                            {provider.business_name}
                                        </h3>

                                        {provider.city && (
                                            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                                <MapPin className="w-3 h-3" />
                                                <span>{provider.city}</span>
                                            </div>
                                        )}

                                        {provider.member_since && (
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                عضو منذ {new Date(provider.member_since).getFullYear()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {(listing.contact_phone || provider.phone) && (
                                            <button
                                                onClick={() => handleContact('phone')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                            >
                                                <Phone className="w-5 h-5" />
                                                {t.ui.call}
                                            </button>
                                        )}

                                        {(listing.contact_whatsapp || provider.phone) && (
                                            <button
                                                onClick={() => handleContact('whatsapp')}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                                {t.ui.whatsapp}
                                            </button>
                                        )}

                                        {listing.seller_type === 'provider' && (
                                            <button
                                                onClick={() => navigate(`/car-providers/${provider.id}`)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium border border-gray-200 dark:border-gray-600"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                                {t.ui.view_profile}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <button className="w-full text-xs text-gray-500 dark:text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {t.ui.report}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowGalleryModal(false)}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-6xl w-full">
                        <img
                            src={images[selectedImageIndex]}
                            alt={listing.title}
                            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarListingDetail;
