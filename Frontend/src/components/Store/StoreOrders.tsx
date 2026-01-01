import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../Icon';
import EmptyState from '../EmptyState';
import { getStatusColor, getStatusLabel } from './utils';
import { FlashProductBuyerRequest, AdminFlashProduct } from '../../types';
import { StoreOrderSkeleton } from './StoreOrderSkeleton';
import { storeAPI } from '../../lib/api';
import { Button } from '../ui/Button';

interface StoreOrdersProps {
    products: AdminFlashProduct[];
    onViewRequest: (req: FlashProductBuyerRequest) => void;
    onPrintRequest: (req: FlashProductBuyerRequest) => void;
    getProductThumbnail: (productId: string) => string | null;
}

const ORDERS_PER_PAGE = 10;

export const StoreOrders: React.FC<StoreOrdersProps> = ({
    products,
    onViewRequest,
    onPrintRequest,
    getProductThumbnail
}) => {
    const [orders, setOrders] = useState<FlashProductBuyerRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch orders
    const fetchOrders = useCallback(async (cursor?: string) => {
        try {
            if (cursor) {
                setIsLoadingMore(true);
            } else {
                setIsLoading(true);
            }
            setError(null);

            const response = await storeAPI.getMyOrders({
                per_page: ORDERS_PER_PAGE,
                cursor: cursor || undefined
            });

            const newOrders = response.data.data || [];
            const apiHasMore = response.data.has_more || false;
            const apiNextCursor = response.data.next_cursor || null;

            if (cursor) {
                // Append to existing orders
                setOrders(prev => [...prev, ...newOrders]);
            } else {
                // Replace orders (initial load or refresh)
                setOrders(newOrders);
            }

            setHasMore(apiHasMore);
            setNextCursor(apiNextCursor);
        } catch (err: any) {
            console.error('Failed to fetch orders:', err);
            setError(err.response?.data?.message || 'فشل تحميل الطلبات');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && nextCursor) {
                    fetchOrders(nextCursor);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, nextCursor, fetchOrders]);

    // Refresh handler
    const handleRefresh = () => {
        setNextCursor(null);
        setHasMore(false);
        fetchOrders();
    };

    if (isLoading) {
        return (
            <div className="px-4 sm:px-8 pb-24 max-w-5xl mx-auto w-full">
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <StoreOrderSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-4 sm:px-8 pb-24 max-w-5xl mx-auto w-full">
                <div className="text-center py-12">
                    <Icon name="AlertCircle" className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">حدث خطأ</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                    <Button
                        onClick={handleRefresh}
                        className="px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors h-auto"
                    >
                        إعادة المحاولة
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-8 pb-24 max-w-5xl mx-auto w-full">
            {/* Refresh Button */}
            <div className="flex justify-end mb-4">
                <Button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 h-auto border-none font-bold"
                >
                    <span className={`text-lg ${isLoading ? 'animate-spin' : ''}`}>🔄</span>
                    <span>تحديث</span>
                </Button>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map(req => {
                        const product = products.find(p => p.id === req.productId);
                        const canPrint = ['preparing', 'shipped', 'delivered', 'approved'].includes(req.status);
                        const thumbnail = product ? getProductThumbnail(product.id) : null;

                        return (
                            <div key={req.id} className="bg-white dark:bg-darkcard p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewRequest(req)}>
                                <div className="flex items-start gap-4 flex-grow">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
                                        {thumbnail ? <img src={thumbnail} className="w-full h-full object-cover" alt={product?.name} /> : <span className="text-3xl">📦</span>}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{req.id.slice(-6)}</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(req.requestDate).toLocaleDateString('ar-SY')}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{product?.name || 'منتج غير متوفر'}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusColor(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">الكمية: {req.quantity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row md:flex-col justify-between items-end md:items-end border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-4 md:pt-0 pl-2 text-left">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                            {product?.price.toLocaleString()} x {req.quantity}
                                        </span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                                            ${((product?.price || 0) * req.quantity).toLocaleString()}
                                        </span>
                                        {(req.shippingCost || 0) > 0 && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                + الشحن: ${req.shippingCost}
                                            </span>
                                        )}
                                        <div className="border-t border-slate-200 dark:border-slate-600 w-full my-1"></div>
                                        <span className="font-black text-lg text-primary">${req.totalPrice?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {canPrint && (
                                            <Button
                                                onClick={(e) => { e.stopPropagation(); onPrintRequest(req); }}
                                                variant="ghost"
                                                size="icon"
                                                className="p-2 rounded-full bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 transition-colors h-auto w-auto"
                                                title="طباعة فاتورة"
                                            >
                                                <Icon name="Printer" className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors h-auto w-auto"
                                        >
                                            <Icon name="ChevronLeft" className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Loading more indicator */}
                    {isLoadingMore && (
                        <div className="space-y-4">
                            <StoreOrderSkeleton />
                        </div>
                    )}

                    {/* Infinite scroll trigger */}
                    {hasMore && !isLoadingMore && (
                        <div ref={loadMoreRef} className="h-10" />
                    )}

                    {/* End of list indicator */}
                    {!hasMore && orders.length > 0 && (
                        <div className="text-center py-4 text-slate-400 dark:text-slate-500 text-sm">
                            ✨ لا يوجد المزيد من الطلبات
                        </div>
                    )}
                </div>
            ) : <EmptyState icon={<span className="text-6xl mb-4 block">🛍️</span>} title="لا توجد طلبات" message="لم تقم بأي عمليات شراء من المتجر بعد." />}
        </div>
    );
};
