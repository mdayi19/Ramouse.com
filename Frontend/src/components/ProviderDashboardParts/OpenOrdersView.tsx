import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Order, PartStatus, Settings, PartSizeCategory, Provider } from '../../types';


import Icon from '../Icon';
import EmptyState from '../EmptyState';
import { ViewHeader } from '../DashboardParts/Shared';
import QuoteModal from './QuoteModal';
import Pagination from '../Pagination';
import { getStorageUrl } from '../../config/api';

// Define a type for the IndexedDB access object to resolve untyped function call errors.
interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface OpenOrdersViewProps {
    provider: Provider;
    orders: Order[];
    onSubmitQuote: (orderNumber: string, quoteDetails: { price: number; partStatus: PartStatus; partSizeCategory: PartSizeCategory; notes?: string; }, media: { images: File[], video: File | null, voiceNote: Blob | null }) => Promise<void>;
    settings: Settings;
    isLoading?: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
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



const OrderCard: React.FC<{ order: Order; onQuote: () => void; isQuoted: boolean }> = ({ order, onQuote, isQuoted }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<{ images: string[]; video?: string; voiceNote?: string }>({ images: [] });
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
    const { formData } = order;

    const hasMedia = (formData.images && formData.images.length > 0) || !!formData.video || !!formData.voiceNote;

    useEffect(() => {
        let active = true;
        const loadMedia = async () => {
            if (!isExpanded || !hasMedia) return;

            const newUrls: typeof mediaUrls = { images: [] };
            let loadedFromDb = false;

            if (formData.images && Array.isArray(formData.images) && formData.images.length > 0) {
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

            if (newUrls.images.length === 0 && !newUrls.video && !newUrls.voiceNote) {
                const db = (window as any).db as IdbAccess;
                if (db) {
                    try {
                        const media = await db.getMedia<{ images: File[], video?: File, voiceNote?: Blob }>('orderMedia', order.orderNumber);
                        if (active && media) {
                            loadedFromDb = true;
                            if (media.images && media.images.length > 0) newUrls.images = media.images.map(URL.createObjectURL);
                            if (media.video) newUrls.video = URL.createObjectURL(media.video);
                            if (media.voiceNote) newUrls.voiceNote = URL.createObjectURL(media.voiceNote);
                        }
                    } catch (e) { console.error("Error loading media from DB:", e); }
                }
            }
            if (active) setMediaUrls(newUrls);
        };
        loadMedia();
        return () => {
            active = false;
            mediaUrls.images.forEach(URL.revokeObjectURL);
            if (mediaUrls.video) URL.revokeObjectURL(mediaUrls.video);
            if (mediaUrls.voiceNote) URL.revokeObjectURL(mediaUrls.voiceNote);
        };
    }, [isExpanded, order.orderNumber, hasMedia]);

    const openLightbox = (index: number) => {
        setLightboxStartIndex(index);
        setLightboxOpen(true);
    };

    const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
        if (!value) return null;
        return (
            <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                <dt className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</dt>
                <dd className="text-sm font-bold text-slate-800 dark:text-slate-200">{value}</dd>
            </div>
        );
    };

    return (
        <div className={`bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:shadow-lg ${isQuoted ? 'opacity-80 grayscale-[0.3]' : ''}`}>
            {/* Header / Summary */}
            <div className="p-4 sm:p-5 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full flex items-center gap-1">
                                📄 {formData.category}
                            </span>
                            <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full flex items-center gap-1">
                                📍 {formData.city}
                            </span>
                            {order.userType === 'technician' && (
                                <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse">
                                    👷 طلب فني
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <h4 className="font-black text-lg sm:text-xl text-slate-800 dark:text-slate-100 leading-tight mb-1">
                            {formData.brand} {formData.model}
                        </h4>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{formData.year} • {formData.partDescription}</div>
                    </div>

                    {/* Date */}
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                            {new Date(order.date).toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {/* Technician Note Highlight */}
                {order.userType === 'technician' && (
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50 flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
                            هذا الطلب من "فني"، يرجى تقديم سعر منافس لأن التاجر خبير بالأسعار!
                        </p>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="px-4 pb-4">
                {isQuoted ? (
                    <div className="w-full flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 py-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                        <span>✅</span>
                        <span>تم تقديم عرض</span>
                    </div>
                ) : (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onQuote(); }}
                            className="flex-1 bg-primary hover:bg-primary-700 text-white py-3 rounded-xl font-black text-sm shadow-md shadow-primary/20 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>🚀</span>
                            تقديم عرض
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <span>📄</span>
                            تفاصيل
                        </button>
                    </div>
                )}
            </div>

            {/* Expanded Details */}
            <div className={`border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-5 space-y-6">
                    {/* Car Details */}
                    <div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <span className="text-lg">🚗</span> تفاصيل السيارة
                        </h5>
                        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <DetailItem label="الشركة" value={formData.brand} />
                            <DetailItem label="الموديل" value={formData.model} />
                            <DetailItem label="السنة" value={formData.year} />
                            <DetailItem label="المحرك" value={formData.engineType} />
                            <DetailItem label="القير" value={formData.transmission} />
                            <DetailItem label="رقم الهيكل" value={formData.vin} />
                            <DetailItem label="المدينة" value={formData.city} />
                        </div>
                    </div>

                    {/* Part Details */}
                    <div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <span className="text-lg">⚙️</span> القطع المطلوبة
                        </h5>
                        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {formData.partTypes.map((type, idx) => (
                                    <span key={idx} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md">{type}</span>
                                ))}
                            </div>
                            <DetailItem label="وصف القطعة" value={formData.partDescription} />
                            <DetailItem label="رقم القطعة" value={formData.partNumber} />
                            {formData.additionalDetails && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 mb-1 font-medium">ملاحظات العميل:</p>
                                    <p className="text-sm text-slate-800 dark:text-slate-200 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        "{formData.additionalDetails}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Media */}
                    <div>
                        <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                            <span className="text-lg">📸</span> الوسائط
                        </h5>
                        {!hasMedia ? (
                            <div className="text-center py-6 bg-slate-100 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                                <span className="text-3xl grayscale opacity-50 block mb-2">📷</span>
                                <span className="text-xs text-slate-500 font-medium">لا توجد صور أو فيديو</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {mediaUrls.images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {mediaUrls.images.map((img, idx) => (
                                            <button key={idx} onClick={() => openLightbox(idx)} className="aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 relative group">
                                                <img src={img} alt="Part" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {mediaUrls.video && (
                                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <video src={mediaUrls.video} controls className="w-full" />
                                    </div>
                                )}
                                {mediaUrls.voiceNote && (
                                    <div className="bg-white dark:bg-darkcard p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                                        <span className="text-2xl">🎤</span>
                                        <audio src={mediaUrls.voiceNote} controls className="w-full h-8" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {lightboxOpen && <Lightbox images={mediaUrls.images} startIndex={lightboxStartIndex} onClose={() => setLightboxOpen(false)} />}
        </div>
    );
};


const OpenOrdersView: React.FC<OpenOrdersViewProps> = ({ provider, orders, onSubmitQuote, settings, isLoading, showToast }) => {
    // Safety check: ensure orders is always an array
    const safeOrders = orders || [];

    const [quotingOrder, setQuotingOrder] = useState<Order | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.orderNumber && safeOrders.length > 0) {
            const targetOrder = safeOrders.find(o => o.orderNumber === location.state.orderNumber);
            if (targetOrder) {
                setQuotingOrder(targetOrder);
            }
        }
    }, [location.state, safeOrders]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const availableCities = useMemo(() => {
        const cities = new Set(safeOrders.map(o => o.formData.city));
        return ['all', ...Array.from(cities)];
    }, [safeOrders]);

    const openOrdersForProvider = useMemo(() => {
        // Safety check: ensure assignedCategories exists, checking both camelCase and snake_case
        const categories = provider.assignedCategories || (provider as any).assigned_categories || [];

        const filtered = safeOrders
            .filter(o => {
                const isPending = o.status === 'pending';
                const matchesCategory = categories.includes(o.formData.category);
                const isQuoted = o.quotes?.some((q: any) => q.providerId === provider.id) || false;

                return isPending && matchesCategory && !isQuoted;
            })
            .map(order => ({
                order,
                isQuoted: false // Always false since we filtered them out
            }));

        return filtered;
    }, [safeOrders, provider]);

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = openOrdersForProvider.filter(({ order }) => {
            const searchTermLower = searchTerm.toLowerCase();
            const searchMatch = searchTerm.trim() === '' ||
                order.formData.brand.toLowerCase().includes(searchTermLower) ||
                order.formData.model.toLowerCase().includes(searchTermLower) ||
                order.formData.partDescription.toLowerCase().includes(searchTermLower);

            const cityMatch = cityFilter === 'all' || order.formData.city === cityFilter;
            return searchMatch && cityMatch;
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.order.date).getTime();
            const dateB = new Date(b.order.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

    }, [openOrdersForProvider, searchTerm, cityFilter, sortOrder]);


    const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedOrders, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, cityFilter, sortOrder]);

    const handleQuoteSubmit = async (
        orderNumber: string,
        quoteDetails: { price: number; partStatus: PartStatus; partSizeCategory: PartSizeCategory; notes?: string; },
        media: { images: File[], video: File | null, voiceNote: Blob | null }
    ) => {
        await onSubmitQuote(orderNumber, quoteDetails, media);
        setQuotingOrder(null); // This will close the modal
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <ViewHeader title="الطلبات المتاحة" subtitle="تصفح الطلبات الجديدة في الفئات المخصصة لك وقدم عروض أسعار." />

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">جاري تحميل الطلبات...</p>
                </div>
            ) : (
                <>

                    <div className="p-4 bg-slate-50 dark:bg-darkbg rounded-lg border dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="ابحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600" />
                        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600">
                            {availableCities.map(city => <option key={city} value={city}>{city === 'all' ? 'كل المدن' : city}</option>)}
                        </select>
                        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as any)} className="w-full p-2 border rounded-md dark:bg-slate-800 dark:border-slate-600">
                            <option value="newest">الأحدث أولاً</option>
                            <option value="oldest">الأقدم أولاً</option>
                        </select>
                    </div>

                    {paginatedOrders.length > 0 ? (
                        <div className="space-y-4">
                            {paginatedOrders.map(({ order, isQuoted }) => (
                                <OrderCard
                                    key={order.orderNumber}
                                    order={order}
                                    isQuoted={false}
                                    onQuote={() => setQuotingOrder(order)}
                                />
                            ))}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredAndSortedOrders.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Icon name="SearchX" className="w-16 h-16 text-slate-400 mx-auto" />}
                            title="لا توجد طلبات متاحة"
                            message="لا توجد طلبات جديدة تطابق معايير البحث الحالية."
                        />
                    )}
                    {quotingOrder && <QuoteModal order={quotingOrder} onClose={() => setQuotingOrder(null)} onSubmit={handleQuoteSubmit} settings={settings} showToast={showToast} />}
                </>
            )}
        </div>
    );
};

export default OpenOrdersView;