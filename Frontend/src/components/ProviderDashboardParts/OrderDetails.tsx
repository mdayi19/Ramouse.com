import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import Icon from '../Icon';
import { getStorageUrl } from '../../config/api';

// Define a type for the IndexedDB access object to resolve untyped function call errors.
interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface OrderDetailsProps {
    order: Order;
    isExpanded: boolean;
}

// A more advanced Lightbox component for viewing images
const Lightbox: React.FC<{ images: string[]; startIndex: number; onClose: () => void }> = ({ images, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isFirst = currentIndex === 0;
        const newIndex = isFirst ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isLast = currentIndex === images.length - 1;
        const newIndex = isLast ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious(e as any);
            if (e.key === 'ArrowRight') goToNext(e as any);
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, images.length]);


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] animate-fade-in" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl hover:opacity-80 transition-opacity" aria-label="Close image viewer">&times;</button>
            <div className="relative w-full h-full max-w-4xl max-h-[90vh] p-4 flex items-center justify-center">
                <img src={images[currentIndex]} alt={`Order image ${currentIndex + 1}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" onClick={e => e.stopPropagation()} />
            </div>
            {images.length > 1 && (
                <>
                    <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"><Icon name="ChevronLeft" /></button>
                    <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"><Icon name="ChevronRight" /></button>
                </>
            )}
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="border-t border-slate-200 dark:border-slate-700/50 pt-2 pb-1">
            <dt className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</dt>
            <dd className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-words">{value}</dd>
        </div>
    );
};

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, isExpanded }) => {
    const [mediaUrls, setMediaUrls] = useState<{ images: string[]; video?: string; voiceNote?: string }>({ images: [] });
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
    const { formData } = order;

    // This is the source of truth for whether media exists, based on persistent data.
    const hasMedia = (formData.images && formData.images.length > 0) || !!formData.video || !!formData.voiceNote;

    useEffect(() => {
        let active = true;
        const loadMedia = async () => {
            if (!isExpanded || !hasMedia) return;

            const newUrls: typeof mediaUrls = { images: [] };
            let loadedFromDb = false;

            // 1. Try to load from Server URLs (formData)
            if (formData.images && Array.isArray(formData.images) && formData.images.length > 0) {
                // Check if the first item is a string (URL) - simplistic check but effective for mixed types
                if (typeof formData.images[0] === 'string') {
                    newUrls.images = (formData.images as any[]).map(getStorageUrl).filter((url): url is string => !!url);
                }
            }

            if (formData.video && typeof formData.video === 'string') {
                const url = getStorageUrl(formData.video);
                if (url) newUrls.video = url;
            }

            if (formData.voiceNote && typeof formData.voiceNote === 'string') {
                const url = getStorageUrl(formData.voiceNote);
                if (url) newUrls.voiceNote = url;
            }

            // 2. If no server media found, try IndexedDB (for local/legacy)
            if (newUrls.images.length === 0 && !newUrls.video && !newUrls.voiceNote) {
                const db = (window as any).db as IdbAccess;
                if (db) {
                    try {
                        const media = await db.getMedia<{ images: File[], video?: File, voiceNote?: Blob }>('orderMedia', order.orderNumber);
                        if (active && media) {
                            loadedFromDb = true;
                            if (media.images && media.images.length > 0) {
                                newUrls.images = media.images.map(URL.createObjectURL);
                            }
                            if (media.video) {
                                newUrls.video = URL.createObjectURL(media.video);
                            }
                            if (media.voiceNote) {
                                newUrls.voiceNote = URL.createObjectURL(media.voiceNote);
                            }
                        }
                    } catch (e) {
                        console.error("Error loading media from DB:", e);
                    }
                }
            }

            if (active) {
                setMediaUrls(newUrls);
            }
        };

        loadMedia();

        return () => {
            active = false; // prevent setting state on unmounted component
            // Revoke previous URLs when effect re-runs or component unmounts
            mediaUrls.images.forEach(URL.revokeObjectURL);
            if (mediaUrls.video) URL.revokeObjectURL(mediaUrls.video);
            if (mediaUrls.voiceNote) URL.revokeObjectURL(mediaUrls.voiceNote);
        };
    }, [isExpanded, order.orderNumber, hasMedia]);

    const openLightbox = (index: number) => {
        setLightboxStartIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className="p-4 bg-slate-50 dark:bg-darkbg">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Details Section (3/5 width) */}
                    <div className="lg:col-span-3 space-y-6">
                        <div>
                            <h5 className="font-bold text-primary dark:text-primary-400 mb-3 border-b-2 border-primary/20 pb-1 flex items-center gap-2"><Icon name="Car" className="w-5 h-5" />تفاصيل السيارة</h5>
                            <dl className="space-y-2">
                                <DetailItem label="الشركة المصنعة" value={formData.brand} />
                                <DetailItem label="الموديل" value={formData.model} />
                                <DetailItem label="سنة الصنع" value={formData.year} />
                                <DetailItem label="رقم الهيكل (VIN)" value={formData.vin} />
                                <DetailItem label="نوع المحرك" value={formData.engineType} />
                                <DetailItem label="ناقل الحركة" value={formData.transmission} />
                            </dl>
                        </div>
                        <div>
                            <h5 className="font-bold text-primary dark:text-primary-400 mb-3 border-b-2 border-primary/20 pb-1 flex items-center gap-2"><Icon name="Cog" className="w-5 h-5" />تفاصيل القطعة المطلوبة</h5>
                            <dl className="space-y-2">
                                <DetailItem label="أنواع القطع" value={formData.partTypes.join(', ')} />
                                <DetailItem label="رقم القطعة" value={formData.partNumber} />
                            </dl>
                        </div>
                        {formData.additionalDetails && (
                            <div>
                                <h5 className="font-bold text-primary dark:text-primary-400 mb-2 flex items-center gap-2"><Icon name="MessageSquare" className="w-5 h-5" />ملاحظات العميل</h5>
                                <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border-l-4 border-yellow-400 dark:border-yellow-500">{formData.additionalDetails}</p>
                            </div>
                        )}
                    </div>
                    {/* Media Section (2/5 width) */}
                    <div className="lg:col-span-2">
                        <h5 className="font-bold text-primary dark:text-primary-400 mb-3 border-b-2 border-primary/20 pb-1 flex items-center gap-2"><Icon name="Paperclip" className="w-5 h-5" />الوسائط المرفقة من العميل</h5>
                        <div className="space-y-4">
                            {!hasMedia ? (
                                <p className="text-sm text-slate-500">لم يرفق العميل أي وسائط.</p>
                            ) : (
                                <>
                                    {isExpanded && mediaUrls.images.length === 0 && !mediaUrls.video && !mediaUrls.voiceNote && (
                                        <div className="text-sm text-center text-slate-500 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                                            يحتوي الطلب على وسائط مرفقة. قد يستغرق عرضها بضع لحظات.
                                        </div>
                                    )}

                                    {mediaUrls.images.length > 0 && (
                                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                                            {mediaUrls.images.map((img, idx) => (
                                                <button key={idx} onClick={() => openLightbox(idx)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-lg aspect-square group overflow-hidden">
                                                    <img src={img} alt={`Customer image ${idx + 1}`} className="w-full h-full object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-all duration-300" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {mediaUrls.video && <video src={mediaUrls.video} controls className="w-full rounded-lg" />}
                                    {mediaUrls.voiceNote && <audio src={mediaUrls.voiceNote} controls className="w-full" />}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {lightboxOpen && <Lightbox images={mediaUrls.images} startIndex={lightboxStartIndex} onClose={() => setLightboxOpen(false)} />}
        </div>
    );
};

export default OrderDetails;
