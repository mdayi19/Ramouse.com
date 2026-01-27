import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Header } from '../layout';
import { SearchBar, EmptyState, LoadingState, ErrorState, BottomSheet, Button } from '../shared';
import { CarListingCard } from './CarListingCard';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

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

interface MarketplaceScreenProps {
    onBack?: () => void;
    onCarPress?: (carId: string) => void;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({
    onBack,
    onCarPress,
}) => {
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const fetchListings = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // TODO: Replace with actual API call
            // const response = await marketplaceService.getListings();
            // setListings(response.data);

            // Mock data
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setListings([
                {
                    id: '1',
                    brand: 'تويوتا',
                    model: 'كامري',
                    year: 2022,
                    price: 85000,
                    currency: 'ر.س',
                    city: 'الرياض',
                    mileage: 45000,
                    images: ['https://via.placeholder.com/400x250'],
                    isFeatured: true,
                    providerName: 'معرض النخبة',
                },
                {
                    id: '2',
                    brand: 'هوندا',
                    model: 'أكورد',
                    year: 2021,
                    price: 72000,
                    currency: 'ر.س',
                    city: 'جدة',
                    mileage: 38000,
                    images: ['https://via.placeholder.com/400x250'],
                    providerName: 'معرض الفخامة',
                },
                {
                    id: '3',
                    brand: 'نيسان',
                    model: 'التيما',
                    year: 2023,
                    price: 95000,
                    currency: 'ر.س',
                    city: 'الدمام',
                    mileage: 12000,
                    images: ['https://via.placeholder.com/400x250'],
                    isFeatured: true,
                    providerName: 'معرض الأمانة',
                },
            ]);
        } catch (err) {
            setError('فشل تحميل السيارات. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleFavorite = (carId: string) => {
        setFavorites((prev) => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(carId)) {
                newFavorites.delete(carId);
            } else {
                newFavorites.add(carId);
            }
            return newFavorites;
        });
    };

    const filteredListings = listings.filter(
        (listing) =>
            listing.brand.includes(searchQuery) ||
            listing.model.includes(searchQuery) ||
            listing.city.includes(searchQuery)
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="تصفح السيارات" showBack onBack={onBack} />
                <LoadingState message="جاري تحميل السيارات..." />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Header title="تصفح السيارات" showBack onBack={onBack} />
                <ErrorState message={error} onRetry={() => fetchListings()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="تصفح السيارات" showBack onBack={onBack} />

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <SearchBar
                        placeholder="ابحث عن سيارة..."
                        value={searchQuery}
                        onSearch={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(true)}
                >
                    <Ionicons name="options-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Listings */}
            <FlatList
                data={filteredListings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CarListingCard
                        listing={item}
                        onPress={() => onCarPress?.(item.id)}
                        onFavorite={() => handleFavorite(item.id)}
                        isFavorite={favorites.has(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchListings(true)} />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="car-outline"
                        title="لا توجد سيارات"
                        message={searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد سيارات متاحة حالياً'}
                    />
                }
            />

            {/* Filters Bottom Sheet */}
            <BottomSheet visible={showFilters} onClose={() => setShowFilters(false)}>
                <View style={styles.filtersContent}>
                    <Text style={styles.filtersTitle}>الفلاتر</Text>
                    <Text style={styles.filtersPlaceholder}>
                        سيتم إضافة خيارات الفلترة هنا (السعر، السنة، المدينة، إلخ)
                    </Text>
                    <Button
                        title="تطبيق"
                        onPress={() => setShowFilters(false)}
                        style={styles.applyButton}
                    />
                </View>
            </BottomSheet>
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
    filterButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
    },
    listContent: {
        padding: 16,
    },
    filtersContent: {
        padding: 16,
    },
    filtersTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    filtersPlaceholder: {
        fontSize: 14,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    applyButton: {
        marginTop: 16,
    },
});
