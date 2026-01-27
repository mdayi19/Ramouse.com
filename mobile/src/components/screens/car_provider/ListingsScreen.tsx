import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CarProviderService } from '@/services/carprovider.service';

export default function CarProviderListingsScreen() {
    const router = useRouter();
    const [listings, setListings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchListings = async () => {
        try {
            const data = await CarProviderService.getMyListings();
            setListings(Array.isArray(data) ? data : data.listings || []);
        } catch (error) {
            console.error('Failed to fetch listings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchListings();
    };

    const renderListingItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                // Edit listing or view details
                // router.push(`/(car-provider)/edit-listing/${item.id}`)
            }}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={item.photos && item.photos.length > 0 ? { uri: item.photos[0] } : { uri: 'https://placehold.co/300x200?text=No+Image' }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <View style={styles.priceTag}>
                    <Text style={styles.priceText}>{Number(item.price).toLocaleString()} $</Text>
                </View>
                <View style={[styles.statusBadge, item.is_hidden ? styles.statusHidden : styles.statusActive]}>
                    <Text style={[styles.statusText, item.is_hidden ? styles.textHidden : styles.textActive]}>
                        {item.is_hidden ? 'مخفي' : 'نشط'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>

                <View style={styles.detailsRow}>
                    <Text style={styles.detailText}>{item.year}</Text>
                    <Text style={styles.divider}>•</Text>
                    <Text style={styles.detailText}>{Number(item.mileage).toLocaleString()} كم</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={14} color="#64748b" />
                        <Text style={styles.statText}>{item.views_count || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={14} color="#64748b" />
                        <Text style={styles.statText}>{item.favorites_count || 0}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>سياراتي المعروضة</Text>
                <TouchableOpacity onPress={() => router.push('/(car-provider)/add-listing')}>
                    <Ionicons name="add" size={24} color="#2563eb" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                </View>
            ) : (
                <FlatList
                    data={listings}
                    renderItem={renderListingItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Ionicons name="car-sport-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyText}>لم تقم بإضافة أي سيارات بعد</Text>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => router.push('/(car-provider)/add-listing')}
                            >
                                <Text style={styles.addButtonText}>إضافة سيارة جديدة</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    listContent: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    imageContainer: {
        height: 180,
        backgroundColor: '#e2e8f0',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    priceTag: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusActive: {
        backgroundColor: '#dcfce7',
    },
    statusHidden: {
        backgroundColor: '#f1f5f9',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    textActive: {
        color: '#16a34a',
    },
    textHidden: {
        color: '#64748b',
    },
    cardContent: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 8,
        textAlign: 'left',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailText: {
        fontSize: 14,
        color: '#64748b',
    },
    divider: {
        marginHorizontal: 6,
        color: '#cbd5e1',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#64748b',
    },
    emptyText: {
        marginTop: 16,
        marginBottom: 24,
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
    },
    addButton: {
        backgroundColor: '#2563eb',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
