
import React, { useState, useMemo, useEffect } from 'react';
import { FlashProductBuyerRequest, FlashProductRequestStatus, NotificationType, AdminFlashProduct, Notification, Settings } from '../../../types';
import { ViewHeader, StatusBadge } from '../Shared';
import Pagination from '../../Pagination';
import Icon from '../../Icon';
import Modal from '../../Modal';
import EmptyState from '../../EmptyState';
import { StoreReceipt } from './StoreReceipt';
import { adminStoreAPI } from '../../../lib/api';

interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface StoreOrderManagementProps {
    requests: FlashProductBuyerRequest[];
    products: AdminFlashProduct[];
    updateRequests: (requests: FlashProductBuyerRequest[]) => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    settings: Settings;
    onPrintReceipt?: (req: FlashProductBuyerRequest) => void; // Kept for compatibility but using local handling
}

const getStatusLabel = (status: FlashProductRequestStatus) => {
    switch (status) {
        case 'pending': return 'قيد الانتظار';
        case 'payment_verification': return 'التحقق من الدفع';
        case 'preparing': return 'جاري التجهيز';
        case 'shipped': return 'تم الشحن';
        case 'delivered': return 'تم التوصيل';
        case 'rejected': return 'مرفوض';
        case 'cancelled': return 'ملغي';
        case 'approved': return 'مقبول';
        default: return status;
    }
};

// Add StatBox definition
const StatBox: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full text-white ${color} shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{value}</p>
        </div>
    </div>
);

