import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { Order, Quote, Notification, Settings, NotificationType, OrderReview, OrderStatus, Customer, Provider, Technician, TowTruck } from '../../types';
import QuoteCard from './QuoteCard';
import QuoteGrid from './QuoteGrid';
import OrderListItem from './OrderListItem';
import SelectedOrderDetails from './SelectedOrderDetails';
import OrderConfirmationModal from './OrderConfirmationModal';
import ReuploadModal from './ReuploadModal';
import Pagination from '../Pagination';
import EmptyState from '../EmptyState';
import Modal from '../Modal';
import { StatusBadge } from '../DashboardParts/Shared';
import Icon from '../Icon';
import Skeleton from '../Skeleton';
import Rating from '../Rating';
import { ordersAPI } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Utilities
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
    saveMedia: <T>(storeName: 'orderMedia' | 'productMedia' | 'profileMedia', key: string, value: T) => Promise<void>;
}

export interface MyOrdersProps {
    allOrders: Order[];
    updateAllOrders: (orders: Order[]) => void;
    userPhone: string;
    onBack?: () => void;
    onRefresh?: () => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
    isLoading: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    navigationParams?: any;
    onNavigationConsumed?: () => void;
    onUpdateCustomer: (customerId: string, updatedData: Partial<Customer>) => Promise<void>;
    isDashboardView?: boolean;
    currentUser?: Customer | Technician | TowTruck;
    userId?: string | number; // Add userId prop for real-time channel subscription
}

