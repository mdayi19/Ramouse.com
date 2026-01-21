import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Customer, AdminFlashProduct, FlashProductBuyerRequest, Notification, NotificationType, Settings, StoreCategory, Provider, Technician, TowTruck, PaymentMethod, ShippingPriceByCity } from '../../types';
import Icon from '../Icon';
import SEO from '../SEO';
import { fileToBase64 } from '../../utils/helpers';
import { SYRIAN_CITIES } from '../../constants';
import { ProductPage } from './ProductPage';
import { CustomerStoreReceipt } from './CustomerStoreReceipt';
import { RequestDetailsModal } from './RequestDetailsModal';
import { storeAPI } from '../../lib/api';
import { useDebounce } from '../../hooks/useDebounce';
import { useCart } from '../../hooks/useCart';
import { useProductFilter } from '../../hooks/useProductFilter';

// Imported Components
import { BannerCarousel } from './BannerCarousel';
import { StoreFilters } from './StoreFilters';
import { StoreProductGrid } from './StoreProductGrid';
import { StoreOrders } from './StoreOrders';
import { StoreCheckoutModal } from './StoreCheckoutModal';
import { Button } from '../ui/Button';

interface StoreViewProps {
    customer?: Customer | null;
    provider?: Provider | null;
    technician?: Technician | null;
    towTruck?: TowTruck | null;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
    onLoginRequest?: () => void;
    storeCategories?: StoreCategory[]; // Now optional - will fetch from API if not provided
}

const ITEMS_PER_PAGE = 12;

