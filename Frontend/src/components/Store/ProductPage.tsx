
import React, { useState, useEffect } from 'react';
import { AdminFlashProduct, GalleryItem } from '../../types';
import Icon from '../Icon';
import Rating from '../Rating';
import CountdownTimer from '../CountdownTimer';
import MediaViewer from '../MediaViewer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import SEO from '../SEO';
import { generateProductSchema } from '../../utils/structuredData';


interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface ProductPageProps {
    product: AdminFlashProduct;
    onBack: () => void;
    onAddToCart: (p: AdminFlashProduct, qty: number) => void;
    onBuyNow: (p: AdminFlashProduct, qty: number) => void;
    similarProducts: AdminFlashProduct[];
    onProductClick: (p: AdminFlashProduct) => void;
    quantityInCart: number;
    isWishlisted: boolean;
    onToggleWishlist: (p: AdminFlashProduct) => void;
    currentUser: any;
    onSubmitReview: (p: AdminFlashProduct, rating: number, comment: string) => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    cartTotal: number;
    cartItemCount: number;
    onOpenCart: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({ product, onBack, onAddToCart, onBuyNow, similarProducts, onProductClick, quantityInCart, isWishlisted, onToggleWishlist, currentUser, onSubmitReview, showToast, cartTotal, cartItemCount, onOpenCart }) => {
    const [activeImage, setActiveImage] = useState<string | undefined>(undefined);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const [qty, setQty] = useState(1);
    const [mediaItems, setMediaItems] = useState<GalleryItem[]>([]);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const [showMediaViewer, setShowMediaViewer] = useState(false);
    // Removed firstImageUrl definition as it's no longer needed for manual schema


    useEffect(() => {
        const loadMedia = async () => {
            if (product?.media && product.media.length > 0) {
                const db = (window as any).db as IdbAccess;
                const loadedMedia: GalleryItem[] = [];

                try {
                    for (let i = 0; i < product.media.length; i++) {
                        const API_BASE = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000';
                        const item = product.media[i];
                        if (item.data && typeof item.data === 'string') {
                            // Check if it's a storage URL (starts with /storage/)
                            if (item.data.startsWith('/storage/')) {
                                loadedMedia.push({ ...item, data: `${API_BASE}${item.data}` });
                            }
                            // Check if it's base64 encoded
                            else if (item.data.startsWith('data:')) {
                                loadedMedia.push(item);
                            }
                            // Check if it's an http/https URL
                            else if (item.data.startsWith('http')) {
                                loadedMedia.push(item);
                            }
                            // Fallback to IndexedDB for old data
                            else {
                                if (db) {
                                    const files: File[] | undefined = await db.getMedia('productMedia', product.id);
                                    if (files && files[i]) {
                                        loadedMedia.push({ ...item, data: URL.createObjectURL(files[i]) });
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error loading product media", e);
                }

                setMediaItems(loadedMedia);
                if (loadedMedia.length > 0 && loadedMedia[0]) {
                    setActiveImage(loadedMedia[0].data);
                    setActiveMediaIndex(0);
                    // No need to set firstImageUrl
                }
            } else {
                setMediaItems([]);
                setActiveImage(undefined);
            }
        };
        loadMedia();
        setQty(1);
        window.scrollTo(0, 0);
    }, [product]);

    // SEO: Inject Product Schema via generic component
    // Removed manual useEffect for schema injection


    const handleQuantityChange = (delta: number) => {
        setQty(prev => Math.max(1, Math.min(product.purchaseLimitPerBuyer, prev + delta)));
    };

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reviewRating === 0) { alert('الرجاء اختيار تقييم.'); return; }
        onSubmitReview(product, reviewRating, reviewComment);
        setIsReviewing(false);
        setReviewRating(0);
        setReviewComment('');
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const shareData = {
            title: product.name,
            text: `${product.name}\n${product.description}\nالسعر: $${product.price.toLocaleString()}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                if ((error as any).name !== 'AbortError') console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
                showToast('تم نسخ تفاصيل المنتج للحافظة.', 'success');
            } catch (err) {
                console.error('Failed to copy:', err);
                showToast('فشل نسخ التفاصيل.', 'error');
            }
        }
    };

    const remainingStock = product.totalStock;
    const isStockAvailable = remainingStock > 0;

    return (
        <div className="bg-white dark:bg-darkcard rounded-2xl shadow-lg overflow-hidden animate-fade-in min-h-[600px]">
            <SEO
                title={`${product.name} | متجر راموسة`}
                description={product.description?.substring(0, 160) || `تسوق ${product.name} من متجر راموسة. أفضل الأسعار وخدمة توصيل سريعة.`}
                canonical={`/store/product/${product.id}`}
                openGraph={{
                    title: product.name,
                    description: product.description?.substring(0, 200),
                    image: product.media?.[0]?.data, // SEO component handles string URLs
                    type: 'product'
                }}
                schema={{
                    type: "Product",
                    data: generateProductSchema(product)
                }}
            />
            {/* Header */}
            <div className="p-4 border-b dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                <Button onClick={onBack} variant="ghost" size="sm" className="hover:text-primary flex items-center gap-1 font-medium transition-colors p-0 h-auto"><Icon name="ArrowRight" className="w-4 h-4" /> المتجر</Button>
                <span className="opacity-50">/</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold truncate">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8">
                {/* Gallery Section */}
                <div className="p-6 lg:p-8 bg-white dark:bg-darkcard">
                    <div
                        className="relative aspect-square bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700 cursor-pointer group"
                        onClick={() => mediaItems.length > 0 && setShowMediaViewer(true)}
                    >
                        {activeImage && mediaItems.length > 0 ? (
                            <>
                                {mediaItems[activeMediaIndex]?.type === 'video' ? (
                                    <div className="relative w-full h-full">
                                        <video src={activeImage} className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                                            <div className="p-6 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-xl">
                                                <Icon name="Play" className="w-12 h-12 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img src={activeImage} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                )}
                                {/* Click to fullscreen hint */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
                                    <Icon name="Maximize2" className="w-3 h-3 inline ml-1" />
                                    انقر للعرض بملء الشاشة
                                </div>
                            </>
                        ) : (
                            <Icon name="Image" className="w-24 h-24 text-slate-300" />
                        )}

                        {/* Action Buttons Overlay */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            <Button
                                onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                                size="icon"
                                className={`rounded-full shadow-lg backdrop-blur-md border transition-all ${isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white/90 border-white text-slate-400 hover:text-red-400'}`}
                            >
                                <Icon name="Heart" className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleShare(e); }}
                                size="icon"
                                className="rounded-full shadow-lg backdrop-blur-md bg-white/90 border border-white text-slate-400 hover:text-blue-500 transition-all"
                                title="مشاركة"
                            >
                                <Icon name="Share2" className="w-5 h-5" />
                            </Button>
                        </div>

                        {product.isFlash !== false && <div className="absolute top-4 left-4"><CountdownTimer expiresAt={product.expiresAt} /></div>}

                        {/* Media count badge */}
                        {mediaItems.length > 1 && (
                            <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm pointer-events-none">
                                <Icon name="Images" className="w-3 h-3 inline ml-1" />
                                {mediaItems.length}
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {mediaItems.length > 1 && (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {mediaItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setActiveImage(item.data); setActiveMediaIndex(idx); }}
                                    className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${activeMediaIndex === idx ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:border-slate-300'}`}
                                >
                                    {item.type === 'video' ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                            <Icon name="Play" className="text-primary w-6 h-6" />
                                        </div>
                                    ) : (
                                        <img src={item.data} className="w-full h-full object-cover" alt="" />
                                    )}
                                    {item.type === 'video' && (
                                        <div className="absolute top-0.5 right-0.5 bg-black/70 rounded-full p-0.5">
                                            <Icon name="Video" className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Details Section */}
                <div className="p-6 lg:p-8 lg:pl-10 flex flex-col h-full border-t lg:border-t-0 lg:border-r dark:border-slate-700">
                    <div className="mb-4 flex items-center gap-3 flex-wrap">
                        {((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 3600 * 24) < 7) && <Badge variant="info" className="bg-blue-100 text-blue-700 border-none">جديد</Badge>}
                        {product.isFlash !== false && <Badge variant="warning" className="bg-amber-100 text-amber-800 border-none flex items-center gap-1"><Icon name="Zap" className="w-3 h-3" /> عرض فوري</Badge>}
                        {isStockAvailable ? (
                            <Badge variant="success" className="bg-green-100 text-green-700 border-none flex items-center gap-1"><Icon name="Check" className="w-3 h-3" /> متوفر</Badge>
                        ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-none">نفذت الكمية</Badge>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 leading-tight">{product.name}</h1>

                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1">
                            <Rating rating={product.averageRating ? parseFloat(product.averageRating.toString()) : 0} readOnly size="sm" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-2">{product.averageRating ? parseFloat(product.averageRating.toString()).toFixed(1) : '0.0'}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                        <span className="text-sm text-slate-500 hover:text-primary cursor-pointer hover:underline transition-colors">{product.reviews?.length || 0} تقييمات</span>
                    </div>

                    <div className="flex items-end gap-3 mb-6">
                        <div className="text-4xl font-black text-primary">${product.price.toLocaleString()}</div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-8">
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    </div>

                    <div className="mt-auto space-y-6">
                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 sm:w-fit">
                                <Button
                                    onClick={() => handleQuantityChange(-1)}
                                    variant="ghost"
                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-r-xl transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-50 font-bold text-lg h-auto"
                                >
                                    -
                                </Button>
                                <span className="w-12 text-center font-bold text-lg">{qty}</span>
                                <Button
                                    onClick={() => handleQuantityChange(1)}
                                    variant="ghost"
                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-l-xl transition-colors text-slate-600 dark:text-slate-300 font-bold text-lg h-auto"
                                >
                                    +
                                </Button>
                            </div>
                            <Button
                                onClick={() => onAddToCart(product, qty)}
                                disabled={!isStockAvailable}
                                variant="primary"
                                className={`flex-1 font-bold text-lg py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 h-auto ${isStockAvailable
                                    ? ''
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none dark:bg-slate-800 dark:text-slate-600'
                                    }`}
                            >
                                <Icon name="ShoppingCart" className="w-5 h-5" />
                                {isStockAvailable ? 'إضافة للسلة' : 'نفذت الكمية'}
                            </Button>
                            {isStockAvailable && (
                                <Button
                                    onClick={() => onBuyNow(product, qty)}
                                    variant="success"
                                    className="flex-1 font-bold text-lg py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 h-auto"
                                >
                                    <Icon name="CreditCard" className="w-5 h-5" />
                                    شراء الآن
                                </Button>
                            )}
                        </div>

                        {quantityInCart > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-lg text-center text-sm font-bold border border-green-200 dark:border-green-800">
                                ✅ هذا المنتج موجود في سلتك ({quantityInCart} قطعة)
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews & Similar Products Section Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                {/* Reviews Column */}
                <div className="lg:col-span-2 bg-white dark:bg-darkcard rounded-2xl shadow-md p-6">
                    <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">آراء العملاء ({product.reviews?.length || 0})</h3>

                    {currentUser && (
                        <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700">
                            <button onClick={() => setIsReviewing(!isReviewing)} className="w-full flex justify-between items-center text-primary font-bold">
                                <span>{isReviewing ? 'إلغاء التقييم' : 'شاركنا برأيك'}</span>
                                <Icon name={isReviewing ? "ChevronUp" : "ChevronDown"} className="w-5 h-5" />
                            </button>

                            {isReviewing && (
                                <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4 animate-fade-in">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">تقييمك</label>
                                        <Rating rating={reviewRating} onRating={setReviewRating} size="md" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">تعليقك</label>
                                        <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-600 focus:ring-2 focus:ring-primary/50 outline-none" rows={3} required placeholder="اكتب تجربتك مع هذا المنتج..."></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" variant="primary" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">نشر التقييم</Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {product.reviews && product.reviews.length > 0 ? (
                            product.reviews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((review) => (
                                <div key={review.id} className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 text-xs">
                                                {(review.buyerName || 'A').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">{review.buyerName || 'Anonymous'}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">{new Date(review.timestamp).toLocaleDateString('ar-SY')}</span>
                                    </div>
                                    <div className="mb-2"><Rating rating={review.rating} readOnly size="sm" /></div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Icon name="MessageSquare" className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Similar Products Sidebar */}
                {similarProducts.length > 0 && (
                    <div className="lg:col-span-1 bg-white dark:bg-darkcard rounded-2xl shadow-md p-6 h-fit">
                        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">منتجات قد تعجبك</h3>
                        <div className="space-y-4">
                            {similarProducts.map(p => (
                                <div key={p.id} onClick={() => onProductClick(p)} className="group flex items-center gap-4 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        <Icon name="Image" className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">{p.name}</h4>
                                        <p className="text-primary font-bold text-sm mt-1">${p.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Floating Cart Button */}
            {cartItemCount > 0 && (
                <Button
                    onClick={onOpenCart}
                    className="fixed bottom-24 md:bottom-10 left-6 md:left-10 bg-primary hover:bg-primary-700 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all flex items-center gap-3 z-40 animate-bounce-in group h-auto"
                >
                    <div className="relative">
                        <Icon name="ShoppingCart" className="w-6 h-6" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-primary shadow-sm">{cartItemCount}</span>
                    </div>
                    <div className="flex flex-col items-start leading-none text-white">
                        <span className="text-[10px] font-medium opacity-80">المجموع</span>
                        <span className="font-bold text-base">${cartTotal.toLocaleString()}</span>
                    </div>
                    <Icon name="ChevronLeft" className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 text-white" />
                </Button>
            )}

            {/* Media Viewer */}
            {showMediaViewer && mediaItems.length > 0 && (
                <MediaViewer
                    items={mediaItems}
                    activeIndex={activeMediaIndex}
                    onClose={() => setShowMediaViewer(false)}
                    onIndexChange={(index) => {
                        setActiveMediaIndex(index);
                        setActiveImage(mediaItems[index].data);
                    }}
                />
            )}
        </div>
    );
};
