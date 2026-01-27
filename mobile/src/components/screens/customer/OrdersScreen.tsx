import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOrders } from '@/hooks';
import { LoadingState, ErrorState } from '@/components';
import type { Order } from '@/services/order.service';

export default function OrdersScreen() {
    const router = useRouter();
    const { data: orders = [], isLoading, error, refetch, isRefetching } = useOrders();

    if (isLoading && !isRefetching) {
        return <LoadingState message="جاري تحميل الطلبات..." />;
    }

    if (error) {
        return (
            <ErrorState
                message="فشل تحميل الطلبات. يرجى المحاولة مرة أخرى."
                onRetry={() => refetch()}
            />
        );
    }

    const getStatusColor = (status: string) => {
        const statusColors: Record<string, string> = {
            'قيد المراجعة': '#f39c12',
            pending: '#f39c12',
            'في انتظار العروض': '#3498db',
            'تم قبول العرض': '#2ecc71',
            'قيد التوصيل': '#9b59b6',
            'تم التوصيل': '#27ae60',
            completed: '#27ae60',
            'ملغي': '#e74c3c',
            cancelled: '#e74c3c',
        };
        return statusColors[status] || '#95a5a6';
    };

    const getStatusLabel = (status: string) => {
        const statusLabels: Record<string, string> = {
            pending: 'قيد المراجعة',
            'قيد المراجعة': 'قيد المراجعة',
            'في انتظار العروض': 'في انتظار العروض',
            'تم قبول العرض': 'تم قبول العرض',
            'قيد التوصيل': 'قيد التوصيل',
            'تم التوصيل': 'تم التوصيل',
            completed: 'مكتمل',
            'ملغي': 'ملغي',
            cancelled: 'ملغي',
        };
        return statusLabels[status] || status;
    };

    const renderOrder = ({ item }: { item: Order }) => {
        const quotesCount = item.quotes?.length || 0;
        const newQuotesCount = item.quotes?.filter(q => !q.viewedByCustomer).length || 0;

        return (
            <TouchableOpacity
                onPress={() => router.push(`/(customer)/order/${item.orderNumber}`)}
                activeOpacity={0.7}
            >
                <Card style={styles.orderCard}>
                    <Card.Content>
                        <View style={styles.orderHeader}>
                            <View style={styles.orderInfo}>
                                <Text variant="titleMedium" style={styles.orderId}>
                                    طلب #{item.orderNumber}
                                </Text>
                                <Text variant="bodySmall" style={styles.carInfo}>
                                    {item.brand} {item.model} ({item.year})
                                </Text>
                            </View>
                            <Chip
                                style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
                                textStyle={styles.statusText}
                            >
                                {getStatusLabel(item.status)}
                            </Chip>
                        </View>

                        <Text variant="bodyMedium" style={styles.orderDate}>
                            📅 {new Date(item.created_at).toLocaleDateString('ar-SA')}
                        </Text>

                        <Text variant="bodySmall" style={styles.partDescription} numberOfLines={2}>
                            {item.part_description}
                        </Text>

                        {quotesCount > 0 && (
                            <View style={styles.quotesRow}>
                                <Chip
                                    icon="tag-multiple"
                                    style={styles.quotesChip}
                                    textStyle={styles.quotesChipText}
                                >
                                    {quotesCount} عرض
                                </Chip>
                                {newQuotesCount > 0 && (
                                    <Chip
                                        style={styles.newQuotesChip}
                                        textStyle={styles.newQuotesText}
                                    >
                                        {newQuotesCount} جديد
                                    </Chip>
                                )}
                            </View>
                        )}
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    📋 طلباتي
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    {orders.length} طلب
                </Text>
            </View>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item.orderNumber}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text variant="headlineSmall" style={styles.emptyEmoji}>
                            📦
                        </Text>
                        <Text variant="titleLarge" style={styles.emptyTitle}>
                            لا توجد طلبات
                        </Text>
                        <Text variant="bodyMedium" style={styles.emptyText}>
                            لم تقم بأي طلبات بعد
                        </Text>
                    </View>
                }
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
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginTop: 4,
    },
    listContent: {
        padding: 16,
    },
    orderCard: {
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontWeight: 'bold',
    },
    carInfo: {
        color: '#666',
        marginTop: 2,
    },
    statusChip: {
        height: 28,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    orderDate: {
        color: '#666',
        marginBottom: 8,
    },
    partDescription: {
        color: '#666',
        marginBottom: 8,
    },
    quotesRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    quotesChip: {
        backgroundColor: '#3498db',
        height: 28,
    },
    quotesChipText: {
        color: '#fff',
        fontSize: 12,
    },
    newQuotesChip: {
        backgroundColor: '#e74c3c',
        height: 28,
    },
    newQuotesText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
});
