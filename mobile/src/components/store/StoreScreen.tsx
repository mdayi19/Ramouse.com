import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Text } from 'react-native';
import { Header } from '../layout';
import { SearchBar, EmptyState, LoadingState, ErrorState } from '../shared';
import { ProductCard } from './ProductCard';
import { Ionicons } from '@expo/vector-icons';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    image: string;
    category: string;
    inStock: boolean;
    rating?: number;
    reviewsCount?: number;
}

interface StoreScreenProps {
    onBack?: () => void;
    onProductPress?: (productId: string) => void;
}

export const StoreScreen: React.FC<StoreScreenProps> = ({ onBack, onProductPress }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cartCount, setCartCount] = useState(0);

    const fetchProducts = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // TODO: Replace with actual API call
            // const response = await storeService.getProducts();
            // setProducts(response.data);

            // Mock data
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setProducts([
                {
                    id: '1',
                    name: 'فلتر زيت محرك',
                    description: 'فلتر زيت أصلي عالي الجودة',
                    price: 45,
                    currency: 'ر.س',
                    image: 'https://via.placeholder.com/200',
                    category: 'فلاتر',
                    inStock: true,
                    rating: 4.5,
                    reviewsCount: 23,
                },
                {
                    id: '2',
                    name: 'بطارية سيارة 70 أمبير',
                    description: 'بطارية قوية ومتينة',
                    price: 350,
                    currency: 'ر.س',
                    image: 'https://via.placeholder.com/200',
                    category: 'بطاريات',
                    inStock: true,
                    rating: 4.8,
                    reviewsCount: 45,
                },
                {
                    id: '3',
                    name: 'إطار سيارة 205/55 R16',
                    description: 'إطار عالي الجودة',
                    price: 280,
                    currency: 'ر.س',
                    image: 'https://via.placeholder.com/200',
                    category: 'إطارات',
                    inStock: false,
                },
                {
                    id: '4',
                    name: 'مساحات زجاج أمامي',
                    description: 'مساحات عالية الأداء',
                    price: 65,
                    currency: 'ر.س',
                    image: 'https://via.placeholder.com/200',
                    category: 'إكسسوارات',
                    inStock: true,
                    rating: 4.2,
                    reviewsCount: 12,
                },
            ]);
        } catch (err) {
            setError('فشل تحميل المنتجات. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleAddToCart = (productId: string) => {
        setCartCount((prev) => prev + 1);
        // TODO: Add to cart logic
        console.log('Added to cart:', productId);
    };

    const filteredProducts = products.filter(
        (product) =>
            product.name.includes(searchQuery) ||
            product.description.includes(searchQuery) ||
            product.category.includes(searchQuery)
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="المتجر" showBack onBack={onBack} />
                <LoadingState message="جاري تحميل المنتجات..." />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Header title="المتجر" showBack onBack={onBack} />
                <ErrorState message={error} onRetry={() => fetchProducts()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="المتجر" showBack onBack={onBack} />

            {/* Search and Cart */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <SearchBar
                        placeholder="ابحث عن منتج..."
                        value={searchQuery}
                        onSearch={setSearchQuery}
                    />
                </View>
                <TouchableOpacity style={styles.cartButton}>
                    <Ionicons name="cart-outline" size={24} color="#007AFF" />
                    {cartCount > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cartCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Products Grid */}
            <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => (
                    <ProductCard
                        product={item}
                        onPress={() => onProductPress?.(item.id)}
                        onAddToCart={() => handleAddToCart(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchProducts(true)} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="storefront-outline"
                        title="لا توجد منتجات"
                        message={searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد منتجات متاحة حالياً'}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
    },
    cartButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
});
