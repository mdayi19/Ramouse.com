import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Text,
    Image,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Badge, Button, LoadingState, ErrorState } from '../shared';
import { ReviewCard } from './ReviewCard';

interface ProductData {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    category: string;
    inStock: boolean;
    rating: number;
    reviewCount: number;
    providerName: string;
}

interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

export const ProductDetailScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<ProductData | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProductDetails();
    }, [productId]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setProduct({
                id: productId,
                name: 'محرك كامري 2020',
                price: 5000000,
                description: 'محرك بحالة ممتازة، تم فحصه بالكامل، ضمان 6 أشهر',
                images: [
                    'https://via.placeholder.com/400x300/007AFF/FFFFFF?text=Product+1',
                    'https://via.placeholder.com/400x300/34C759/FFFFFF?text=Product+2',
                ],
                category: 'محركات',
                inStock: true,
                rating: 4.5,
                reviewCount: 12,
                providerName: 'محل قطع الغيار الأول',
            });
            setReviews([
                {
                    id: '1',
                    userName: 'أحمد محمد',
                    rating: 5,
                    comment: 'منتج ممتاز، جودة عالية',
                    date: new Date().toISOString(),
                },
                {
                    id: '2',
                    userName: 'خالد علي',
                    rating: 4,
                    comment: 'جيد جداً، سعر مناسب',
                    date: new Date(Date.now() - 86400000).toISOString(),
                },
            ]);
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError('فشل تحميل تفاصيل المنتج');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchProductDetails();
        setRefreshing(false);
    };

    const handleAddToCart = () => {
        Alert.alert('نجح', 'تمت إضافة المنتج إلى السلة');
    };

    if (loading) {
        return <LoadingState message="جاري تحميل تفاصيل المنتج..." />;
    }

    if (error || !product) {
        return <ErrorState message={error || 'المنتج غير موجود'} onRetry={fetchProductDetails} />;
    }

    return (
        <View style={styles.container}>
            <Header title={product.name} showBack onBack={() => router.back()} />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Images */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                    {product.images.map((image, index) => (
                        <Image key={index} source={{ uri: image }} style={styles.productImage} />
                    ))}
                </ScrollView>

                {/* Price & Stock */}
                <Card style={styles.priceCard} padding={16}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{product.price.toLocaleString('ar-SY')} ل.س</Text>
                        <Badge
                            variant={product.inStock ? 'success' : 'danger'}
                            text={product.inStock ? 'متوفر' : 'غير متوفر'}
                        />
                    </View>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>
                            ⭐ {product.rating.toFixed(1)} ({product.reviewCount} تقييم)
                        </Text>
                    </View>
                </Card>

                {/* Description */}
                <Card style={styles.section} padding={16}>
                    <Text style={styles.sectionTitle}>الوصف</Text>
                    <Text style={styles.description}>{product.description}</Text>
                </Card>

                {/* Provider */}
                <Card style={styles.section} padding={16}>
                    <Text style={styles.sectionTitle}>المزود</Text>
                    <Text style={styles.providerName}>{product.providerName}</Text>
                </Card>

                {/* Reviews */}
                {reviews.length > 0 && (
                    <View style={styles.reviewsSection}>
                        <Text style={styles.reviewsTitle}>التقييمات ({reviews.length})</Text>
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Add to Cart Button */}
            <View style={styles.footer}>
                <Button
                    title="إضافة إلى السلة"
                    onPress={handleAddToCart}
                    variant="primary"
                    disabled={!product.inStock}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        paddingBottom: 100,
    },
    imagesScroll: {
        marginBottom: 12,
    },
    productImage: {
        width: 250,
        height: 180,
        borderRadius: 12,
        marginLeft: 16,
    },
    priceCard: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    price: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#34C759',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        color: '#64748b',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 22,
        textAlign: 'right',
    },
    providerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    reviewsSection: {
        marginHorizontal: 16,
        marginTop: 8,
    },
    reviewsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
});
