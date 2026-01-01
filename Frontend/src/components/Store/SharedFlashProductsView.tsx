import React, { useState, useMemo, useEffect } from 'react';
import { AdminFlashProduct, FlashProductBuyerRequest, FlashProductPurchase, Notification, NotificationType, Settings, GalleryItem, FlashProductRequestStatus } from '../../types';
import { ViewHeader } from '../DashboardParts/Shared';
import EmptyState from '../EmptyState';
import Modal from '../Modal';
import Icon from '../Icon';
import { timeUntil, fileToBase64 } from '../../utils/helpers';
import ImageUpload from '../ImageUpload';
import { SYRIAN_CITIES } from '../../constants';
import CountdownTimer from '../CountdownTimer';
import { storeAPI } from '../../lib/api';
import MediaViewer from '../MediaViewer';
import { ProductSkeleton } from './ProductSkeleton';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface SharedFlashProductsViewProps {
    userType: 'customer' | 'provider' | 'technician' | 'tow_truck';
    userId: string;
    userName?: string;
    userCity?: string;
    userAddress?: string;
    userPhone: string;
    userSpecialty?: string; // For technicians
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
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

const getStatusVariant = (status: FlashProductRequestStatus): "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning" | "purple" | "orange" | "sky" | "teal" | "indigo" => {
    switch (status) {
        case 'pending': return 'warning';
        case 'payment_verification': return 'warning';
        case 'preparing': return 'default';
        case 'shipped': return 'default';
        case 'delivered': case 'approved': return 'success';
        case 'rejected': return 'destructive';
        case 'cancelled': return 'secondary';
        default: return 'secondary';
    }
};

export const SharedFlashProductsView: React.FC<SharedFlashProductsViewProps> = ({
    userType,
    userId,
    userName,
    userCity,
    userAddress,
    userPhone,
    userSpecialty,
    showToast,
    addNotificationForUser,
    settings
}) => {
    const [adminProducts, setAdminProducts] = useState<AdminFlashProduct[]>([]);
    const [myRequests, setMyRequests] = useState<FlashProductBuyerRequest[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<AdminFlashProduct | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Checkout State
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [shippingAddress, setShippingAddress] = useState(userAddress || '');
    const [contactPhone, setContactPhone] = useState(userPhone);
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
    const [paymentReceipt, setPaymentReceipt] = useState<File[]>([]);
    const [selectedCity, setSelectedCity] = useState(userCity || SYRIAN_CITIES[0]);

    // Media Viewer State
    const [viewingMedia, setViewingMedia] = useState<{ product: AdminFlashProduct; index: number } | null>(null);

    const fetchData = async (forceRefresh = false) => {
        const loadingState = forceRefresh ? setIsRefreshing : setIsLoading;
        loadingState(true);

        try {
            // Fetch flash products
            const productsResponse = await storeAPI.getProducts({
                is_flash: true
            });
            const productsData = productsResponse.data.data || productsResponse.data;
            setAdminProducts(Array.isArray(productsData) ? productsData : []);

            // Fetch my orders
            const ordersResponse = await storeAPI.getMyOrders();
            const ordersData = ordersResponse.data.data || ordersResponse.data;
            setMyRequests(Array.isArray(ordersData) ? ordersData : []);

            if (forceRefresh) {
                showToast('تم تحديث العروض بنجاح', 'success');
            }
        } catch (error) {
            console.error('Failed to fetch flash products:', error);
            showToast('فشل تحميل العروض الفورية', 'error');
        } finally {
            loadingState(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    const handleManualRefresh = () => {
        fetchData(true);
    };

    const availableProducts = useMemo(() => {
        return adminProducts.filter(p => {
            // Check expiration
            if (new Date(p.expiresAt) <= new Date()) return false;
            if (p.isFlash === false) return false;

            // Check target audience
            if (p.targetAudience === 'all') return true;

            if (userType === 'customer') {
                return p.targetAudience === 'customers';
            } else if (userType === 'provider') {
                return p.targetAudience === 'providers';
            } else if (userType === 'tow_truck') {
                return p.targetAudience === 'tow_trucks';
            } else if (userType === 'technician') {
                return p.targetAudience === 'technicians' && (!p.specialty || p.specialty === userSpecialty);
            }

            return false;
        });
    }, [adminProducts, userType, userSpecialty]);

    const handleRequestBuy = (product: AdminFlashProduct) => {
        setQuantity(1);
        setSelectedProduct(product);
        // Reset checkout fields
        setShippingAddress(userAddress || '');
        setContactPhone(userPhone);
        setPaymentReceipt([]);
        // Set default payment method
        const activeMethods = settings.storePaymentMethods ? settings.storePaymentMethods.filter(m => m.isActive) : [];
        if (activeMethods.length > 0) {
            setSelectedPaymentMethodId(activeMethods[0].id);
        }
    };

    const handleCancelRequest = async (request: FlashProductBuyerRequest) => {
        if (!window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;

        try {
            await storeAPI.cancelOrder(request.id);
            // Refresh orders
            const ordersResponse = await storeAPI.getMyOrders();
            const ordersData = ordersResponse.data.data || ordersResponse.data;
            setMyRequests(Array.isArray(ordersData) ? ordersData : []);
            showToast('تم إلغاء الطلب بنجاح.', 'success');
        } catch (error) {
            console.error('Failed to cancel request:', error);
            showToast('فشل إلغاء الطلب.', 'error');
        }
    };

    const availablePaymentMethods = useMemo(() => {
        if (!selectedProduct) return [];
        const methods = settings.storePaymentMethods || [];
        return methods.filter(m =>
            m.isActive &&
            (!selectedProduct.allowedPaymentMethods ||
                selectedProduct.allowedPaymentMethods.length === 0 ||
                selectedProduct.allowedPaymentMethods.includes(m.id))
        );
    }, [settings.storePaymentMethods, selectedProduct]);

    useEffect(() => {
        if (selectedProduct && availablePaymentMethods.length > 0) {
            if (!selectedPaymentMethodId || !availablePaymentMethods.find(m => m.id === selectedPaymentMethodId)) {
                setSelectedPaymentMethodId(availablePaymentMethods[0].id);
            }
        } else {
            setSelectedPaymentMethodId('');
        }
    }, [selectedProduct, availablePaymentMethods]);

    const shippingCost = useMemo(() => {
        if (deliveryMethod === 'pickup' || !selectedProduct) return 0;

        if (selectedProduct.staticShippingCost !== undefined && selectedProduct.staticShippingCost !== null) {
            return Number(selectedProduct.staticShippingCost);
        }

        const cityPrices = settings.limitSettings.shippingPrices?.find(p => p.city === selectedCity);
        const fallbackPrices = settings.limitSettings.shippingPrices?.find(p => p.city === 'أخرى');
        const pricesToUse = cityPrices || fallbackPrices;

        if (!pricesToUse) return 0;

        const size = selectedProduct.shippingSize || 'm';
        return Number(pricesToUse[size]) || 0;
    }, [deliveryMethod, selectedProduct, selectedCity, settings.limitSettings.shippingPrices]);

    const totalPrice = selectedProduct ? (Number(selectedProduct.price) * quantity) + Number(shippingCost) : 0;

    const handleConfirmRequest = async () => {
        if (!selectedProduct) return;

        if (deliveryMethod === 'shipping' && (!shippingAddress.trim() || !contactPhone.trim())) {
            showToast('يرجى تعبئة العنوان ورقم التواصل.', 'error');
            return;
        }

        const selectedMethod = availablePaymentMethods.find(m => m.id === selectedPaymentMethodId);
        if (!selectedMethod) {
            showToast('يرجى اختيار طريقة دفع.', 'error');
            return;
        }

        const isCOD = selectedMethod.id.includes('cod');
        if (!isCOD && paymentReceipt.length === 0) {
            showToast('يرجى إرفاق صورة إيصال التحويل.', 'error');
            return;
        }

        setIsProcessing(true);

        let receiptBase64: string | undefined;
        if (paymentReceipt.length > 0) {
            receiptBase64 = await fileToBase64(paymentReceipt[0]);
        }

        const fullAddress = deliveryMethod === 'shipping' ? `${selectedCity} - ${shippingAddress}` : undefined;

        try {
            await storeAPI.purchase({
                items: [{ product_id: selectedProduct.id, quantity }],
                delivery_method: deliveryMethod,
                shipping_address: fullAddress,
                contact_phone: contactPhone,
                payment_method_id: selectedMethod.id,
                payment_method_name: selectedMethod.name,
                payment_receipt: receiptBase64
            });

            // Refresh data
            await fetchData();

            showToast('تم إرسال طلب الشراء. سيتم مراجعته من قبل الإدارة.', 'success');
            setSelectedProduct(null);
        } catch (error: any) {
            console.error("Failed to submit purchase:", error);
            const errorMsg = error.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب.';
            showToast(errorMsg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const ProductCard: React.FC<{ product: AdminFlashProduct }> = ({ product }) => {
        const imageUrl = product?.media?.[0]?.data;
        const hasMedia = product?.media && product.media.length > 0;
        const firstMediaType = product?.media?.[0]?.type;

        // Calculate Stock and Limits
        const remainingStock = product.totalStock;
        const isSoldOut = remainingStock <= 0;

        // Calculate how many this user has already purchased
        const userPurchasedQuantity = myRequests
            .filter(r => r.productId === product.id && r.status !== 'cancelled' && r.status !== 'rejected')
            .reduce((sum, r) => sum + r.quantity, 0);

        // Effective limit is the minimum of remaining stock and remaining purchase limit
        const effectiveLimit = Math.min(
            remainingStock,
            Math.max(0, product.purchaseLimitPerBuyer - userPurchasedQuantity)
        );
        const limitReached = effectiveLimit <= 0;

        return (
            <Card className="rounded-xl overflow-hidden flex flex-col h-full group hover:shadow-lg transition-all duration-300 p-0 border-0">
                <div
                    className="h-48 bg-slate-100 dark:bg-slate-800 relative overflow-hidden cursor-pointer"
                    onClick={() => hasMedia && setViewingMedia({ product, index: 0 })}
                >
                    {imageUrl ? (
                        <>
                            {firstMediaType === 'video' ? (
                                <div className="relative w-full h-full">
                                    <video src={imageUrl} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                        <div className="p-3 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all shadow-lg">
                                            <Icon name="Play" className="w-6 h-6 text-primary" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            )}
                            {hasMedia && product.media.length > 1 && (
                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                                    <Icon name="Images" className="w-3 h-3 inline ml-1" />
                                    {product.media.length}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400"><Icon name="Image" className="w-12 h-12" /></div>
                    )}

                    <CountdownTimer expiresAt={product.expiresAt} className="absolute top-2 right-2" />
                    <div className="absolute top-2 right-2 flex flex-col items-end gap-1 mt-8">
                        {isSoldOut && <Badge variant="destructive" className="shadow-sm">نفذت الكمية</Badge>}
                        {!isSoldOut && remainingStock <= 5 && <Badge variant="warning" className="shadow-sm animate-pulse">بقي القليل!</Badge>}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <div className="flex justify-between items-end text-white">
                            <div>
                                <p className="text-xs opacity-90">المتوفر</p>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">{remainingStock}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-grow flex flex-col">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1 text-base line-clamp-1">{product.name}</h4>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-grow">{product.description}</p>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>الحد المسموح لك:</span>
                            <span className={limitReached ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                                {effectiveLimit > 0 ? `يمكنك طلب ${effectiveLimit} قطع` : 'وصلت للحد الأقصى'}
                            </span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="font-extrabold text-xl text-primary dark:text-primary-400">${Number(product.price).toLocaleString()}</span>
                            <Button
                                onClick={() => handleRequestBuy(product)}
                                disabled={isSoldOut || limitReached}
                                className="px-4 py-2"
                                leftIcon={<Icon name="ShoppingCart" className="w-4 h-4" />}
                            >
                                {isSoldOut ? 'نفذت' : limitReached ? 'اكتمل' : 'شراء'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    const myFlashRequests = useMemo(() => {
        return myRequests.filter(r => {
            const product = adminProducts.find(p => p.id === r.productId);
            // Include if product exists (even if not flash anymore, to show history) or if we can't find it (deleted)
            return true;
        });
    }, [myRequests, adminProducts]);

    return (
        <div className="p-4 sm:p-6 w-full">
            <div className="flex items-center justify-between mb-6">
                <ViewHeader title="العروض الفورية" subtitle="عروض خاصة ومحدودة الوقت." />
                <Button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    variant="outline"
                    className="gap-2"
                >
                    <Icon
                        name="RefreshCw"
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span className="font-medium">
                        {isRefreshing ? 'جاري التحديث...' : 'تحديث'}
                    </span>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {[...Array(8)].map((_, idx) => (
                        <ProductSkeleton key={idx} />
                    ))}
                </div>
            ) : availableProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {availableProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<Icon name="ZapOff" className="w-12 h-12 text-slate-400 mb-4" />}
                    title="لا توجد عروض حالياً"
                    message="تحقق مرة أخرى لاحقاً للحصول على عروض جديدة."
                />
            )}

            <div className="mt-8">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-200">طلباتي السابقة</h3>
                {myFlashRequests.length > 0 ? (
                    <Card className="rounded-lg shadow overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase">
                                    <tr>
                                        <th className="p-3">المنتج</th>
                                        <th className="p-3">الكمية</th>
                                        <th className="p-3">الإجمالي</th>
                                        <th className="p-3">التاريخ</th>
                                        <th className="p-3">الحالة</th>
                                        {userType !== 'customer' && <th className="p-3">إجراءات</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {myFlashRequests.map(req => {
                                        const product = adminProducts.find(p => p.id === req.productId);
                                        return (
                                            <tr key={req.id}>
                                                <td className="p-3 font-medium">{product?.name || 'منتج محذوف'}</td>
                                                <td className="p-3 font-mono">{req.quantity}</td>
                                                <td className="p-3 font-mono text-green-600 font-bold">${req.totalPrice?.toLocaleString() || '-'}</td>
                                                <td className="p-3 text-slate-500">{new Date(req.requestDate).toLocaleDateString('ar-SY')}</td>
                                                <td className="p-3">
                                                    <Badge variant={getStatusVariant(req.status)}>
                                                        {getStatusLabel(req.status)}
                                                    </Badge>
                                                    {req.adminNotes && <p className="text-xs text-red-500 mt-1">{req.adminNotes}</p>}
                                                </td>
                                                {userType !== 'customer' && (
                                                    <td className="p-3">
                                                        {(req.status === 'pending' || req.status === 'payment_verification') && (
                                                            <Button onClick={() => handleCancelRequest(req)} variant="link" size="sm" className="text-red-500 hover:text-red-700 font-bold p-0 h-auto">إلغاء</Button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ) : (
                    <p className="text-sm text-slate-500">لم تقم بأي طلبات شراء بعد.</p>
                )}
            </div>

            {selectedProduct && (
                <Modal title="طلب شراء عرض فوري" onClose={() => setSelectedProduct(null)}>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="flex items-start gap-4">
                            <div>
                                <h4 className="font-bold">{selectedProduct.name}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{selectedProduct.description}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-primary font-bold">${Number(selectedProduct.price).toLocaleString()}</p>
                                    <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                        المتوفر: {selectedProduct.totalStock}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Card className="flex justify-between items-center p-4">
                            <span className="font-bold text-sm">الكمية المطلوبة</span>
                            <div className="flex items-center gap-3">
                                <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="secondary" className="w-8 h-8 p-0 font-bold text-lg">-</Button>
                                <span className="font-bold w-8 text-center text-lg">{quantity}</span>
                                <Button onClick={() => setQuantity(Math.min(selectedProduct.totalStock, selectedProduct.purchaseLimitPerBuyer, quantity + 1))} variant="secondary" className="w-8 h-8 p-0 font-bold text-lg">+</Button>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">طريقة الاستلام</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'shipping' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <input type="radio" name="delivery" value="shipping" checked={deliveryMethod === 'shipping'} onChange={() => setDeliveryMethod('shipping')} className="hidden" />
                                    <Icon name="Truck" className="w-5 h-5" />
                                    <span className="font-semibold text-sm">توصيل</span>
                                </label>
                                <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                    <input type="radio" name="delivery" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="hidden" />
                                    <Icon name="Store" className="w-5 h-5" />
                                    <span className="font-semibold text-sm">استلام من المركز</span>
                                </label>
                            </div>
                        </Card>

                        {deliveryMethod === 'shipping' && (
                            <Card className="space-y-4 p-4">
                                <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300">عنوان التوصيل</h5>
                                <div>
                                    <label className="block text-xs font-medium mb-1 text-slate-500">المدينة</label>
                                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">{SYRIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                </div>
                                <div>
                                    <Textarea
                                        label="تفاصيل العنوان"
                                        value={shippingAddress}
                                        onChange={e => setShippingAddress(e.target.value)}
                                        placeholder="المنطقة - الشارع..."
                                        className="min-h-[60px]"
                                    />
                                </div>
                                <div>
                                    <Input
                                        label="رقم للتواصل"
                                        type="tel"
                                        value={contactPhone}
                                        onChange={e => setContactPhone(e.target.value)}
                                        className="text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </Card>
                        )}

                        <Card className="p-4">
                            <label className="block text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">طريقة الدفع</label>
                            <div className="space-y-2">
                                {availablePaymentMethods.length > 0 ? (
                                    availablePaymentMethods.map(method => (
                                        <label key={method.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${selectedPaymentMethodId === method.id ? 'border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            <input type="radio" name="payment" value={method.id} checked={selectedPaymentMethodId === method.id} onChange={() => setSelectedPaymentMethodId(method.id)} className="mt-1 text-primary focus:ring-primary" />
                                            <div>
                                                <div className="font-semibold text-sm">{method.name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{method.details}</div>
                                            </div>
                                        </label>
                                    ))
                                ) : <p className="text-sm text-red-500">لا توجد طرق دفع متاحة.</p>}
                            </div>
                        </Card>

                        {selectedPaymentMethodId !== '' && !selectedPaymentMethodId.includes('cod') && (
                            <Card className="p-4">
                                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">إرفاق إيصال الدفع</label>
                                <ImageUpload files={paymentReceipt} setFiles={setPaymentReceipt} maxFiles={1} />
                            </Card>
                        )}

                        {/* Price Breakdown */}
                        <div className="bg-gradient-to-br from-primary/5 via-slate-50 to-slate-100 dark:from-primary/10 dark:via-slate-800/50 dark:to-slate-900/50 p-5 rounded-xl border-2 border-primary/20 dark:border-primary/30 shadow-lg">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon name="Receipt" className="w-5 h-5 text-primary" />
                                <h5 className="font-bold text-base text-slate-800 dark:text-slate-200">ملخص الطلب</h5>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Icon name="Package" className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">سعر المنتج</span>
                                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-medium">× {quantity}</span>
                                    </div>
                                    <span className="font-bold text-base text-slate-800 dark:text-white">${(Number(selectedProduct.price) * quantity).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Icon name="Truck" className="w-4 h-4 text-slate-500" />
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">تكلفة الشحن</span>
                                            {deliveryMethod === 'shipping' && selectedProduct && (
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {selectedProduct.staticShippingCost !== undefined && selectedProduct.staticShippingCost !== null
                                                        ? '(سعر ثابت)'
                                                        : `(حسب ${selectedCity})`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-bold text-base text-slate-800 dark:text-white">
                                        {shippingCost > 0 ? `$${shippingCost.toLocaleString()}` : (
                                            <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <Icon name="CheckCircle" className="w-4 h-4" />
                                                مجاناً
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="h-0.5 bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent my-3"></div>
                                <div className="flex justify-between items-center py-3 px-4 bg-primary/10 dark:bg-primary/20 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Icon name="DollarSign" className="w-5 h-5 text-primary" />
                                        <span className="font-black text-lg text-slate-800 dark:text-white">الإجمالي الكلي</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-3xl text-primary">${totalPrice.toLocaleString()}</div>
                                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">شامل جميع التكاليف</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button onClick={() => setSelectedProduct(null)} variant="outline">إلغاء</Button>
                            <Button onClick={handleConfirmRequest} disabled={isProcessing || availablePaymentMethods.length === 0} isLoading={isProcessing}>
                                تأكيد الطلب
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Media Viewer */}
            {viewingMedia && viewingMedia.product.media && (
                <MediaViewer
                    items={viewingMedia.product.media}
                    activeIndex={viewingMedia.index}
                    onClose={() => setViewingMedia(null)}
                    onIndexChange={(index) => setViewingMedia({ ...viewingMedia, index })}
                />
            )}
        </div>
    );
};
