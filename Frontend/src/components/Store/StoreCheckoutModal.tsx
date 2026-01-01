
import React from 'react';
import Modal from '../Modal';
import Icon from '../Icon';
import ImageUpload from '../ImageUpload';
import { CheckoutStepper } from './CheckoutStepper';
import { PaymentMethod, Settings, AdminFlashProduct } from '../../types';
import { SYRIAN_CITIES } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CartItem {
    product: AdminFlashProduct;
    quantity: number;
}

interface StoreCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    step: 'cart' | 'details' | 'payment';
    setStep: (step: 'cart' | 'details' | 'payment') => void;
    cart: CartItem[];
    cartTotal: number;
    updateCartQuantity: (productId: string, delta: number) => void;
    removeFromCart: (productId: string) => void;
    deliveryMethod: 'shipping' | 'pickup';
    setDeliveryMethod: (method: 'shipping' | 'pickup') => void;
    shippingAddress: string;
    setShippingAddress: (address: string) => void;
    contactPhone: string;
    setContactPhone: (phone: string) => void;
    selectedCity: string;
    setSelectedCity: (city: string) => void;
    availablePaymentMethods: PaymentMethod[];
    selectedPaymentMethodId: string;
    setSelectedPaymentMethodId: (id: string) => void;
    paymentReceipt: File[];
    setPaymentReceipt: (files: File[]) => void;
    settings: Settings;
    estimatedShippingCost: number;
    grandTotal: number;
    handleCheckout: () => void;
    isProcessing: boolean;
}

