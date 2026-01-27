import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Button, Surface, Card, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser, useFavorites, useOrders, useWalletBalance } from '@/hooks';
import { LoadingState } from '@/components';

export default function CustomerDashboard() {
    const router = useRouter();
    const user = useCurrentUser();
    const { data: favorites = [], refetch: refetchFavorites, isRefetching: favoritesRefetching } = useFavorites();
    const { data: orders = [], refetch: refetchOrders, isRefetching: ordersRefetching } = useOrders();
    const { data: walletData, refetch: refetchWallet, isRefetching: walletRefetching } = useWalletBalance();

    const isRefreshing = favoritesRefetching || ordersRefetching || walletRefetching;

    const handleRefresh = () => {
        refetchFavorites();
        refetchOrders();
        refetchWallet();
    };

    if (!user) {
        return <LoadingState message="جاري التحميل..." />;
    }

    const balance = walletData?.balance || 0;
    const favoritesCount = favorites.length;
    const ordersCount = orders.length;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header */}
                <Surface style={styles.header}>
                    <View style={styles.headerContent}>
                        <View>
                            <Text variant="headlineMedium" style={styles.welcome}>
                                مرحباً {user?.name || 'عزيزي العميل'} 👋
                            </Text>
                            <Text variant="bodyMedium" style={styles.subtitle}>
                                لوحة تحكم العميل
                            </Text>
                        </View>
                        <Avatar.Text
                            size={60}
                            label={user.name?.charAt(0) || 'U'}
                            style={styles.avatar}
                        />
                    </View>
                </Surface>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                {favoritesCount}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                المفضلة
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                {ordersCount}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                الطلبات
                            </Text>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statContent}>
                            <Text variant="headlineSmall" style={styles.statNumber}>
                                ${balance.toLocaleString()}
                            </Text>
                            <Text variant="bodySmall" style={styles.statLabel}>
                                الرصيد
                            </Text>
                        </Card.Content>
                    </Card>
                </View>

                {/* Main Features */}
                <View style={styles.content}>
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleLarge">📝 طلب قطعة جديدة</Text>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                اطلب قطع غيار لسيارتك واحصل على عروض من الموردين
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="contained"
                                onPress={() => router.push('/(customer)/new-order')}
                                buttonColor="#2ecc71"
                            >
                                طلب جديد
                            </Button>
                        </Card.Actions>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleLarge">🚗 سوق السيارات</Text>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                تصفح آلاف السيارات المعروضة للبيع والإيجار
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="contained"
                                onPress={() => router.push('/(customer)/marketplace')}
                            >
                                تصفح الآن
                            </Button>
                        </Card.Actions>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <Text variant="titleLarge">⭐ المفضلة</Text>
                                {favoritesCount > 0 && (
                                    <Chip style={styles.badge}>{favoritesCount}</Chip>
                                )}
                            </View>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                السيارات والإعلانات المحفوظة
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="outlined"
                                onPress={() => router.push('/(customer)/favorites')}
                            >
                                عرض المفضلة
                            </Button>
                        </Card.Actions>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.cardHeader}>
                                <Text variant="titleLarge">📋 طلباتي</Text>
                                {ordersCount > 0 && (
                                    <Chip style={styles.badge}>{ordersCount}</Chip>
                                )}
                            </View>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                تتبع طلباتك وحالتها
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="outlined"
                                onPress={() => router.push('/(customer)/orders')}
                            >
                                عرض الطلبات
                            </Button>
                        </Card.Actions>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleLarge">💰 المحفظة</Text>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                إدارة رصيدك والمعاملات المالية
                            </Text>
                            <Text variant="headlineMedium" style={styles.balanceText}>
                                ${balance.toLocaleString()}
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="outlined"
                                onPress={() => router.push('/(customer)/wallet')}
                            >
                                عرض المحفظة
                            </Button>
                        </Card.Actions>
                    </Card>

                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleLarge">👤 الملف الشخصي</Text>
                            <Text variant="bodyMedium" style={styles.cardText}>
                                إدارة معلوماتك الشخصية والإعدادات
                            </Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button
                                mode="outlined"
                                onPress={() => router.push('/(customer)/profile')}
                            >
                                عرض الملف الشخصي
                            </Button>
                        </Card.Actions>
                    </Card>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 20,
        elevation: 2,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcome: {
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#666',
        marginTop: 4,
    },
    avatar: {
        backgroundColor: '#6366f1',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        elevation: 1,
    },
    statContent: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    statNumber: {
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        color: '#666',
        marginTop: 4,
    },
    content: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#3498db',
    },
    cardText: {
        marginTop: 8,
        color: '#666',
    },
    balanceText: {
        marginTop: 8,
        fontWeight: 'bold',
        color: '#2ecc71',
    },
});
