import React, { useState, useMemo, useCallback } from 'react';
import { Quote, Settings } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';
import Rating from '../Rating';
import { getStorageUrl } from '../../config/api';

const QuoteCard: React.FC<{
    quote: Quote,
    orderNumber: string,
    providerRating?: number,
    onAcceptOffer: () => void,
    canBeAccepted: boolean,
    isAccepted: boolean,
    isCheapest: boolean,
    settings: Settings,
    city: string
}> = ({ quote, orderNumber, providerRating, onAcceptOffer, canBeAccepted, isAccepted, isCheapest, settings, city }) => {
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const closeModal = useCallback(() => setImageModalUrl(null), []);
    const openModal = useCallback((url: string) => setImageModalUrl(url), []);
    const goToPreviousImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => prev === 0 ? (quote.media?.images?.length || 1) - 1 : prev - 1);
    }, [quote.media?.images?.length]);
    const goToNextImage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => prev === (quote.media?.images?.length || 1) - 1 ? 0 : prev + 1);
    }, [quote.media?.images?.length]);

    const shippingPrice = useMemo(() => {
        if (!quote.partSizeCategory || !city) return 0;
        const shippingPrices = settings?.limitSettings?.shippingPrices || [];
        const cityPrices = Array.isArray(shippingPrices) ? shippingPrices.find(p => p && p.city === city) : undefined;
        const fallbackPrices = Array.isArray(shippingPrices) ? shippingPrices.find(p => p && p.city === 'أخرى') : undefined;
        const pricesToUse = cityPrices || fallbackPrices;
        if (!pricesToUse) return 0;
        return Number(pricesToUse[quote.partSizeCategory]) || 0;
    }, [quote.partSizeCategory, city, settings.limitSettings.shippingPrices]);

    const totalPrice = Number(quote.price) + Number(shippingPrice);

    const mediaUrls = useMemo(() => {
        const result: { images: string[], video?: string, voiceNote?: string } = { images: [] };

        if (quote.media) {
            if (quote.media.images && Array.isArray(quote.media.images)) {
                result.images = quote.media.images.map((path: string) => getStorageUrl(path)).filter(url => !!url);
            }
            if (quote.media.video) {
                result.video = getStorageUrl(quote.media.video);
            }
            if (quote.media.voiceNote) {
                result.voiceNote = getStorageUrl(quote.media.voiceNote);
            }
        }

        return result;
    }, [quote.media]);


    return (
        <Card className={`relative transition-all duration-500 flex flex-col group overflow-hidden ${isAccepted
            ? 'bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 border-emerald-500 shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/20'
            : 'hover:border-primary-400 dark:hover:border-primary-600 hover:-translate-y-2 hover:shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-darkcard'
            }`}>

            {/* 3D-effect Banners */}
            {isCheapest && !isAccepted && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1.5 uppercase tracking-wider scale-110 -rotate-2">
                        <Icon name="Star" className="w-3 h-3 fill-current" />
                        الأفضل سعراً
                    </div>
                </div>
            )}

            {isAccepted && (
                <div className="absolute top-4 left-4 z-20 pointer-events-none">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 uppercase tracking-wider scale-110 -rotate-2">
                        <Icon name="Check" className="w-3 h-3" />
                        تم الاختيار
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold shadow-md">
                                {quote.providerName && quote.providerPhone ? (
                                    quote.providerName.charAt(0).toUpperCase()
                                ) : (
                                    <Icon name="User" className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-gray-200">
                                    {quote.providerName && quote.providerPhone ? quote.providerName : `المزود #${quote.providerUniqueId}`}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {quote.providerUniqueId && (quote.providerName && quote.providerPhone) && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">#{quote.providerUniqueId}</span>
                                    )}
                                    {providerRating !== undefined && (
                                        <div className="flex items-center gap-1.5">
                                            <Rating rating={providerRating} readOnly size="sm" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">({providerRating.toFixed(1)})</span>
                                        </div>
                                    )}
                                </div>
                                {quote.providerPhone && (
                                    <div className="mt-1">
                                        <a
                                            href={`https://wa.me/${quote.providerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، بخصوص العرض المقدم للطلب رقم ${orderNumber} في تطبيق راموسة.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-medium transition-colors shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Icon name="MessageCircle" className="w-3 h-3" />
                                            <span>{quote.providerPhone}</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <Badge variant={quote.partStatus === 'new' ? 'default' : 'orange'}>
                        {quote.partStatus === 'new' ? 'جديد' : 'مستعمل'}
                    </Badge>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex-grow space-y-4">
                {/* Dynamic Price Breakdown */}
                <div className="group/price relative overflow-hidden bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 hover:border-primary-500/30">
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center group-hover/price:translate-x-1 transition-transform">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">سعر القطعة</span>
                            <span className="text-lg font-black text-slate-700 dark:text-slate-300">${quote.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center group-hover/price:translate-x-1 transition-transform delay-75">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">تكاليف الشحن</span>
                            <span className="text-lg font-black text-slate-700 dark:text-slate-300">${shippingPrice.toLocaleString()}</span>
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t-2 border-dashed border-slate-200 dark:border-slate-800"></span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pt-2">
                            <div>
                                <span className="text-[10px] font-black text-primary-500 uppercase tracking-widest block mb-1">الإجمالي النهائي</span>
                                <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    ${totalPrice.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-left">
                                <span className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <Icon name="Truck" className="w-3 h-3" />
                                    شامل الشحن
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Background Blur Decoration */}
                    <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl group-hover/price:bg-primary-500/20 transition-colors"></div>
                </div>

                {/* Notes */}
                {quote.notes && (
                    <div className="relative">
                        <div className="absolute top-3 right-3 text-primary/20">
                            <Icon name="Quote" className="w-8 h-8" />
                        </div>
                        <blockquote className="text-sm text-gray-700 dark:text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 pr-12 rounded-xl italic border-r-4 border-primary shadow-sm">
                            {quote.notes}
                        </blockquote>
                    </div>
                )}

                {/* Video */}
                {mediaUrls.video && (
                    <div className="rounded-xl overflow-hidden shadow-md border-2 border-gray-200 dark:border-gray-700">
                        <video src={mediaUrls.video} controls className="w-full" />
                    </div>
                )}

                {/* Voice Note */}
                {mediaUrls.voiceNote && (
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-primary-200 dark:border-primary-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon name="Mic" className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-300">ملاحظة صوتية</span>
                        </div>
                        <audio src={mediaUrls.voiceNote} controls className="w-full" />
                    </div>
                )}

                {/* Images Gallery */}
                {mediaUrls.images.length > 0 && (
                    <div className="relative w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-xl overflow-hidden group border-2 border-slate-200 dark:border-slate-700 shadow-md">
                        <img
                            src={mediaUrls.images[currentImageIndex]}
                            alt={`Quote image ${currentImageIndex + 1}`}
                            className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
                            onClick={() => setImageModalUrl(mediaUrls.images[currentImageIndex])}
                        />

                        {mediaUrls.images.length > 1 && (
                            <>
                                <button
                                    onClick={goToPreviousImage}
                                    aria-label="Previous image"
                                    className="absolute top-1/2 left-3 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-10"
                                >
                                    <Icon name="ChevronLeft" className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={goToNextImage}
                                    aria-label="Next image"
                                    className="absolute top-1/2 right-3 transform -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-10"
                                >
                                    <Icon name="ChevronRight" className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    {mediaUrls.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentImageIndex(index);
                                            }}
                                            className={`w-2 h-2 rounded-full transition-all duration-200 ${currentImageIndex === index
                                                ? 'bg-white w-6'
                                                : 'bg-white/50 hover:bg-white/75'
                                                }`}
                                            aria-label={`Go to image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-darkbg dark:to-slate-900 rounded-b-2xl mt-auto border-t border-gray-200 dark:border-gray-700">
                {isAccepted ? (
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm py-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Icon name="Check" className="w-4 h-4 text-white" />
                        </div>
                        تم قبول هذا العرض
                    </div>
                ) : canBeAccepted ? (
                    <Button
                        onClick={onAcceptOffer}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg"
                        leftIcon={<Icon name="Check" className="w-4 h-4" />}
                    >
                        قبول العرض
                    </Button>
                ) : (
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 text-center py-2">لا يمكن قبول العرض حالياً</p>
                )}
            </div>

            {/* Image Modal */}
            {imageModalUrl && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={() => setImageModalUrl(null)}>
                    <div className="relative max-w-7xl max-h-[90vh] animate-fade-in">
                        <img src={imageModalUrl} alt="Quote image" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
                        <button
                            onClick={() => setImageModalUrl(null)}
                            className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-xl"
                            aria-label="Close image viewer"
                        >
                            <Icon name="X" className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default QuoteCard;
