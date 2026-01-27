import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../shared';

interface CarListing {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    currency: string;
    city: string;
    mileage?: number;
    images: string[];
    isFeatured?: boolean;
    providerName: string;
}

interface CarListingCardProps {
    listing: CarListing;
    onPress: () => void;
    onFavorite?: () => void;
    isFavorite?: boolean;
}

export const CarListingCard: React.FC<CarListingCardProps> = ({
    listing,
    onPress,
    onFavorite,
    isFavorite = false,
}) => {
    const formatPrice = (price: number, currency: string) => {
        return `${price.toLocaleString()} ${currency}`;
    };

    const formatMileage = (mileage?: number) => {
        if (!mileage) return null;
        return `${mileage.toLocaleString()} كم`;
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <Card style={styles.card} padding={0}>
                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: listing.images[0] || 'https://via.placeholder.com/400x250' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {listing.isFeatured && (
                        <View style={styles.featuredBadge}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.featuredText}>مميز</Text>
                        </View>
                    )}
                    {onFavorite && (
                        <TouchableOpacity
                            style={styles.favoriteButton}
                            onPress={onFavorite}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isFavorite ? 'heart' : 'heart-outline'}
                                size={24}
                                color={isFavorite ? '#FF3B30' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>
                        {listing.brand} {listing.model}
                    </Text>
                    <Text style={styles.year}>{listing.year}</Text>

                    <View style={styles.details}>
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={14} color="#666" />
                            <Text style={styles.detailText}>{listing.city}</Text>
                        </View>
                        {listing.mileage && (
                            <View style={styles.detailItem}>
                                <Ionicons name="speedometer-outline" size={14} color="#666" />
                                <Text style={styles.detailText}>{formatMileage(listing.mileage)}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
                        <Text style={styles.provider}>{listing.providerName}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        backgroundColor: '#F0F0F0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    featuredBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    featuredText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    favoriteButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    year: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    details: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 12,
        color: '#666',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    price: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    provider: {
        fontSize: 12,
        color: '#999',
    },
});
