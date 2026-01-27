import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TechnicianService } from '@/services/technician.service';
import { useAuthStore } from '@/store/authStore';

export default function TechnicianDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await TechnicianService.getDashboardStats();
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
                        <Text style={styles.greeting}>صباح الخير ☀️</Text>
                        <Text style={styles.userName}>{user?.name || 'فني محترم'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(technician)/profile')}>
                        <Image
                            source={user?.profilePhoto ? { uri: user.profilePhoto } : { uri: 'https://placehold.co/100' }}
                            style={styles.profilePhoto}
                        />
                    </TouchableOpacity>
                </View>

                {/* Verification Status */}
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
                        label="إجمالي الطلبات"
                        value={stats?.totalOrders || 0}
                        icon="document-text"
                        color="#2563eb"
                        bgColor="#dbeafe"
                    />
                    <StatCard
                        label="الطلبات النشطة"
                        value={stats?.activeOrders || 0}
                        icon="hourglass"
                        color="#d97706"
                        bgColor="#fef3c7"
                    />
                    <StatCard
                        label="قيد الانتظار"
                        value={stats?.pendingRequests || 0}
                        icon="time"
                        color="#7c3aed"
                        bgColor="#ede9fe"
                    />
                    <StatCard
                        label="تم الإنجاز"
                        value={stats?.completedOrders || 0}
                        icon="checkmark-done"
                        color="#059669"
                        bgColor="#d1fae5"
                    />
                </View>

                {/* Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(technician)/jobs')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="briefcase" size={24} color="#0284c7" />
                        </View>
                        <Text style={styles.actionLabel}>المهام الحالية</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(technician)/profile')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#fce7f3' }]}>
                            <Ionicons name="person" size={24} color="#db2777" />
                        </View>
                        <Text style={styles.actionLabel}>تحديث الملف</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => TechnicianService.toggleAvailability().then(() => {
                            alert('تم تحديث حالتك');
                            fetchStats();
                        })}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#dcfce7' }]}>
                            <Ionicons name="power" size={24} color="#16a34a" />
                        </View>
                        <Text style={styles.actionLabel}>متاح/مشغول</Text>
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
