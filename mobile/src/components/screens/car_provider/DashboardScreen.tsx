import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CarProviderService } from '@/services/carprovider.service';
import { useAuthStore } from '@/store/authStore';

export default function CarProviderDashboard() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await CarProviderService.getProviderStats();
            setStats(data?.stats || {});
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
                        <Text style={styles.greeting}>مرحباً بك 🚗</Text>
                        <Text style={styles.userName}>{user?.name || 'معرض سيارات'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(car-provider)/profile')}>
                        <Image
                            source={user?.profilePhoto ? { uri: user.profilePhoto } : { uri: 'https://placehold.co/100?text=Shop' }}
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
                        label="السيارات النشطة"
                        value={stats?.total_listings || 0}
                        icon="car-sport"
                        color="#2563eb"
                        bgColor="#dbeafe"
                    />
                    <StatCard
                        label="المشاهدات"
                        value={stats?.total_views || 0}
                        icon="eye"
                        color="#7c3aed"
                        bgColor="#ede9fe"
                    />
                    <StatCard
                        label="الرصيد"
                        value={`${user?.wallet_balance || 0} $`}
                        icon="wallet"
                        color="#059669"
                        bgColor="#d1fae5"
                    />
                    <StatCard
                        label="المفضلة"
                        value={stats?.total_favorites || 0}
                        icon="heart"
                        color="#dc2626"
                        bgColor="#fee2e2"
                    />
                </View>

                {/* Call to Action */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => router.push('/(car-provider)/add-listing')}
                >
                    <View style={styles.ctaIconContainer}>
                        <Ionicons name="add" size={32} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.ctaTitle}>إضافة سيارة جديدة</Text>
                        <Text style={styles.ctaSubtitle}>اعرض سيارتك للبيع أو الإيجار الآن</Text>
                    </View>
                    <Ionicons name="chevron-back" size={24} color="#fff" style={{ marginRight: 'auto' }} />
                </TouchableOpacity>

                {/* Quick Actions */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>الوصول السريع</Text>
                </View>

                <View style={styles.actionsGrid}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(car-provider)/listings')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#e0f2fe' }]}>
                            <Ionicons name="list" size={24} color="#0284c7" />
                        </View>
                        <Text style={styles.actionLabel}>إدارة السيارات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(car-provider)/profile')}>
                        <View style={[styles.actionIcon, { backgroundColor: '#f3e8ff' }]}>
                            <Ionicons name="settings" size={24} color="#7c3aed" />
                        </View>
                        <Text style={styles.actionLabel}>الإعدادات</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <View style={[styles.actionIcon, { backgroundColor: '#ffedd5' }]}>
                            <Ionicons name="stats-chart" size={24} color="#ea580c" />
                        </View>
                        <Text style={styles.actionLabel}>التحليلات</Text>
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    ctaButton: {
        backgroundColor: '#2563eb',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        shadowColor: '#2563eb',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    ctaIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ctaTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    ctaSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
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
