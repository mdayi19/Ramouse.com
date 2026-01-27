import React from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Text, Button, Chip, IconButton, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCarDetails, useToggleFavorite, useIsFavorite } from '@/hooks';
import { LoadingState, ErrorState } from '@/components';

const { width } = Dimensions.get('window');

export default function CarDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const carId = parseInt(id);

    const { data, isLoading, error, refetch } = useCarDetails(carId);
    const toggleFavorite = useToggleFavorite();
    const isFavorite = useIsFavorite(carId);

    if (isLoading) {
        return <LoadingState message="جاري تحميل تفاصيل السيارة..." />;
    }

    if (error || !data) {
        return (
            <ErrorState
                message="فشل تحميل تفاصيل السيارة"
                onRetry={() => refetch()}
            />
        );
    }

    const { car, provider, similar_cars } = data;
    const price = car.listing_type === 'rent' ? car.daily_price : car.price;
    const priceLabel = car.listing_type === 'rent' ? '/ يومياً' : '';

    const handleFavoriteToggle = () => {
        toggleFavorite.mutate(carId);
    };

    const handleContact = () => {
        // TODO: Implement contact functionality
        console.log('Contact provider');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView>
                {/* Image Gallery */}
                <View style={styles.imageContainer}>
                    {car.photos && car.photos.length > 0 ? (
                        <Image
                            source={{ uri: car.photos[0] }}
                            style={styles.mainImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.placeholderImage}>
                            <Text>لا توجد صورة</Text>
                        </View>
                    )}

                    {/* Back Button */}
                    <IconButton
                        icon="arrow-right"
                        size={24}
                        iconColor="#fff"
                        style={styles.backButton}
                        onPress={() => router.back()}
                    />

                    {/* Favorite Button */}
                    <IconButton
                        icon={isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        iconColor={isFavorite ? '#e74c3c' : '#fff'}
                        style={styles.favoriteButton}
                        onPress={handleFavoriteToggle}
                    />

                    {/* Listing Type Badge */}
                    <Chip
                        style={[
                            styles.typeBadge,
                            car.listing_type === 'rent' ? styles.rentBadge : styles.saleBadge,
                        ]}
                        textStyle={styles.typeBadgeText}
                    >
                        {car.listing_type === 'rent' ? 'للإيجار' : 'للبيع'}
                    </Chip>
                </View>

                {/* Car Info */}
                <View style={styles.infoContainer}>
                    <Text variant="headlineMedium" style={styles.title}>
                        {car.brand} {car.model}
                    </Text>

                    <View style={styles.priceRow}>
                        <Text variant="headlineLarge" style={styles.price}>
                            ${price?.toLocaleString()}
                        </Text>
                        {priceLabel && (
                            <Text variant="bodyLarge" style={styles.priceLabel}>
                                {priceLabel}
                            </Text>
                        )}
                    </View>

                    {/* Specs */}
                    <View style={styles.specsContainer}>
                        <View style={styles.specItem}>
                            <Text variant="bodySmall" style={styles.specLabel}>
                                السنة
                            </Text>
                            <Text variant="titleMedium" style={styles.specValue}>
                                {car.year}
                            </Text>
                        </View>

                        <View style={styles.specItem}>
                            <Text variant="bodySmall" style={styles.specLabel}>
                                المحرك
                            </Text>
                            <Text variant="titleMedium" style={styles.specValue}>
                                {car.engine_type === 'petrol' ? 'بنزين' : car.engine_type === 'diesel' ? 'ديزل' : car.engine_type}
                            </Text>
                        </View>

                        <View style={styles.specItem}>
                            <Text variant="bodySmall" style={styles.specLabel}>
                                ناقل الحركة
                            </Text>
                            <Text variant="titleMedium" style={styles.specValue}>
                                {car.transmission === 'auto' ? 'أوتوماتيك' : 'يدوي'}
                            </Text>
                        </View>

                        {car.mileage && (
                            <View style={styles.specItem}>
                                <Text variant="bodySmall" style={styles.specLabel}>
                                    المسافة المقطوعة
                                </Text>
                                <Text variant="titleMedium" style={styles.specValue}>
                                    {car.mileage.toLocaleString()} كم
                                </Text>
                            </View>
                        )}
                    </View>

                    <Divider style={styles.divider} />

                    {/* Description */}
                    {car.description && (
                        <>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                الوصف
                            </Text>
                            <Text variant="bodyMedium" style={styles.description}>
                                {car.description}
                            </Text>
                            <Divider style={styles.divider} />
                        </>
                    )}

                    {/* Location */}
                    {car.city && (
                        <>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                الموقع
                            </Text>
                            <Text variant="bodyMedium" style={styles.location}>
                                📍 {car.city}
                            </Text>
                            <Divider style={styles.divider} />
                        </>
                    )}

                    {/* Provider Info */}
                    {provider && (
                        <>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                معلومات المعرض
                            </Text>
                            <View style={styles.providerCard}>
                                <Text variant="titleMedium">{provider.name}</Text>
                                {provider.city && (
                                    <Text variant="bodyMedium" style={styles.providerCity}>
                                        📍 {provider.city}
                                    </Text>
                                )}
                            </View>
                        </>
                    )}
                </View>

                {/* Contact Button */}
                <View style={styles.contactContainer}>
                    <Button
                        mode="contained"
                        onPress={handleContact}
                        style={styles.contactButton}
                        contentStyle={styles.contactButtonContent}
                    >
                        تواصل مع المعرض
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    imageContainer: {
        position: 'relative',
        height: 300,
        backgroundColor: '#f0f0f0',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
    },
    backButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    favoriteButton: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    typeBadge: {
        position: 'absolute',
        bottom: 16,
        left: 16,
    },
    rentBadge: {
        backgroundColor: '#3498db',
    },
    saleBadge: {
        backgroundColor: '#2ecc71',
    },
    typeBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    infoContainer: {
        padding: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    price: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    priceLabel: {
        marginLeft: 8,
        color: '#666',
    },
    specsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
    },
    specItem: {
        flex: 1,
        minWidth: '45%',
    },
    specLabel: {
        color: '#999',
        marginBottom: 4,
    },
    specValue: {
        fontWeight: '600',
    },
    divider: {
        marginVertical: 16,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        color: '#666',
        lineHeight: 22,
    },
    location: {
        color: '#666',
    },
    providerCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
    },
    providerCity: {
        color: '#666',
        marginTop: 4,
    },
    contactContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    contactButton: {
        borderRadius: 8,
    },
    contactButtonContent: {
        paddingVertical: 8,
    },
});
