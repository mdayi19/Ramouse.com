import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Provider, Order, OrderStatus, Settings } from '../../types';
import { ViewHeader, StatusBadge } from '../DashboardParts/Shared';
import EmptyState from '../EmptyState';
import VisualOrderTimeline from '../VisualOrderTimeline';
import Modal from '../Modal';
import Icon from '../Icon';
import ShippingReceipt from '../ShippingReceipt';
import { providerAPI } from '../../lib/api';
import Pagination from '../Pagination';
import { getStorageUrl } from '../../config/api';
import { useRealtime } from '../../hooks/useRealtime';

interface AcceptedOrdersViewProps {
    provider: Provider;
    settings: Settings;
}

const KANBAN_COLUMNS: { id: string; title: string; statuses: OrderStatus[]; colorClass: string; emoji: string }[] = [
    { id: 'processing', title: 'قيد التجهيز', statuses: ['payment_pending', 'بانتظار تأكيد الدفع', 'processing', 'جاري التجهيز'], colorClass: 'border-l-yellow-400', emoji: '⚙️' },
    { id: 'ready', title: 'جاهز للشحن/الاستلام', statuses: ['provider_received', 'ready_for_pickup', 'تم الاستلام من المزود', 'جاهز للاستلام'], colorClass: 'border-l-blue-400', emoji: '📦' },
    { id: 'transit', title: 'قيد التوصيل', statuses: ['shipped', 'out_for_delivery', 'تم الشحن للعميل', 'قيد التوصيل'], colorClass: 'border-l-purple-400', emoji: '🚚' },
    { id: 'completed', title: 'مكتملة', statuses: ['delivered', 'completed', 'تم التوصيل', 'تم الاستلام من الشركة'], colorClass: 'border-l-green-400', emoji: '✅' },
];

