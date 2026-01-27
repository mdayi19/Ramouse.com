import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TowTruckService } from '@/services/towtruck.service';

export default function TowTruckRequestsScreen() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const data = await TowTruckService.getRequests();
            setRequests(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openMaps = (lat: number, lng: number) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = 'موقع العميل';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        if (url) Linking.openURL(url);
    };

    const renderRequestItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.customerName}>{item.customerName || 'عميل في وضع طارئ'}</Text>
                <Text style={styles.timeAgo}>منذ 5 دقائق</Text>
            </View>

            <View style={styles.locationDetails}>
                <Ionicons name="location" size={20} color="#ef4444" />
                <Text style={styles.address}>{item.address || 'طريق المطار، قرب الجسر الرابع'}</Text>
            </View>

            <Text style={styles.description}>{item.notes || 'السيارة معطلة بالكامل وبحاجة لسحب للورشة.'}</Text>

            <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => openMaps(item.lat || 33.5138, item.lng || 36.2765)}>
                    <Ionicons name="navigate" size={18} color="#fff" />
                    <Text style={styles.btnText}>توجيه</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnSecondary]}>
                    <Ionicons name="call" size={18} color="#0f172a" />
                    <Text style={[styles.btnText, { color: '#0f172a' }]}>اتصال</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>طلبات الإنقاذ</Text>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#d97706" />
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Ionicons name="checkmark-circle-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyText}>لا توجد طلبات جديدة حالياً</Text>
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
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    timeAgo: {
        fontSize: 12,
        color: '#64748b',
    },
    locationDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#fef2f2',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    address: {
        fontSize: 14,
        color: '#7f1d1d',
        flex: 1,
    },
    description: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 16,
        lineHeight: 20,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    btn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    btnPrimary: {
        backgroundColor: '#ef4444',
    },
    btnSecondary: {
        backgroundColor: '#f1f5f9',
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
    },
});