export const StoreView: React.FC<StoreViewProps> = ({ customer, provider, technician, towTruck, showToast, addNotificationForUser, settings, onLoginRequest, storeCategories: propCategories }) => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState<AdminFlashProduct[]>([]);

    // Categories from API (with fallback to props)
    const [categories, setCategories] = useState<StoreCategory[]>(propCategories || []);
    const [isLoadingCategories, setIsLoadingCategories] = useState(!propCategories?.length);

    // User Context
    const currentUser = customer || provider || technician || towTruck;
    const userType = customer ? 'customer' : provider ? 'provider' : technician ? 'technician' : towTruck ? 'tow_truck' : 'guest';

    // State managed by hooks
    const {
        cart,
        addToCart,
        decreaseCartQuantity,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal
    } = useCart({ currentUser, showToast, onLoginRequest, products });

    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'wishlist'>('products');
    const [wishlist, setWishlist] = useState<string[]>([]);

    const {
        selectedCategory,
        setSelectedCategory,
        selectedSubCategory,
        setSelectedSubCategory,
        priceRange,
        setPriceRange,
        sortBy,
        setSortBy,
        searchInput,
        setSearchInput,
        filteredProducts
    } = useProductFilter({ products, userType, activeTab, wishlist });

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details' | 'payment'>('cart');

    // General State
    const [currentPage, setCurrentPage] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);

    // Product Detail View State (New Page)
    const [viewingProduct, setViewingProduct] = useState<AdminFlashProduct | null>(null);

    // Orders View State
    const [myRequests, setMyRequests] = useState<FlashProductBuyerRequest[]>([]);
    const [viewingRequest, setViewingRequest] = useState<FlashProductBuyerRequest | null>(null);
    const [printingRequest, setPrintingRequest] = useState<FlashProductBuyerRequest | null>(null);

    // Checkout Flow State
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [shippingAddress, setShippingAddress] = useState(customer?.address || towTruck?.serviceArea || '');
    const [contactPhone, setContactPhone] = useState(customer?.id || provider?.id || technician?.id || towTruck?.id || '');
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('');
    const [paymentReceipt, setPaymentReceipt] = useState<File[]>([]);
    const [selectedCity, setSelectedCity] = useState(customer?.address?.split(' - ')[0] || SYRIAN_CITIES[0]);

    const topRef = useRef<HTMLDivElement>(null);

    // Fetch saved address
    const fetchSavedAddress = async () => {
        if (!currentUser) return;

        try {
            const response = await storeAPI.getSavedAddress();
            const savedAddr = response.data.data || response.data;

            if (savedAddr) {
                // Pre-fill with saved address data
                if (savedAddr.city) setSelectedCity(savedAddr.city);
                if (savedAddr.address) setShippingAddress(savedAddr.address);
                if (savedAddr.phone) setContactPhone(savedAddr.phone);
            }
        } catch (error) {
            console.error('Failed to fetch saved address:', error);
            // Silently fail - it's OK if there's no saved address
        }
    };

    // Fetch saved address when checkout modal opens
    useEffect(() => {
        if (isCheckoutOpen && deliveryMethod === 'shipping') {
            fetchSavedAddress();
        }
    }, [isCheckoutOpen, deliveryMethod]);

    // Auto-fill address and phone when user data changes (e.g. after login)
    useEffect(() => {
        if (currentUser) {
            const addr = customer?.address || towTruck?.serviceArea || '';
            setShippingAddress(addr);
            setContactPhone(currentUser.id);

            // Attempt to extract city from address or profile
            let cityToSelect = SYRIAN_CITIES[0];
            if (customer?.address) {
                const extracted = customer.address.split(' - ')[0].trim();
                if (SYRIAN_CITIES.includes(extracted)) cityToSelect = extracted;
            } else if (towTruck?.city && SYRIAN_CITIES.includes(towTruck.city)) {
                cityToSelect = towTruck.city;
            }
            setSelectedCity(cityToSelect);
        }
    }, [currentUser?.id, customer, technician, towTruck]);

    // Load Wishlist from LocalStorage
    useEffect(() => {
        if (currentUser) {
            const savedWishlist = localStorage.getItem(`wishlist_${currentUser.id}`);
            if (savedWishlist) setWishlist(JSON.parse(savedWishlist));

            const savedRecentlyViewed = localStorage.getItem(`recently_viewed_${currentUser.id}`);
            if (savedRecentlyViewed) setRecentlyViewed(JSON.parse(savedRecentlyViewed));
        }
    }, [currentUser?.id]);

    const toggleWishlist = (product: AdminFlashProduct) => {
        if (!currentUser) {
            if (onLoginRequest) { showToast('يرجى تسجيل الدخول لاستخدام المفضلة.', 'info'); onLoginRequest(); }
            return;
        }

        let newWishlist = [...wishlist];
        if (newWishlist.includes(product.id)) {
            newWishlist = newWishlist.filter(id => id !== product.id);
            showToast('تمت إزالة المنتج من المفضلة', 'info');
        } else {
            newWishlist.push(product.id);
            showToast('تمت إضافة المنتج للمفضلة', 'success');
        }

        setWishlist(newWishlist);
        localStorage.setItem(`wishlist_${currentUser.id}`, JSON.stringify(newWishlist));
    };

    // Fetch products from API
    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const response = await storeAPI.getProducts({ is_flash: false, _t: timestamp } as any);
            const fetchedProducts = response.data.data;
            setProducts(fetchedProducts);
            if (fetchedProducts.length > 0) {
                const maxP = Math.max(...fetchedProducts.map((p: AdminFlashProduct) => p.price), 1000);
                setPriceRange(prev => ({ ...prev, max: maxP }));
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            showToast('فشل تحميل المنتجات', 'error');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        // Fetch categories from API (always use database)
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await storeAPI.getCategories();
                const fetchedCategories = response.data.data || response.data || [];
                setCategories(fetchedCategories);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                // Fall back to props if API fails
                if (propCategories?.length) {
                    setCategories(propCategories);
                }
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();

        // Refetch on window focus to ensure fresh data
        const handleFocus = () => {
            fetchProducts();
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // Handle deep linking to product
    useEffect(() => {
        if (productId) {
            const product = products.find(p => p.id === productId);
            if (product) {
                setViewingProduct(product);
                // Track recently viewed
                if (currentUser) {
                    setRecentlyViewed(prev => {
                        const updated = [productId, ...prev.filter(id => id !== productId)].slice(0, 10);
                        localStorage.setItem(`recently_viewed_${currentUser.id}`, JSON.stringify(updated));
                        return updated;
                    });
                }
            } else if (!isLoadingProducts) {
                // Fetch specific product if not in list (e.g. direct access) and main list finished loading
                storeAPI.getProduct(productId)
                    .then(res => {
                        setViewingProduct(res.data.data);
                    })
                    .catch(err => {
                        console.error('Failed to fetch product:', err);
                        showToast('المنتج غير موجود أو تم حذفه', 'error');
                        navigate('/store');
                    });
            }
        } else {
            setViewingProduct(null);
        }
    }, [productId, products, navigate, showToast, isLoadingProducts, currentUser]);

    // Fetch user orders from API
    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;
            try {
                const response = await storeAPI.getMyOrders();
                setMyRequests(response.data.data);
            } catch (error) {
                console.error('Failed to fetch orders:', error);
                // Silently fail - orders tab will show empty state
            }
        };
        fetchOrders();
    }, [currentUser?.id]);

    const handleReviewSubmit = async (product: AdminFlashProduct, rating: number, comment: string) => {
        if (!currentUser) {
            if (onLoginRequest) onLoginRequest();
            return;
        }

        try {
            await storeAPI.addReview(product.id, rating, comment);

            // Refresh product to get updated reviews
            const response = await storeAPI.getProduct(product.id);
            const updatedProduct = response.data.data;

            setProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
            if (viewingProduct?.id === product.id) {
                setViewingProduct(updatedProduct);
            }

            showToast('تم إضافة تقييمك بنجاح!', 'success');
        } catch (error) {
            console.error('Failed to submit review:', error);
            showToast('فشل إضافة التقييم', 'error');
        }
    };

    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredProducts, currentPage]);

    const handleBuyNow = (product: AdminFlashProduct, quantity: number = 1) => {
        if (!currentUser) {
            if (onLoginRequest) { showToast('يرجى تسجيل الدخول للشراء.', 'info'); onLoginRequest(); }
            return;
        }
        // Add to cart (silently update if already there)
        addToCart(product, quantity, true);

        // Open Checkout
        setIsCheckoutOpen(true);
        setCheckoutStep('cart');
    };

    // -- Checkout Logic --
    const availablePaymentMethods = useMemo(() => {
        const activeMethods = settings.storePaymentMethods ? settings.storePaymentMethods.filter((m: PaymentMethod) => m.isActive) : [];
        if (cart.length === 0) return activeMethods;

        // Filter payment methods based on product restrictions
        return activeMethods.filter((method: PaymentMethod) => {
            return cart.every(item => {
                const allowed = item.product.allowedPaymentMethods;

                // If no restrictions set, all methods are allowed
                if (!allowed || !Array.isArray(allowed) || allowed.length === 0) {
                    return true;
                }

                // Check if method ID is in allowed list
                return allowed.includes(method.id);
            });
        });
    }, [settings.storePaymentMethods, cart]);

    useEffect(() => {
        if (isCheckoutOpen && availablePaymentMethods.length > 0 && !selectedPaymentMethodId) {
            setSelectedPaymentMethodId(availablePaymentMethods[0].id);
        }
    }, [isCheckoutOpen, availablePaymentMethods, selectedPaymentMethodId]);

    const [shippingCost, setShippingCost] = useState(0);

    useEffect(() => {
        const calculateShipping = async () => {
            if (deliveryMethod === 'pickup') {
                setShippingCost(0);
                return;
            }

            if (cart.length === 0) {
                setShippingCost(0);
                return;
            }

            try {
                const response = await storeAPI.calculateShipping({
                    items: cart.map(item => ({
                        product_id: item.product.id,
                        quantity: item.quantity
                    })),
                    city: selectedCity
                });
                setShippingCost(response.data.cost);
            } catch (error) {
                console.error('Failed to calculate shipping:', error);
                // Fallback or error handling? For now just keep 0 or previous
            }
        };

        const debounceTimer = setTimeout(() => {
            calculateShipping();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [cart, deliveryMethod, selectedCity]);

    const estimatedShippingCost = shippingCost;

    const grandTotal = cartTotal + estimatedShippingCost;


    const handleCheckout = async () => {
        if (!currentUser || cart.length === 0) return;

        if (deliveryMethod === 'shipping' && (!shippingAddress.trim() || !contactPhone.trim())) {
            showToast('يرجى تعبئة العنوان ورقم التواصل.', 'error');
            return;
        }

        const selectedMethod = availablePaymentMethods.find((m: PaymentMethod) => m.id === selectedPaymentMethodId);
        if (!selectedMethod) { showToast('يرجى اختيار طريقة دفع.', 'error'); return; }

        const isCOD = selectedMethod.id.includes('cod');
        if (!isCOD && paymentReceipt.length === 0) { showToast('يرجى إرفاق صورة إيصال التحويل.', 'error'); return; }

        setIsProcessing(true);

        try {
            // Prepare receipt as base64 if provided
            let receiptBase64: string | undefined;
            if (paymentReceipt.length > 0 && !isCOD) {
                receiptBase64 = await fileToBase64(paymentReceipt[0]);
            }

            const fullAddress = deliveryMethod === 'shipping' ? `${selectedCity} - ${shippingAddress}` : undefined;

            // Prepare order data for API
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity
                })),
                delivery_method: deliveryMethod,
                shipping_address: fullAddress,
                contact_phone: contactPhone,
                payment_method_id: selectedMethod.id,
                payment_method_name: selectedMethod.name,
                payment_receipt: receiptBase64
            };

            // Call API to create order
            const response = await storeAPI.purchase(orderData);

            showToast(`تم إرسال طلبك لـ ${cart.length} منتجات بنجاح!`, 'success');

            // Clear cart
            clearCart();

            // Refresh orders list
            const ordersResponse = await storeAPI.getMyOrders();
            setMyRequests(ordersResponse.data.data);

            // Refresh products (to update stock)
            const productsResponse = await storeAPI.getProducts({ is_flash: false });
            setProducts(productsResponse.data.data);

            setIsCheckoutOpen(false);
            setCheckoutStep('cart');
            setActiveTab('orders');
        } catch (error: any) {
            console.error('Checkout failed:', error);
            const errorMessage = error.response?.data?.message || 'حدث خطأ أثناء المعالجة.';
            showToast(errorMessage, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle order cancellation
    const handleCancelOrder = async (orderId: string) => {
        try {
            await storeAPI.cancelOrder(orderId);
            showToast('تم إلغاء الطلب بنجاح', 'success');

            // Refresh orders list
            const ordersResponse = await storeAPI.getMyOrders();
            setMyRequests(ordersResponse.data.data);

            // Refresh products to update available stock
            const productsResponse = await storeAPI.getProducts({ is_flash: false });
            setProducts(productsResponse.data.data);
        } catch (error: any) {
            console.error('Cancel order failed:', error);
            const errorMessage = error.response?.data?.message || 'فشل إلغاء الطلب';
            showToast(errorMessage, 'error');
            throw error; // Re-throw so modal can handle it
        }
    };

    // Get product thumbnail for order list
    const getProductThumbnail = useMemo(() => {
        const cache = new Map<string, string | null>();
        return (productId: string): string | null => {
            if (cache.has(productId)) {
                return cache.get(productId) || null;
            }
            const product = products.find(p => p.id === productId);
            let thumbnail: string | null = null;
            if (product?.media && product.media.length > 0 && product.media[0].data && typeof product.media[0].data === 'string' && product.media[0].data.startsWith('data:')) {
                thumbnail = product.media[0].data;
            }
            cache.set(productId, thumbnail);
            return thumbnail;
        };
    }, [products]);

    if (viewingProduct) {
        const qtyInCart = cart.find(i => i.product.id === viewingProduct.id)?.quantity || 0;
        return (
            <ProductPage
                product={viewingProduct}
                onBack={() => {
                    // Go back to the main store view (parent of product)
                    const baseUrl = location.pathname.split('/product')[0];
                    navigate(baseUrl || '/store');
                }}
                onAddToCart={(p: AdminFlashProduct, q: number) => { addToCart(p, q); }}
                onBuyNow={handleBuyNow}
                similarProducts={filteredProducts.filter(p => p.id !== viewingProduct.id && p.storeCategoryId === viewingProduct.storeCategoryId).slice(0, 4)}
                onProductClick={(p) => {
                    const baseUrl = location.pathname.split('/product')[0];
                    navigate(`${baseUrl}/product/${p.id}`);
                }}
                quantityInCart={qtyInCart}
                isWishlisted={wishlist.includes(viewingProduct.id)}
                onToggleWishlist={toggleWishlist}
                currentUser={currentUser}
                onSubmitReview={handleReviewSubmit}
                showToast={showToast}
                cartTotal={cartTotal}
                cartItemCount={cart.reduce((s, i) => s + i.quantity, 0)}
                onOpenCart={() => { setIsCheckoutOpen(true); setCheckoutStep('cart'); }}
            />
        );
    }

    return (
        <div className="flex flex-col h-full w-full animate-fade-in bg-gradient-to-br from-gray-50 to-white dark:from-slate-900 dark:to-slate-800" ref={topRef}>
            {/* SEO Metadata */}
            <SEO
                title={`متجر قطع غيار السيارات - ${products.length} منتج متاح | راموسة`}
                description="تسوق أفضل قطع غيار السيارات، زيوت، بطاريات، وإكسسوارات في سوريا. توصيل سريع لجميع المحافظات وأسعار منافسة."
                canonical="/store"
            />

            {/* Banner Carousel - Enhanced */}
            <div className="mb-4 md:mb-6">
                <BannerCarousel banners={settings.storeBanners || []} />
            </div>

            {/* Quick Category Pills - Horizontal Scroll */}
            {activeTab === 'products' && categories.length > 0 && (
                <div className="relative px-4 sm:px-6 lg:px-8 mb-6">
                    {/* Gradient fade edges */}
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-50 dark:from-slate-900 to-transparent z-10 pointer-events-none sm:hidden"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-50 dark:from-slate-900 to-transparent z-10 pointer-events-none sm:hidden"></div>

                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                        <Button
                            onClick={() => { setSelectedCategory('all'); setSelectedSubCategory(''); }}
                            variant={selectedCategory === 'all' ? 'primary' : 'outline'}
                            className={`rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border-2 flex-shrink-0 h-auto py-2.5 sm:py-3 px-4 sm:px-5 ${selectedCategory === 'all'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 border-transparent shadow-lg shadow-primary-500/30 scale-105'
                                : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors mr-2 ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                                }`}>
                                <span className="text-lg">🛍️</span>
                            </div>
                            <span>الكل</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs mr-2 ${selectedCategory === 'all' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                                }`}>
                                {products.length}
                            </span>
                        </Button>
                        {categories.map(cat => {
                            const categoryProducts = products.filter(p => p.storeCategoryId === cat.id);
                            return (
                                <Button
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubCategory(''); }}
                                    variant={selectedCategory === cat.id ? 'primary' : 'outline'}
                                    className={`rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border-2 flex-shrink-0 h-auto py-2.5 sm:py-3 px-4 sm:px-5 ${selectedCategory === cat.id
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 border-transparent shadow-lg shadow-primary-500/30 scale-105'
                                        : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors mr-2 ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                                        }`}>
                                        <Icon name={cat.icon as any} className="w-4 h-4" />
                                    </div>
                                    <span>{cat.name}</span>
                                    {categoryProducts.length > 0 && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs mr-2 ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                                            }`}>
                                            {categoryProducts.length}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mobile-Optimized Main Navigation (Desktop) */}
            {currentUser && (
                <div className="hidden sm:flex justify-center mb-6 md:mb-8 px-4">
                    <div className="bg-white dark:bg-darkcard p-1.5 rounded-2xl shadow-lg inline-flex border-2 border-slate-200 dark:border-slate-700 gap-1">
                        <Button
                            onClick={() => setActiveTab('products')}
                            variant={activeTab === 'products' ? 'primary' : 'ghost'}
                            className={`px-6 md:px-8 py-3 md:py-3.5 h-auto rounded-xl text-sm font-black transition-all duration-200 flex items-center gap-2 md:gap-2.5 ${activeTab === 'products'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 scale-105'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02]'
                                }`}
                        >
                            <span className="text-xl">🛍️</span>
                            <span>المنتجات</span>
                        </Button>
                        <Button
                            onClick={() => setActiveTab('wishlist')}
                            variant={activeTab === 'wishlist' ? 'primary' : 'ghost'}
                            className={`px-6 md:px-8 py-3 md:py-3.5 h-auto rounded-xl text-sm font-black transition-all duration-200 flex items-center gap-2 md:gap-2.5 ${activeTab === 'wishlist'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 scale-105'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02]'
                                }`}
                        >
                            <span className="text-xl">❤️</span>
                            <span>المفضلة</span>
                            <span className={`px-2 md:px-2.5 py-0.5 rounded-full text-xs font-bold mr-1 ${activeTab === 'wishlist' ? 'bg-white/30' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                }`}>
                                {wishlist.length}
                            </span>
                        </Button>
                        <Button
                            onClick={() => setActiveTab('orders')}
                            variant={activeTab === 'orders' ? 'primary' : 'ghost'}
                            className={`px-6 md:px-8 py-3 md:py-3.5 h-auto rounded-xl text-sm font-black transition-all duration-200 flex items-center gap-2 md:gap-2.5 ${activeTab === 'orders'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 scale-105'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-[1.02]'
                                }`}
                        >
                            <span className="text-xl">📦</span>
                            <span>طلباتي</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Enhanced Mobile Navigation */}
            {currentUser && (
                <div className="sm:hidden px-4 mb-6">
                    <div className="flex w-full bg-white dark:bg-darkcard p-2 rounded-2xl shadow-lg border-2 border-slate-200 dark:border-slate-700 gap-2">
                        <Button
                            onClick={() => setActiveTab('products')}
                            variant={activeTab === 'products' ? 'primary' : 'ghost'}
                            className={`flex-1 py-3.5 px-2 h-auto rounded-xl text-xs font-black text-center transition-all duration-200 ${activeTab === 'products'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-md scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-xl">🛍️</span>
                                <span>المنتجات</span>
                            </div>
                        </Button>
                        <Button
                            onClick={() => setActiveTab('wishlist')}
                            variant={activeTab === 'wishlist' ? 'primary' : 'ghost'}
                            className={`flex-1 py-3.5 px-2 h-auto rounded-xl text-xs font-black text-center transition-all duration-200 ${activeTab === 'wishlist'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-md scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="relative">
                                    <span className="text-xl">❤️</span>
                                    {wishlist.length > 0 && (
                                        <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                                            {wishlist.length}
                                        </span>
                                    )}
                                </div>
                                <span>المفضلة</span>
                            </div>
                        </Button>
                        <Button
                            onClick={() => setActiveTab('orders')}
                            variant={activeTab === 'orders' ? 'primary' : 'ghost'}
                            className={`flex-1 py-3.5 px-2 h-auto rounded-xl text-xs font-black text-center transition-all duration-200 ${activeTab === 'orders'
                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-md scale-105'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-xl">📦</span>
                                <span>طلباتي</span>
                            </div>
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            {(activeTab === 'products' || activeTab === 'wishlist') && (
                <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-8 lg:px-12 pb-32 max-w-[1920px] mx-auto w-full relative">
                    <StoreFilters
                        searchTerm={searchInput}
                        setSearchTerm={setSearchInput}
                        sortBy={sortBy}
                        setSortBy={setSortBy as any}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        storeCategories={categories}
                        activeTab={activeTab}
                    />

                    <StoreProductGrid
                        products={paginatedProducts}
                        isLoading={isLoadingProducts}
                        cart={cart}
                        wishlist={wishlist}
                        onAddToCart={addToCart}
                        onDecreaseQty={decreaseCartQuantity}
                        onToggleWishlist={toggleWishlist}
                        onProductClick={(p) => {
                            const baseUrl = location.pathname.split('/product')[0];
                            navigate(`${baseUrl}/product/${p.id}`);
                        }}
                        onBuyNow={handleBuyNow}
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
                        onPageChange={setCurrentPage}
                        totalItems={filteredProducts.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        activeTab={activeTab}
                        onResetFilters={() => {
                            setSelectedCategory('all');
                            setSearchInput('');
                        }}
                        storeCategories={categories}
                        selectedCategory={selectedCategory}
                        selectedSubCategory={selectedSubCategory}
                        setSelectedSubCategory={setSelectedSubCategory}
                    />
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="px-4 sm:px-6 lg:px-8 pb-24 max-w-[1920px] mx-auto w-full">
                    <StoreOrders
                        products={products}
                        onViewRequest={setViewingRequest}
                        onPrintRequest={setPrintingRequest}
                        getProductThumbnail={getProductThumbnail}
                    />
                </div>
            )}

            {/* Enhanced Mobile-Optimized Floating Cart Button */}
            {cart.length > 0 && (
                <Button
                    onClick={() => { setIsCheckoutOpen(true); setCheckoutStep('cart'); }}
                    className="fixed bottom-24 left-6 right-6 md:left-auto md:right-10 md:bottom-10 md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-5 rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-between md:justify-start gap-4 z-[60] h-auto border-4 border-white dark:border-slate-800 touch-manipulation group"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 text-2xl">
                                🛒
                            </div>
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                                {cart.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">سلة التسوق</span>
                            <span className="font-black text-xl">${cartTotal.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 font-black text-sm bg-primary/10 px-4 py-2 rounded-xl text-primary">
                        عرض السلة
                        <Icon name="ArrowLeft" className="w-4 h-4" />
                    </div>
                </Button>
            )}

            {/* Checkout Modal */}
            <StoreCheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                step={checkoutStep}
                setStep={setCheckoutStep}
                cart={cart}
                cartTotal={cartTotal}
                updateCartQuantity={updateCartQuantity}
                removeFromCart={removeFromCart}
                deliveryMethod={deliveryMethod}
                setDeliveryMethod={setDeliveryMethod}
                shippingAddress={shippingAddress}
                setShippingAddress={setShippingAddress}
                contactPhone={contactPhone}
                setContactPhone={setContactPhone}
                selectedCity={selectedCity}
                setSelectedCity={setSelectedCity}
                availablePaymentMethods={availablePaymentMethods}
                selectedPaymentMethodId={selectedPaymentMethodId}
                setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                paymentReceipt={paymentReceipt}
                setPaymentReceipt={setPaymentReceipt}
                settings={settings}
                estimatedShippingCost={estimatedShippingCost}
                grandTotal={grandTotal}
                handleCheckout={handleCheckout}
                isProcessing={isProcessing}
            />

            {viewingRequest && (
                <RequestDetailsModal
                    request={viewingRequest}
                    onClose={() => setViewingRequest(null)}
                    onPrint={() => setPrintingRequest(viewingRequest)}
                    canPrint={['preparing', 'shipped', 'delivered', 'approved'].includes(viewingRequest.status)}
                    onCancel={handleCancelOrder}
                />
            )}

            {printingRequest && (
                <CustomerStoreReceipt
                    request={printingRequest}
                    productName="مجموعة منتجات"
                    settings={settings}
                    onDone={() => setPrintingRequest(null)}
                />
            )}
        </div>
    );
};