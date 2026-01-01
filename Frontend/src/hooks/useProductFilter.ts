import { useState, useMemo } from 'react';
import { AdminFlashProduct, StoreCategory } from '../types';
import { useDebounce } from './useDebounce';

interface UseProductFilterProps {
    products: AdminFlashProduct[];
    userType: string;
    activeTab: 'products' | 'orders' | 'wishlist';
    wishlist: string[];
}

export const useProductFilter = ({ products, userType, activeTab, wishlist }: UseProductFilterProps) => {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [priceRange, setPriceRange] = useState<{ min: number, max: number }>({ min: 0, max: 1000 });
    const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'newest' | 'rating'>('default');
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearchTerm = useDebounce(searchInput, 300);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (activeTab === 'wishlist' && !wishlist.includes(p.id)) return false;

            const isForUser = p.targetAudience === 'all' ||
                (userType === 'customer' && p.targetAudience === 'customers') ||
                (userType === 'provider' && p.targetAudience === 'providers') ||
                (userType === 'technician' && p.targetAudience === 'technicians') ||
                (userType === 'tow_truck' && p.targetAudience === 'tow_trucks');

            const isActive = new Date(p.expiresAt) > new Date();
            const isStoreProduct = p.isFlash === false;

            if (!isForUser || !isActive || !isStoreProduct) return false;
            if (debouncedSearchTerm && !p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) && !p.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) return false;
            if (selectedCategory !== 'all' && p.storeCategoryId !== selectedCategory) return false;
            if (selectedSubCategory && p.storeSubcategoryId !== selectedSubCategory) return false;
            if (p.price < priceRange.min || p.price > priceRange.max) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'price_asc') return a.price - b.price;
            if (sortBy === 'price_desc') return b.price - a.price;
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
            return 0;
        });
    }, [products, selectedCategory, selectedSubCategory, debouncedSearchTerm, priceRange, userType, activeTab, wishlist, sortBy]);

    return {
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
    };
};