const OrderDetailsModal: React.FC<{
    order: Order;
    onClose: () => void;
    onPrint: () => void;
    onStatusUpdate: (newStatus: string) => void;
}> = ({ order, onClose, onPrint, onStatusUpdate }) => {
    console.log('🏗️ OrderDetailsModal rendering with order:', order);
    const { acceptedQuote, formData, customerName, customerAddress, customerPhone, paymentMethodName, deliveryMethod, shippingPrice, status } = order;

    if (!acceptedQuote) {
        console.error('❌ OrderDetailsModal: acceptedQuote is missing!', order);
        return null;
    }

    const totalPrice = Number(acceptedQuote.price || 0) + Number(shippingPrice || 0);
    const canPrint = status === 'جاري التجهيز' || status === 'processing' || status === 'تم الاستلام من المزود' || status === 'provider_received' || status === 'جاهز للاستلام' || status === 'ready_for_pickup';

    // Process media URLs
    const mediaUrls = useMemo(() => {
        const result: { images: string[], video?: string, voiceNote?: string } = { images: [] };

        if (acceptedQuote.media) {
            if (acceptedQuote.media.images && Array.isArray(acceptedQuote.media.images)) {
                result.images = acceptedQuote.media.images.map((path: string) => getStorageUrl(path)).filter(url => !!url);
            }
            if (acceptedQuote.media.video) {
                result.video = getStorageUrl(acceptedQuote.media.video);
            }
            if (acceptedQuote.media.voiceNote) {
                result.voiceNote = getStorageUrl(acceptedQuote.media.voiceNote);
            }
        }

        return result;
    }, [acceptedQuote.media]);

    // Determine available status transitions
    const getNextStatuses = () => {
        if (status === 'جاري التجهيز' || status === 'processing') {
            return deliveryMethod === 'pickup'
                ? [{ value: 'جاهز للاستلام', label: 'جاهز للاستلام', emoji: '✅', color: 'blue' }]
                : [{ value: 'تم الاستلام من المزود', label: 'تم الاستلام للشحن', emoji: '🚛', color: 'blue' }];
        }
        return [];
    };

    const nextStatuses = getNextStatuses();

    const DetailRow: React.FC<{ emoji: string; label: string; value?: string | number | null; children?: React.ReactNode }> = ({ emoji, label, value, children }) => {
        if (!value && !children) return null;
        return (
            <div className="flex items-start gap-3 py-2">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-lg">{emoji}</div>
                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{label}</p>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{children || value}</div>
                </div>
            </div>
        );
    };

    return (
        <Modal
            title={`تفاصيل الطلب #${order.orderNumber.slice(-6)}`}
            onClose={onClose}
            size="xl">
            <div className="space-y-6">
                {/* Action Banner */}
                {(status === 'جاري التجهيز' || status === 'processing') && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-center gap-4 animate-pulse">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <h4 className="font-black text-amber-800 dark:text-amber-200">مطلوب التجهيز</h4>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300">يرجى تجهيز القطعة وتغليفها لتسليمها للعميل أو شركة الشحن.</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div>
                        <h5 className="font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <span>👤</span> معلومات العميل
                        </h5>
                        <DetailRow emoji="🦸‍♂️" label="العميل">عميل موثوق</DetailRow>
                        <DetailRow emoji="📱" label="رقم الهاتف"><span className="text-slate-500 italic">مخفي للخصوصية</span></DetailRow>
                        <DetailRow emoji="📍" label="العنوان">{customerAddress ? customerAddress.split('-')[0] : 'غير محدد'}</DetailRow>
                    </div>

                    <div>
                        <h5 className="font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                            <span>💰</span> التفاصيل المالية
                        </h5>
                        <DetailRow emoji="🏷️" label="حالة القطعة">{acceptedQuote.partStatus === 'new' ? '✨ جديد' : '🛠️ مستعمل'}</DetailRow>
                        <DetailRow emoji="💵" label="سعر القطعة">{Number(acceptedQuote.price).toFixed(0)} ر.س</DetailRow>
                        <DetailRow emoji="🚚" label="طريقة الاستلام">{deliveryMethod === 'pickup' ? '🏪 استلام من الشركة' : '🚛 توصيل وشحن'}</DetailRow>
                    </div>
                </div>

                {acceptedQuote.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">ملاحظاتك:</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{acceptedQuote.notes}</p>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="font-black text-slate-700 dark:text-slate-300 mb-4 text-center">مراحل الطلب</h5>
                    <VisualOrderTimeline order={order} />
                </div>

                {/* Quote Media */}
                {(mediaUrls.images.length > 0 || mediaUrls.video || mediaUrls.voiceNote) && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h5 className="font-black text-slate-700 dark:text-slate-300 mb-3">📸 وسائط العرض</h5>
                        <div className="space-y-4">
                            {mediaUrls.images.length > 0 && (
                                <div className="grid grid-cols-3 gap-2">
                                    {mediaUrls.images.map((img: string, idx: number) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`Quote image ${idx + 1}`}
                                            className="w-full h-24 object-cover rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                                            onClick={() => window.open(img, '_blank')}
                                        />
                                    ))}
                                </div>
                            )}
                            {/* Video and Audio logic remains similar but simplified visually if needed */}
                        </div>
                    </div>
                )}

                {/* Status Update Section */}
                {nextStatuses.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h5 className="font-black text-slate-700 dark:text-slate-300 mb-3">تحديث الحالة</h5>
                        <div className="flex flex-wrap gap-2">
                            {nextStatuses.map((statusOption) => (
                                <button
                                    key={statusOption.value}
                                    onClick={() => onStatusUpdate(statusOption.value)}
                                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-black text-white shadow-lg transform active:scale-95 transition-all flex items-center justify-center gap-2
                                        ${statusOption.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                                            'bg-primary hover:bg-primary-600'}`}
                                >
                                    <span className="text-xl">{statusOption.emoji}</span>
                                    {statusOption.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors">
                        إغلاق
                    </button>
                    {canPrint && (
                        <button onClick={onPrint} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-900 transition-colors">
                            <span>🖨️</span>
                            طباعة البوليصة
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
};


const KanbanCard: React.FC<{ order: Order; onDetailsClick: () => void; colorClass: string }> = ({ order, onDetailsClick, colorClass }) => {
    const { formData, acceptedQuote } = order;
    return (
        <div
            onClick={onDetailsClick}
            className={`bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group overflow-hidden`}
        >
            <div className={`h-1.5 w-full ${colorClass.replace('border-l-', 'bg-')}`}></div>
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h4 className="font-black text-base text-slate-800 dark:text-slate-100 leading-tight">
                            {formData.brand} {formData.model}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">#{order.orderNumber.slice(-6)}</span>
                    </div>
                    {/* Delivery Method Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${order.deliveryMethod === 'pickup' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        {order.deliveryMethod === 'pickup' ? '🏪' : '🚛'}
                    </div>
                </div>

                <div className="flex items-start gap-2 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    <span className="text-lg">🛠️</span>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {formData.partDescription}
                    </p>
                </div>

                <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                        <StatusBadge status={order.status} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-slate-400 font-bold mb-0.5">صافي الربح</p>
                        <div className="font-black text-lg text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span>{Number(acceptedQuote?.price).toFixed(0)}</span>
                            <span className="text-[10px] font-medium text-slate-400">ر.س</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AcceptedOrdersView: React.FC<AcceptedOrdersViewProps> = ({ provider, settings }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [activeTabId, setActiveTabId] = useState<string>(KANBAN_COLUMNS[0].id);
    const [printOrder, setPrintOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [updating, setUpdating] = useState(false);
    const itemsPerPage = 12;
    const location = useLocation();

    // Deep linking effect
    useEffect(() => {
        if (location.state?.orderNumber && orders.length > 0) {
            console.log('🔗 Deep linking to order:', location.state.orderNumber);
            const targetOrder = orders.find(o => o.orderNumber === location.state.orderNumber);
            if (targetOrder) {
                setSelectedOrder(targetOrder);
            }
        }
    }, [location.state, orders]);

    // Real-time updates effect
    const { listenToPrivateChannel } = useRealtime();

    useEffect(() => {
        if (!provider) return;

        // Use provider.user_id if available (backend stores user_id for notifications now)
        const userId = provider.user_id || provider.id;
        const channelName = `user.${userId}`;
        console.log('🔌 AcceptedOrdersView: Listening on channel:', channelName);

        const cleanup = listenToPrivateChannel(channelName, '.user.notification', (data: any) => {
            console.log('🔔 AcceptedOrdersView received notification:', data);
            const type = data.notification?.type;

            if (type === 'OFFER_ACCEPTED_PROVIDER_WIN' ||
                type === 'ORDER_STATUS_CHANGED' ||
                type === 'ORDER_COMPLETED_PROVIDER' ||
                type === 'ORDER_CANCELLED_PROVIDER') {
                console.log('✨ Relevant notification received! Refreshing accepted orders...');
                fetchOrders(true);
            }
        });

        return () => {
            console.log('🔌 AcceptedOrdersView: Cleaning up listeners');
            cleanup();
        };
    }, [provider, listenToPrivateChannel]);

    const fetchOrders = async (background: boolean = false) => {
        try {
            if (!background) setLoading(true);
            console.log('🔄 Fetching accepted orders...');
            const response = await providerAPI.getAcceptedOrders();
            console.log('📦 API Response:', response);
            console.log('📊 Orders data:', response.data.data);
            setOrders(response.data.data || []);
            console.log('✅ Orders set. Count:', (response.data.data || []).length);
            console.log('📋 Order statuses:', (response.data.data || []).map((o: any) => ({ orderNumber: o.orderNumber, status: o.status })));
            setError(null);
        } catch (err) {
            console.error("Failed to fetch accepted orders", err);
            if (!background) setError("فشل تحميل الطلبات المقبولة");
        } finally {
            if (!background) setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (orderNumber: string, newStatus: string) => {
        if (updating) return;

        try {
            setUpdating(true);
            console.log('⏳ جاري تحديث حالة الطلب...');

            await providerAPI.updateAcceptedOrderStatus(orderNumber, newStatus);

            // Refresh orders list
            await fetchOrders();

            console.log('✅ تم تحديث حالة الطلب بنجاح!');
            setSelectedOrder(null);
        } catch (err: any) {
            console.error('Failed to update order status:', err);
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'فشل تحديث حالة الطلب';
            console.error('❌ Error:', errorMessage);
            alert(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const filteredAndSortedOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            const lowercasedSearch = searchTerm.toLowerCase();
            const searchMatch = searchTerm.trim() === '' ||
                order.orderNumber.toLowerCase().includes(lowercasedSearch) ||
                order.formData.partDescription.toLowerCase().includes(lowercasedSearch);
            return searchMatch;
        });

        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
    }, [orders, searchTerm, sortOrder]);

    const kanbanData = useMemo(() => {
        const result = KANBAN_COLUMNS.map(col => ({
            ...col,
            orders: filteredAndSortedOrders.filter(order => col.statuses.includes(order.status))
        }));
        console.log('📋 Kanban Data:', result.map(col => ({ title: col.title, count: col.orders.length, orders: col.orders.map(o => o.orderNumber) })));
        return result;
    }, [filteredAndSortedOrders]);

    const activeColumn = useMemo(() => kanbanData.find(c => c.id === activeTabId), [kanbanData, activeTabId]);

    // Paginate orders within each column
    const paginatedKanbanData = useMemo(() => {
        return kanbanData.map(col => {
            const totalPages = Math.ceil(col.orders.length / itemsPerPage);
            const start = (currentPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            return {
                ...col,
                paginatedOrders: col.orders.slice(start, end),
                totalPages,
                totalOrders: col.orders.length
            };
        });
    }, [kanbanData, currentPage, itemsPerPage]);

    if (loading) {
        return (
            <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-slate-500">جاري تحميل الطلبات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 h-full flex flex-col items-center justify-center">
                <Icon name="AlertTriangle" className="w-12 h-12 text-red-500 mb-4" />
                <p className="text-slate-700 dark:text-slate-300 mb-4">{error}</p>
                <button
                    onClick={() => fetchOrders()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <ViewHeader title="الطلبات المقبولة" subtitle="تابع حالة الطلبات التي فزت بها وتفاصيلها." />
                <button
                    onClick={() => fetchOrders(false)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <Icon name="RefreshCw" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>تحديث</span>
                </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                    <input
                        type="text"
                        placeholder="بحث بالرقم أو القطعة..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="relative">
                    <select
                        value={sortOrder}
                        onChange={e => setSortOrder(e.target.value as any)}
                        className="w-full px-4 py-3 bg-white dark:bg-darkcard border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none shadow-sm"
                    >
                        <option value="newest">⏰ الأحدث أولاً</option>
                        <option value="oldest">🕰️ الأقدم أولاً</option>
                    </select>
                    <Icon name="ChevronDown" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {filteredAndSortedOrders.length > 0 ? (
                <div className="flex-grow flex flex-col min-h-0">

                    {/* Mobile Tabs */}
                    <div className="md:hidden mb-4 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
                        <div className="flex gap-2">
                            {kanbanData.map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => setActiveTabId(col.id)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border-2 ${activeTabId === col.id
                                        ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                        : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                                        }`}
                                >
                                    <span>{col.emoji}</span>
                                    {col.title}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTabId === col.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                        {col.orders.length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kanban Columns Container */}
                    <div className="flex-grow">
                        {/* Mobile View: Single Active Column */}
                        <div className="md:hidden h-full overflow-y-auto">
                            {activeColumn && (
                                <div className="space-y-3 pb-20">
                                    {activeColumn.orders.length > 0 ? (
                                        activeColumn.orders.map(order => (
                                            <KanbanCard
                                                key={order.orderNumber}
                                                order={order}
                                                onDetailsClick={() => setSelectedOrder(order)}
                                                colorClass={activeColumn.colorClass}
                                            />
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                            <span className="text-6xl mb-4 opacity-50">📭</span>
                                            <p className="text-sm font-medium">لا توجد طلبات في هذه المرحلة</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop View: All Columns Grid */}
                        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 h-full min-h-[500px]">
                            {kanbanData.map(column => (
                                <div key={column.id} className="flex flex-col bg-slate-50/50 dark:bg-darkcard/30 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 h-full">
                                    <div className="p-4 border-b border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-t-2xl">
                                        <h3 className="font-black text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                                            <span>{column.emoji}</span>
                                            {column.title}
                                        </h3>
                                        <span className="text-xs bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-600 font-bold shadow-sm">
                                            {column.orders.length}
                                        </span>
                                    </div>
                                    <div className="p-3 flex-grow overflow-y-auto space-y-3 custom-scrollbar">
                                        {column.orders.length > 0 ? column.orders.map(order => (
                                            <KanbanCard
                                                key={order.orderNumber}
                                                order={order}
                                                onDetailsClick={() => setSelectedOrder(order)}
                                                colorClass={column.colorClass}
                                            />
                                        )) : (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 opacity-60 min-h-[150px]">
                                                <p className="text-xs font-medium">فارغ</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <EmptyState
                    icon={<span className="text-6xl grayscale opacity-50">🏆</span>}
                    title="لا توجد طلبات مقبولة"
                    message="لم يتم قبول أي من عروضك بعد، أو لا توجد طلبات تطابق الفلاتر الحالية."
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onPrint={() => {
                        setPrintOrder(selectedOrder);
                        setSelectedOrder(null);
                    }}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(selectedOrder.orderNumber, newStatus)}
                />
            )}

            {printOrder && <ShippingReceipt order={printOrder} settings={settings} onDone={() => setPrintOrder(null)} />}
        </div>
    );
};

export default AcceptedOrdersView;
