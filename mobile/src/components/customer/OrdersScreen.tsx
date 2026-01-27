import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Badge, EmptyState, LoadingState, ErrorState, SearchBar } from '../shared';
import { CustomerService } from '@/services/customer.service';
import { useRouter } from 'expo-router';

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    partDescription: string;
    brand: string;
    model: string;
    year?: string;
    createdAt: string;
    quotesCount?: number;
}

interface OrdersScreenProps {
    onBack?: () => void;
}

// Status grouping configuration
const STATUS_GROUPS = {
    active: {
        title: 'طلبات نشطة',
        icon: 'time-outline' as const,
        color: '#3B82F6',
        bgColor: '#EFF6FF',
        darkBgColor: '#1E3A8A',
        statuses: ['pending', 'payment_pending', 'processing', 'ready_for_pickup']
    },
    quoted: {
        title: 'بعروض أسعار',
        icon: 'chatbubbles-outline' as const,
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        darkBgColor: '#5B21B6',
        statuses: ['quoted']
    },
    shipping: {
        title: 'قيد الشحن',
        icon: 'car-outline' as const,
        color: '#6366F1',
        bgColor: '#EEF2FF',
        darkBgColor: '#3730A3',
        statuses: ['provider_received', 'shipped', 'out_for_delivery']
    },
    completed: {
        title: 'مكتملة',
        icon: 'checkmark-circle-outline' as const,
        color: '#10B981',
        bgColor: '#ECFDF5',
        darkBgColor: '#065F46',
        statuses: ['delivered', 'completed']
    },
    cancelled: {
        title: 'ملغية',
        icon: 'close-circle-outline' as const,
        color: '#EF4444',
        bgColor: '#FEF2F2',
        darkBgColor: '#991B1B',
        statuses: ['cancelled']
    }
};

type StatusGroupKey = keyof typeof STATUS_GROUPS;

// Loading Skeleton Component
const OrderCardSkeleton = () => {
    const pulseAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Card style={styles.orderCard}>
            <Animated.View style={{ opacity }}>
                <View style={styles.skeletonHeader}>
                    <View style={styles.skeletonTitle} />
                    <View style={styles.skeletonBadge} />
                </View>
                <View style={styles.skeletonNumber} />
                <View style={styles.skeletonDescription} />
                <View style={styles.skeletonFooter}>
                    <View style={styles.skeletonTime} />
                    <View style={styles.skeletonQuote} />
                </View>
            </Animated.View>
        </Card>
    );
};

