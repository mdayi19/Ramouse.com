import React, { useState, useEffect } from 'react';
import { Quote, Settings, Customer, Order } from '../../types';
import Modal from '../Modal';
import Icon from '../Icon';
import ImageUpload from '../ImageUpload';

interface OrderConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null; // The order being accepted
    acceptedQuote: Quote | null;
    shippingPrice: number; // calculated shipping price
    city: string; // city for shipping calculation display
    settings: Settings;
    userPhone: string;
    currentUser?: any; // Pass currentUser if available
    onConfirm: (data: {
        paymentMethodId: string;
        paymentMethodName: string;
        deliveryMethod: 'shipping' | 'pickup';
        customerName: string;
        customerAddress: string;
        customerPhone: string;
        paymentReceipt: File | null;
    }) => Promise<void>;
    isAccepting: boolean;
    onUpdateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
}

const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
    isOpen,
    onClose,
    order,
    acceptedQuote,
    shippingPrice,
    city,
    settings,
    userPhone,
    currentUser,
    onConfirm,
    isAccepting,
    onUpdateCustomer
}) => {
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState(userPhone);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
    const [paymentReceipt, setPaymentReceipt] = useState<File[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Initialize defaults when modal opens
            setDeliveryMethod('shipping');
            setPaymentReceipt([]);
            const paymentMethods = settings?.paymentMethods || [];
            const firstActiveMethod = Array.isArray(paymentMethods) ? paymentMethods.find(pm => pm.isActive) : undefined;
            setSelectedPaymentMethodId(firstActiveMethod ? firstActiveMethod.id : '');

            // Pre-fill user data
            if (currentUser) {
                setCustomerName(currentUser.name || '');
                setCustomerPhone(userPhone);
                if ('address' in currentUser && currentUser.address) {
                    setCustomerAddress(currentUser.address);
                } else if ('city' in currentUser && currentUser.city) {
                    setCustomerAddress(currentUser.city);
                } else {
                    setCustomerAddress('');
                }
            } else {
                // Fallback to localStorage if no currentUser prop
                const allCustomersRaw = localStorage.getItem('all_customers');
                if (allCustomersRaw) {
                    try {
                        const allCustomers: Customer[] = JSON.parse(allCustomersRaw);
                        if (Array.isArray(allCustomers)) {
                            const currentUserStored = allCustomers.find(c => c && c.id === userPhone);
                            if (currentUserStored) {
                                setCustomerName(currentUserStored.name || '');
                                setCustomerAddress(currentUserStored.address || '');
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse all_customers", e);
                    }
                }
            }
        }
    }, [isOpen, currentUser, userPhone, settings]);


    if (!isOpen) return null;

    const shippingPriceForDisplay = deliveryMethod === 'shipping' ? shippingPrice : 0;
    const totalPriceForDisplay = acceptedQuote ? Number(acceptedQuote.price) + Number(shippingPriceForDisplay) : 0;

    const paymentMethods = settings?.paymentMethods || [];
    const selectedMethod = Array.isArray(paymentMethods) ? paymentMethods.find(pm => pm.id === selectedPaymentMethodId) : undefined;


    const handleConfirm = () => {
        // Validation
        if (deliveryMethod === 'shipping' && (!customerName.trim() || !customerAddress.trim() || !customerPhone.trim())) {
            alert('يرجى إدخال الاسم الكامل والعنوان ورقم الهاتف.'); // Simple fallback or pass onError prop
            return;
        }
        if (!selectedPaymentMethodId) {
            alert('يرجى اختيار طريقة الدفع.');
            return;
        }
        const isCOD = selectedPaymentMethodId === 'pm-cod';
        if (!isCOD && paymentReceipt.length === 0) {
            alert('يرجى رفع صورة إيصال الدفع.');
            return;
        }

        onConfirm({
            paymentMethodId: selectedPaymentMethodId,
            paymentMethodName: selectedMethod?.name || '',
            deliveryMethod,
            customerName: deliveryMethod === 'shipping' ? customerName : '',
            customerAddress: deliveryMethod === 'shipping' ? customerAddress : '',
            customerPhone: deliveryMethod === 'shipping' ? customerPhone : userPhone,
            paymentReceipt: paymentReceipt.length > 0 ? paymentReceipt[0] : null
        });
    };

    return (
        <Modal
            onClose={onClose}
            title="تأكيد قبول العرض"
            size="lg"
        >
            <div className="space-y-5 sm:space-y-6">
                {/* Delivery Method Toggle */}
                <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1">
                    <button
                        onClick={() => setDeliveryMethod('shipping')}
                        className={`flex-1 py-2 sm:py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${deliveryMethod === 'shipping'
                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Icon name="Truck" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        توصيل (شحن)
                    </button>
                    <button
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`flex-1 py-2 sm:py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${deliveryMethod === 'pickup'
                            ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Icon name="Store" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        استلام من المتجر
                    </button>
                </div>

                {/* Shipping Details */}
                {deliveryMethod === 'shipping' && (
                    <div className="space-y-3 sm:space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                الاسم الكامل
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
                                placeholder="أدخل اسمك الكامل"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                رقم الهاتف
                            </label>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
                                placeholder="أدخل رقم هاتفك"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                                العنوان التفصيلي
                            </label>
                            <textarea
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                                className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none h-20 sm:h-24 text-sm font-medium"
                                placeholder="المدينة، الحي، الشارع، معلم قريب..."
                            />
                        </div>
                    </div>
                )}

                {/* Payment Methods */}
                <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                        طريقة الدفع
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {(Array.isArray(paymentMethods) ? paymentMethods : []).filter(pm => pm.isActive).map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setSelectedPaymentMethodId(method.id)}
                                className={`relative p-3 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col items-start gap-1.5 sm:gap-2 ${selectedPaymentMethodId === method.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-800 bg-white dark:bg-slate-800'
                                    }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className={`text-sm font-bold ${selectedPaymentMethodId === method.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {method.name}
                                    </span>
                                    {selectedPaymentMethodId === method.id && (
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary-500 flex items-center justify-center">
                                            <Icon name="Check" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                {method.details && (
                                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 text-right leading-relaxed line-clamp-2">
                                        {method.details}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Receipt Upload */}
                {selectedPaymentMethodId && selectedPaymentMethodId !== 'pm-cod' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                            إيصال الدفع
                        </label>
                        <ImageUpload
                            files={paymentReceipt}
                            setFiles={setPaymentReceipt}
                            maxFiles={1}
                        />
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                            <Icon name="Info" className="w-3 h-3" />
                            يرجى رفع صورة واضحة لإيصال التحويل البنكي
                        </p>
                    </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-slate-700">
                    <h5 className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        <Icon name="FileText" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        ملخص الطلب
                    </h5>
                    <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>سعر القطعة</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                ${acceptedQuote?.price.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>رسوم الشحن ({deliveryMethod === 'shipping' ? city : 'استلام من المتجر'})</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                ${shippingPriceForDisplay.toLocaleString()}
                            </span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-slate-700 pt-2 mt-2 flex justify-between items-center">
                            <span className="font-bold text-gray-800 dark:text-gray-200">الإجمالي الكلي</span>
                            <span className="font-black text-lg sm:text-xl text-primary-600 dark:text-primary-400">
                                ${totalPriceForDisplay.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 sm:gap-3 pt-2">
                    <button
                        onClick={handleConfirm}
                        disabled={isAccepting}
                        className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-3 sm:py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        {isAccepting ? (
                            <>
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                جاري التأكيد...
                            </>
                        ) : (
                            <>
                                <Icon name="CheckCircle" className="w-4 h-4 sm:w-5 sm:h-5" />
                                تأكيد الطلب
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isAccepting}
                        className="px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-200 dark:border-slate-700 text-sm sm:text-base"
                    >
                        إلغاء
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OrderConfirmationModal;
