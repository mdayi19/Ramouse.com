import React from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFavorites } from '@/hooks';
import { CarCard, LoadingState, ErrorState } from '@/components';
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const router = useRouter();
    const { data: favorites = [], isLoading, error, refetch, isRefetching } = useFavorites();

    if (isLoading && !isRefetching) {
        return <LoadingState message="جاري تحميل المفضلة..." />;
    }

    if (error) {
        return (
            <ErrorState
                message="فشل تحميل المفضلة. يرجى المحاولة مرة أخرى."
                onRetry={() => refetch()}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={styles.title}>
                    ⭐ المفضلة
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    {favorites.length} سيارة محفوظة
                </Text>
            </View>

            <FlatList
                data={favorites}
                renderItem={({ item }) => <CarCard car={item} />}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text variant="headlineSmall" style={styles.emptyEmoji}>
                            💔
                        </Text>
                        <Text variant="titleLarge" style={styles.emptyTitle}>
                            لا توجد سيارات في المفضلة
                        </Text>
                        <Text variant="bodyMedium" style={styles.emptyText}>
                            ابدأ بإضافة السيارات التي تعجبك إلى المفضلة
                        </Text>
                    </View>
                }
            />

            <FAB
                icon="magnify"
                style={styles.fab}
                onPress={() => router.push('/(customer)/marketplace')}
                label="تصفح السيارات"
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
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
