import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TowTruckService } from '@/services/towtruck.service';
import { useAuthStore } from '@/store/authStore';

export default function TowTruckDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await TowTruckService.getDashboardStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const StatCard = ({ label, value, icon, color, bgColor }: any) => (
        <View style={[styles.statCard, { backgroundColor: bgColor }]}>
            <View style={styles.statHeader}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={[styles.statValue, { color }]}>{value}</Text>
            </View>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>مرحباً بك 🚚</Text>
                        <Text style={styles.userName}>{user?.name || 'سائق ونش'}</Text>
                    </View>
                    <Image
                        source={user?.profilePhoto ? { uri: user.profilePhoto } : { uri: 'https://placehold.co/100?text=Truck' }}
                        style={styles.profilePhoto}
                    />
                </View>

                {/* Status */}
                <View style={[styles.statusBanner, user?.isVerified ? styles.statusVerified : styles.statusPending]}>
                    <Ionicons
                        name={user?.isVerified ? "checkmark-circle" : "time"}
                        size={20}
                        color={user?.isVerified ? "#15803d" : "#b45309"}
                    />
                    <Text style={[styles.statusText, { color: user?.isVerified ? "#15803d" : "#b45309" }]}>
                        {user?.isVerified ? 'حساب موثوق ✅' : 'بانتظار التوثيق ⏳'}
                    </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        label="طلبات السحب"
                        value={stats?.totalRequests || 0}
                        icon="car-sport"
                        color="#d97706"
                        bgColor="#fef3c7"
                    />
                    <StatCard
                        label="تم الإنجاز"
                        value={stats?.completedRequests || 0}
                        icon="checkmark-done"
                        color="#16a34a"
                        bgColor="#dcfce7"
                    />
                </View>

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>التحكم السريع</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tow-truck)/requests')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="notifications" size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.actionLabel}>طلبات الإنقاذ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => alert('تم تحديث الموقع')} // Placeholder for real geolocation update
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="navigate" size={24} color="#0284c7" />
                        </View>
                        <Text style={styles.actionLabel}>تحديث الموقع</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    profilePhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f1f5f9',
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 24,
        gap: 8,
    },
    statusVerified: {
        backgroundColor: '#dcfce7',
    },
    statusPending: {
        backgroundColor: '#fef3c7',
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 4,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    sectionHeader: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    actionsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
    },
});
