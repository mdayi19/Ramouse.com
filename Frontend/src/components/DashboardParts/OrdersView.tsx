import React, { useState, useMemo, useEffect } from 'react';
import { Order, OrderStatus, Quote, ORDER_STATUS_LABELS } from '../../types';
import EmptyState from '../EmptyState';
import { ViewHeader, StatusBadge, WrenchScrewdriverIcon } from './Shared';
import Icon from '../Icon';
import Pagination from '../Pagination';
import { getStorageUrl } from '../../config/api';

interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

// ============================================
// QUOTE DISPLAY COMPONENT - Redesigned
// ============================================
const QuoteDisplay: React.FC<{ quote: Quote, orderNumber: string, isAccepted?: boolean }> = ({ quote, orderNumber, isAccepted }) => {
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const mediaUrls = useMemo(() => {
        const result: { images: string[], video?: string, voiceNote?: string } = { images: [] };
        if (quote.media) {
            if (quote.media.images && Array.isArray(quote.media.images)) {
                result.images = quote.media.images.map((path: string) => getStorageUrl(path)).filter(url => !!url);
            }
            if (quote.media.video) result.video = getStorageUrl(quote.media.video);
            if (quote.media.voiceNote) result.voiceNote = getStorageUrl(quote.media.voiceNote);
        }
        return result;
    }, [quote.media]);

    return (
        <Card
            className={`
                relative p-5 transition-all duration-300
                ${isAccepted
                    ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg'
                }
                ${!isAccepted && isHovered ? 'transform scale-[1.01]' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Accepted Badge */}
            {isAccepted && (
                <Badge className="absolute -top-2.5 right-4 bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 shadow-md">
                    <Icon name="Check" className="w-3.5 h-3.5" />
                    العرض المقبول
                </Badge>
            )}

            {/* Header Row */}
            <div className="flex justify-between items-start mb-3 pt-1">
                <div className="flex items-center gap-3">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                        ${isAccepted
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }
                    `}>
                        {quote.providerName?.charAt(0) || '؟'}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{quote.providerName || 'مزود مجهول'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono flex-wrap mt-1">
                            <span>#{quote.providerUniqueId || 'N/A'}</span>
                            {(quote.providerPhone || quote.provider_phone) && (
                                <>
                                    <span>•</span>
                                    <div className="flex items-center gap-2">
                                        <span dir="ltr" className="select-all font-semibold">
                                            {quote.providerPhone || quote.provider_phone}
                                        </span>
                                        <a
                                            href={`https://wa.me/${(quote.providerPhone || quote.provider_phone)?.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، بخصوص العرض المقدم للطلب رقم ${orderNumber} في تطبيق راموسة.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-medium transition-colors shadow-sm"
                                            onClick={(e) => e.stopPropagation()}
                                            title="تواصل عبر واتساب"
                                        >
                                            <Icon name="MessageCircle" className="w-3 h-3" />
                                            واتساب
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <time className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(quote.timestamp).toLocaleString('ar-SY', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
            </div>

            {/* Price & Status Row */}
            <div className="flex items-center gap-4 mb-3">
                <div className={`
                    text-2xl font-bold tracking-tight
                    ${isAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}
                `}>
                    ${quote.price.toLocaleString('en-US')}
                </div>
                <span className={`
                    text-xs font-medium px-2.5 py-1 rounded-full
                    ${quote.partStatus === 'new'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                    }
                `}>
                    {quote.partStatus === 'new' ? 'جديد' : 'مستعمل'}
                </span>
            </div>

            {/* Notes */}
            {quote.notes && (
                <div className="mb-3 p-3 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">"{quote.notes}"</p>
                </div>
            )}

            {/* Image Carousel */}
            {mediaUrls.images.length > 0 && (
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 group shadow-inner">
                    <img
                        src={mediaUrls.images[currentImageIndex]}
                        alt={`صورة العرض ${currentImageIndex + 1}`}
                        className="w-full h-52 object-cover cursor-zoom-in transition-all duration-500 group-hover:scale-105"
                        onClick={() => setViewingImage(mediaUrls.images[currentImageIndex])}
                        loading="lazy"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {mediaUrls.images.length > 1 && (
                        <>
                            <Button
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? mediaUrls.images.length - 1 : prev - 1); }}
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg border-0"
                                aria-label="الصورة السابقة"
                            >
                                <Icon name="ChevronLeft" className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === mediaUrls.images.length - 1 ? 0 : prev + 1); }}
                                variant="ghost"
                                size="icon"
                                className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg border-0"
                                aria-label="الصورة التالية"
                            >
                                <Icon name="ChevronRight" className="w-5 h-5" />
                            </Button>

                            {/* Image Counter Badge */}
                            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {currentImageIndex + 1} / {mediaUrls.images.length}
                            </div>

                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
                                {mediaUrls.images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                                        className={`transition-all duration-300 rounded-full ${currentImageIndex === i ? 'bg-white w-6 h-2' : 'bg-white/50 hover:bg-white/70 w-2 h-2'}`}
                                        aria-label={`الانتقال إلى الصورة ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Video & Voice Note - Compact Row */}
            {(mediaUrls.video || mediaUrls.voiceNote) && (
                <div className="mt-3 flex flex-wrap gap-3">
                    {mediaUrls.video && (
                        <video src={mediaUrls.video} controls className="flex-1 min-w-[200px] max-w-xs h-32 rounded-lg object-cover bg-slate-900" />
                    )}
                    {mediaUrls.voiceNote && (
                        <div className="flex-1 min-w-[200px]">
                            <audio src={mediaUrls.voiceNote} controls className="w-full h-10" />
                        </div>
                    )}
                </div>
            )}

            {/* Fullscreen Image Modal */}
            {viewingImage && (
                <div
                    className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setViewingImage(null)}
                >
                    <img
                        src={viewingImage}
                        alt="عرض مكبر"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300"
                    />
                    <Button
                        onClick={() => setViewingImage(null)}
                        variant="ghost"
                        size="icon"
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 shadow-xl border-0"
                        aria-label="إغلاق"
                    >
                        <Icon name="X" className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                    </Button>

                    {/* Download Button */}
                    <a
                        href={viewingImage}
                        download
                        className="absolute top-6 left-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 shadow-xl"
                        aria-label="تحميل الصورة"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Icon name="Download" className="w-5 h-5" />
                    </a>
                </div>
            )}
        </Card>
    );
};


// ============================================
// ORDER DETAILS COMPONENT - Redesigned
// ============================================
const OrderDetails: React.FC<{ order: Order; onUpdateShippingNotes: (orderNumber: string, notes: string) => void; }> = ({ order, onUpdateShippingNotes }) => {
    const { formData, quotes, acceptedQuote, customerName, customerAddress } = order;
    const [mediaUrls, setMediaUrls] = useState<{ video?: string; voiceNote?: string; images: string[] }>({ images: [] });
    const [receiptUrl, setReceiptUrl] = useState<string | undefined>(order.paymentReceiptUrl);
    const [shippingNotes, setShippingNotes] = useState(order.shippingNotes || '');
    const [notesSaved, setNotesSaved] = useState(false);

    useEffect(() => {
        const db = (window as any).db as IdbAccess;
        if (!db) return;

        let urlsToRevoke: string[] = [];
        let active = true;

        const loadMedia = async () => {
            const newUrls: typeof mediaUrls = { images: [] };

            if (formData.images && Array.isArray(formData.images) && formData.images.length > 0) {
                const firstItem = formData.images[0];
                if (typeof firstItem === 'string') {
                    newUrls.images = formData.images.map((path: any) => getStorageUrl(path)).filter((url): url is string => !!url);
                }
            }
            if (formData.video && typeof formData.video === 'string') {
                const normalized = getStorageUrl(formData.video);
                if (normalized) newUrls.video = normalized;
            }
            if (formData.voiceNote && typeof formData.voiceNote === 'string') {
                const normalized = getStorageUrl(formData.voiceNote);
                if (normalized) newUrls.voiceNote = normalized;
            }

            if (newUrls.images.length === 0 && !newUrls.video && !newUrls.voiceNote) {
                const media = await db.getMedia<{ images: File[], video?: File, voiceNote?: Blob }>('orderMedia', order.orderNumber);
                if (!active) return;

                if (media) {
                    if (media.images && media.images.length > 0) {
                        const imageUrls = media.images.map(URL.createObjectURL);
                        newUrls.images = imageUrls;
                        urlsToRevoke.push(...imageUrls);
                    }
                    if (media.video) {
                        const videoUrl = URL.createObjectURL(media.video);
                        newUrls.video = videoUrl;
                        urlsToRevoke.push(videoUrl);
                    }
                    if (media.voiceNote) {
                        const voiceNoteUrl = URL.createObjectURL(media.voiceNote);
                        newUrls.voiceNote = voiceNoteUrl;
                        urlsToRevoke.push(voiceNoteUrl);
                    }
                }
            }

            setMediaUrls(newUrls);

            if (order.paymentReceiptUrl && order.paymentReceiptUrl.startsWith('db:')) {
                const parts = order.paymentReceiptUrl.split(':');
                if (parts.length >= 3) {
                    const storeName = parts[1];
                    const key = parts[2];
                    try {
                        const blob = await db.getMedia(storeName as any, key);
                        if (blob instanceof Blob || blob instanceof File) {
                            const url = URL.createObjectURL(blob);
                            setReceiptUrl(url);
                            urlsToRevoke.push(url);
                        }
                    } catch (e) { console.error("Failed to resolve receipt", e); }
                }
            } else {
                setReceiptUrl(order.paymentReceiptUrl);
            }
        };

        loadMedia();

        return () => {
            active = false;
            urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
        };
    }, [order.orderNumber, order.paymentReceiptUrl]);

    const handleSaveNotes = () => {
        onUpdateShippingNotes(order.orderNumber, shippingNotes);
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
    };

    const DetailRow = ({ label, value, children }: { label: string; value?: string | number | string[]; children?: React.ReactNode }) => {
        if (!value && !children) return null;
        const displayValue = Array.isArray(value) ? value.join('، ') : value;
        return (
            <div className="flex items-start py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <dt className="w-32 flex-shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</dt>
                <dd className="flex-1 text-sm text-slate-800 dark:text-slate-200">{children || displayValue}</dd>
            </div>
        );
    };

    const PhoneWithWhatsApp = ({ phone }: { phone: string }) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً، بخصوص الطلب رقم ${order.orderNumber} في تطبيق راموسة.`)}`;
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <span dir="ltr" className="font-mono text-slate-700 dark:text-slate-300">{phone}</span>
                <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Icon name="MessageCircle" className="w-3.5 h-3.5" />
                    واتساب
                </a>
            </div>
        );
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <div className="p-5">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Details Section */}
                    <Card className="p-4 shadow-sm">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <Icon name="FileText" className="w-4 h-4 text-primary" />
                            تفاصيل الطلب
                        </h4>
                        <dl>
                            <DetailRow label="فئة السيارة" value={formData.category} />
                            <DetailRow label="الشركة" value={formData.brandManual || formData.brand} />
                            <DetailRow label="الموديل" value={formData.model} />
                            <DetailRow label="سنة الصنع" value={formData.year} />
                            <DetailRow label="رقم الهيكل" value={formData.vin} />
                            <DetailRow label="أنواع القطع" value={formData.partTypes} />
                            <DetailRow label="وصف القطعة" value={formData.partDescription} />
                        </dl>

                        {/* Attached Media */}
                        {(mediaUrls.video || mediaUrls.voiceNote) && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                                {mediaUrls.video && (
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">فيديو مرفق</p>
                                        <video src={mediaUrls.video} controls className="w-full max-w-sm rounded-lg" />
                                    </div>
                                )}
                                {mediaUrls.voiceNote && (
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">ملاحظة صوتية</p>
                                        <audio src={mediaUrls.voiceNote} controls className="w-full max-w-sm" />
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Delivery & Payment Section */}
                    <Card className="p-4 shadow-sm">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <Icon name="Truck" className="w-4 h-4 text-primary" />
                            التوصيل والدفع
                        </h4>
                        <dl>
                            <DetailRow label="طريقة الاستلام" value={order.deliveryMethod === 'pickup' ? 'استلام من الشركة' : 'توصيل وشحن'} />
                            {order.userPhone && (
                                <DetailRow label={order.userType === 'technician' ? 'هاتف الفني' : 'هاتف العميل'}>
                                    <PhoneWithWhatsApp phone={order.userPhone} />
                                </DetailRow>
                            )}
                            <DetailRow label="طريقة التواصل" value={formData.contactMethod} />
                            <DetailRow label="المدينة" value={formData.city} />
                            {customerName && <DetailRow label="اسم المستلم" value={customerName} />}
                            {customerAddress && <DetailRow label="عنوان التوصيل" value={customerAddress} />}
                            {order.customerPhone && (
                                <DetailRow label="هاتف المستلم">
                                    <PhoneWithWhatsApp phone={order.customerPhone} />
                                </DetailRow>
                            )}
                            {order.paymentMethodName && <DetailRow label="طريقة الدفع" value={order.paymentMethodName} />}
                        </dl>

                        {/* Payment Receipt */}
                        {receiptUrl && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">إيصال الدفع</p>
                                <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                                    <img src={receiptUrl} alt="إيصال الدفع" className="max-h-40 rounded-lg border hover:opacity-90 transition-opacity" />
                                </a>
                            </div>
                        )}

                        {/* Shipping Notes */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1.5">ملاحظات الشحن</label>
                            <textarea
                                value={shippingNotes}
                                onChange={e => setShippingNotes(e.target.value)}
                                rows={2}
                                className="w-full p-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                                placeholder="أضف ملاحظات لفريق التوصيل..."
                            />
                            <Button
                                onClick={handleSaveNotes}
                                variant="ghost"
                                className={`mt-2 text-xs px-3 py-1.5 h-auto rounded-lg font-medium transition-all ${notesSaved
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200'
                                    }`}
                            >
                                {notesSaved ? '✓ تم الحفظ' : 'حفظ الملاحظات'}
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Customer Images */}
                {mediaUrls.images.length > 0 && (
                    <Card className="mt-5 p-4 shadow-sm">
                        <h5 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <Icon name="Image" className="w-4 h-4" />
                            الصور المرفقة من العميل
                        </h5>
                        <div className="flex gap-2 flex-wrap">
                            {mediaUrls.images.map((imgSrc, i) => (
                                <a key={i} href={imgSrc} target="_blank" rel="noopener noreferrer" className="group">
                                    <img
                                        src={imgSrc}
                                        alt={`صورة ${i + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border-2 border-white dark:border-slate-700 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all"
                                    />
                                </a>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Quotes Summary */}
                {quotes && quotes.length > 0 && (
                    <div className="mt-6 bg-gradient-to-br from-primary-50 via-blue-50 to-indigo-50 dark:from-primary-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border-2 border-primary-100 dark:border-primary-800 shadow-lg">
                        <h4 className="font-bold text-base text-primary-700 dark:text-primary-300 mb-4 flex items-center gap-2">
                            <Icon name="TrendingUp" className="w-5 h-5" />
                            ملخص العروض
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">عدد العروض</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{quotes.length}</p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">أقل سعر</p>
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${Math.min(...quotes.map(q => q.price)).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">أعلى سعر</p>
                                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">${Math.max(...quotes.map(q => q.price)).toLocaleString()}</p>
                            </div>
                            <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">متوسط السعر</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${Math.round(quotes.reduce((a, b) => a + b.price, 0) / quotes.length).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quotes List */}
                <div className="mt-5">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Icon name="MessageSquare" className="w-4 h-4 text-primary" />
                        عروض الأسعار
                        {quotes && quotes.length > 0 && (
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full">
                                {quotes.length}
                            </span>
                        )}
                    </h4>
                    {quotes && quotes.length > 0 ? (
                        <div className="space-y-3">
                            {quotes
                                .sort((a, b) => {
                                    if (a.timestamp === acceptedQuote?.timestamp) return -1;
                                    if (b.timestamp === acceptedQuote?.timestamp) return 1;
                                    return a.price - b.price;
                                })
                                .map((quote, idx) => (
                                    <QuoteDisplay
                                        key={idx}
                                        quote={quote}
                                        orderNumber={order.orderNumber}
                                        isAccepted={quote.timestamp === acceptedQuote?.timestamp}
                                    />
                                ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <Icon name="Inbox" className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">لم يتم استلام أي عروض أسعار بعد</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ============================================
// STATUS GROUPS CONFIGURATION
// ============================================
const STATUS_GROUPS = {
    active: {
        title: 'طلبات نشطة',
        icon: 'Clock' as const,
        color: 'blue',
        statuses: ['pending', 'payment_pending', 'processing', 'ready_for_pickup', 'بانتظار تأكيد الدفع', 'جاري التجهيز', 'جاهز للاستلام'] as OrderStatus[]
    },
    shipping: {
        title: 'قيد الشحن',
        icon: 'Truck' as const,
        color: 'indigo',
        statuses: ['provider_received', 'shipped', 'out_for_delivery', 'تم الاستلام من المزود', 'تم الشحن للعميل', 'قيد التوصيل'] as OrderStatus[]
    },
    completed: {
        title: 'مكتملة',
        icon: 'CheckCircle' as const,
        color: 'green',
        statuses: ['delivered', 'completed', 'تم التوصيل', 'تم الاستلام من الشركة'] as OrderStatus[]
    },
    quoted: {
        title: 'بعروض أسعار',
        icon: 'MessageSquare' as const,
        color: 'purple',
        statuses: ['quoted'] as OrderStatus[]
    },
    cancelled: {
        title: 'ملغية',
        icon: 'XCircle' as const,
        color: 'red',
        statuses: ['cancelled', 'ملغي'] as OrderStatus[]
    }
};


// ============================================
// MAIN ORDERS VIEW COMPONENT - Redesigned
// ============================================
interface OrdersViewProps {
    orders: Order[];
    onToggleExpand: (orderId: string) => void;
    expandedOrderId: string | null;
    onApprovePayment: (order: Order) => void;
    onRejectPayment: (order: Order) => void;
    onUpdateStatus: (orderNumber: string, newStatus: OrderStatus) => void;
    onOpenShippingReceipt: (order: Order) => void;
    onUpdateShippingNotes: (orderNumber: string, notes: string) => void;
    viewTitle?: string;
    viewSubtitle?: string;
    filterStatus?: OrderStatus | 'all';
    onRefresh?: () => void;
}

const OrdersView: React.FC<OrdersViewProps> = ({
    orders,
    onToggleExpand,
    expandedOrderId,
    onApprovePayment,
    onRejectPayment,
    onUpdateStatus,
    onOpenShippingReceipt,
    onUpdateShippingNotes,
    viewTitle,
    viewSubtitle,
    filterStatus,
    onRefresh
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['active', 'shipping', 'completed']));
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            await onRefresh();
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            newSet.has(section) ? newSet.delete(section) : newSet.add(section);
            return newSet;
        });
    };

    // Filter orders
    const filteredOrders = useMemo(() => {
        let result = orders;

        if (filterStatus && filterStatus !== 'all') {
            result = result.filter(order => order.status === filterStatus);
        }

        if (activeFilter && activeFilter !== 'all') {
            const group = STATUS_GROUPS[activeFilter as keyof typeof STATUS_GROUPS];
            if (group) {
                result = result.filter(order => group.statuses.includes(order.status));
            }
        }

        if (searchTerm.trim()) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.orderNumber.toLowerCase().includes(lowerTerm) ||
                order.formData.brand.toLowerCase().includes(lowerTerm) ||
                order.formData.model.toLowerCase().includes(lowerTerm) ||
                (order.customerName && order.customerName.toLowerCase().includes(lowerTerm)) ||
                (order.customerPhone && order.customerPhone.includes(lowerTerm))
            );
        }

        return result;
    }, [orders, searchTerm, filterStatus, activeFilter]);

    const groupedOrders = useMemo(() => {
        const groups: Record<string, { orders: Order[] } & (typeof STATUS_GROUPS)[keyof typeof STATUS_GROUPS]> = {};

        Object.entries(STATUS_GROUPS).forEach(([key, config]) => {
            groups[key] = { ...config, orders: [] };
        });

        filteredOrders.forEach(order => {
            for (const [key, group] of Object.entries(groups)) {
                if (group.statuses.includes(order.status)) {
                    group.orders.push(order);
                    break;
                }
            }
        });

        return groups;
    }, [filteredOrders]);

    // Color classes for sections
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-700 dark:text-blue-300',
            badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        },
        indigo: {
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
            border: 'border-indigo-200 dark:border-indigo-800',
            text: 'text-indigo-700 dark:text-indigo-300',
            badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
        },
        green: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            border: 'border-emerald-200 dark:border-emerald-800',
            text: 'text-emerald-700 dark:text-emerald-300',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-purple-950/30',
            border: 'border-purple-200 dark:border-purple-800',
            text: 'text-purple-700 dark:text-purple-300',
            badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        },
        red: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-800',
            text: 'text-red-700 dark:text-red-300',
            badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        }
    };

    // Render single order card
    const renderOrderCard = (order: Order) => {
        const isExpanded = expandedOrderId === order.orderNumber;

        return (
            <Card
                key={order.orderNumber}
                className={`
                    group relative rounded-xl border transition-all duration-300 overflow-hidden
                    ${isExpanded
                        ? 'border-primary ring-2 ring-primary/20 shadow-xl shadow-primary/10 dark:shadow-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5'
                    }
                `}
            >
                {/* Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${isExpanded
                    ? 'bg-gradient-to-r from-primary via-blue-500 to-indigo-500'
                    : 'bg-transparent group-hover:bg-gradient-to-r group-hover:from-slate-300 group-hover:to-slate-400 dark:group-hover:from-slate-600 dark:group-hover:to-slate-500'
                    }`} />

                {/* Card Header - Clickable */}
                <div
                    className="p-5 cursor-pointer select-none"
                    onClick={() => onToggleExpand(order.orderNumber)}
                >
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                                    {order.formData.brand} {order.formData.model}
                                </h3>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                                    {order.formData.year}
                                </span>

                                {/* User Type Badges */}
                                {order.userType === 'technician' && (
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                        <WrenchScrewdriverIcon className="w-3.5 h-3.5" />
                                        فني
                                    </span>
                                )}
                                {order.userType === 'tow_truck' && (
                                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900/40 dark:to-blue-900/40 text-sky-700 dark:text-sky-300 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                                        <Icon name="Truck" className="w-3.5 h-3.5" />
                                        سائق شاحنة
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded inline-block">
                                {order.orderNumber}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <Icon
                                name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                                className={`w-5 h-5 text-slate-400 transition-all duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-0.5'
                                    }`}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5 rounded-lg">
                            <Icon name="Calendar" className="w-3.5 h-3.5" />
                            {new Date(order.date).toLocaleDateString('ar-SY')}
                        </span>
                        {order.quotes && order.quotes.length > 0 && (
                            <span className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 px-2.5 py-1.5 rounded-lg font-medium">
                                <Icon name="MessageSquare" className="w-3.5 h-3.5" />
                                {order.quotes.length} {order.quotes.length === 1 ? 'عرض' : 'عروض'}
                            </span>
                        )}
                        {order.acceptedQuote && (
                            <span className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 rounded-lg font-medium">
                                <Icon name="DollarSign" className="w-3.5 h-3.5" />
                                ${order.acceptedQuote.price.toLocaleString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <>
                        <OrderDetails order={order} onUpdateShippingNotes={onUpdateShippingNotes} />

                        {/* Action Buttons */}
                        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/50 rounded-b-xl">
                            <div className="flex flex-wrap gap-3">
                                {/* Payment Actions */}
                                {(order.status === 'payment_pending' || order.status === 'بانتظار تأكيد الدفع' || (order.status === 'quoted' && order.acceptedQuote)) && (
                                    <>
                                        <Button
                                            onClick={() => onApprovePayment(order)}
                                            variant="ghost"
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:scale-105"
                                        >
                                            <Icon name="Check" className="w-4 h-4" />
                                            الموافقة على الدفع
                                        </Button>
                                        <Button
                                            onClick={() => onRejectPayment(order)}
                                            variant="ghost"
                                            className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-5 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-red-500/30 hover:scale-105"
                                        >
                                            <Icon name="X" className="w-4 h-4" />
                                            رفض الدفع
                                        </Button>
                                    </>
                                )}

                                {/* Fulfillment Flow Buttons */}
                                {order.status === 'processing' && (
                                    order.deliveryMethod === 'pickup'
                                        ? <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'ready_for_pickup')} icon="Package" color="blue">جاهز للاستلام</ActionButton>
                                        : <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'provider_received')} icon="ArrowRight" color="blue">تم الاستلام من المزود</ActionButton>
                                )}

                                {order.status === 'provider_received' && (
                                    <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'shipped')} icon="Truck" color="indigo">تم الشحن</ActionButton>
                                )}

                                {order.status === 'shipped' && (
                                    <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'out_for_delivery')} icon="Navigation" color="purple">قيد التوصيل</ActionButton>
                                )}

                                {order.status === 'out_for_delivery' && (
                                    <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'delivered')} icon="CheckCircle" color="green">تم التوصيل</ActionButton>
                                )}

                                {order.status === 'ready_for_pickup' && (
                                    <ActionButton onClick={() => onUpdateStatus(order.orderNumber, 'completed')} icon="CheckCircle" color="green">تم الاستلام</ActionButton>
                                )}

                                {/* Cancel Button */}
                                {!['cancelled', 'delivered', 'completed'].includes(order.status) && (
                                    <Button
                                        onClick={() => onUpdateStatus(order.orderNumber, 'cancelled')}
                                        variant="ghost"
                                        className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
                                    >
                                        <Icon name="X" className="w-4 h-4" />
                                        إلغاء الطلب
                                    </Button>
                                )}

                                {/* Print Shipping Receipt */}
                                {order.acceptedQuote && ['processing', 'provider_received', 'shipped'].includes(order.status) && (
                                    <Button
                                        onClick={() => onOpenShippingReceipt(order)}
                                        variant="ghost"
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 dark:from-slate-600 dark:to-slate-700 dark:hover:from-slate-500 dark:hover:to-slate-600 text-white px-4 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-slate-500/20 hover:scale-105 mr-auto"
                                    >
                                        <Icon name="Printer" className="w-4 h-4" />
                                        طباعة بوليصة الشحن
                                    </Button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Card>
        );
    };

    // Action Button Component
    const ActionButton = ({ onClick, icon, color, children }: { onClick: () => void; icon: string; color: string; children: React.ReactNode }) => {
        const colorMap = {
            blue: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/30',
            indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/30',
            purple: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/30',
            green: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30'
        };
        return (
            <Button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent accidental collapse if inside clickable area
                    console.log('🔘 ActionButton Clicked:', children);
                    onClick();
                }}
                variant="ghost"
                className={`inline-flex items-center gap-2 ${colorMap[color as keyof typeof colorMap]} text-white px-4 py-2.5 h-auto rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:scale-105`}
            >
                <Icon name={icon as any} className="w-4 h-4" />
                {children}
            </Button>
        );
    };

    // Render section with orders
    const renderSection = (key: string, group: typeof groupedOrders.active) => {
        if (group.orders.length === 0) return null;

        const isExpanded = expandedSections.has(key);
        const colors = colorClasses[group.color as keyof typeof colorClasses];

        return (
            <div key={key} className="mb-6 animate-in slide-in-from-top-2 duration-300">
                <Button
                    onClick={() => toggleSection(key)}
                    variant="ghost"
                    className={`w-full flex items-center justify-between p-4 h-auto rounded-xl border-2 transition-all duration-300 group ${colors.bg} ${colors.border} hover:shadow-lg hover:scale-[1.01]`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors.badge} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            <Icon name={group.icon} className="w-6 h-6" />
                        </div>
                        <span className={`font-bold text-lg ${colors.text}`}>{group.title}</span>
                        <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${colors.badge} min-w-[2.5rem] text-center shadow-sm`}>
                            {group.orders.length}
                        </span>
                    </div>
                    <Icon name={isExpanded ? 'ChevronUp' : 'ChevronDown'} className={`w-6 h-6 ${colors.text} transition-all duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
                </Button>

                {isExpanded && (
                    <div className="mt-4 space-y-3 animate-in slide-in-from-top-3 duration-300">
                        {group.orders.map(order => renderOrderCard(order))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <ViewHeader
                title={viewTitle || "إدارة الطلبات"}
                subtitle={viewSubtitle || "متابعة جميع الطلبات وتحديث حالاتها."}
            />

            {/* Search & Filter Bar */}
            <div className="mb-6 space-y-4">
                {/* Search Input */}
                <div className="relative w-full">
                    <Input
                        placeholder="بحث برقم الطلب، الماركة، الموديل، أو رقم الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Icon name="Search" className="w-5 h-5" />}
                        className="py-6"
                    />
                    {searchTerm && (
                        <Button
                            onClick={() => setSearchTerm('')}
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full hover:scale-110 transition-all"
                            aria-label="مسح البحث"
                        >
                            <Icon name="X" className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Quick Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                    <Button
                        onClick={() => setActiveFilter(null)}
                        variant="ghost"
                        className={`px-4 py-2 h-auto rounded-xl text-sm font-semibold transition-all duration-200 ${!activeFilter
                            ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/30 scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                            }`}
                    >
                        الكل ({orders.length})
                    </Button>
                    {Object.entries(groupedOrders).map(([key, group]) => (
                        group.orders.length > 0 && (
                            <Button
                                key={key}
                                onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                                variant="ghost"
                                className={`px-4 py-2 h-auto rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${activeFilter === key
                                    ? `${colorClasses[group.color as keyof typeof colorClasses].badge} shadow-lg scale-105`
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105'
                                    }`}
                            >
                                <Icon name={group.icon} className="w-4 h-4" />
                                {group.title} ({group.orders.length})
                            </Button>
                        )
                    ))}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {Object.entries(groupedOrders).map(([key, group]) => {
                    const colors = colorClasses[group.color as keyof typeof colorClasses];
                    const isActive = activeFilter === key;
                    return (
                        <Card
                            key={key}
                            onClick={() => {
                                setActiveFilter(activeFilter === key ? null : key);
                                if (!expandedSections.has(key)) toggleSection(key);
                            }}
                            className={`
                                group p-4 border-2 cursor-pointer transition-all duration-300
                                ${isActive
                                    ? `${colors.bg} ${colors.border} shadow-xl scale-105`
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-1'
                                }
                            `}
                        >
                            <div className="flex items-center gap-2.5 mb-3">
                                <div className={`p-2 rounded-lg transition-all duration-300 ${isActive ? colors.badge : 'bg-slate-100 dark:bg-slate-700/50 group-hover:scale-110'
                                    }`}>
                                    <Icon name={group.icon} className={`w-5 h-5 ${isActive ? colors.text : 'text-slate-500 dark:text-slate-400'}`} />
                                </div>
                                <span className={`text-xs font-semibold ${isActive ? colors.text : 'text-slate-500 dark:text-slate-400'}`}>
                                    {group.title}
                                </span>
                            </div>
                            <p className={`text-3xl font-bold transition-all duration-300 ${isActive ? colors.text : 'text-slate-800 dark:text-slate-100 group-hover:scale-110'}`}>
                                {group.orders.length}
                            </p>
                        </Card>
                    );
                })}
            </div>

            {/* Orders List */}
            {orders.length > 0 ? (
                filteredOrders.length > 0 ? (
                    activeFilter ? (
                        // Show filtered orders directly
                        <div className="space-y-3">
                            {groupedOrders[activeFilter as keyof typeof groupedOrders]?.orders.map(order => renderOrderCard(order))}
                        </div>
                    ) : (
                        // Show grouped sections
                        <div>
                            {renderSection('active', groupedOrders.active)}
                            {renderSection('shipping', groupedOrders.shipping)}
                            {renderSection('quoted', groupedOrders.quoted)}
                            {renderSection('completed', groupedOrders.completed)}
                            {renderSection('cancelled', groupedOrders.cancelled)}
                        </div>
                    )
                ) : (
                    // No results for current filters
                    <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                        <div className="max-w-sm mx-auto">
                            <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <Icon name="Search" className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">لم يتم العثور على نتائج</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                                {searchTerm ? `لا توجود طلبات تطابق بحثك "${searchTerm}"` : 'لا توجود طلبات في هذه الفئة'}
                            </p>
                            <Button
                                onClick={() => {
                                    setSearchTerm('');
                                    setActiveFilter(null);
                                }}
                                variant="ghost"
                                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 h-auto rounded-xl font-medium transition-all shadow-lg shadow-primary/20 hover:scale-105"
                            >
                                <Icon name="RotateCcw" className="w-4 h-4" />
                                مسح جميع التصفيات
                            </Button>
                        </div>
                    </div>
                )
            ) : (
                <EmptyState message="لا توجد طلبات." />
            )}
        </div>
    );
};

export default OrdersView;