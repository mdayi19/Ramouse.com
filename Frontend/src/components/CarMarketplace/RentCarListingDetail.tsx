import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Calendar, Gauge, GitFork, Share2, Heart, ArrowLeft,
    Phone, MessageSquare, ShieldCheck, Star, User, Clock,
    CheckCircle2, AlertCircle, Info, Car
} from 'lucide-react';
import { CarProviderService, CarListing } from '../../services/carprovider.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '../../hooks/useAppState';

const RentCarListingDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { showToast, isAuthenticated, userPhone } = useAppState();

    const [listing, setListing] = useState<CarListing | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);

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
            setIsFavorited(false); // Ideally check from API
            // Check favorite status
            if (data?.id) {
                CarProviderService.checkFavorite(data.id).then(setIsFavorited).catch(console.error);
                CarProviderService.trackAnalytics(data.id, 'view').catch(console.error);
            }
        } catch (error) {
            console.error('Failed to load listing:', error);
            showToast('فشل تحميل تفاصيل السيارة', 'error');
            navigate('/rent-car');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: listing?.title || 'Rent Car',
                    text: `Check out this rental car: ${listing?.title}`,
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

    const handlePhoneCall = async () => {
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول للاتصال بالبائع', 'info');
            return;
        }
        if (!listing?.contact_phone) {
            showToast('رقم الهاتف غير متوفر', 'error');
            return;
        }

        // Track contact analytics
        if (listing?.id) {
            try {
                await CarProviderService.trackAnalytics(listing.id, 'contact_phone');
            } catch (error) {
                console.error('Failed to track phone contact:', error);
            }
        }

        // Open phone dialer
        window.location.href = `tel:${listing.contact_phone}`;
    };

    const handleWhatsApp = async () => {
        if (!isAuthenticated) {
            showToast('الرجاء تسجيل الدخول للتواصل عبر واتساب', 'info');
            return;
        }

        const phone = listing?.contact_whatsapp || listing?.contact_phone;
        if (!phone) {
            showToast('رقم الواتساب غير متوفر', 'error');
            return;
        }

        // Track WhatsApp contact analytics
        if (listing?.id) {
            try {
                await CarProviderService.trackAnalytics(listing.id, 'contact_whatsapp');
            } catch (error) {
                console.error('Failed to track WhatsApp contact:', error);
            }
        }

        // Prepare WhatsApp message in Arabic
        const message = encodeURIComponent(
            `مرحباً، أنا مهتم بسيارتك ${listing.title}\n` +
            `السعر: ${formatPrice(listing.daily_rate || listing.price)} (يومي)\n` +
            `الرابط: ${window.location.href}`
        );

        // Open WhatsApp (works on mobile and desktop)
        const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', maximumFractionDigits: 0 }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!listing) return null;

    const images = (listing.photos && listing.photos.length > 0) ? listing.photos : ['/placeholder-car.jpg'];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header / Nav */}
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </button>
                    <h1 className="text-lg font-bold truncate max-w-xs md:max-w-md">{listing.title}</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleFavoriteToggle}
                            className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors ${isFavorited ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Gallery & Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Gallery */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm">
                            <div className="aspect-video relative bg-black">
                                <motion.img
                                    key={activeImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    src={images[activeImageIndex]}
                                    alt={listing.title}
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === activeImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* Thumbnails */}
                            {images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    {images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`relative w-20 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${idx === activeImageIndex ? 'border-primary' : 'border-transparent'}`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Rental Rates Card */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-teal-100 dark:border-teal-900/30">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-6 h-6 text-teal-600" />
                                خيارات الإيجار
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 text-center">
                                    <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">يومي</span>
                                    <span className="text-xl font-bold text-teal-700 dark:text-teal-300">
                                        {formatPrice(listing.daily_rate || listing.price)}
                                    </span>
                                </div>
                                {listing.weekly_rate && (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">أسبوعي</span>
                                        <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                            {formatPrice(listing.weekly_rate)}
                                        </span>
                                    </div>
                                )}
                                {listing.monthly_rate && (
                                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-center">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 block mb-1">شهري</span>
                                        <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                            {formatPrice(listing.monthly_rate)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
                            <h2 className="text-xl font-bold">المواصفات</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <SpecItem icon={Calendar} label="السنة" value={listing.year} />
                                <SpecItem icon={Gauge} label="الممشى" value={`${listing.mileage.toLocaleString()} كم`} />
                                <SpecItem icon={GitFork} label="ناقل الحركة" value={listing.transmission} />
                                <SpecItem icon={Car} label="الموديل" value={listing.model} />
                            </div>
                        </div>

                        {/* Rental Terms */}
                        {listing.rental_terms && Array.isArray(listing.rental_terms) && listing.rental_terms.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                                    شروط ومميزات الإيجار
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {listing.rental_terms.map((term, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
                                            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-teal-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{term as string}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-3">الوصف</h2>
                            <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${!showFullDesc && 'line-clamp-4'}`}>
                                {listing.description}
                            </p>
                            {listing.description && listing.description.length > 200 && (
                                <button
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-primary font-medium mt-2 hover:underline"
                                >
                                    {showFullDesc ? 'عرض أقل' : 'عرض المزيد'}
                                </button>
                            )}
                        </div>

                        {/* Features */}
                        {listing.features && listing.features.length > 0 && (
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold mb-4">المميزات</h2>
                                <div className="flex flex-wrap gap-2">
                                    {listing.features.map((feature, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Provider Info & Contact - Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm sticky top-24 border border-slate-100 dark:border-slate-700">
                            {/* Provider Profile */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {listing.owner?.avatar ? (
                                        <img src={listing.owner.avatar} alt={listing.owner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">مقدم الخدمة</p>
                                    <h3 className="font-bold text-lg">{listing.owner?.name || 'غير متوفر'}</h3>
                                </div>
                            </div>

                            {/* Contact Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handlePhoneCall}
                                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20"
                                >
                                    <Phone className="w-5 h-5" />
                                    اتصال
                                </button>
                                <button
                                    onClick={handleWhatsApp}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    واتساب
                                </button>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                                        سلامة المعاملة: لا تقم بأي تحويلات مالية قبل معاينة السيارة وتوقيع العقد.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const SpecItem: React.FC<{ icon: any; label: string; value: string | number | undefined | null | any }> = ({ icon: Icon, label, value }) => {
    if (value === undefined || value === null || value === '' || typeof value === 'object') return null;
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm text-slate-400">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{value}</p>
            </div>
        </div>
    );
};

export default RentCarListingDetail;
