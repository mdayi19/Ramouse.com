
import React from 'react';
import Icon from '../Icon';
import EmptyState from '../EmptyState';
import Pagination from '../Pagination';
import { StoreProductCard } from './StoreProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import { AdminFlashProduct, StoreCategory, StoreSubCategory, CartItem } from '../../types';
import { Button } from '../ui/Button';

interface StoreProductGridProps {
    products: AdminFlashProduct[];
    isLoading: boolean;
    cart: CartItem[];
    wishlist: string[];
    onAddToCart: (product: AdminFlashProduct, quantity?: number, silent?: boolean) => void;
    onDecreaseQty: (product: AdminFlashProduct) => void;
    onToggleWishlist: (product: AdminFlashProduct) => void;
    onProductClick: (product: AdminFlashProduct) => void;
    onBuyNow: (product: AdminFlashProduct, quantity?: number) => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    activeTab: string;
    onResetFilters: () => void;

    // Subcategory props
    storeCategories: StoreCategory[];
    selectedCategory: string;
    selectedSubCategory: string;
    setSelectedSubCategory: (id: string) => void;
}

export const StoreProductGrid: React.FC<StoreProductGridProps> = ({
    products,
    isLoading,
    cart,
    wishlist,
    onAddToCart,
    onDecreaseQty,
    onToggleWishlist,
    onProductClick,
    onBuyNow,
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    activeTab,
    onResetFilters,
    storeCategories,
    selectedCategory,
    selectedSubCategory,
    setSelectedSubCategory
}) => {
    return (
        <div className="flex-grow">
            {activeTab === 'wishlist' && (
                <div className="flex items-center gap-3 mb-8 pb-4 border-b dark:border-slate-800">
                    <div className="p-2 bg-red-500/10 rounded-xl text-3xl">
                        ❤️
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">قائمة المفضلة</h3>
                </div>
            )}

            {selectedCategory !== 'all' && (storeCategories.find(c => c.id === selectedCategory)?.subcategories?.length || 0) > 0 && (
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-6 no-scrollbar mb-4">
                    <Button
                        onClick={() => setSelectedSubCategory('')}
                        variant={selectedSubCategory === '' ? 'primary' : 'outline'}
                        className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border-2 transition-all duration-300 h-auto flex-shrink-0 ${selectedSubCategory === ''
                            ? 'bg-primary border-transparent text-white shadow-lg shadow-primary/25 scale-105'
                            : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        الكل
                    </Button>
                    {storeCategories.find(c => c.id === selectedCategory)?.subcategories?.map((sub: StoreSubCategory) => (
                        <Button
                            key={sub.id}
                            onClick={() => setSelectedSubCategory(sub.id)}
                            variant={selectedSubCategory === sub.id ? 'primary' : 'outline'}
                            className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap border-2 transition-all duration-300 h-auto flex-shrink-0 ${selectedSubCategory === sub.id
                                ? 'bg-primary border-transparent text-white shadow-lg shadow-primary/25 scale-105'
                                : 'bg-white dark:bg-darkcard text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {sub.name}
                        </Button>
                    ))}
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                    {[...Array(8)].map((_, idx) => (
                        <div key={idx} className="h-full" style={{ animationDelay: `${idx * 50}ms` }}>
                            <ProductSkeleton />
                        </div>
                    ))}
                </div>
            ) : products.length > 0 ? (
                <>
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                            <span className="text-base font-black text-slate-800 dark:text-white">
                                {products.length} منتج
                            </span>
                        </div>
                        <div className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            {currentPage} / {totalPages}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {products.map((p, idx) => (
                            <div
                                key={p.id}
                                className="animate-fade-in-up"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <StoreProductCard
                                    product={p}
                                    qtyInCart={cart.find(c => c.product.id === p.id)?.quantity || 0}
                                    inWishlist={wishlist.includes(p.id)}
                                    onAddToCart={onAddToCart}
                                    onDecreaseQty={onDecreaseQty}
                                    onToggleWishlist={onToggleWishlist}
                                    onClick={onProductClick}
                                    onBuyNow={onBuyNow}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-12">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} totalItems={totalItems} itemsPerPage={itemsPerPage} />
                    </div>
                </>
            ) : (
                <EmptyState
                    icon={<span className="text-6xl mb-4 block">😕</span>}
                    title={activeTab === 'wishlist' ? "قائمة المفضلة فارغة" : "لا توجد منتجات"}
                    message={activeTab === 'wishlist' ? "لم تقم بإضافة أي منتجات للمفضلة بعد." : "لم يتم العثور على منتجات تطابق الفلاتر الحالية."}
                    action={
                        activeTab !== 'wishlist' ? (
                            <Button
                                onClick={onResetFilters}
                                variant="primary"
                                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary/20 h-auto"
                            >
                                إعادة تعيين الفلاتر
                            </Button>
                        ) : undefined
                    }
                />
            )}
        </div>
    );
};

