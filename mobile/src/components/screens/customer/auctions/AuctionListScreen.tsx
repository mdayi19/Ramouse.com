import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, Searchbar, Chip, ActivityIndicator, IconButton, Card, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuctionService } from '@/services/auction.service';
import { useAuctionUpdates } from '@/hooks/useAuctionUpdates';
import { Auction } from '@/types/auction';
import { LoadingState, ErrorState } from '@/components';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type TabType = 'all' | 'live' | 'upcoming';

export default function AuctionListScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAuctions = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (activeTab !== 'all') params.status = activeTab;

            // Simulating API call since backend might be different in this mock
            const data: any = await AuctionService.getAuctions(params);
            setAuctions(Array.isArray(data) ? data : data.data || []);
        } catch (err: any) {
            console.error(err);
            setError('فشل تحميل المزادات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAuctions();
    }, [activeTab]);

    // Real-time updates
    const auctionIds = auctions.map(a => a.id);
    useAuctionUpdates(auctionIds, (auctionId, updates) => {
        setAuctions(prev => prev.map(a => a.id === auctionId ? { ...a, ...updates } : a));
    });

    const renderAuctionCard = ({ item }: { item: Auction }) => {
        const coverImage = item.car.media.images?.[0]
            ? { uri: item.car.media.images[0] }
            : { uri: 'https://placehold.co/600x400/png' };

        const isLive = item.is_live;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(customer)/auctions/${item.id}`)}
            >
                <View style={styles.imageContainer}>
                    <Image source={coverImage} style={styles.coverImage} resizeMode="cover" />

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, isLive ? styles.liveBadge : styles.upcomingBadge]}>
                        {isLive && <Ionicons name="flame" size={12} color="#fff" style={{ marginRight: 4 }} />}
                        <Text style={styles.statusText}>
                            {item.status === 'live' ? 'مباشر الآن' :
                                item.status === 'scheduled' ? 'قريباً' :
                                    item.status === 'ended' ? 'منتهي' : item.status}
                        </Text>
                    </View>

                    {/* Like Button */}
                    <TouchableOpacity style={styles.likeButton}>
                        <Ionicons name="heart-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardContent}>
                    <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>

                    <View style={styles.detailsRow}>
                        <View style={styles.priceContainer}>
                            <Text variant="bodySmall" style={styles.label}>
                                {isLive ? 'أعلى مزايدة' : 'يبدأ من'}
                            </Text>
                            <Text variant="titleLarge" style={styles.price}>
                                ${item.current_bid?.toLocaleString() || item.starting_bid?.toLocaleString()}
                            </Text>
                        </View>

                        {isLive && (
                            <View style={styles.bidCountBadge}>
                                <Ionicons name="hammer-outline" size={14} color="#2980b9" />
                                <Text style={styles.bidCountText}>{item.bid_count} مزايدة</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text variant="headlineSmall" style={styles.headerTitle}>المزادات</Text>
                    <TouchableOpacity onPress={() => { }} style={styles.filterButton}>
                        <Ionicons name="filter-outline" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <Searchbar
                    placeholder="ابحث عن سيارة..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchInput}
                />

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <Chip
                        selected={activeTab === 'all'}
                        onPress={() => setActiveTab('all')}
                        style={styles.tab}
                        showSelectedCheck={false}
                    >
                        الكل
                    </Chip>
                    <Chip
                        selected={activeTab === 'live'}
                        onPress={() => setActiveTab('live')}
                        style={styles.tab}
                        selectedColor="#e74c3c"
                        showSelectedCheck={false}
                    >
                        🔥 مباشر
                    </Chip>
                    <Chip
                        selected={activeTab === 'upcoming'}
                        onPress={() => setActiveTab('upcoming')}
                        style={styles.tab}
                        showSelectedCheck={false}
                    >
                        📅 قريباً
                    </Chip>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : error ? (
                <ErrorState message={error} onRetry={loadAuctions} />
            ) : (
                <FlatList
                    data={auctions}
                    renderItem={renderAuctionCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text>لا توجد مزادات حالياً</Text>
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    filterButton: {
        padding: 4,
    },
    searchBar: {
        backgroundColor: '#f1f2f6',
        borderRadius: 12,
        elevation: 0,
        height: 48,
        marginBottom: 12,
    },
    searchInput: {
        textAlign: 'right',
        minHeight: 0,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    tab: {
        backgroundColor: '#f1f2f6',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        elevation: 3,
    },
    imageContainer: {
        height: 200,
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    liveBadge: {
        backgroundColor: '#e74c3c',
    },
    upcomingBadge: {
        backgroundColor: '#3498db',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    likeButton: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 20,
    },
    cardContent: {
        padding: 16,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    priceContainer: {

    },
    label: {
        color: '#95a5a6',
        marginBottom: 2,
    },
    price: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    bidCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eaf2f8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    bidCountText: {
        color: '#2980b9',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 6,
    },
});