const MyOrders: React.FC<MyOrdersProps> = ({
    allOrders,
    updateAllOrders,
    userPhone,
    onBack,
    addNotificationForUser,
    settings,
    isLoading,
    showToast,
    navigationParams,
    onNavigationConsumed,
    onUpdateCustomer,
    isDashboardView = false,
    currentUser,
    userId: userIdProp // Destructure userId prop
}) => {
    const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);
    const [isFetchingOrders, setIsFetchingOrders] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedQuoteInfo, setSelectedQuoteInfo] = useState<{ orderNumber: string, quote: Quote } | null>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [showReuploadModal, setShowReuploadModal] = useState(false);
    const [reuploadOrder, setReuploadOrder] = useState<Order | null>(null);
    const [isReuploading, setIsReuploading] = useState(false);
    const [allProviders, setAllProviders] = useState<Provider[]>([]);
    const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // Initial Fetch
    useEffect(() => {
        const fetchOrders = async (forceRefresh = false) => {
            // If explicit refresh is requested, we should fetch regardless of props
            if (!forceRefresh && allOrders.length > 0) return;

            setIsFetchingOrders(true);
            try {
                // Check if parent provided a refresh handler logic 
                // Note: The logic here is tricky because if onRefresh is provided, we expect parent to update allOrders prop.
                // But MyOrders also has local state logic.
                // We will fetch locally here to support forceRefresh
                const response = await ordersAPI.getOrders(forceRefresh);

                // Mapping logic to handle both camelCase (from updated api.ts) and snake_case (fallback)
                const orders: Order[] = response.data.data?.map((order: any) => ({
                    orderNumber: order.orderNumber || order.order_number,
                    userPhone: order.userPhone || order.user_id,
                    date: order.date || order.created_at,
                    status: order.status,
                    formData: order.formData || order.form_data, // Defensive check
                    quotes: order.quotes?.map((q: any) => ({
                        id: q.id,
                        providerId: q.providerId || q.provider_id,
                        providerUniqueId: q.providerUniqueId || q.provider_unique_id,
                        price: q.price,
                        partStatus: q.partStatus || q.part_status,
                        partSizeCategory: q.partSizeCategory || q.part_size_category,
                        notes: q.notes,
                        timestamp: q.timestamp,
                        viewedByCustomer: q.viewedByCustomer || q.viewed_by_customer || false,
                        media: q.media
                    })) || [],
                    acceptedQuote: order.acceptedQuote || (order.accepted_quote_id ? order.quotes?.find((q: any) => q.id === order.accepted_quote_id) : undefined),
                    paymentMethodId: order.paymentMethodId || order.payment_method_id,
                    paymentMethodName: order.paymentMethodName || order.payment_method_name,
                    paymentReceiptUrl: order.paymentReceiptUrl || order.payment_receipt_url,
                    deliveryMethod: order.deliveryMethod || order.delivery_method,
                    shippingPrice: order.shippingPrice || order.shipping_price,
                    customerName: order.customerName || order.customer_name,
                    customerAddress: order.customerAddress || order.customer_address,
                    customerPhone: order.customerPhone || order.customer_phone,
                    rejectionReason: order.rejectionReason || order.rejection_reason,
                    review: order.review
                })) || [];

                setFetchedOrders(orders);
                // Also update parent state if function provided
                if (updateAllOrders) updateAllOrders(orders);

            } catch (error) {
                console.error('❌ Failed to fetch orders:', error);
                showToast('فشل في تحميل الطلبات', 'error');
            } finally {
                setIsFetchingOrders(false);
            }
        };

        fetchOrders();
    }, [showToast, allOrders.length, updateAllOrders]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            // We reuse the logic from useEffect essentially, but forced
            const response = await ordersAPI.getOrders(true);
            const orders: Order[] = response.data.data?.map((order: any) => ({
                orderNumber: order.orderNumber || order.order_number,
                userPhone: order.userPhone || order.user_id,
                date: order.date || order.created_at,
                status: order.status,
                formData: order.formData || order.form_data, // Defensive check
                quotes: order.quotes?.map((q: any) => ({
                    id: q.id,
                    providerId: q.providerId || q.provider_id,
                    providerUniqueId: q.providerUniqueId || q.provider_unique_id,
                    price: q.price,
                    partStatus: q.partStatus || q.part_status,
                    partSizeCategory: q.partSizeCategory || q.part_size_category,
                    notes: q.notes,
                    timestamp: q.timestamp,
                    viewedByCustomer: q.viewedByCustomer || q.viewed_by_customer || false,
                    media: q.media
                })) || [],
                acceptedQuote: order.acceptedQuote || (order.accepted_quote_id ? order.quotes?.find((q: any) => q.id === order.accepted_quote_id) : undefined),
                paymentMethodId: order.paymentMethodId || order.payment_method_id,
                paymentMethodName: order.paymentMethodName || order.payment_method_name,
                paymentReceiptUrl: order.paymentReceiptUrl || order.payment_receipt_url,
                deliveryMethod: order.deliveryMethod || order.delivery_method,
                shippingPrice: order.shippingPrice || order.shipping_price,
                customerName: order.customerName || order.customer_name,
                customerAddress: order.customerAddress || order.customer_address,
                customerPhone: order.customerPhone || order.customer_phone,
                rejectionReason: order.rejectionReason || order.rejection_reason,
                review: order.review
            })) || [];

            setFetchedOrders(orders);
            if (updateAllOrders) updateAllOrders(orders);
            // If parent provided onRefresh, call it too? Usually updateAllOrders is enough.
        } catch (error) {
            console.error('Failed to refresh orders:', error);
            showToast('فشل تحديث الطلبات', 'error');
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    // Real-time Listeners - using getEcho() directly inside effect
    const { getEcho } = useRealtime();

    // Use ref for showToast to prevent dependency changes causing re-subscription
    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    // Ref to track latest fetch request for race condition handling
    const fetchIdRef = useRef(0);

    // Extract userId for real-time channel subscription
    // Priority: 1) prop, 2) currentUser.user_id (database ID), 3) localStorage fallback
    const userId = useMemo(() => {
        // Use prop if provided (most reliable)
        if (userIdProp) return String(userIdProp);

        // Fall back to currentUser.user_id if available
        // IMPORTANT: currentUser.id is the phone number, user_id is the database ID
        if (currentUser && 'user_id' in currentUser && currentUser.user_id) {
            return String(currentUser.user_id);
        }

        // Last resort: try to get from localStorage
        try {
            const storedCurrentUser = localStorage.getItem('currentUser');
            if (storedCurrentUser) {
                const parsed = JSON.parse(storedCurrentUser);
                // user_id is the database ID we need for channel subscription
                if (parsed.user_id) return String(parsed.user_id);
            }
        } catch (e) {
            console.error('Failed to parse currentUser from localStorage:', e);
        }

        return null;
    }, [userIdProp, currentUser]);

    useEffect(() => {
        console.warn('🟢 MyOrders useEffect RUNNING'); // warn not stripped in production

        if (!userId) {
            console.warn('⚠️ MyOrders: No user ID found, skipping real-time listeners');
            return;
        }

        console.warn('🔌 MyOrders: Setting up real-time listeners for user:', userId);

        const fetchOrdersBackground = async () => {
            const currentFetchId = ++fetchIdRef.current;
            try {
                const response = await ordersAPI.getOrders(true);
                const orders: Order[] = response.data.data?.map((order: any) => ({
                    orderNumber: order.orderNumber || order.order_number,
                    userPhone: order.userPhone || order.user_id,
                    date: order.date || order.created_at,
                    status: order.status,
                    formData: order.formData || order.form_data,
                    quotes: order.quotes?.map((q: any) => ({
                        id: q.id,
                        providerId: q.providerId || q.provider_id,
                        providerUniqueId: q.providerUniqueId || q.provider_unique_id,
                        price: q.price,
                        partStatus: q.partStatus || q.part_status,
                        partSizeCategory: q.partSizeCategory || q.part_size_category,
                        notes: q.notes,
                        timestamp: q.timestamp,
                        viewedByCustomer: q.viewedByCustomer || q.viewed_by_customer || false,
                        media: q.media
                    })) || [],
                    acceptedQuote: order.acceptedQuote || (order.accepted_quote_id ? order.quotes?.find((q: any) => q.id === order.accepted_quote_id) : undefined),
                    paymentMethodId: order.paymentMethodId || order.payment_method_id,
                    paymentMethodName: order.paymentMethodName || order.payment_method_name,
                    paymentReceiptUrl: order.paymentReceiptUrl || order.payment_receipt_url,
                    deliveryMethod: order.deliveryMethod || order.delivery_method,
                    shippingPrice: order.shippingPrice || order.shipping_price,
                    customerName: order.customerName || order.customer_name,
                    customerAddress: order.customerAddress || order.customer_address,
                    customerPhone: order.customerPhone || order.customer_phone,
                    rejectionReason: order.rejectionReason || order.rejection_reason,
                    review: order.review
                })) || [];

                // Race condition check: Only update if this is still the latest request
                if (currentFetchId === fetchIdRef.current) {
                    setFetchedOrders(orders);
                    if (updateAllOrders) updateAllOrders(orders); // Sync global state
                    console.warn('🔄 MyOrders: Orders refreshed silently');
                }
            } catch (error) {
                console.error('Failed to background refresh orders:', error);
            }
        };

        const channelName = `user.${userId}`;
        const echo = getEcho(); // Get Echo instance inside effect

        console.warn('📡 MyOrders: Subscribing to channel:', channelName);

        echo.private(channelName)
            .listen('.quote.received', (data: any) => {
                console.warn('💬 MyOrders: Quote Received:', data);
                // Notification handled globally by App.tsx, just refresh data here
                fetchOrdersBackground();
            })
            .listen('.order.status_updated', (data: any) => {
                console.warn('🔄 MyOrders: Order Status Updated:', data);
                // Notification handled globally by App.tsx, just refresh data here
                fetchOrdersBackground();
            })
            .listen('.payment.updated', (data: any) => {
                console.warn('💳 MyOrders: Payment Updated:', data);
                // Notification handled globally by App.tsx, just refresh data here
                fetchOrdersBackground();
            })
            .listen('.user.notification', (data: any) => {
                console.warn('🔔 MyOrders: User Notification:', data);
                if (data.type?.includes('ORDER') || data.type?.includes('QUOTE') || data.type?.includes('PAYMENT')) {
                    fetchOrdersBackground();
                }
            });

        return () => {
            console.warn('🔌 MyOrders: Cleaning up listeners');
            echo.leave(channelName);
        };
    }, [userId, getEcho]); // ✅ Added userId dependency

    const userOrders = useMemo(() => {
        const ordersToUse = (fetchedOrders && fetchedOrders.length > 0) ? fetchedOrders : (allOrders || []);
        if (!Array.isArray(ordersToUse)) return [];
        // Create a copy before sorting to avoid mutating props/state directly
        return [...ordersToUse].sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }, [fetchedOrders, allOrders]);


    // Handle URL Params for Navigation
    useEffect(() => {
        // Fetch providers here or relying on API? 
        // Original code used localStorage 'all_providers'. We want to move away from that.
        // But for now, if 'all_providers' is available in localStorage, we can use it, 
        // OR better: fetch providers if needed.
        // The original code was: if (providersRaw) setAllProviders(JSON.parse(providersRaw));
        // We will keep this for backward compatibility but plan to fetch using providerAPI if needed.
        const providersRaw = localStorage.getItem('all_providers');
        if (providersRaw) setAllProviders(JSON.parse(providersRaw));

        if (navigationParams?.orderNumber && onNavigationConsumed) {
            const orderToSelect = userOrders.find(o => o.orderNumber === navigationParams.orderNumber);
            if (orderToSelect) setSelectedOrder(orderToSelect);
            onNavigationConsumed();
        }
    }, [navigationParams, onNavigationConsumed, userOrders]);

    const filteredAndSortedOrders = useMemo(() => {
        if (!Array.isArray(userOrders)) return [];

        let filtered = userOrders.filter(order => {
            if (!order) return false;
            // Defensive check for formData
            const formData = order.formData || (order as any).form_data || {};
            const lowercasedSearch = (searchTerm || '').toLowerCase();

            const searchMatch = !searchTerm.trim() ||
                (order.orderNumber && order.orderNumber.toLowerCase().includes(lowercasedSearch)) ||
                (formData.brand && formData.brand.toLowerCase().includes(lowercasedSearch)) ||
                (formData.model && formData.model.toLowerCase().includes(lowercasedSearch)) ||
                (formData.partDescription && formData.partDescription.toLowerCase().includes(lowercasedSearch));

            const statusMatch = statusFilter === 'all' || order.status === statusFilter;
            return searchMatch && statusMatch;
        });

        // Sort safely
        filtered.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return filtered;
    }, [userOrders, searchTerm, statusFilter, sortOrder]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredAndSortedOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredAndSortedOrders, currentPage]);

    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
    }, [userOrders, currentPage, totalPages]);

    useEffect(() => {
        const updatedSelectedOrderInList = selectedOrder ? filteredAndSortedOrders.find(o => o.orderNumber === selectedOrder.orderNumber) : undefined;

        if (selectedOrder && !updatedSelectedOrderInList) {
            setSelectedOrder(filteredAndSortedOrders[0] || null);
        }
        else if (updatedSelectedOrderInList && JSON.stringify(selectedOrder) !== JSON.stringify(updatedSelectedOrderInList)) {
            setSelectedOrder(updatedSelectedOrderInList);
        }
        else if (!selectedOrder && window.innerWidth >= 768 && filteredAndSortedOrders.length > 0) {
            setSelectedOrder(filteredAndSortedOrders[0]);
        }
    }, [filteredAndSortedOrders, selectedOrder]);

    // Mark quotes as viewed
    useEffect(() => {
        if (selectedOrder) {
            let orderChanged = false;
            // Guard allOrders
            const ordersList = allOrders || [];
            if (!Array.isArray(ordersList)) return;

            const updatedAllOrders = ordersList.map(order => {
                if (order && order.orderNumber === selectedOrder.orderNumber && Array.isArray(order.quotes)) {
                    const updatedQuotes = order.quotes.map(quote => {
                        if (quote && !quote.viewedByCustomer) {
                            addNotificationForUser(
                                quote.providerId,
                                {
                                    title: 'تمت مشاهدة عرضك!',
                                    message: `شاهد العميل عرض السعر الذي قدمته للطلب #${order.orderNumber}.`,
                                    link: { view: 'providerDashboard', params: { orderNumber: order.orderNumber } },
                                    type: 'QUOTE_VIEWED_BY_CUSTOMER'
                                },
                                'QUOTE_VIEWED_BY_CUSTOMER',
                                { orderNumber: order.orderNumber }
                            );
                            orderChanged = true;
                            return { ...quote, viewedByCustomer: true };
                        }
                        return quote;
                    });
                    return { ...order, quotes: updatedQuotes };
                }
                return order;
            });
            if (orderChanged) updateAllOrders(updatedAllOrders);
        }
    }, [selectedOrder, allOrders, addNotificationForUser, updateAllOrders]);

    const handleAcceptOffer = (orderNumber: string, quote: Quote) => {
        setSelectedQuoteInfo({ orderNumber, quote });
        setShowAddressModal(true);
    };

    const handleConfirmAcceptance = async (data: {
        paymentMethodId: string;
        paymentMethodName: string;
        deliveryMethod: 'shipping' | 'pickup';
        customerName: string;
        customerAddress: string;
        customerPhone: string;
        paymentReceipt: File | null;
    }) => {
        if (!selectedQuoteInfo) return;
        setIsAccepting(true);
        try {
            const { orderNumber, quote: acceptedQuote } = selectedQuoteInfo;
            // Calculations logic here or passed?
            // Re-calculate shipping price for safety
            // Wait, we need the city to calculate shipping logic which is in the component...
            // Let's rely on the modal to pass correct data or re-calculate here.
            // The modal logic was extracted. The modal passed the data.
            // The modal doesn't calculate shipping price, it receives it.
            // But we need to send shipping_price to API.
            // We need to re-calculate it here or have it passed from modal. 
            // The logic was in MyOrders.tsx:
            const { city } = selectedOrder?.formData || { city: '' };
            let shippingPrice = 0;
            if (data.deliveryMethod === 'shipping') {
                // Calculate shipping
                if (selectedQuoteInfo.quote.partSizeCategory && city) {
                    const cityPrices = settings.limitSettings.shippingPrices?.find(p => p.city === city);
                    const fallbackPrices = settings.limitSettings.shippingPrices?.find(p => p.city === 'أخرى');
                    const pricesToUse = cityPrices || fallbackPrices;
                    if (pricesToUse) {
                        shippingPrice = Number(pricesToUse[selectedQuoteInfo.quote.partSizeCategory]) || 0;
                    }
                }
            }

            const response = await ordersAPI.acceptQuote(orderNumber, {
                quote_id: acceptedQuote.id,
                payment_method_id: data.paymentMethodId,
                payment_method_name: data.paymentMethodName,
                delivery_method: data.deliveryMethod,
                customer_name: data.customerName,
                customer_address: data.customerAddress,
                customer_phone: data.customerPhone,
                shipping_price: shippingPrice,
                payment_receipt: data.paymentReceipt
            });

            const updatedOrder = response.data.data;
            // Update local state and parent state
            // If using fetchedOrders:
            const mappedUpdatedOrder = {
                // ... map it similar to fetchOrders ... 
                // simplifying for brevity, assuming standard map
                ...updatedOrder,
                orderNumber: updatedOrder.order_number,
                formData: updatedOrder.form_data, // etc
                // ...
            };

            // Actually, we should probably just reload the window as in original code
            window.location.reload();

        } catch (error) {
            console.error('Error accepting quote:', error);
            showToast('فشل في تأكيد الطلب. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setIsAccepting(false);
            setShowAddressModal(false);
        }
    };

    const handleSubmitReview = () => {
        if (!reviewOrder || rating === 0) return showToast('الرجاء اختيار تقييم.', 'error');
        // Optimistic update
        const updatedAllOrders = (allOrders || []).map(o =>
            o.orderNumber === reviewOrder.orderNumber ? { ...o, review: { rating, comment, id: 'temp_' + Date.now(), timestamp: new Date().toISOString() } } : o
        );
        updateAllOrders(updatedAllOrders);

        // Update provider rating locally (legacy support)
        const providerId = reviewOrder.acceptedQuote?.providerId;
        if (providerId) {
            // Logic to update provider rating in localStorage
            try {
                const allProvidersRaw = localStorage.getItem('all_providers');
                let providerList: Provider[] = allProvidersRaw ? JSON.parse(allProvidersRaw) : [];
                // Simple re-calc logic if needed, but we rely on backend mainly.
            } catch (e) { }
        }

        setReviewOrder(null);
        setRating(0);
        setComment('');
        showToast('شكراً لتقييمك!', 'success');
    };

    const handleReuploadReceipt = async (files: File[]) => {
        if (!reuploadOrder) return;
        if (files.length === 0) {
            showToast('يرجى رفع إيصال الدفع.', 'error');
            return;
        }

        setIsReuploading(true);
        try {
            await ordersAPI.acceptQuote(reuploadOrder.orderNumber, {
                quote_id: reuploadOrder.acceptedQuote?.id || '',
                // ... other params reused from order
                payment_method_id: reuploadOrder.paymentMethodId || '',
                payment_method_name: reuploadOrder.paymentMethodName || '',
                delivery_method: reuploadOrder.deliveryMethod || 'shipping',
                customer_name: reuploadOrder.customerName || '',
                customer_address: reuploadOrder.customerAddress || '',
                customer_phone: reuploadOrder.customerPhone || userPhone,
                shipping_price: reuploadOrder.shippingPrice || 0,
                payment_receipt: files[0]
            });

            showToast('تم إعادة رفع إيصال الدفع بنجاح! سيتم مراجعته من قبل الإدارة.', 'success');
            setShowReuploadModal(false);
            setReuploadOrder(null);

            // Reload to refresh
            window.location.reload();
        } catch (error) {
            console.error('Error reuploading receipt:', error);
            showToast('فشل في إعادة رفع الإيصال. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setIsReuploading(false);
        }
    };

    // Derived values for modal
    const selectedQuoteShippingPrice = useMemo(() => {
        if (!selectedQuoteInfo || !selectedOrder) return 0;
        const { quote } = selectedQuoteInfo;

        // Defensive check for formData
        const formData = selectedOrder.formData || (selectedOrder as any).form_data || {};
        const { city } = formData;

        if (!quote.partSizeCategory || !city) return 0;

        // Defensive check for shippingPrices array
        const shippingPrices = settings?.limitSettings?.shippingPrices || [];
        if (!Array.isArray(shippingPrices)) return 0;

        const cityPrices = shippingPrices.find(p => p && p.city === city);
        const fallbackPrices = shippingPrices.find(p => p && p.city === 'أخرى');

        const pricesToUse = cityPrices || fallbackPrices;
        if (!pricesToUse) return 0;
        return Number(pricesToUse[quote.partSizeCategory]) || 0;
    }, [selectedQuoteInfo, selectedOrder, settings]);


    if (isLoading || isFetchingOrders) {
        return (
            <div className="p-4 sm:p-8 w-full flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">📦</div>
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">جاري تحميل طلباتك...</p>
                    <p className="text-gray-500 dark:text-gray-400">انتظر لحظة من فضلك ⏳</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full h-full flex flex-col ${isDashboardView ? 'bg-transparent' : 'bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800'}`}>
            {/* Mobile-Optimized Header - Simplified for non-technical users */}
            {!isDashboardView && (
                <div className="sticky top-0 z-10 bg-white/95 dark:bg-darkcard/95 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:relative lg:bg-transparent lg:backdrop-blur-none lg:border-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-4xl sm:text-5xl">📦</div>
                            <div>
                                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-800 dark:text-gray-200">
                                    طلباتي
                                </h3>
                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
                                    {userOrders.length > 0
                                        ? `لديك ${userOrders.length} طلب 📋`
                                        : 'لا توجد طلبات حتى الآن'
                                    }
                                </p>
                            </div>
                        </div>
                        {onBack && (
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleRefresh}
                                    variant="secondary"
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 transition-colors ${isRefreshing ? 'animate-pulse' : ''}`}
                                >
                                    <Icon name="RefreshCw" className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    <span className="hidden sm:inline">تحديث</span>
                                </Button>
                                <button
                                    onClick={onBack}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 transition-colors"
                                >
                                    <Icon name="ArrowRight" className="w-5 h-5" />
                                    <span className="hidden sm:inline">العودة</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard View Header - Mobile Optimized */}
            {isDashboardView && (
                <div className="sticky top-0 z-30 bg-white/80 dark:bg-darkcard/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-700/50 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                                <Icon name="ShoppingCart" className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">طلباتي</h3>
                                <p className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400">تتبع وإدارة جميع طلباتك بسهولة</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleRefresh}
                                variant="secondary"
                                size="icon"
                                className={`rounded-full h-9 w-9 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 ${isRefreshing ? 'animate-pulse' : ''}`}
                            >
                                <Icon name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>

                            {/* Mobile Filter Toggle */}
                            <button
                                onClick={() => setShowAddressModal(false)} // Just a placeholder for now if we want to toggle something
                                className="md:hidden w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400"
                            >
                                <Icon name="Filter" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Stats Overview (Desktop only) */}
            <div className="hidden lg:grid grid-cols-4 gap-4 px-4 sm:px-6 mb-6">
                {[
                    { label: 'إجمالي الطلبات', value: userOrders.length, icon: 'Package', color: 'primary' },
                    { label: 'طلبات مكتملة', value: userOrders.filter(o => o.status === 'تم التوصيل').length, icon: 'CheckCircle', color: 'green' },
                    { label: 'قيد المراجعة', value: userOrders.filter(o => o.status === 'قيد المراجعة' || o.status === 'pending').length, icon: 'Clock', color: 'amber' },
                    { label: 'عروض جديدة', value: userOrders.filter(o => o.quotes?.some(q => !q.viewedByCustomer)).length, icon: 'Bell', color: 'secondary' }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white/50 dark:bg-darkcard/50 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-slate-700/30 shadow-sm flex items-center gap-4 group hover:bg-white dark:hover:bg-darkcard transition-all duration-300 cursor-default">
                        <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`}>
                            <Icon name={stat.icon as any} className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile-Optimized Filters with Glassmorphism */}
            <div className={`grid grid-cols-1 gap-3 sm:gap-4 bg-white/70 dark:bg-darkcard/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-700/50 ${isDashboardView ? 'mx-4 sm:mx-6 mb-6 p-4 sm:p-5' : 'mb-8 p-5 sm:p-6'}`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-grow group">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                            <Icon name="Search" className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="ابحث برقم الطلب، الماركة، أو اسم القطعة..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-12 sm:h-14 pr-12 pl-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
                        />
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-col sm:flex-row gap-3 min-w-[300px]">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <Icon name="Filter" className="w-4 h-4" />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                                className="w-full h-12 sm:h-14 pr-11 pl-10 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">جميع الحالات</option>
                                <option value="قيد المراجعة">قيد المراجعة</option>
                                <option value="تم التوصيل">تم التوصيل</option>
                                <option value="ملغي">ملغي</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Icon name="ChevronDown" className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <Icon name="SortAsc" className="w-4 h-4" />
                            </div>
                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as any)}
                                className="w-full h-12 sm:h-14 pr-11 pl-10 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-500/50 focus:ring-4 focus:ring-primary-500/10 transition-all appearance-none cursor-pointer"
                            >
                                <option value="newest">الأحدث أولاً</option>
                                <option value="oldest">الأقدم أولاً</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Icon name="ChevronDown" className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile-Optimized Main Content Area */}
            <div className={`flex-grow flex flex-col md:flex-row border border-gray-200 dark:border-slate-700 rounded-xl md:rounded-2xl overflow-hidden bg-white dark:bg-darkcard shadow-xl ${isDashboardView ? 'mx-4 sm:mx-6 mb-6' : 'mb-6'}`}>
                {/* Orders List */}
                <div className={`w-full md:w-[380px] lg:w-[420px] xl:w-[450px] flex-shrink-0 md:border-l-2 border-gray-200 dark:border-slate-700 overflow-y-auto flex flex-col bg-gradient-to-b from-white to-gray-50 dark:from-darkcard dark:to-slate-900 ${selectedOrder ? 'hidden md:flex' : 'flex'}`}>
                    {paginatedOrders.length > 0 ? (
                        <div className="flex-grow">
                            {paginatedOrders.map(order => (
                                <OrderListItem
                                    key={order.orderNumber}
                                    order={order}
                                    isSelected={selectedOrder?.orderNumber === order.orderNumber}
                                    onSelect={() => setSelectedOrder(order)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center p-8">
                            <div className="text-center max-w-sm">
                                <div className="text-7xl mb-4">🔍</div>
                                <h4 className="text-xl font-black text-slate-700 dark:text-slate-300 mb-2">
                                    لا توجد طلبات
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 mb-4">
                                    {searchTerm || statusFilter !== 'all'
                                        ? 'جرب تغيير البحث أو الفلتر'
                                        : 'لم تقم بإنشاء أي طلب حتى الآن'
                                    }
                                </p>
                                <p className="text-sm text-slate-400">
                                    💡 اطلب قطعة غيار الآن!
                                </p>
                            </div>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-darkcard">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredAndSortedOrders.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className={`w-full flex-grow overflow-y-auto ${!selectedOrder ? 'hidden md:flex' : 'block'}`}>
                    {selectedOrder ? (
                        <SelectedOrderDetails
                            order={selectedOrder}
                            onBack={() => setSelectedOrder(null)}
                            providers={allProviders}
                            onAcceptOffer={(quote) => handleAcceptOffer(selectedOrder.orderNumber, quote)}
                            settings={settings}
                            onOpenReuploadModal={(order) => {
                                setReuploadOrder(order);
                                setShowReuploadModal(true);
                            }}
                        />
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full w-full text-slate-500 p-12 text-center bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-6 shadow-lg">
                                <Icon name="Package" className="w-12 h-12 text-slate-400" />
                            </div>
                            <h4 className="font-black text-2xl text-slate-600 dark:text-slate-400 mb-2">اختر طلبًا من القائمة</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-md">سيتم عرض تفاصيل الطلب الكاملة وجميع عروض الأسعار المستلمة هنا.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <OrderConfirmationModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                order={selectedQuoteInfo ? userOrders.find(o => o.orderNumber === selectedQuoteInfo.orderNumber) || null : null}
                acceptedQuote={selectedQuoteInfo?.quote || null}
                shippingPrice={selectedQuoteShippingPrice}
                city={selectedOrder?.formData?.city || (selectedOrder as any)?.form_data?.city || ''}
                settings={settings}
                userPhone={userPhone}
                currentUser={currentUser}
                onConfirm={handleConfirmAcceptance}
                isAccepting={isAccepting}
                onUpdateCustomer={onUpdateCustomer}
            />

            {/* Re-upload Receipt Modal */}
            <ReuploadModal
                isOpen={showReuploadModal}
                onClose={() => setShowReuploadModal(false)}
                reuploadOrder={reuploadOrder}
                onReupload={handleReuploadReceipt}
                isReuploading={isReuploading}
            />

            {/* Review Modal */}
            {reviewOrder && (
                <Modal
                    onClose={() => setReviewOrder(null)}
                    title="تقييم الخدمة"
                >
                    <div className="space-y-6 text-center">
                        <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2">
                            <Icon name="Star" className="w-8 h-8 text-yellow-500" />
                        </div>

                        <div>
                            <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-2">
                                كيف كانت تجربتك؟
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                يرجى تقييم تعاملك مع المزود لمساعدتنا في تحسين الخدمة
                            </p>
                        </div>

                        <div className="flex justify-center py-4">
                            <Rating
                                rating={rating}
                                onRating={setRating}
                                size="md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 text-right">
                                ملاحظات إضافية (اختياري)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none h-32"
                                placeholder="اكتب تعليقك هنا..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSubmitReview}
                                disabled={rating === 0}
                                className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                            >
                                إرسال التقييم
                            </button>
                            <button
                                onClick={() => setReviewOrder(null)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MyOrders;
