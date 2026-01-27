import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../layout';
import { EmptyState, LoadingState, ErrorState } from '../shared';
import { CustomerService } from '@/services/customer.service';

type FavoriteType = 'cars' | 'parts' | 'providers';

interface FavoriteItem {
    id: string;
    type: FavoriteType;
    title: string;
    subtitle: string;
    price?: number;
    image?: string;
    rating?: number;
}

export const FavoritesScreen: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<FavoriteType>('cars');
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchFavorites();
    }, [activeTab]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            const favoritesData = await CustomerService.getFavorites();
            // Map API response to local format if needed
            setFavorites(favoritesData);
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError('فشل تحميل المفضلة');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchFavorites();
        setRefreshing(false);
    };

    const handleRemoveFavorite = async (itemId: string) => {
        try {
            await CustomerService.toggleFavorite(parseInt(itemId));
            setFavorites((prev) => prev.filter((item) => item.id !== itemId));
        } catch (err) {
            console.error('Error removing favorite:', err);
        }
    };

    const handleItemPress = (item: FavoriteItem) => {
        if (item.type === 'cars') {
            router.push(`/(customer)/car/${item.id}`);
        } else if (item.type === 'parts') {
            router.push(`/(customer)/product/${item.id}`);
        } else if (item.type === 'providers') {
            router.push(`/(customer)/provider/${item.id}`);
        }
    };

    const renderTab = (type: FavoriteType, label: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === type && styles.tabActive]}
            onPress={() => setActiveTab(type)}
        >
            <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderFavoriteItem = ({ item }: { item: FavoriteItem }) => (
        <TouchableOpacity
            style={styles.itemCard}
            onPress={() => handleItemPress(item)}
        >
            <View style={styles.itemContent}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    {item.price && (
                        <Text style={styles.itemPrice}>
                            {item.price.toLocaleString('ar-SY')} ل.س
                        </Text>
                    )}
                    {item.rating && (
                        <Text style={styles.itemRating}>⭐ {item.rating.toFixed(1)}</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFavorite(item.id)}
                >
                    <Text style={styles.removeIcon}>❤️</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return <LoadingState message="جاري تحميل المفضلة..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchFavorites} />;
    }

    return (
        <View style={styles.container}>
            <Header title="المفضلة" showBack onBack={() => router.back()} />

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {renderTab('cars', 'سيارات')}
                {renderTab('parts', 'قطع')}
                {renderTab('providers', 'مزودين')}
            </View>

            {/* List */}
            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                renderItem={renderFavoriteItem}
                ListEmptyComponent={
                    <EmptyState
                        icon="heart-outline"
                        title="لا توجد مفضلة"
                        message={`لم تقم بإضافة أي ${activeTab === 'cars' ? 'سيارات' : activeTab === 'parts' ? 'قطع' : 'مزودين'
                            } إلى المفضلة`}
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
        paddingHorizontal: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#007AFF',
    },
    listContent: {
        padding: 16,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    itemContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemInfo: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#34C759',
    },
    itemRating: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 4,
    },
    removeButton: {
        padding: 4,
    },
    removeIcon: {
        fontSize: 24,
    },
});