export const StoreCheckoutModal: React.FC<StoreCheckoutModalProps> = ({
    isOpen,
    onClose,
    step,
    setStep,
    cart,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    deliveryMethod,
    setDeliveryMethod,
    shippingAddress,
    setShippingAddress,
    contactPhone,
    setContactPhone,
    selectedCity,
    setSelectedCity,
    availablePaymentMethods,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    paymentReceipt,
    setPaymentReceipt,
    settings,
    estimatedShippingCost,
    grandTotal,
    handleCheckout,
    isProcessing
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            title={step === 'cart' ? "سلة المشتريات" : step === 'details' ? "معلومات الشحن" : "الدفع والتأكيد"}
            onClose={onClose}
            size="lg"
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">

                {/* Stepper */}
                <CheckoutStepper currentStep={step} />

                {step === 'cart' && (
                    <div className="animate-fade-in">
                        <div className="space-y-4">
                            {cart.map(item => {
                                let imgUrl = undefined;
                                if (item && item.product && item.product.media && item.product.media.length > 0 && item.product.media[0]) {
                                    if (item.product.media[0].data && item.product.media[0].data.startsWith('data:')) imgUrl = item.product.media[0].data;
                                }
                                return (
                                    <div key={item.product.id} className="flex gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                                            {imgUrl ? <img src={imgUrl} alt={item.product.name} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                                        </div>
                                        <div className="flex-grow flex flex-col justify-between">
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{item.product.name}</h5>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">${item.product.price}</p>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 h-8 px-1">
                                                    <Button
                                                        onClick={() => updateCartQuantity(item.product.id, -1)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-6 h-full text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                                                    >
                                                        -
                                                    </Button>
                                                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                                    <Button
                                                        onClick={() => updateCartQuantity(item.product.id, 1)}
                                                        variant="ghost"
                                                        size="icon"
                                                        className="w-6 h-full text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                <Button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors h-8 w-8"
                                                >
                                                    <Icon name="Trash2" className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 mt-6 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-slate-600 dark:text-slate-400 font-bold">المجموع الفرعي</span>
                                <span className="font-black text-lg text-primary">${cartTotal.toLocaleString()}</span>
                            </div>
                            <Button
                                onClick={() => setStep('details')}
                                variant="primary"
                                className="w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 h-auto text-base"
                            >
                                متابعة الشراء <span className="text-xl">🚚</span>
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <div className="animate-fade-in">
                        <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="text-xl">📍</span> معلومات التوصيل
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 text-slate-600 dark:text-slate-400">طريقة الاستلام</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`border-2 rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all ${deliveryMethod === 'shipping' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="dm" value="shipping" checked={deliveryMethod === 'shipping'} onChange={() => setDeliveryMethod('shipping')} className="hidden" />
                                        <span className="text-3xl mb-2">🚚</span>
                                        <span className="text-sm font-bold">توصيل</span>
                                    </label>
                                    <label className={`border-2 rounded-xl p-3 flex flex-col items-center cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="dm" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="hidden" />
                                        <span className="text-3xl mb-2">🏪</span>
                                        <span className="text-sm font-bold">استلام من المركز</span>
                                    </label>
                                </div>
                            </div>

                            {deliveryMethod === 'shipping' && (
                                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-slate-500">المدينة</label>
                                        <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-800 outline-none focus:border-primary transition-colors">{SYRIAN_CITIES.map((c: string) => <option key={c} value={c}>{c}</option>)}</select>
                                    </div>
                                    <div>
                                        <Input
                                            label="العنوان التفصيلي"
                                            placeholder="المنطقة، الشارع، رقم البناء..."
                                            value={shippingAddress}
                                            onChange={e => setShippingAddress(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Input
                                            label="رقم الهاتف"
                                            placeholder="09..."
                                            value={contactPhone}
                                            onChange={e => setContactPhone(e.target.value)}
                                            style={{ direction: 'ltr' }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 mt-2">
                                <Button
                                    onClick={() => setStep('cart')}
                                    variant="ghost"
                                    className="px-5 py-3 rounded-xl font-bold text-sm h-auto bg-slate-100 hover:bg-slate-200 text-slate-600"
                                >
                                    عودة
                                </Button>
                                <Button
                                    onClick={() => setStep('payment')}
                                    variant="primary"
                                    className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 h-auto text-base"
                                >
                                    متابعة للدفع <span className="text-xl">💳</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'payment' && (
                    <div className="animate-fade-in">
                        <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span className="text-xl">💰</span> الدفع والتأكيد
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-2 text-slate-600 dark:text-slate-400">اختر طريقة الدفع</label>
                                {availablePaymentMethods.length === 0 && settings.storePaymentMethods.length > 0 ? (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex gap-3 items-start">
                                        <Icon name="AlertTriangle" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h5 className="font-bold text-sm text-red-800 dark:text-red-200 mb-1">تعارض في طرق الدفع</h5>
                                            <p className="text-sm text-red-600 dark:text-red-300">
                                                عذراً، يحتوي طلبك على منتجات تتطلب طرق دفع مختلفة غير متوافقة.
                                                <br />
                                                يرجى تقسيم الطلب إلى طلبين منفصلين لإتمام عملية الشراء.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {availablePaymentMethods.map((pm: PaymentMethod) => (
                                            <label key={pm.id} className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${selectedPaymentMethodId === pm.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="radio" name="pm" value={pm.id} checked={selectedPaymentMethodId === pm.id} onChange={() => setSelectedPaymentMethodId(pm.id)} className="w-4 h-4 text-primary focus:ring-primary" />
                                                    <span className="text-sm font-semibold">{pm.name}</span>
                                                </div>
                                                {pm.iconUrl && <img src={pm.iconUrl} alt="" className="w-6 h-6 object-contain opacity-80" />}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedPaymentMethodId && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                                    <Icon name="Info" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-bold text-blue-800 dark:text-blue-200 mb-1">تفاصيل الدفع:</p>
                                        <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap leading-relaxed">{settings.storePaymentMethods.find((m: PaymentMethod) => m.id === selectedPaymentMethodId)?.details}</p>
                                    </div>
                                </div>
                            )}

                            {selectedPaymentMethodId && !selectedPaymentMethodId.includes('cod') && (
                                <div>
                                    <label className="block text-xs font-bold mb-2 text-slate-600 dark:text-slate-400">إرفاق إيصال الدفع</label>
                                    <ImageUpload files={paymentReceipt} setFiles={setPaymentReceipt} maxFiles={1} />
                                </div>
                            )}

                            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl space-y-2 text-sm mt-4">
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>المجموع الفرعي</span>
                                    <span>${cartTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                    <span>الشحن ({selectedCity})</span>
                                    <span>${estimatedShippingCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                    <span>الإجمالي الكلي</span>
                                    <span className="text-primary">${grandTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 mt-2">
                                <Button
                                    onClick={() => setStep('details')}
                                    variant="ghost"
                                    className="px-5 py-3 rounded-xl font-bold text-sm h-auto"
                                >
                                    عودة
                                </Button>
                                <Button
                                    onClick={handleCheckout}
                                    disabled={isProcessing}
                                    variant="success"
                                    className="flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 disabled:shadow-none h-auto bg-green-600 hover:bg-green-700 text-base"
                                >
                                    {isProcessing ? <Icon name="Loader" className="animate-spin" /> : <span className="text-xl">✅</span>} تأكيد الطلب
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
