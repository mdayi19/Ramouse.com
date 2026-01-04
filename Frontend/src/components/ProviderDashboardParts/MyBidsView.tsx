import React, { useEffect, useMemo, useState } from 'react';
import { Provider, Order, Quote, PartStatus, PartSizeCategory, Settings } from '../../types';
import { ViewHeader, StatusBadge } from '../DashboardParts/Shared';
import EmptyState from '../EmptyState';
import Icon from '../Icon';
import { providerAPI, ordersAPI } from '../../lib/api';
import OrderDetails from './OrderDetails';
import QuoteModal from './QuoteModal';
import { useRealtime } from '../../hooks/useRealtime';

interface MyBidsViewProps {
    provider: Provider;
    settings: Settings;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type BidStatus = 'pending' | 'won' | 'lost';

const BidCard: React.FC<{ order: Order, myQuotes: Quote[], status: BidStatus, onAddQuote: () => void }> = ({ order, myQuotes, status, onAddQuote }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const statusInfo = {
        pending: {
            emoji: '⏳',
            text: 'بانتظار العميل',
            bgClass: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
            textClass: 'text-amber-600 dark:text-amber-400',
        },
        won: {
            emoji: '🏆',
            text: 'مبروك! فزت بالطلب',
            bgClass: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800',
            textClass: 'text-emerald-600 dark:text-emerald-400',
        },
        lost: {
            emoji: '✋',
            text: 'حظاً أوفر',
            bgClass: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
            textClass: 'text-slate-500 dark:text-slate-400',
        },
    };

    const currentStatus = statusInfo[status];

    return (
        <div className={`rounded-2xl border-2 transition-all duration-300 ${currentStatus.bgClass} shadow-sm hover:shadow-md`}>
            {/* Header */}
            <div className="p-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-darkcard border border-slate-100 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                    {currentStatus.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-lg truncate">
                            {order.formData.brand} {order.formData.model}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white/50 border ${currentStatus.textClass} border-current opacity-80`}>
                            {currentStatus.text}
                        </span>
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {order.formData.partDescription}
                    </p>
                    <div className="text-xs text-slate-400 mt-1 font-mono">#{order.orderNumber}</div>
                </div>
            </div>

            {/* Bids List */}
            <div className="px-4 pb-4 space-y-2">
                {myQuotes.map((quote, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-darkcard p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">عرض {idx + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-md ${quote.partStatus === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                {quote.partStatus === 'new' ? '✨ جديد' : '🛠️ مستعمل'}
                            </span>
                        </div>
                        <div className="font-black text-lg text-slate-800 dark:text-white">
                            {Number(quote.price).toFixed(0)} <span className="text-xs text-slate-400 font-medium">ر.س</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Actions */}
            <div className={`p-2 border-t flex gap-2 ${currentStatus.bgClass.replace('bg-', 'border-').split(' ')[0] || 'border-slate-200'}`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-black/5 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                    {isExpanded ? 'إخفاء التفاصيل' : 'تفاصيل الطلب'}
                    <Icon name="ChevronDown" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {status === 'pending' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddQuote(); }}
                        className="flex-1 py-2 text-xs font-black text-white bg-primary hover:bg-primary-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                        <span>➕</span> عرض أخر
                    </button>
                )}
            </div>

            <OrderDetails order={order} isExpanded={isExpanded} />
        </div>
    );
};

const MyBidsView: React.FC<MyBidsViewProps> = ({ provider, settings, showToast }) => {
    const [filter, setFilter] = useState<BidStatus | 'all'>('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quotingOrder, setQuotingOrder] = useState<Order | null>(null);

    const fetchBids = async (background: boolean = false) => {
        try {
            if (!background) setLoading(true);
            const response = await providerAPI.getMyBids();
            setOrders(response.data.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch bids:', err);
            if (!background) setError('فشل في تحميل العروض. يرجى المحاولة مرة أخرى.');
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    const { listenToPrivateChannel } = useRealtime();

    useEffect(() => {
        if (!provider) return;

        const userId = provider.user_id || provider.id;
        const channelName = `user.${userId}`;

        const cleanup = listenToPrivateChannel(channelName, '.user.notification', (data: any) => {
            const type = data.notification?.type;
            if (type === 'OFFER_ACCEPTED_PROVIDER_WIN' ||
                type === 'OFFER_ACCEPTED_PROVIDER_LOSS' ||
                type === 'ORDER_STATUS_CHANGED') {
                console.log('🔔 MyBidsView: Refreshing bids due to notification:', type);
                fetchBids(true);
            }
        });

        return () => {
            cleanup();
        };
    }, [provider, listenToPrivateChannel]);

    const handleQuoteSubmit = async (
        orderNumber: string,
        quoteDetails: { price: number; partStatus: PartStatus; partSizeCategory: PartSizeCategory; notes?: string; },
        media: { images: File[], video: File | null, voiceNote: Blob | null }
    ) => {
        try {
            await ordersAPI.submitQuote(orderNumber, {
                price: quoteDetails.price,
                part_status: quoteDetails.partStatus,
                part_size_category: quoteDetails.partSizeCategory,
                notes: quoteDetails.notes,
                providerId: provider.id,
                providerName: provider.name,
                providerRating: (provider as any).rating || 0 // Cast to any to bypass strict type check for now if property exists in backend but not type def, or default to 0.
            }, media);

            // Refresh bids after submission to show the new quote immediately
            await fetchBids(true);
            setQuotingOrder(null);
            showToast('تم إرسال العرض بنجاح!', 'success');
        } catch (error) {
            console.error('Failed to submit quote:', error);
            showToast('حدث خطأ أثناء إرسال العرض. يرجى المحاولة مرة أخرى.', 'error');
        }
    };

    const biddedOrders = useMemo(() => {
        return orders
            .map(order => {
                const myQuotes = order.quotes?.filter(q => String(q.providerId) === String(provider.id)) || [];
                if (myQuotes.length === 0) return null;

                let status: BidStatus = 'pending';
                if (order.acceptedQuote) {
                    status = String(order.acceptedQuote.providerId) === String(provider.id) ? 'won' : 'lost';
                } else if (order.status !== 'pending' && order.status !== 'quoted') {
                    status = 'lost';
                }

                return { order, myQuotes, status };
            })
            .filter((item): item is { order: Order; myQuotes: Quote[]; status: BidStatus } => item !== null)
            .sort((a, b) => new Date(b.order.date).getTime() - new Date(a.order.date).getTime());
    }, [orders, provider.id]);

    const filteredBids = useMemo(() => {
        if (filter === 'all') {
            return biddedOrders;
        }
        return biddedOrders.filter(bid => bid.status === filter);
    }, [biddedOrders, filter]);

    const FilterButton: React.FC<{ value: BidStatus | 'all', label: string, icon: React.ReactNode }> = ({ value, label, icon }) => (
        <button
            onClick={() => setFilter(value)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${filter === value ? 'bg-primary text-white shadow' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
        >
            {icon}
            {label}
        </button>
    );

    if (loading) {
        return (
            <div className="p-6 flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-500">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <ViewHeader title="عروضي" subtitle="تتبع حالة الطلبات التي قدمت عروض أسعار لها." />

            <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-darkbg rounded-xl mb-6 overflow-x-auto">
                <FilterButton value="all" label="الكل" icon={<span className="text-lg">📂</span>} />
                <FilterButton value="pending" label="الانتظار" icon={<span className="text-lg">⏳</span>} />
                <FilterButton value="won" label="المقبولة" icon={<span className="text-lg">🏆</span>} />
                <FilterButton value="lost" label="المرفوضة" icon={<span className="text-lg">✋</span>} />
            </div>

            {filteredBids.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredBids.map(({ order, myQuotes, status }) => (
                        <BidCard
                            key={order.orderNumber}
                            order={order}
                            myQuotes={myQuotes}
                            status={status}
                            onAddQuote={() => setQuotingOrder(order)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState message="لم تقدم أي عروض أسعار تطابق هذا الفلتر." />
            )}

            {quotingOrder && settings && (
                <QuoteModal
                    order={quotingOrder}
                    onClose={() => setQuotingOrder(null)}
                    onSubmit={handleQuoteSubmit}
                    settings={settings}
                    showToast={showToast}
                />
            )}
        </div>
    );
};

export default MyBidsView;
