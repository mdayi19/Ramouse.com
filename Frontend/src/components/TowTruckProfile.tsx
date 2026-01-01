
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TowTruck, GalleryItem, Customer, TowTruckReview, Review } from '../types';
import { getImageUrl } from '../utils/helpers';
import Icon from './Icon';
import Rating from './Rating';
import { toCanvas } from 'qrcode';
import PrintableTowTruckProfile from './PrintableTowTruckProfile';
import MediaViewer from './MediaViewer';
import SEO from './SEO';

interface TowTruckProfileProps {
    towTruck: TowTruck;
    onBack: () => void;
    userPhone: string;
    isCustomer: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    isAuthenticated: boolean;
    onLoginClick: () => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode, className?: string }> = ({ icon, title, children, className }) => (
    <div className={`bg-white dark:bg-darkcard rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
            {icon}
            {title}
        </h3>
        <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            {children}
        </div>
    </div>
);

const ReviewSection: React.FC<Pick<TowTruckProfileProps, 'towTruck' | 'isCustomer' | 'userPhone' | 'showToast' | 'isAuthenticated' | 'onLoginClick'>> =
    ({ towTruck, isCustomer, userPhone, showToast, isAuthenticated, onLoginClick }) => {
        const [rating, setRating] = useState(0);
        const [comment, setComment] = useState('');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [reviews, setReviews] = useState<Review[]>([]);
        const [isLoading, setIsLoading] = useState(true);

        // Fetch reviews from API
        useEffect(() => {
            const fetchReviews = async () => {
                try {
                    const response = await fetch(`/api/tow-trucks/${towTruck.id}/reviews`);
                    if (response.ok) {
                        const data = await response.json();
                        setReviews(data);
                    }
                } catch (error) {
                    console.error('Error fetching reviews:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchReviews();
        }, [towTruck.id]);

        const approvedReviews = useMemo(() => reviews.filter(r => r.status === 'approved').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [reviews]);
        const myReview = useMemo(() => reviews.find(r => r.user_id.toString() === userPhone || r.reviewable_id === userPhone), [reviews, userPhone]);

        const handleSubmit = async () => {
            if (rating === 0) {
                showToast('الرجاء اختيار تقييم (نجمة واحدة على الأقل).', 'error');
                return;
            }
            if (!comment.trim()) {
                showToast('الرجاء كتابة تعليق.', 'error');
                return;
            }

            setIsSubmitting(true);

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        reviewable_type: 'tow_truck',
                        reviewable_id: towTruck.id,
                        rating,
                        comment
                    })
                });

                if (response.ok) {
                    showToast('تم إرسال تقييمك للمراجعة. شكراً لك!', 'success');
                    setRating(0);
                    setComment('');
                    const data = await response.json();
                    setReviews([...reviews, data.review]);
                } else {
                    const error = await response.json();
                    showToast(error.message || 'فشل إرسال التقييم.', 'error');
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                showToast('حدث خطأ أثناء إرسال التقييم.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        };

        return (
            <InfoCard icon={<Icon name="Star" className="w-6 h-6" />} title="التقييمات والآراء">
                {!isAuthenticated && (
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6 border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 shadow-sm">
                            <Icon name="LogIn" className="w-6 h-6 text-primary dark:text-primary-400" />
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 font-medium">يرجى تسجيل الدخول لتتمكن من إضافة تقييمك.</p>
                        <button onClick={onLoginClick} className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2">
                            <span>تسجيل الدخول</span>
                            <Icon name="ArrowLeft" className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {isAuthenticated && isCustomer && !myReview && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
                        <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">أضف تقييمك</h4>
                        <div className="space-y-3">
                            <div><Rating rating={rating} onRating={setRating} /></div>
                            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="اكتب تعليقك هنا..." className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"></textarea>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm disabled:bg-slate-400">
                                {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                            </button>
                        </div>
                    </div>
                )}
                {isAuthenticated && isCustomer && myReview && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                        <h4 className="font-semibold">تقييمك</h4>
                        <Rating rating={myReview.rating} readOnly />
                        <p className="text-sm italic mt-1">"{myReview.comment}"</p>
                        <p className="text-xs font-bold mt-2">الحالة: {myReview.status === 'pending' ? 'قيد المراجعة' : myReview.status === 'approved' ? 'مقبول' : 'مرفوض'}</p>
                        {myReview.provider_response && (
                            <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded">
                                <p className="text-xs font-semibold">رد السائق:</p>
                                <p className="text-sm mt-1">"{myReview.provider_response}"</p>
                            </div>
                        )}
                    </div>
                )}
                {approvedReviews.length > 0 ? (
                    <div className="space-y-4">
                        {approvedReviews.map(review => (
                            <div key={review.id} className="pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{review.customer_name}</span>
                                    <Rating rating={review.rating} readOnly size="sm" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mt-1 italic">"{review.comment}"</p>
                                {review.provider_response && (
                                    <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                        <p className="text-xs font-semibold text-primary">رد السائق:</p>
                                        <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">"{review.provider_response}"</p>
                                    </div>
                                )}
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-left">{new Date(review.created_at).toLocaleDateString('ar-SY')}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">لا توجد تقييمات معتمدة لهذا السائق بعد.</p>
                )}
            </InfoCard>
        );
    };

const TowTruckProfile: React.FC<TowTruckProfileProps> = (props) => {
    const { towTruck, onBack, showToast } = props;
    const [viewingMedia, setViewingMedia] = useState<{ type: 'image' | 'video'; data: string } | null>(null);
    const [copied, setCopied] = useState(false);
    const [showQrCode, setShowQrCode] = useState(false);
    const [qrCodeStatus, setQrCodeStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    const deepLink = useMemo(() => {
        const params = new URLSearchParams();
        params.set('view', 'towTruckProfile');
        params.set('towTruckId', towTruck.id);
        return `${window.location.origin}/#?${params.toString()}`;
    }, [towTruck.id]);

    const shareUrl = deepLink;




    useEffect(() => {
        if (showQrCode && qrCanvasRef.current) {
            setQrCodeStatus('loading');
            toCanvas(qrCanvasRef.current, shareUrl, { width: 256, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0284c7', light: '#FFFFFF' } }, (error) => {
                if (error) {
                    console.error("QR generation failed", error);
                    setQrCodeStatus('error');
                } else {
                    setQrCodeStatus('success');
                }
            });
        }
    }, [showQrCode, shareUrl]);

    const handleShare = async () => {
        const shareData = {
            title: `ملف ${towTruck.name} الشخصي`,
            text: `اطلع على ملف ${towTruck.name}، خدمة سحب سيارات في ${towTruck.city}.`,
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                copyToClipboard(shareData.url);
            }
        } catch (err) {
            if ((err as any).name !== 'AbortError') {
                console.error('Share failed:', err);
                copyToClipboard(shareData.url);
            }
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            showToast('تم نسخ الرابط.', 'success');
        } catch (err) {
            console.error('Failed to copy!', err);
            showToast('فشل في نسخ الرابط.', 'error');
        }
    }

    const handleViewMedia = (item: GalleryItem) => {
        setViewingMedia({
            type: item.type,
            data: getImageUrl(item.data || (item.path ? (item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '') || '')
        });
    };

    const hasSocials = towTruck.socials && (towTruck.socials.facebook || towTruck.socials.instagram);
    const hasGallery = towTruck.gallery && towTruck.gallery.length > 0;
    const whatsappMessage = encodeURIComponent('مرحباً، لقد وجدت رقمك عبر تطبيق راموسة لقطع غيار السيارات.\nThis message redirect from Ramouse');

    const ActionButton: React.FC<{ onClick?: () => void; href?: string; children: React.ReactNode; className?: string; isPrimary?: boolean }> = ({ onClick, href, children, className, isPrimary }) => {
        const commonClasses = `flex items-center justify-center gap-3 w-full text-center font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 ${className}`;
        const primaryClasses = "bg-primary text-white hover:bg-primary-700";
        const secondaryClasses = "bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500";
        const finalClasses = `${commonClasses} ${isPrimary ? primaryClasses : secondaryClasses}`;

        if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={finalClasses}>{children}</a>;
        return <button onClick={onClick} className={finalClasses}>{children}</button>;
    };

    const SocialLink: React.FC<{ href?: string; icon: React.ReactNode; name: string }> = ({ href, icon, name }) => {
        if (!href) return null;
        let finalHref = href;
        if (name === 'Instagram' && !href.startsWith('http')) {
            finalHref = `https://instagram.com/${href}`;
        }
        return <a href={finalHref} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-400 transition-colors p-2 bg-slate-100 dark:bg-slate-700 rounded-full" title={name}>{icon}</a>
    };

    return (
        <div className="p-4 sm:p-0 w-full max-w-5xl mx-auto animate-fade-in">
            <SEO
                title={`${towTruck.name} | سطحة في ${towTruck.city}`}
                description={towTruck.description || `خدمة سحب سيارات (سطحة) في ${towTruck.city} مع ${towTruck.name}. خدمة سريعة وموثوقة.`}
                openGraph={{
                    title: `${towTruck.name} | سطحة في ${towTruck.city}`,
                    description: towTruck.description,
                    image: towTruck.profilePhoto,
                    type: 'profile'
                }}
                schema={{
                    type: 'AutomotiveBusiness',
                    data: {
                        "name": towTruck.name,
                        "image": [towTruck.profilePhoto],
                        "description": towTruck.description,
                        "address": {
                            "@type": "PostalAddress",
                            "streetAddress": towTruck.serviceArea || "Unknown",
                            "addressLocality": towTruck.city,
                            "addressCountry": "SY"
                        },
                        ...(towTruck.location && {
                            "geo": {
                                "@type": "GeoCoordinates",
                                "latitude": towTruck.location.latitude,
                                "longitude": towTruck.location.longitude
                            }
                        }),
                        "telephone": towTruck.id,
                        "priceRange": "$$",
                        ...(towTruck.reviews && towTruck.reviews.filter(r => r.status === 'approved').length > 0 ? {
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": towTruck.averageRating?.toFixed(1) || "0",
                                "reviewCount": towTruck.reviews.filter(r => r.status === 'approved').length
                            }
                        } : {})
                    }
                }}
            />
            <div className="mb-6"><button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400"><Icon name="ArrowRight" /><span>العودة لدليل السطحات</span></button></div>
            <div className="bg-slate-50 dark:bg-darkbg rounded-2xl shadow-xl overflow-hidden">
                <div className="h-48 bg-slate-300 dark:bg-slate-800 relative">
                    {hasGallery && <img src={getImageUrl(towTruck.gallery![0].data || (towTruck.gallery![0].path ? (towTruck.gallery![0].path.startsWith('storage') || towTruck.gallery![0].path.startsWith('/storage') ? towTruck.gallery![0].path : `storage/${towTruck.gallery![0].path}`) : '') || '')} alt="background" className="w-full h-full object-cover blur-sm" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-darkbg dark:via-darkbg/80"></div>
                </div>
                <div className="px-6 pb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-32 sm:-mt-24 gap-6 relative">
                        {towTruck.profilePhoto ? <img className="w-48 h-48 rounded-full object-cover ring-8 ring-slate-50 dark:ring-darkbg shadow-lg" src={getImageUrl(towTruck.profilePhoto.startsWith('storage') || towTruck.profilePhoto.startsWith('/storage') || towTruck.profilePhoto.startsWith('http') || towTruck.profilePhoto.startsWith('data') ? towTruck.profilePhoto : `storage/${towTruck.profilePhoto}`)} alt={towTruck.name} />
                            : <div className="w-48 h-48 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-8 ring-slate-50 dark:ring-darkbg shadow-lg"><Icon name="User" className="w-24 h-24 text-slate-400 dark:text-slate-500" /></div>}
                        <div className="text-center sm:text-right pb-4 flex-grow">
                            <div className="flex items-center justify-center sm:justify-start gap-2"><h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100">{towTruck.name}</h1>{towTruck.isVerified && <Icon name="BadgeCheck" className="w-8 h-8 text-primary" />}</div>
                            <div className="mt-2 flex items-center justify-center sm:justify-start gap-4 text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5 text-md font-semibold text-primary dark:text-primary-400"><Icon name="Truck" /><span>{towTruck.vehicleType}</span></div>
                                <div className="flex items-center gap-1.5 text-md font-medium"><Icon name="MapPin" /><span>{towTruck.city}</span></div>
                            </div>
                            {towTruck.averageRating !== undefined && <div className="mt-3 flex items-center justify-center sm:justify-start gap-2"><Rating rating={towTruck.averageRating} readOnly /><span className="font-bold text-slate-700 dark:text-slate-300">{towTruck.averageRating.toFixed(1)}</span></div>}
                            {hasSocials && (
                                <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                                    <SocialLink href={towTruck.socials?.facebook} icon={<Icon name="Facebook" className="w-5 h-5" />} name="Facebook" />
                                    <SocialLink href={towTruck.socials?.instagram} icon={<Icon name="Instagram" className="w-5 h-5" />} name="Instagram" />
                                </div>
                            )}
                        </div>
                        <div className="sm:absolute top-0 right-0 pt-24 sm:pt-0 flex items-center gap-2">
                            <button onClick={handleShare} className="p-3 bg-white dark:bg-darkcard rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700">
                                {copied ? <Icon name="Check" className="w-5 h-5 text-green-500" /> : <Icon name="Share2" className="w-5 h-5" />}
                            </button>
                            <button onClick={() => setShowQrCode(true)} className="p-3 bg-white dark:bg-darkcard rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700"><Icon name="QrCode" className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <ActionButton href={`tel:${towTruck.id}`} isPrimary><Icon name="Phone" /> اتصال مباشر</ActionButton>
                        {towTruck.socials?.whatsapp && <ActionButton href={`https://wa.me/${towTruck.socials.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`} className="!bg-green-500 hover:!bg-green-600"><Icon name="MessageCircle" /> واتساب</ActionButton>}
                        {towTruck.location && <ActionButton href={`https://www.google.com/maps/dir/?api=1&destination=${towTruck.location.latitude},${towTruck.location.longitude}`}><Icon name="Navigation" /> الاتجاهات</ActionButton>}
                    </div>
                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <InfoCard icon={<Icon name="Info" />} title="نبذة">{towTruck.description || 'لا يوجد وصف.'}</InfoCard>
                            <ReviewSection {...props} />
                            {towTruck.gallery && towTruck.gallery.length > 0 && (
                                <InfoCard icon={<Icon name="GalleryHorizontal" />} title="المعرض">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        {towTruck.gallery?.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleViewMedia(item)}
                                                className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all relative group"
                                            >
                                                {item.type === 'image' ? (
                                                    <img src={getImageUrl(item.data || (item.path ? (item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '') || '')} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="relative w-full h-full">
                                                        <video src={getImageUrl(item.data || (item.path ? (item.path.startsWith('storage') || item.path.startsWith('/storage') ? item.path : `storage/${item.path}`) : '') || '')} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                                            <Icon name="Play" className="w-12 h-12 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </InfoCard>
                            )}
                        </div>
                        <div className="lg:col-span-1">
                            <InfoCard icon={<Icon name="Map" />} title="معلومات الخدمة">
                                <p className="font-semibold">{towTruck.serviceArea ? `منطقة الخدمة: ${towTruck.serviceArea}` : `الخدمة في: ${towTruck.city}`}</p>
                            </InfoCard>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Viewer with MediaViewer Component */}
            {viewingMedia && (
                <MediaViewer
                    items={[viewingMedia]}
                    activeIndex={0}
                    onIndexChange={() => { }}
                    onClose={() => setViewingMedia(null)}
                />
            )}

            {/* QR Code Modal */}
            {showQrCode && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowQrCode(false)}>
                    <div className="bg-gradient-to-br from-slate-50 to-slate-200 dark:from-darkcard dark:to-darkbg p-6 rounded-2xl shadow-2xl relative animate-modal-in w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="relative text-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-inner">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{towTruck.name}</h3>
                            <div className="mt-4 p-2 bg-white dark:bg-slate-800 rounded-lg inline-block shadow-sm min-w-[272px] min-h-[272px] flex items-center justify-center">
                                {qrCodeStatus === 'loading' && (
                                    <div className="w-[256px] h-[256px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                )}
                                {qrCodeStatus === 'error' && (
                                    <div className="w-[256px] h-[256px] flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4">
                                        <Icon name="AlertTriangle" className="w-8 h-8 mb-2" />
                                        <p className="text-sm text-center">فشل تحميل الرمز.</p>
                                    </div>
                                )}
                                <canvas ref={qrCanvasRef} className={`w-full max-w-[256px] h-auto ${qrCodeStatus !== 'success' ? 'hidden' : ''}`}></canvas>
                            </div>
                            <p className="text-xs text-slate-500 mt-4">امسح الرمز لعرض الملف الشخصي مباشرة.</p>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setShowQrCode(false)} className="flex-1 bg-slate-200 dark:bg-slate-600 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">إغلاق</button>
                        </div>
                    </div>
                    {/* Hidden Printable Component for Preview/PDF Generation */}
                    <div className="hidden">
                        <PrintableTowTruckProfile
                            towTruck={towTruck}
                            settings={JSON.parse(localStorage.getItem('app_settings') || '{}')}
                            dynamicQrCodeUrl={shareUrl}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TowTruckProfile;