export const OrdersScreen: React.FC<OrdersScreenProps> = ({ onBack }) => {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<StatusGroupKey | 'all'>('all');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(['active', 'quoted', 'shipping'])
    );

    const fetchOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const response = await CustomerService.getOrders();
            const ordersData = Array.isArray(response)
                ? response
                : ((response as any)?.data || []);

            const mappedOrders: Order[] = ordersData.map((order: any) => {
                const orderId = order.id || '';
                const formData = order.formData || {};

                return {
                    id: orderId.toString(),
                    orderNumber: order.orderNumber || orderId.toString(),
                    status: order.status || 'pending',
                    partDescription: formData.partDescription || '',
                    brand: formData.brand || formData.brandManual || '',
                    model: formData.model || '',
                    year: formData.year || '',
                    createdAt: order.createdAt || new Date().toISOString(),
                    quotesCount: order.quotes?.length || order.quotesCount || 0,
                };
            });

            setOrders(mappedOrders);
        } catch (err) {
            console.error('❌ Error fetching orders:', err);
            setError('فشل تحميل الطلبات. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filter and group orders
    const { filteredOrders, groupedOrders } = useMemo(() => {
        let filtered = orders.filter(
            (order) =>
                order.orderNumber.includes(searchQuery) ||
                order.partDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.model.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (activeFilter !== 'all') {
            const group = STATUS_GROUPS[activeFilter];
            filtered = filtered.filter(order => group.statuses.includes(order.status));
        }

        const grouped: Record<StatusGroupKey, Order[]> = {
            active: [],
            quoted: [],
            shipping: [],
            completed: [],
            cancelled: []
        };

        filtered.forEach(order => {
            for (const [key, group] of Object.entries(STATUS_GROUPS)) {
                if (group.statuses.includes(order.status)) {
                    grouped[key as StatusGroupKey].push(order);
                    break;
                }
            }
        });

        return { filteredOrders: filtered, groupedOrders: grouped };
    }, [orders, searchQuery, activeFilter]);

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { text: string; variant: any }> = {
            pending: { text: 'قيد المراجعة', variant: 'warning' },
            quoted: { text: 'عروض متاحة', variant: 'info' },
            payment_pending: { text: 'بانتظار الدفع', variant: 'warning' },
            processing: { text: 'جاري التجهيز', variant: 'default' },
            ready_for_pickup: { text: 'جاهز', variant: 'success' },
            provider_received: { text: 'استلمه المزود', variant: 'info' },
            shipped: { text: 'تم الشحن', variant: 'info' },
            out_for_delivery: { text: 'قيد التوصيل', variant: 'info' },
            delivered: { text: 'تم التوصيل', variant: 'success' },
            completed: { text: 'مكتمل', variant: 'success' },
            cancelled: { text: 'ملغي', variant: 'danger' },
        };
        return statusMap[status] || { text: status, variant: 'default' };
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `منذ ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
        if (diffHours > 0) return `منذ ${diffHours} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
        return 'منذ قليل';
    };

    const renderOrderCard = (order: Order) => {
        const statusBadge = getStatusBadge(order.status);

        return (
            <TouchableOpacity
                key={order.orderNumber}
                onPress={() => router.push(`/(customer)/order/${order.orderNumber}`)}
                activeOpacity={0.7}
                style={styles.orderCardTouchable}
            >
                <Card style={styles.orderCard}>
                    {/* Header Row */}
                    <View style={styles.orderHeader}>
                        <View style={styles.orderTitleRow}>
                            <Text style={styles.orderTitle}>
                                {order.brand} {order.model}
                            </Text>
                            {order.year && (
                                <View style={styles.yearBadge}>
                                    <Text style={styles.yearText}>{order.year}</Text>
                                </View>
                            )}
                        </View>
                        <Badge text={statusBadge.text} variant={statusBadge.variant} />
                    </View>

                    {/* Order Number */}
                    <Text style={styles.orderNumber}>طلب #{order.orderNumber}</Text>

                    {/* Part Description */}
                    {order.partDescription && (
                        <Text style={styles.partDescription} numberOfLines={2}>
                            {order.partDescription}
                        </Text>
                    )}

                    {/* Footer Row */}
                    <View style={styles.orderFooter}>
                        <View style={styles.footerLeft}>
                            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                            <Text style={styles.timeAgo}>{getTimeAgo(order.createdAt)}</Text>
                        </View>
                        {order.quotesCount !== undefined && order.quotesCount > 0 && (
                            <View style={styles.quoteBadge}>
                                <Ionicons name="chatbubbles" size={14} color="#8B5CF6" />
                                <Text style={styles.quoteCount}>
                                    {order.quotesCount} {order.quotesCount === 1 ? 'عرض' : 'عروض'}
                                </Text>
                            </View>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderGroup = (groupKey: StatusGroupKey) => {
        const group = STATUS_GROUPS[groupKey];
        const groupOrders = groupedOrders[groupKey];
        const isExpanded = expandedGroups.has(groupKey);

        if (groupOrders.length === 0) return null;

        return (
            <View key={groupKey} style={styles.groupContainer}>
                {/* Group Header */}
                <TouchableOpacity
                    style={[styles.groupHeader, { borderLeftColor: group.color, backgroundColor: group.bgColor }]}
                    onPress={() => toggleGroup(groupKey)}
                    activeOpacity={0.7}
                >
                    <View style={styles.groupHeaderLeft}>
                        <Ionicons name={group.icon} size={24} color={group.color} />
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={[styles.countBadge, { backgroundColor: group.color }]}>
                            <Text style={styles.countText}>{groupOrders.length}</Text>
                        </View>
                    </View>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={group.color}
                    />
                </TouchableOpacity>

                {/* Group Content */}
                {isExpanded && (
                    <View style={styles.groupContent}>
                        {groupOrders.map(order => renderOrderCard(order))}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="طلباتي" showBack onBack={onBack} />
                <View style={styles.searchContainer}>
                    <SearchBar
                        placeholder="ابحث عن طلب..."
                        value=""
                        onSearch={() => { }}
                    />
                </View>
                <View style={styles.scrollContent}>
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                    <OrderCardSkeleton />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Header title="طلباتي" showBack onBack={onBack} />
                <ErrorState message={error} onRetry={() => fetchOrders()} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="طلباتي" showBack onBack={onBack} />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchBar
                    placeholder="ابحث عن طلب..."
                    value={searchQuery}
                    onSearch={setSearchQuery}
                />
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterTabs}
                contentContainerStyle={styles.filterTabsContent}
            >
                <TouchableOpacity
                    style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
                    onPress={() => setActiveFilter('all')}
                >
                    <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
                        الكل ({orders.length})
                    </Text>
                </TouchableOpacity>
                {Object.entries(STATUS_GROUPS).map(([key, group]) => {
                    const count = groupedOrders[key as StatusGroupKey].length;
                    if (count === 0) return null;

                    return (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.filterTab,
                                activeFilter === key && [styles.filterTabActive, { backgroundColor: group.color }]
                            ]}
                            onPress={() => setActiveFilter(key as StatusGroupKey)}
                        >
                            <Ionicons
                                name={group.icon}
                                size={16}
                                color={activeFilter === key ? '#FFF' : group.color}
                            />
                            <Text style={[styles.filterTabText, activeFilter === key && styles.filterTabTextActive]}>
                                {group.title} ({count})
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Orders List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />
                }
            >
                {filteredOrders.length === 0 ? (
                    <EmptyState
                        icon="document-text-outline"
                        title="لا توجد طلبات"
                        message={searchQuery ? 'لم يتم العثور على نتائج' : 'لم تقم بإنشاء أي طلبات بعد'}
                    />
                ) : (
                    Object.keys(STATUS_GROUPS).map(key => renderGroup(key as StatusGroupKey))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    filterTabs: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    filterTabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 10,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F1F5F9',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    filterTabActive: {
        backgroundColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
    },
    filterTabTextActive: {
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    groupContainer: {
        marginBottom: 20,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 16,
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    groupTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    countText: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#FFF',
    },
    groupContent: {
        marginTop: 12,
        gap: 10,
    },
    orderCardTouchable: {
        marginBottom: 0,
    },
    orderCard: {
        marginBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderRadius: 14,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    orderTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginRight: 12,
    },
    orderTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#1E293B',
        flex: 1,
    },
    yearBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    yearText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    orderNumber: {
        fontSize: 12,
        color: '#94A3B8',
        fontFamily: 'monospace',
        marginBottom: 10,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    partDescription: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 14,
        lineHeight: 21,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeAgo: {
        fontSize: 13,
        color: '#94A3B8',
    },
    quoteBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F3E8FF',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 14,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    quoteCount: {
        fontSize: 13,
        color: '#8B5CF6',
        fontWeight: '600',
    },
    // Skeleton styles
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    skeletonTitle: {
        width: '60%',
        height: 20,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    skeletonBadge: {
        width: 80,
        height: 28,
        backgroundColor: '#E2E8F0',
        borderRadius: 14,
    },
    skeletonNumber: {
        width: '40%',
        height: 16,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginBottom: 10,
    },
    skeletonDescription: {
        width: '100%',
        height: 14,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        marginBottom: 14,
    },
    skeletonFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    skeletonTime: {
        width: 100,
        height: 14,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    skeletonQuote: {
        width: 120,
        height: 28,
        backgroundColor: '#E2E8F0',
        borderRadius: 14,
    },
});
