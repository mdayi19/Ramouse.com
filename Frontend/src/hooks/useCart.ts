import { useState, useEffect, useMemo } from 'react';
import { AdminFlashProduct, CartItem } from '../types';

interface UseCartProps {
    currentUser: any;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onLoginRequest?: () => void;
    products: AdminFlashProduct[];
}

export const useCart = ({ currentUser, showToast, onLoginRequest, products }: UseCartProps) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // Load Cart from LocalStorage
    useEffect(() => {
        if (currentUser) {
            const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                // Filter out deleted products
                const validCart = parsedCart.filter((item: CartItem) => {
                    const productExists = products.find(p => p.id === item.product.id);
                    return productExists !== undefined;
                });

                if (validCart.length < parsedCart.length) {
                    const removedCount = parsedCart.length - validCart.length;
                    showToast(`تم إزالة ${removedCount} منتج غير متوفر من السلة`, 'info');
                }
                setCart(validCart);
            }
        }
    }, [currentUser?.id, products]);

    // Save Cart to LocalStorage
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
        }
    }, [cart, currentUser?.id]);

    const addToCart = (product: AdminFlashProduct, quantity: number = 1, silent: boolean = false) => {
        if (!currentUser) {
            if (onLoginRequest) { showToast('يرجى تسجيل الدخول لإضافة منتجات للسلة.', 'info'); onLoginRequest(); }
            return;
        }

        // Optimistic update with haptic feedback (if supported)
        if ('vibrate' in navigator && !silent) {
            navigator.vibrate(50);
        }

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty > product.purchaseLimitPerBuyer) {
                    if (!silent) showToast('لقد وصلت للحد الأقصى المسموح به.', 'error');
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
            }
            if (!silent) showToast('تمت إضافة المنتج للسلة.', 'success');
            return [...prev, { product, quantity: quantity }];
        });
    };

    const decreaseCartQuantity = (product: AdminFlashProduct) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (!existing) return prev;
            if (existing.quantity <= 1) return prev.filter(item => item.product.id !== product.id);
            return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity - 1 } : item);
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateCartQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, Math.min(item.product.purchaseLimitPerBuyer, item.quantity + delta));
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        if (currentUser) {
            localStorage.removeItem(`cart_${currentUser.id}`);
        }
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cart]);

    return {
        cart,
        addToCart,
        decreaseCartQuantity,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal
    };
};
