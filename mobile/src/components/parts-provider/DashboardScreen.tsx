import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../shared';

interface DashboardScreenProps {
    providerName?: string;
    onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
    providerName = 'مزود قطع الغيار',
    onNavigate,
}) => {
    const stats = [
        { label: 'طلبات متاحة', value: '12', icon: 'document-text', color: '#007AFF', screen: 'available-orders' },
        { label: 'عروضي', value: '8', icon: 'pricetag', color: '#5856D6', screen: 'my-bids' },
        { label: 'طلبات مقبولة', value: '3', icon: 'checkmark-circle', color: '#34C759', screen: 'accepted-orders' },
        { label: 'المحفظة', value: '5,420 ر.س', icon: 'wallet', color: '#FF9500', screen: 'wallet' },
    ];

    const quickActions = [
        { label: 'الطلبات المتاحة', icon: 'search', color: '#007AFF', screen: 'available-orders' },
        { label: 'عروضي', icon: 'document', color: '#5856D6', screen: 'my-bids' },
        { label: 'المحفظة', icon: 'wallet', color: '#34C759', screen: 'wallet' },
        { label: 'الإعدادات', icon: 'settings', color: '#8E8E93', screen: 'settings' },
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Welcome Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>مرحباً</Text>
                <Text style={styles.providerName}>{providerName}</Text>
                <Text style={styles.subtitle}>لوحة تحكم مزود قطع الغيار</Text>
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

            {/* Recent Activity */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>النشاط الأخير</Text>
                    <TouchableOpacity onPress={() => onNavigate('my-bids')}>
                        <Text style={styles.seeAll}>عرض الكل</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                        <View>
                            <Text style={styles.activityTitle}>عرض جديد مقدم</Text>
                            <Text style={styles.activityOrder}>طلب #12345</Text>
                        </View>
                        <Badge text="قيد المراجعة" variant="warning" />
                    </View>
                    <Text style={styles.activityDetails}>محرك - تويوتا كامري 2020</Text>
                    <Text style={styles.activityPrice}>السعر المقترح: 2,500 ر.س</Text>
                    <Text style={styles.activityDate}>منذ ساعتين</Text>
                </Card>

                <Card style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                        <View>
                            <Text style={styles.activityTitle}>عرض مقبول</Text>
                            <Text style={styles.activityOrder}>طلب #12340</Text>
                        </View>
                        <Badge text="مقبول" variant="success" />
                    </View>
                    <Text style={styles.activityDetails}>صندوق تروس - هوندا أكورد 2019</Text>
                    <Text style={styles.activityPrice}>السعر: 3,200 ر.س</Text>
                    <Text style={styles.activityDate}>منذ يوم واحد</Text>
                </Card>
            </View>

            {/* Performance Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>ملخص الأداء</Text>
                <Card>
                    <View style={styles.performanceRow}>
                        <Text style={styles.performanceLabel}>معدل قبول العروض</Text>
                        <Text style={styles.performanceValue}>65%</Text>
                    </View>
                    <View style={styles.performanceRow}>
                        <Text style={styles.performanceLabel}>متوسط وقت الاستجابة</Text>
                        <Text style={styles.performanceValue}>2.5 ساعة</Text>
                    </View>
                    <View style={styles.performanceRow}>
                        <Text style={styles.performanceLabel}>التقييم</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.performanceValue}>4.8</Text>
                        </View>
                    </View>
                </Card>
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
        backgroundColor: '#5856D6',
    },
    greeting: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    providerName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
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
        textAlign: 'center',
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
    activityCard: {
        marginBottom: 12,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    activityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    activityOrder: {
        fontSize: 13,
        color: '#666',
    },
    activityDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    activityPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 12,
        color: '#999',
    },
    performanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    performanceLabel: {
        fontSize: 14,
        color: '#666',
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});
