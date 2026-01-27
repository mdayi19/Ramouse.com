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
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Badge, SearchBar, EmptyState, LoadingState, ErrorState } from '../shared';
import { AuctionService } from '@/services/auction.service';

interface Auction {
    id: string;
    title: string;
    currentBid: number;
    minBid: number;
    endTime: string;
    bidsCount: number;
    category: string;
}

export const AuctionsScreen: React.FC = () => {
    const router = useRouter();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAuctions();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            setFilteredAuctions(
                auctions.filter((a) =>
                    a.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredAuctions(auctions);
        }
    }, [searchQuery, auctions]);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAuctions([
                {
                    id: '1',
                    title: 'تويوتا كامري 2018',
                    currentBid: 20000000,
                    minBid: 21000000,
                    endTime: new Date(Date.now() + 3600000).toISOString(),
                    bidsCount: 5,
                    category: 'سيارات',
                },
                {
                    id: '2',
                    title: 'محرك هيونداي',
                    currentBid: 3000000,
                    minBid: 3500000,
                    endTime: new Date(Date.now() + 7200000).toISOString(),
                    bidsCount: 3,
                    category: 'قطع',
                },
            ]);
        } catch (err) {
            console.error('Error fetching auctions:', err);
            setError('فشل تحميل المزادات');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAuctions();
        setRefreshing(false);
    };

    const getTimeRemaining = (endTime: string) => {
        const now = new Date().getTime();
        const end = new Date(endTime).getTime();
        const diff = end - now;

        if (diff <= 0) return 'انتهى';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}س ${minutes}د`;
    };

    const renderAuction = ({ item }: { item: Auction }) => (
        <TouchableOpacity
            onPress={() => router.push(`/(customer)/auction/${item.id}`)}
        >
            <Card style={styles.auctionCard} padding={16}>
                <View style={styles.header}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Badge variant="info" text={item.category} />
                </View>

                <View style={styles.bidInfo}>
                    <View style={styles.bidRow}>
                        <Text style={styles.bidValue}>
                            {item.currentBid.toLocaleString('ar-SY')} ل.س
                        </Text>
                        <Text style={styles.bidLabel}>السعر الحالي:</Text>
                    </View>
                    <View style={styles.bidRow}>
                        <Text style={styles.minBidValue}>
                            {item.minBid.toLocaleString('ar-SY')} ل.س
                        </Text>
                        <Text style={styles.bidLabel}>الحد الأدنى:</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={16} color="#FF9500" />
                        <Text style={styles.timeText}>{getTimeRemaining(item.endTime)}</Text>
                    </View>
                    <View style={styles.bidsContainer}>
                        <Ionicons name="people-outline" size={16} color="#64748b" />
                        <Text style={styles.bidsText}>{item.bidsCount} مزايدة</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    if (loading) {
        return <LoadingState message="جاري تحميل المزادات..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchAuctions} />;
    }

    return (
        <View style={styles.container}>
            <Header title="المزادات" showBack onBack={() => router.back()} />

            <View style={styles.searchContainer}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="ابحث في المزادات..."
                />
            </View>

            <FlatList
                data={filteredAuctions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                renderItem={renderAuction}
                ListEmptyComponent={
                    <EmptyState
                        icon="hammer-outline"
                        title="لا توجد مزادات"
                        message="لا توجد مزادات نشطة حالياً"
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
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    listContent: {
        padding: 16,
    },
    auctionCard: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        flex: 1,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    bidInfo: {
        gap: 8,
        marginBottom: 12,
    },
    bidRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bidLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    bidValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34C759',
    },
    minBidValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF9500',
    },
    bidsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    bidsText: {
        fontSize: 13,
        color: '#64748b',
    },
});
