import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Card, Text, Chip, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import type { CarListing } from '@/types';
import { useToggleFavorite, useIsFavorite } from '@/hooks';

interface CarCardProps {
    car: CarListing;
    onPress?: () => void;
}

export function CarCard({ car, onPress }: CarCardProps) {
    const router = useRouter();
    const toggleFavorite = useToggleFavorite();
    const isFavorite = useIsFavorite(car.id);

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push(`/(customer)/car/${car.id}`);
        }
    };

    const handleFavoritePress = (e: any) => {
        e.stopPropagation();
        toggleFavorite.mutate(car.id);
    };

    const price = car.listing_type === 'rent' ? car.daily_price : car.price;
    const priceLabel = car.listing_type === 'rent' ? 'يومياً' : '';

    return (
        <Card style={styles.card} onPress={handlePress}>
            <View style={styles.imageContainer}>
                {car.photos && car.photos.length > 0 ? (
                    <Image
                        source={{ uri: car.photos[0] }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text>لا توجد صورة</Text>
                    </View>
                )}

                {/* Favorite Button */}
                <IconButton
                    icon={isFavorite ? 'heart' : 'heart-outline'}
                    iconColor={isFavorite ? '#e74c3c' : '#fff'}
                    size={24}
                    style={styles.favoriteButton}
                    onPress={handleFavoritePress}
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

            <Card.Content style={styles.content}>
                {/* Title */}
                <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
                    {car.brand} {car.model}
                </Text>

                {/* Year and Details */}
                <View style={styles.detailsRow}>
                    <Text variant="bodySmall" style={styles.year}>
                        {car.year}
                    </Text>
                    <Text variant="bodySmall" style={styles.separator}>
                        •
                    </Text>
                    <Text variant="bodySmall" style={styles.detail}>
                        {car.engine_type === 'petrol' ? 'بنزين' : car.engine_type === 'diesel' ? 'ديزل' : car.engine_type}
                    </Text>
                    <Text variant="bodySmall" style={styles.separator}>
                        •
                    </Text>
                    <Text variant="bodySmall" style={styles.detail}>
                        {car.transmission === 'auto' ? 'أوتوماتيك' : 'يدوي'}
                    </Text>
                </View>

                {/* City */}
                {car.city && (
                    <View style={styles.locationRow}>
                        <Text variant="bodySmall" style={styles.location}>
                            📍 {car.city}
                        </Text>
                    </View>
                )}

                {/* Price */}
                <View style={styles.priceRow}>
                    <Text variant="titleLarge" style={styles.price}>
                        ${price?.toLocaleString()}
                    </Text>
                    {priceLabel && (
                        <Text variant="bodySmall" style={styles.priceLabel}>
                            {priceLabel}
                        </Text>
                    )}
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
        backgroundColor: '#f0f0f0',
    },
    image: {
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
    favoriteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    typeBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
    },
    rentBadge: {
        backgroundColor: '#3498db',
    },
    saleBadge: {
        backgroundColor: '#2ecc71',
    },
    typeBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    content: {
        padding: 12,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    year: {
        color: '#666',
    },
    separator: {
        marginHorizontal: 6,
        color: '#999',
    },
    detail: {
        color: '#666',
    },
    locationRow: {
        marginBottom: 8,
    },
    location: {
        color: '#666',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 4,
    },
    price: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    priceLabel: {
        marginLeft: 4,
        color: '#666',
    },
});
