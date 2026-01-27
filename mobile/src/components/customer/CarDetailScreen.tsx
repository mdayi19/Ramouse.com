import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Text,
    Image,
    Share,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Badge, Button, LoadingState, ErrorState } from '../shared';
import { ImageGallery } from '../shared/ImageGallery';
import { MarketplaceService } from '@/services/marketplace.service';
import { CustomerService } from '@/services/customer.service';

interface CarData {
    id: string;
    title: string;
    brand: string;
    model: string;
    year: string;
    price: number;
    mileage: string;
    transmission: string;
    fuelType: string;
    color: string;
    city: string;
    description: string;
    images: string[];
    providerName: string;
    providerPhone: string;
    isFavorite: boolean;
}

export const CarDetailScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const carId = params.id as string;

    const [car, setCar] = useState<CarData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);

    useEffect(() => {
        fetchCarDetails();
    }, [carId]);

    const fetchCarDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await MarketplaceService.getListingById(parseInt(carId));
            const carData = response.car;
            setCar({
                id: carData.id.toString(),
                title: `${carData.brand} ${carData.model} ${carData.year}`,
                brand: carData.brand,
                model: carData.model,
                year: carData.year.toString(),
                price: carData.price,
                mileage: carData.mileage || '0 كم',
                transmission: carData.transmission || 'أوتوماتيك',
                fuelType: carData.engine_type || 'بنزين',
                color: carData.color || 'غير محدد',
                city: carData.city,
                description: carData.description || '',
                images: carData.images || [],
                providerName: response.provider?.name || 'غير محدد',
                providerPhone: response.provider?.phone || '',
                isFavorite: carData.is_favorite || false,
            });
        } catch (err) {
            console.error('Error fetching car details:', err);
            setError('فشل تحميل تفاصيل السيارة');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchCarDetails();
        setRefreshing(false);
    };

    const handleToggleFavorite = async () => {
        if (!car) return;
        try {
            await CustomerService.toggleFavorite(parseInt(car.id));
            setCar({ ...car, isFavorite: !car.isFavorite });
        } catch (err) {
            Alert.alert('خطأ', 'فشل تحديث المفضلة');
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `${car?.title} - ${car?.price.toLocaleString('ar-SY')} ل.س`,
            });
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleContact = () => {
        Alert.alert(
            'الاتصال بالمزود',
            car?.providerPhone || '',
            [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'اتصال', onPress: () => { } },
            ]
        );
    };

    const openGallery = (index: number) => {
        setGalleryIndex(index);
        setGalleryVisible(true);
    };

    if (loading) {
        return <LoadingState message="جاري تحميل تفاصيل السيارة..." />;
    }

    if (error || !car) {
        return <ErrorState message={error || 'السيارة غير موجودة'} onRetry={fetchCarDetails} />;
    }

    return (
        <View style={styles.container}>
            <Header
                title={car.title}
                showBack
                onBack={() => router.back()}
                rightElement={
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                            <Ionicons name="share-outline" size={24} color="#1e293b" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleToggleFavorite} style={styles.headerButton}>
                            <Ionicons
                                name={car.isFavorite ? 'heart' : 'heart-outline'}
                                size={24}
                                color={car.isFavorite ? '#FF3B30' : '#1e293b'}
                            />
                        </TouchableOpacity>
                    </View>
                }
            />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Images */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                    {car.images.map((image, index) => (
                        <TouchableOpacity key={index} onPress={() => openGallery(index)}>
                            <Image source={{ uri: image }} style={styles.carImage} />
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Price */}
                <Card style={styles.priceCard} padding={16}>
                    <Text style={styles.price}>{car.price.toLocaleString('ar-SY')} ل.س</Text>
                    <Text style={styles.priceLabel}>السعر</Text>
                </Card>

                {/* Specs */}
                <Card style={styles.section} padding={16}>
                    <Text style={styles.sectionTitle}>المواصفات</Text>
                    <View style={styles.specsGrid}>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.year}</Text>
                            <Text style={styles.specLabel}>السنة</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.mileage}</Text>
                            <Text style={styles.specLabel}>المسافة</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.transmission}</Text>
                            <Text style={styles.specLabel}>الجير</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.fuelType}</Text>
                            <Text style={styles.specLabel}>الوقود</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.color}</Text>
                            <Text style={styles.specLabel}>اللون</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specValue}>{car.city}</Text>
                            <Text style={styles.specLabel}>المدينة</Text>
                        </View>
                    </View>
                </Card>

                {/* Description */}
                <Card style={styles.section} padding={16}>
                    <Text style={styles.sectionTitle}>الوصف</Text>
                    <Text style={styles.description}>{car.description}</Text>
                </Card>

                {/* Provider */}
                <Card style={styles.section} padding={16}>
                    <Text style={styles.sectionTitle}>المزود</Text>
                    <Text style={styles.providerName}>{car.providerName}</Text>
                </Card>
            </ScrollView>

            {/* Contact Button */}
            <View style={styles.footer}>
                <Button title="الاتصال بالمزود" onPress={handleContact} variant="primary" />
            </View>

            {/* Image Gallery */}
            <ImageGallery
                images={car.images}
                initialIndex={galleryIndex}
                visible={galleryVisible}
                onClose={() => setGalleryVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerButton: {
        padding: 4,
    },
    content: {
        paddingBottom: 100,
    },
    imagesScroll: {
        marginBottom: 12,
    },
    carImage: {
        width: 300,
        height: 200,
        borderRadius: 12,
        marginLeft: 16,
    },
    priceCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#34C759',
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    section: {
        marginHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
    },
    specsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    specItem: {
        width: '30%',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
    },
    specValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    specLabel: {
        fontSize: 12,
        color: '#64748b',
    },
    description: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 22,
        textAlign: 'right',
    },
    providerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
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
