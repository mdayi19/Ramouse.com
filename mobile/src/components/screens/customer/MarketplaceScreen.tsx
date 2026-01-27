import React, { useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, SegmentedButtons, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCarListings } from '@/hooks';
import { CarCard, LoadingState, ErrorState } from '@/components';
import type { MarketplaceFilters } from '@/services/marketplace.service';

export default function MarketplaceScreen() {
    const [listingType, setListingType] = useState<'sale' | 'rent'>('sale');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<MarketplaceFilters>({
        listing_type: 'sale',
        page: 1,
        per_page: 20,
    });

    const { data, isLoading, error, refetch, isRefetching } = useCarListings(filters);

    const handleListingTypeChange = (value: string) => {
        const newType = value as 'sale' | 'rent';
        setListingType(newType);
        setFilters({ ...filters, listing_type: newType, page: 1 });
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setFilters({ ...filters, search: query, page: 1 });
    };

    const handleLoadMore = () => {
        if (data && data.current_page < data.last_page) {
            setFilters({ ...filters, page: (filters.page || 1) + 1 });
        }
    };

    if (isLoading && !isRefetching) {
        return <LoadingState message="جاري تحميل السيارات..." />;
    }

    if (error) {
        return (
            <ErrorState
                message="فشل تحميل السيارات. يرجى المحاولة مرة أخرى."
                onRetry={() => refetch()}
            />
        );
    }

    const cars = data?.data || [];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                {/* Search Bar */}
                <Searchbar
                    placeholder="ابحث عن سيارة..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={styles.searchBar}
                />

                {/* Listing Type Toggle */}
                <SegmentedButtons
                    value={listingType}
                    onValueChange={handleListingTypeChange}
                    buttons={[
                        {
                            value: 'sale',
                            label: 'للبيع',
                            icon: 'car',
                        },
                        {
                            value: 'rent',
                            label: 'للإيجار',
                            icon: 'car-clock',
                        },
                    ]}
                    style={styles.segmentedButtons}
                />
            </View>

            {/* Car List */}
            <FlatList
                data={cars}
                renderItem={({ item }) => <CarCard car={item} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <ErrorState
                            message="لا توجد سيارات متاحة حالياً"
                            onRetry={() => refetch()}
                            retryLabel="تحديث"
                        />
                    </View>
                }
            />

            {/* Filter FAB */}
            <FAB
                icon="filter-variant"
                style={styles.fab}
                onPress={() => {
                    // TODO: Open filter modal
                    console.log('Open filters');
                }}
                label="فلاتر"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchBar: {
        marginBottom: 12,
        elevation: 0,
        backgroundColor: '#f5f5f5',
    },
    segmentedButtons: {
        marginBottom: 0,
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        flex: 1,
        minHeight: 400,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
