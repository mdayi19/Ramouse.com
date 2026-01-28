
import React, { useState, useRef, useEffect } from 'react';
import { AdminFlashProduct } from '../../types';
import Icon from '../Icon';
import Rating from '../Rating';
import CountdownTimer from '../CountdownTimer';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface StoreProductCardProps {
    product: AdminFlashProduct;
    qtyInCart: number;
    inWishlist: boolean;
    onAddToCart: (product: AdminFlashProduct, quantity?: number, silent?: boolean) => void;
    onDecreaseQty: (product: AdminFlashProduct) => void;
    onToggleWishlist: (product: AdminFlashProduct) => void;
    onClick: (product: AdminFlashProduct) => void;
    onBuyNow: (product: AdminFlashProduct) => void;
}

export const StoreProductCard: React.FC<StoreProductCardProps> = ({ product, qtyInCart, inWishlist, onAddToCart, onDecreaseQty, onToggleWishlist, onClick, onBuyNow }) => {
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const remainingStock = product.totalStock;

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const loadImage = async () => {
            const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
            const API_BASE = API_BASE_URL.endsWith('/api') ? API_BASE_URL.replace('/api', '') : API_BASE_URL;

            if (product?.media && product.media.length > 0) {
                const item = product.media[0];
                if (item && item.data && typeof item.data === 'string') {
                    // Check if it's a storage URL (starts with /storage/)
                    if (item.data.startsWith('/storage/')) {
                        setImageUrl(`${API_BASE}${item.data}`);
                    }
                    // Check if it's base64 encoded
                    else if (item.data.startsWith('data:')) {
                        setImageUrl(item.data);
                    }
                    // Check if it's an http/https URL
                    else if (item.data.startsWith('http')) {
                        setImageUrl(item.data);
                    }
                    // Fallback to IndexedDB for old data
                    else {
                        try {
                            const db = (window as any).db as IdbAccess;
                            if (db) {
                                const files: File[] | undefined = await db.getMedia('productMedia', product.id);
                                if (files && files.length > 0 && files[0] instanceof Blob) {
                                    setImageUrl(URL.createObjectURL(files[0]));
                                }
                            }
                        } catch (e) {
                            console.error("Failed to load product image", e);
                        }
                    }
                }
            }
        };

        loadImage();
    }, [product, isVisible]);

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAddToCart(product, 1, true); // Silent add
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDecreaseQty(product);
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleWishlist(product);
    }

    const handleBuyNowClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBuyNow(product);
    }

    const isStockAvailable = remainingStock > 0;

    return (
        <div ref={cardRef} className="group bg-white dark:bg-darkcard rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 border border-slate-100 dark:border-slate-800/50 overflow-hidden flex flex-col h-full relative cursor-pointer" onClick={() => { if (navigator.vibrate) navigator.vibrate(20); onClick(product); }}>
            {/* Image Area */}
            <div className="aspect-[4/4] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <span className="text-5xl">📦</span>
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Quick View Icon (Mobile) */}
                <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-2 z-10">
                    <div className="sm:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-lg">
                        <span className="text-sm">👆</span>
                    </div>
                </div>

                {/* Badges with Emojis */}
                <div className="absolute top-2 right-10 sm:top-4 sm:right-14 flex flex-col gap-1 sm:gap-1.5 z-10">
                    {((new Date().getTime() - new Date(product.createdAt).getTime()) / (1000 * 3600 * 24) < 7) && (
                        <span className="bg-blue-600 text-white text-[9px] sm:text-xs font-black shadow-lg backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5">
                            ✨ جديد
                        </span>
                    )}
                    {product.isFlash !== false && (
                        <span className="bg-amber-500 text-white text-[9px] sm:text-xs font-black shadow-lg backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-full flex items-center gap-0.5 animate-pulse">
                            🔥 مميز
                        </span>
                    )}
                </div>

                {/* Wishlist Button */}
                <Button
                    onClick={handleWishlistClick}
                    size="icon"
                    variant="ghost"
                    className={`absolute top-2 right-2 sm:top-4 sm:right-4 h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl shadow-lg backdrop-blur-md transition-all duration-500 z-10 ${inWishlist ? 'bg-red-500 text-white scale-110' : 'bg-white/90 dark:bg-slate-800/90 text-slate-400 hover:text-red-500 hover:scale-110'}`}
                >
                    <span className="text-base sm:text-lg">{inWishlist ? '❤️' : '🤍'}</span>
                </Button>

                {/* Price Tag (Mobile prominent) */}
                <div className="absolute bottom-2 left-2 sm:hidden bg-primary px-2.5 py-1 rounded-lg shadow-xl border border-white/20">
                    <span className="text-white font-black text-xs">${product.price.toLocaleString()}</span>
                </div>
            </div>

            <div className="p-3 sm:p-5 flex flex-col flex-grow">
                <h4 className="font-black text-slate-800 dark:text-slate-100 mb-1.5 sm:mb-2 line-clamp-1 sm:line-clamp-2 leading-tight group-hover:text-primary transition-colors text-xs sm:text-base">{product.name}</h4>

                <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-4">
                    <Rating rating={product.averageRating || 0} readOnly size="sm" />
                    <span className="text-[9px] sm:text-xs font-bold text-slate-400">({product.reviews?.length || 0})</span>
                </div>

                <div className="mt-auto">
                    <div className="hidden sm:flex items-center justify-between mb-4">
                        <span className="font-black text-xl text-slate-900 dark:text-white">${product.price.toLocaleString()}</span>
                        {!isStockAvailable ? (
                            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1"><Icon name="XCircle" className="w-3 h-3" /> مخلص</span>
                        ) : (
                            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><Icon name="CheckCircle" className="w-3 h-3" /> متوفر</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {isStockAvailable && (
                            <Button
                                onClick={handleBuyNowClick}
                                className="flex-grow py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:opacity-90 active:scale-95 transition-all text-xs font-black h-auto"
                            >
                                <Icon name="Zap" className="w-3 h-3 mr-1" />
                                شراء
                            </Button>
                        )}

                        {qtyInCart > 0 ? (
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-0.5" onClick={e => e.stopPropagation()}>
                                <Button
                                    onClick={handleDecrement}
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"
                                >
                                    -
                                </Button>
                                <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-slate-200">{qtyInCart}</span>
                                <Button
                                    onClick={handleIncrement}
                                    disabled={qtyInCart >= product.purchaseLimitPerBuyer || !isStockAvailable}
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600"
                                >
                                    +
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={handleIncrement}
                                disabled={!isStockAvailable}
                                size="icon"
                                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl transition-all shadow-md hover:shadow-xl active:scale-95 bg-primary text-white border-2 border-white/10 ${!isStockAvailable ? 'opacity-50 grayscale' : ''}`}
                            >
                                <Icon name="ShoppingCart" className="w-4 h-4 sm:w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
