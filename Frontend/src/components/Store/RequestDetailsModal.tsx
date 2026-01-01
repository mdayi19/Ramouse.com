
import React, { useState, useEffect } from 'react';
import { FlashProductBuyerRequest } from '../../types';
import Modal from '../Modal';
import Icon from '../Icon';
import { getStatusColor, getStatusLabel } from './utils';

interface IdbAccess {
    getMedia: <T>(storeName: 'orderMedia' | 'productMedia', key: string) => Promise<T | undefined>;
}

interface RequestDetailsModalProps {
    request: FlashProductBuyerRequest;
    onClose: () => void;
    onPrint: () => void;
    canPrint: boolean;
    onCancel?: (orderId: string) => Promise<void>;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ request, onClose, onPrint, canPrint, onCancel }) => {
    const [receiptUrl, setReceiptUrl] = useState<string | undefined>(request.paymentReceiptUrl);
    const [isCancelling, setIsCancelling] = useState(false);

    const canCancelOrder = ['pending', 'payment_verification'].includes(request.status);

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
            } else if (request.paymentReceiptUrl && request.paymentReceiptUrl.startsWith('/')) {
                // Prepend API URL if it's a relative path (fallback if proxy doesn't work or for production)
                // Assuming API_URL is /api, we need the root. 
                // In dev with proxy, /storage works. In prod, we might need full URL.
                // For now, let's trust the proxy for /storage, but if we wanted to be explicit:
                // const baseUrl = API_URL.replace('/api', '');
                // setReceiptUrl(`${baseUrl}${request.paymentReceiptUrl}`);
                setReceiptUrl(request.paymentReceiptUrl);
            } else {
                setReceiptUrl(request.paymentReceiptUrl);
            }
        };
        resolveUrl();
    }, [request.paymentReceiptUrl]);

    if (!request.deliveryMethod) return null;
    return (
        <Modal title={`تفاصيل الطلب #${request.id.slice(-6)}`} onClose={onClose}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b dark:border-slate-700 pb-4 gap-4">
                    <div><p className="text-sm text-slate-500">الحالة الحالية</p><span className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full text-sm font-bold ${getStatusColor(request.status)}`}>{request.status === 'approved' && <Icon name="CheckCircle" className="w-4 h-4" />}{getStatusLabel(request.status)}</span></div>
                    <div className="text-right"><p className="text-sm text-slate-500">تاريخ الطلب</p><p className="font-medium">{new Date(request.requestDate).toLocaleDateString('ar-SY')}</p></div>
                </div>
                <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2"><Icon name="Truck" className="w-5 h-5 text-primary" /> معلومات الشحن والدفع</h4>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><span className="text-slate-500 block text-xs mb-1">طريقة الاستلام</span><span className="font-semibold">{request.deliveryMethod === 'shipping' ? 'توصيل' : 'استلام من المركز'}</span></div>
                        <div><span className="text-slate-500 block text-xs mb-1">طريقة الدفع</span><span className="font-semibold">{request.paymentMethodName}</span></div>
                        {request.deliveryMethod === 'shipping' && (<div className="sm:col-span-2"><span className="text-slate-500 block text-xs mb-1">العنوان</span><span className="font-semibold">{request.shippingAddress}</span><div className="mt-1 text-xs text-slate-500 font-mono" dir="ltr">{request.contactPhone}</div></div>)}

                        <div><span className="text-slate-500 block text-xs mb-1">سعر المنتج ({request.quantity} قطع)</span><span className="font-semibold">${((request.totalPrice || 0) - (request.shippingCost || 0)).toLocaleString()}</span></div>
                        <div><span className="text-slate-500 block text-xs mb-1">تكلفة الشحن</span><span className="font-semibold">${request.shippingCost || 0}</span></div>

                        <div className="sm:col-span-2 border-t dark:border-slate-700 pt-3 mt-1 flex justify-between items-center"><span className="font-bold">الإجمالي الكلي</span><span className="font-black text-xl text-primary">${request.totalPrice?.toLocaleString()}</span></div>
                    </div>
                </div>
                {receiptUrl && (<div><h4 className="font-bold mb-3 flex items-center gap-2"><Icon name="Receipt" className="w-5 h-5 text-primary" /> إيصال الدفع</h4><a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="block group relative overflow-hidden rounded-xl border dark:border-slate-700"><img src={receiptUrl} alt="Receipt" className="w-full h-48 object-cover bg-slate-100 dark:bg-slate-800 transition-transform duration-500 group-hover:scale-105" /></a></div>)}
                {request.adminNotes && (<div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 flex gap-3"><Icon name="AlertCircle" className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><div><p className="text-xs font-bold text-red-800 mb-1">ملاحظات الإدارة</p><p className="text-sm text-red-700">{request.adminNotes}</p></div></div>)}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        {canCancelOrder && onCancel && (
                            <button
                                onClick={async () => {
                                    if (window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                                        setIsCancelling(true);
                                        try {
                                            await onCancel(request.id);
                                            onClose();
                                        } catch (error) {
                                            console.error('Cancel failed:', error);
                                        } finally {
                                            setIsCancelling(false);
                                        }
                                    }
                                }}
                                disabled={isCancelling}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                            >
                                {isCancelling ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {canPrint && (
                            <button
                                onClick={onPrint}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold flex items-center gap-2"
                            >
                                <Icon name="Printer" className="w-4 h-4" />
                                طباعة
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate- dark:bg-slate-600 rounded-lg hover:bg-slate-300 text-sm font-bold"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
