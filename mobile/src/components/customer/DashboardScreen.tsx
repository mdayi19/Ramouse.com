import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, LoadingState, ErrorState } from '../shared';
import { CustomerService } from '@/services/customer.service';
import { OrderService } from '@/services/order.service';

interface DashboardScreenProps {
    userName?: string;
    onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
    userName = 'عميل',
    onNavigate,
}) => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState({
        ordersCount: 0,
        walletBalance: 0,
        favoritesCount: 0,
        vehiclesCount: 0,
        recentOrders: [] as any[],
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all dashboard data in parallel
            const [ordersResponse, wallet, favoritesResponse, garageResponse] = await Promise.all([
                CustomerService.getOrders().catch(() => ({ data: [] })),
                CustomerService.getWalletBalance().catch(() => ({ balance: 0 })),
                CustomerService.getFavorites().catch(() => []),
                CustomerService.getGarage().catch(() => []),
            ]);

            // Extract arrays from responses
            const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse.data || []);
            const favorites = Array.isArray(favoritesResponse) ? favoritesResponse : (favoritesResponse.data || []);
            const garage = Array.isArray(garageResponse) ? garageResponse : (garageResponse.data || []);

            setDashboardData({
                ordersCount: orders.length,
                walletBalance: wallet.balance || 0,
                favoritesCount: favorites.length,
                vehiclesCount: garage.length,
                recentOrders: orders.slice(0, 2), // Get latest 2 orders
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('فشل تحميل بيانات لوحة التحكم');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const getOrderStatus = (status: string) => {
        const statusMap: Record<string, { text: string; variant: any }> = {
            pending: { text: 'قيد الانتظار', variant: 'warning' },
            quoted: { text: 'تم تلقي عروض', variant: 'info' },
            accepted: { text: 'تم القبول', variant: 'success' },
            in_progress: { text: 'قيد التنفيذ', variant: 'info' },
            completed: { text: 'مكتمل', variant: 'success' },
            cancelled: { text: 'ملغي', variant: 'danger' },
        };
        return statusMap[status] || statusMap.pending;
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'منذ دقائق';
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        if (diffDays === 1) return 'منذ يوم واحد';
        return `منذ ${diffDays} أيام`;
    };

    const stats = [
        {
            label: 'طلباتي',
            value: dashboardData.ordersCount.toString(),
            icon: 'document-text',
            color: '#007AFF',
            screen: 'orders'
        },
        {
            label: 'المحفظة',
            value: `${dashboardData.walletBalance.toLocaleString('ar-SY')} ل.س`,
            icon: 'wallet',
            color: '#34C759',
            screen: 'wallet'
        },
        {
            label: 'المفضلة',
            value: dashboardData.favoritesCount.toString(),
            icon: 'heart',
            color: '#FF3B30',
            screen: 'favorites'
        },
        {
            label: 'المرآب',
            value: dashboardData.vehiclesCount.toString(),
            icon: 'car',
            color: '#FF9500',
            screen: 'garage'
        },
    ];

    const quickActions = [
        { label: 'طلب قطعة', icon: 'add-circle', color: '#007AFF', screen: 'new-order' },
        { label: 'تصفح السيارات', icon: 'car-sport', color: '#5856D6', screen: 'marketplace' },
        { label: 'المزادات', icon: 'hammer', color: '#FF9500', screen: 'auctions' },
        { label: 'المتجر', icon: 'storefront', color: '#34C759', screen: 'store' },
    ];

    if (loading && !refreshing) {
        return <LoadingState message="جاري تحميل لوحة التحكم..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchDashboardData} />;
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
        >
            {/* Welcome Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>مرحباً</Text>
                <Text style={styles.userName}>{userName}</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.statCard}
                        onPress={() => onNavigate(stat.screen)}
                    >
                        <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                            <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
                <View style={styles.actionsGrid}>
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.actionCard}
                            onPress={() => onNavigate(action.screen)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                                <Ionicons name={action.icon as any} size={28} color="#FFFFFF" />
                            </View>
                            <Text style={styles.actionLabel}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Recent Orders */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>طلباتي الأخيرة</Text>
                    <TouchableOpacity onPress={() => onNavigate('orders')}>
                        <Text style={styles.seeAll}>عرض الكل</Text>
                    </TouchableOpacity>
                </View>

                {dashboardData.recentOrders.length > 0 ? (
                    dashboardData.recentOrders.map((order, index) => {
                        const status = getOrderStatus(order.status);
                        return (
                            <TouchableOpacity
                                key={order.id || `order-${index}`}
                                onPress={() => onNavigate(`order/${order.id}`)}
                            >
                                <Card style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <Text style={styles.orderNumber}>طلب #{order.orderNumber || order.id}</Text>
                                        <Badge text={status.text} variant={status.variant} />
                                    </View>
                                    <Text style={styles.orderDetails}>
                                        {order.part_description || `${order.brand} ${order.model} ${order.year}`}
                                    </Text>
                                    <Text style={styles.orderDate}>
                                        {formatTimeAgo(order.created_at)}
                                    </Text>
                                </Card>
                            </TouchableOpacity>
                        );
                    })
                ) : (
                    <Card style={styles.orderCard}>
                        <Text style={styles.emptyText}>لا توجد طلبات حالياً</Text>
                    </Card>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#007AFF',
    },
    greeting: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAll: {
        fontSize: 14,
        color: '#007AFF',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
    },
    orderCard: {
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 12,
        color: '#999',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        padding: 20,
    },
});