const RequestDetailsModal: React.FC<{
    request: FlashProductBuyerRequest,
    onClose: () => void,
    onPrint: () => void,
    onUpdateStatus: (status: FlashProductRequestStatus, reason?: string) => void
}> = ({ request, onClose, onPrint, onUpdateStatus }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | undefined>(request.paymentReceiptUrl);

    useEffect(() => {
        const resolveUrl = async () => {
            if (request.paymentReceiptUrl && request.paymentReceiptUrl.startsWith('db:')) {
                const parts = request.paymentReceiptUrl.split(':');
                if (parts.length >= 3) {
                    const storeName = parts[1];
                    const key = parts[2];
                    const db = (window as any).db as IdbAccess;
                    if (db) {
                        try {
                            const blob = await db.getMedia(storeName as any, key);
                            if (blob instanceof Blob || blob instanceof File) {
                                setReceiptUrl(URL.createObjectURL(blob));
                            }
                        } catch (e) { console.error("Failed to resolve receipt", e); }
                    }
                }
            } else {
                setReceiptUrl(request.paymentReceiptUrl);
            }
        };
        resolveUrl();
    }, [request.paymentReceiptUrl]);

    const canPrint = ['preparing', 'shipped', 'delivered', 'approved'].includes(request.status);

    if (!request.deliveryMethod) return null;

    const handleReject = () => {
        if (!rejectReason.trim()) {
            alert('الرجاء إدخال سبب الرفض');
            return;
        }
        onUpdateStatus('rejected', rejectReason);
        setIsRejecting(false);
    };

    // Workflow Actions Bar
    const renderWorkflowActions = () => {
        const actions = [];

        // Case 1: Electronic Payment (Needs Verification)
        if (request.status === 'payment_verification') {
            actions.push(
                <button key="approve" onClick={() => onUpdateStatus('preparing')} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md flex items-center justify-center gap-2">
                    <Icon name="CheckCircle" className="w-5 h-5" />
                    تأكيد الدفع والبدء بالتجهيز
                </button>
            );
            actions.push(
                <button key="reject" onClick={() => setIsRejecting(true)} className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg hover:bg-red-200 transition-colors font-bold border border-red-200 flex items-center justify-center gap-2">
                    <Icon name="XCircle" className="w-5 h-5" />
                    رفض إيصال الدفع
                </button>
            );
        }
        // Case 2: Cash On Delivery (Needs Acceptance)
        else if (request.status === 'pending') {
            actions.push(
                <button key="accept" onClick={() => onUpdateStatus('preparing')} className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md flex items-center justify-center gap-2">
                    <Icon name="Check" className="w-5 h-5" />
                    قبول الطلب (الدفع عند الاستلام)
                </button>
            );
            actions.push(
                <button key="reject" onClick={() => setIsRejecting(true)} className="flex-1 bg-red-100 text-red-700 py-3 rounded-lg hover:bg-red-200 transition-colors font-bold border border-red-200 flex items-center justify-center gap-2">
                    <Icon name="XCircle" className="w-5 h-5" />
                    رفض الطلب
                </button>
            );
        }
        // Case 3: Preparing -> Shipping
        else if (request.status === 'preparing') {
            actions.push(
                <button key="ship" onClick={() => onUpdateStatus('shipped')} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md flex items-center justify-center gap-2">
                    <Icon name="Truck" className="w-5 h-5" />
                    تم الشحن (إرسال للتوصيل)
                </button>
            );
        }
        // Case 4: Shipped -> Delivered
        else if (request.status === 'shipped') {
            actions.push(
                <button key="deliver" onClick={() => onUpdateStatus('delivered')} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors font-bold shadow-md flex items-center justify-center gap-2">
                    <Icon name="CheckCircle" className="w-5 h-5" />
                    تأكيد التوصيل والاستلام
                </button>
            );
        }

        if (actions.length === 0) return null;

        return (
            <div className="bg-slate-100 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">الإجراءات التالية</h4>
                <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                    {actions}
                </div>
            </div>
        );
    };

    return (
        <Modal title={`تفاصيل الطلب #${request.id.slice(-6)}`} onClose={onClose} size="lg">
            <div className="space-y-6">

                {/* Order Progress Stepper */}
                <div className="flex items-center justify-between px-2 sm:px-6 mb-4 relative">
                    {/* Connecting Line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>

                    {[
                        { status: 'placed', label: 'تم الطلب', active: true },
                        { status: 'preparing', label: 'قيد التجهيز', active: ['preparing', 'shipped', 'delivered', 'approved'].includes(request.status) },
                        { status: 'shipped', label: 'تم الشحن', active: ['shipped', 'delivered', 'approved'].includes(request.status) },
                        { status: 'delivered', label: 'تم التسليم', active: ['delivered', 'approved'].includes(request.status) },
                    ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center bg-white dark:bg-darkcard px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2 ${step.active ? 'bg-primary border-primary text-white' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                                {step.active ? <Icon name="Check" className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${step.active ? 'text-primary' : 'text-slate-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>

                {/* Workflow Banner */}
                {!isRejecting && renderWorkflowActions()}

                {isRejecting && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 animate-fade-in mb-6">
                        <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-2">سبب الرفض</label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full p-2 border border-red-300 rounded-md mb-3 text-sm focus:ring-red-500 focus:border-red-500 dark:bg-slate-800 dark:border-slate-600"
                            placeholder="يرجى توضيح سبب الرفض للعميل..."
                            rows={2}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsRejecting(false)} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm font-medium">إلغاء</button>
                            <button onClick={handleReject} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700">تأكيد الرفض</button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Icon name="User" className="w-4 h-4" /> المشتري</h4>
                        <div className="bg-white dark:bg-darkcard p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-2 shadow-sm">
                            <div className="flex justify-between"><span className="text-slate-500">الاسم:</span> <span className="font-medium">{request.buyerName}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">النوع:</span> <span>{request.buyerType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">الهاتف:</span> <span dir="ltr" className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{request.contactPhone}</span></div>
                        </div>
                    </div>

                    {/* Shipping Info */}
                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Icon name="Truck" className="w-4 h-4" /> الشحن والاستلام</h4>
                        <div className="bg-white dark:bg-darkcard p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm space-y-2 shadow-sm">
                            <div className="flex justify-between"><span className="text-slate-500">الطريقة:</span> <span className="font-bold">{request.deliveryMethod === 'shipping' ? 'توصيل' : 'استلام من المركز'}</span></div>
                            {request.deliveryMethod === 'shipping' && (
                                <div><span className="text-slate-500 block mb-1">العنوان:</span> <p className="font-medium bg-slate-50 dark:bg-slate-800 p-2 rounded text-slate-700 dark:text-slate-300">{request.shippingAddress}</p></div>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-3 md:col-span-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Icon name="CreditCard" className="w-4 h-4" /> الدفع</h4>
                        <div className="bg-white dark:bg-darkcard p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm shadow-sm">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div><span className="text-slate-500 block text-xs mb-1">طريقة الدفع</span><span className="font-medium">{request.paymentMethodName}</span></div>
                                <div><span className="text-slate-500 block text-xs mb-1">تاريخ الطلب</span><span className="font-medium">{new Date(request.requestDate).toLocaleString('ar-SY')}</span></div>
                                <div><span className="text-slate-500 block text-xs mb-1">الحالة الحالية</span><div className="mt-1"><StatusBadge status={request.status} /></div></div>
                            </div>
                            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
                                <span className="font-bold text-lg">الإجمالي</span>
                                <span className="font-black text-2xl text-primary">${request.totalPrice?.toLocaleString()}</span>
                            </div>

                            {/* Receipt Display for Verification */}
                            {receiptUrl && (
                                <div className={`mt-4 border-t border-slate-200 dark:border-slate-700 pt-3 ${request.status === 'payment_verification' ? 'bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800' : ''}`}>
                                    <span className="text-slate-500 block text-sm mb-2 font-bold flex items-center gap-2">
                                        <Icon name="Receipt" className="w-4 h-4" /> إيصال الدفع المرفق
                                        {request.status === 'payment_verification' && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">مطلوب التحقق</span>}
                                    </span>
                                    <a href={receiptUrl} target="_blank" rel="noreferrer" className="block hover:opacity-90 transition-opacity">
                                        <img src={receiptUrl} alt="Receipt" className="max-w-full h-64 object-contain rounded-lg border bg-slate-50 dark:bg-slate-800" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-3 pt-4 border-t dark:border-slate-700">
                    {canPrint && (<button onClick={onPrint} className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold"><Icon name="Printer" className="w-4 h-4" /> طباعة الفاتورة</button>)}
                    <button onClick={onClose} className="bg-slate-200 dark:bg-slate-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-300">إغلاق</button>
                </div>
            </div>
        </Modal>
    );
};


const ITEMS_PER_PAGE = 12;

const StoreOrderManagement: React.FC<StoreOrderManagementProps> = ({ requests, products, updateRequests, addNotificationForUser, showToast, settings }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | FlashProductRequestStatus>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingRequest, setViewingRequest] = useState<FlashProductBuyerRequest | null>(null);
    const [printingRequest, setPrintingRequest] = useState<FlashProductBuyerRequest | null>(null);
    const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
    const [quickFilter, setQuickFilter] = useState<'all' | 'action' | 'processing' | 'completed'>('all');
    const [isLoading, setIsLoading] = useState(false);
    const [orders, setOrders] = useState<FlashProductBuyerRequest[]>([]);

    // Fetch orders from API on mount
    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const response = await adminStoreAPI.getAllOrders();
            setOrders(response.data.data);
            updateRequests(response.data.data); // Also update parent state if needed
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            showToast('فشل تحميل الطلبات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Stats Calculation (now from API or calculate from orders) ---
    const stats = useMemo(() => {
        const totalRevenue = orders.filter(r => ['delivered', 'approved'].includes(r.status)).reduce((sum, r) => sum + (r.totalPrice || 0), 0);
        const pendingCount = orders.filter(r => ['pending', 'payment_verification'].includes(r.status)).length;
        const processingCount = orders.filter(r => ['preparing', 'shipped'].includes(r.status)).length;
        const completedCount = orders.filter(r => r.status === 'delivered').length;
        return { totalRevenue, pendingCount, processingCount, completedCount };
    }, [orders]);

    const filteredRequests = useMemo(() => {
        return orders.filter(r => {
            // Quick Filters
            if (quickFilter === 'action') {
                if (!['pending', 'payment_verification'].includes(r.status)) return false;
            } else if (quickFilter === 'processing') {
                if (!['preparing', 'shipped'].includes(r.status)) return false;
            } else if (quickFilter === 'completed') {
                if (!['delivered', 'approved'].includes(r.status)) return false;
            }

            // Specific Filters
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const product = products.find(p => p.id === r.productId);
                return r.buyerName.toLowerCase().includes(term) ||
                    product?.name.toLowerCase().includes(term) ||
                    r.id.toLowerCase().includes(term) ||
                    r.contactPhone?.includes(term);
            }
            return true;
        }).sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
    }, [orders, statusFilter, searchTerm, products, quickFilter]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * 15;
        return filteredRequests.slice(startIndex, startIndex + 15);
    }, [filteredRequests, currentPage]);

    const updateStatus = async (ids: string[], newStatus: FlashProductRequestStatus, reason?: string) => {
        try {
            // Update each order via API
            await Promise.all(ids.map(id =>
                adminStoreAPI.updateOrderStatus(id, newStatus, reason)
            ));

            // Refresh orders list from API
            await fetchOrders();

            // Update modal if viewing
            if (viewingRequest && ids.includes(viewingRequest.id)) {
                setViewingRequest(prev => prev ? { ...prev, status: newStatus, adminNotes: reason || prev.adminNotes } : null);
            }

            showToast(`تم تحديث ${ids.length} طلب بنجاح.`, 'success');
            setSelectedRequestIds(new Set());
        } catch (error) {
            console.error('Failed to update status:', error);
            showToast('فشل تحديث الحالة', 'error');
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedRequestIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedRequestIds(newSet);
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedRequestIds(new Set(filteredRequests.map(r => r.id)));
        else setSelectedRequestIds(new Set());
    }

    const getProductImage = (productId: string) => {
        const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
        const API_BASE = API_BASE_URL.endsWith('/api') ? API_BASE_URL.replace('/api', '') : API_BASE_URL;
        const product = products.find(p => p.id === productId);

        if (product?.media && product.media.length > 0 && product.media[0].type === 'image') {
            const imgData = product.media[0].data || '';

            // If it's base64 or full URL, return as is
            if (imgData.startsWith('data:') || imgData.startsWith('http://') || imgData.startsWith('https://')) {
                return imgData;
            }

            // If it's a storage path, prepend backend URL
            if (imgData.startsWith('/storage/')) {
                return `${API_BASE}${imgData}`;
            } else if (imgData.startsWith('storage/')) {
                return `${API_BASE}/${imgData}`;
            }

            return imgData;
        }

        return null;
    };

    // Quick Action Renderers for Table Rows
    const renderRowActions = (req: FlashProductBuyerRequest) => {
        if (req.status === 'pending' || req.status === 'payment_verification') {
            return (
                <button
                    onClick={(e) => { e.stopPropagation(); updateStatus([req.id], 'preparing'); }}
                    className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded transition-colors"
                    title="قبول وتجهيز"
                >
                    <Icon name="Check" className="w-4 h-4" />
                </button>
            );
        }
        if (req.status === 'preparing') {
            return (
                <button
                    onClick={(e) => { e.stopPropagation(); updateStatus([req.id], 'shipped'); }}
                    className="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded transition-colors"
                    title="تم الشحن"
                >
                    <Icon name="Truck" className="w-4 h-4" />
                </button>
            );
        }
        if (req.status === 'shipped') {
            return (
                <button
                    onClick={(e) => { e.stopPropagation(); updateStatus([req.id], 'delivered'); }}
                    className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded transition-colors"
                    title="تم التوصيل"
                >
                    <Icon name="CheckCircle" className="w-4 h-4" />
                </button>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <ViewHeader title="إدارة طلبات المتجر" subtitle="متابعة ومعالجة طلبات الشراء الواردة." />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatBox label="إجمالي الإيرادات" value={`$${stats.totalRevenue.toLocaleString()}`} color="bg-emerald-500" icon={<Icon name="Banknote" className="w-6 h-6" />} />
                <StatBox label="بحاجة لإجراء" value={stats.pendingCount} color="bg-amber-500" icon={<Icon name="AlertCircle" className="w-6 h-6" />} />
                <StatBox label="قيد التجهيز" value={stats.processingCount} color="bg-blue-500" icon={<Icon name="Package" className="w-6 h-6" />} />
                <StatBox label="طلبات مكتملة" value={stats.completedCount} color="bg-indigo-500" icon={<Icon name="CheckCircle" className="w-6 h-6" />} />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: 'all', label: 'الكل' },
                        { id: 'action', label: 'بحاجة لإجراء' },
                        { id: 'processing', label: 'قيد التجهيز والشحن' },
                        { id: 'completed', label: 'مكتملة' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setQuickFilter(tab.id as any); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${quickFilter === tab.id ? 'bg-primary text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Icon name="Search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input type="text" placeholder="بحث (اسم، هاتف، رقم طلب)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pr-9 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary/50 outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 outline-none focus:border-primary">
                            <option value="all">كل الحالات</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="payment_verification">التحقق من الدفع</option>
                            <option value="preparing">جاري التجهيز</option>
                            <option value="shipped">تم الشحن</option>
                            <option value="delivered">تم التوصيل</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </div>
                </div>

                {selectedRequestIds.size > 0 && (
                    <div className="flex flex-wrap gap-2 items-center bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800 animate-in slide-in-from-top-2 shadow-md">
                        <span className="text-sm font-bold text-blue-800 dark:text-blue-200 ml-4 whitespace-nowrap">تم تحديد {selectedRequestIds.size}</span>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => updateStatus(Array.from(selectedRequestIds), 'preparing')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm flex items-center gap-1"><Icon name="Package" className="w-3 h-3" /> تجهيز</button>
                            <button onClick={() => updateStatus(Array.from(selectedRequestIds), 'shipped')} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1"><Icon name="Truck" className="w-3 h-3" /> شحن</button>
                            <button onClick={() => updateStatus(Array.from(selectedRequestIds), 'delivered')} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 shadow-sm flex items-center gap-1"><Icon name="Check" className="w-3 h-3" /> توصيل</button>
                            <button onClick={() => {
                                const reason = prompt("سبب الرفض الجماعي:");
                                if (reason) updateStatus(Array.from(selectedRequestIds), 'rejected', reason);
                            }} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 shadow-sm flex items-center gap-1"><Icon name="X" className="w-3 h-3" /> رفض</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto border dark:border-slate-700 rounded-lg bg-white dark:bg-darkcard shadow-sm">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-100 dark:bg-slate-900/50 border-b dark:border-slate-700">
                        <tr>
                            <th className="p-4 text-center w-12"><input type="checkbox" onChange={toggleSelectAll} checked={selectedRequestIds.size === filteredRequests.length && filteredRequests.length > 0} className="rounded text-primary w-4 h-4 cursor-pointer" /></th>
                            <th className="p-4">الطلب / المنتج</th>
                            <th className="p-4">المشتري</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4">الدفع / التوصيل</th>
                            <th className="p-4 text-center">إجراء سريع</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {paginatedData.map(req => {
                            const product = products.find(p => p.id === req.productId);
                            const img = product ? getProductImage(product.id) : null;

                            return (
                                <tr key={req.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedRequestIds.has(req.id) ? 'bg-blue-50/60 dark:bg-blue-900/10' : ''}`}>
                                    <td className="p-4 text-center"><input type="checkbox" checked={selectedRequestIds.has(req.id)} onChange={() => toggleSelect(req.id)} className="rounded text-primary cursor-pointer w-4 h-4" /></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-md flex-shrink-0 overflow-hidden border dark:border-slate-600 flex items-center justify-center">
                                                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Icon name="Image" className="w-5 h-5 text-slate-400" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[200px]">{product?.name || 'منتج محذوف'}</div>
                                                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                                    <span>#{req.id.slice(-6)}</span>
                                                    <span className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">x{req.quantity}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{req.buyerName}</div>
                                        <div className="text-xs text-slate-500">{req.buyerType}</div>
                                    </td>
                                    <td className="p-4">
                                        <StatusBadge status={req.status} />
                                        {req.paymentReceiptUrl && req.status === 'payment_verification' && (
                                            <button
                                                className="text-[10px] text-blue-600 block mt-1 font-bold flex items-center gap-1 cursor-pointer hover:underline"
                                                onClick={(e) => { e.stopPropagation(); setViewingRequest(req); }}
                                            >
                                                <Icon name="Receipt" className="w-3 h-3" /> إيصال مرفق
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs">
                                        <div className="font-semibold">{req.paymentMethodName}</div>
                                        <div className="font-mono font-bold text-green-600 mt-1">${req.totalPrice?.toLocaleString()}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {renderRowActions(req)}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setViewingRequest(req); }}
                                                className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded transition-colors"
                                                title="التفاصيل"
                                            >
                                                <Icon name="Eye" className="w-4 h-4" />
                                            </button>
                                            {['preparing', 'shipped', 'delivered', 'approved'].includes(req.status) && (
                                                <button onClick={(e) => { e.stopPropagation(); setPrintingRequest(req); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded transition-colors" title="طباعة">
                                                    <Icon name="Printer" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                        {paginatedData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-500">
                            <div className="flex flex-col items-center">
                                <Icon name="SearchX" className="w-12 h-12 mb-2 opacity-50" />
                                <span>لا توجد طلبات تطابق الفلاتر الحالية.</span>
                            </div>
                        </td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredRequests.length / 15)} onPageChange={setCurrentPage} totalItems={filteredRequests.length} itemsPerPage={15} />

            {viewingRequest && (
                <RequestDetailsModal
                    request={viewingRequest}
                    onClose={() => setViewingRequest(null)}
                    onPrint={() => setPrintingRequest(viewingRequest)}
                    onUpdateStatus={(newStatus, reason) => updateStatus([viewingRequest.id], newStatus, reason)}
                />
            )}

            {printingRequest && (
                <StoreReceipt
                    request={printingRequest}
                    productName={products.find(p => p.id === printingRequest.productId)?.name || 'منتج غير معروف'}
                    settings={settings}
                    onDone={() => setPrintingRequest(null)}
                />
            )}
        </div>
    );
};

export default StoreOrderManagement;
