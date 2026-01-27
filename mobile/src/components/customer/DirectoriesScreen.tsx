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
import { Card, SearchBar, EmptyState, LoadingState, ErrorState } from '../shared';
import { DirectoryService } from '@/services/directory.service';
import { CustomerService } from '@/services/customer.service';

type DirectoryType = 'providers' | 'technicians' | 'tow-trucks';

interface DirectoryItem {
    id: string;
    name: string;
    type: DirectoryType;
    city: string;
    phone: string;
    rating: number;
    reviewCount: number;
}

export const DirectoriesScreen: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<DirectoryType>('providers');
    const [items, setItems] = useState<DirectoryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<DirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDirectoryItems();
    }, [activeTab]);

    useEffect(() => {
        if (searchQuery) {
            setFilteredItems(
                items.filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.city.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredItems(items);
        }
    }, [searchQuery, items]);

    const fetchDirectoryItems = async () => {
        try {
            setLoading(true);
            setError(null);

            // TODO: Replace with actual API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mockData: Record<DirectoryType, DirectoryItem[]> = {
                providers: [
                    {
                        id: '1',
                        name: 'محل قطع الغيار الأول',
                        type: 'providers',
                        city: 'دمشق',
                        phone: '+963 999 123 456',
                        rating: 4.5,
                        reviewCount: 120,
                    },
                    {
                        id: '2',
                        name: 'مركز الخليج للقطع',
                        type: 'providers',
                        city: 'حلب',
                        phone: '+963 999 654 321',
                        rating: 4.8,
                        reviewCount: 85,
                    },
                ],
                technicians: [
                    {
                        id: '3',
                        name: 'أحمد الميكانيكي',
                        type: 'technicians',
                        city: 'دمشق',
                        phone: '+963 999 111 222',
                        rating: 4.7,
                        reviewCount: 45,
                    },
                ],
                'tow-trucks': [
                    {
                        id: '4',
                        name: 'خدمة السحب السريع',
                        type: 'tow-trucks',
                        city: 'دمشق',
                        phone: '+963 999 333 444',
                        rating: 4.6,
                        reviewCount: 30,
                    },
                ],
            };

            setItems(mockData[activeTab]);
        } catch (err) {
            console.error('Error fetching directory items:', err);
            setError('فشل تحميل الدليل');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDirectoryItems();
        setRefreshing(false);
    };

    const handleContact = (phone: string) => {
        // TODO: Implement call functionality
        console.log('Calling:', phone);
    };

    const renderTab = (type: DirectoryType, label: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === type && styles.tabActive]}
            onPress={() => setActiveTab(type)}
        >
            <Text style={[styles.tabText, activeTab === type && styles.tabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }: { item: DirectoryItem }) => (
        <Card style={styles.itemCard} padding={16}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>
                            ⭐ {item.rating.toFixed(1)} ({item.reviewCount})
                        </Text>
                    </View>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color="#64748b" />
                        <Text style={styles.cityText}>{item.city}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={styles.contactButton}
                onPress={() => handleContact(item.phone)}
            >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.contactButtonText}>اتصال</Text>
            </TouchableOpacity>
        </Card>
    );

    if (loading && !refreshing) {
        return <LoadingState message="جاري تحميل الدليل..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchDirectoryItems} />;
    }

    return (
        <View style={styles.container}>
            <Header title="الدليل" showBack onBack={() => router.back()} />

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                {renderTab('providers', 'مزودين')}
                {renderTab('technicians', 'فنيين')}
                {renderTab('tow-trucks', 'سحب')}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <SearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="ابحث..."
                />
            </View>

            {/* List */}
            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                renderItem={renderItem}
                ListEmptyComponent={
                    <EmptyState
                        icon="book-outline"
                        title="لا توجد نتائج"
                        message="لا يوجد محتوى في هذا القسم"
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
    searchContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    listContent: {
        padding: 16,
    },
    itemCard: {
        marginBottom: 12,
    },
    itemHeader: {
        marginBottom: 12,
    },
    itemInfo: {
        gap: 6,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 13,
        color: '#64748b',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    cityText: {
        fontSize: 13,
        color: '#64748b',
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#34C759',
    },
    contactButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
