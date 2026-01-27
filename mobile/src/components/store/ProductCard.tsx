import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../shared';

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

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    onAddToCart?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onPress,
    onAddToCart,
}) => {
    const formatPrice = (price: number, currency: string) => {
        return `${price.toLocaleString()} ${currency}`;
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
            <Card style={styles.card} padding={0}>
                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: product.image || 'https://via.placeholder.com/200' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {!product.inStock && (
                        <View style={styles.outOfStockBadge}>
                            <Text style={styles.outOfStockText}>غير متوفر</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.category}>{product.category}</Text>
                    <Text style={styles.name} numberOfLines={2}>
                        {product.name}
                    </Text>

                    {product.rating && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#FFD700" />
                            <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
                            {product.reviewsCount && (
                                <Text style={styles.reviewsCount}>({product.reviewsCount})</Text>
                            )}
                        </View>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
                        {product.inStock && onAddToCart && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onAddToCart();
                                }}
                            >
                                <Ionicons name="cart-outline" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '48%',
        marginBottom: 16,
    },
    card: {
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 150,
        backgroundColor: '#F0F0F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    outOfStockBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    category: {
        fontSize: 11,
        color: '#999',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    name: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        minHeight: 36,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    rating: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    reviewsCount: {
        fontSize: 11,
        color: '#999',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F8FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
