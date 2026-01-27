import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, EmptyState, LoadingState, ErrorState } from '../shared';
import { TransactionCard } from './TransactionCard';
import { CustomerService } from '@/services/customer.service';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

type FilterType = 'all' | 'credit' | 'debit';

export const WalletScreen: React.FC = () => {
    const router = useRouter();
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<
        Transaction[]
    >([]);
    const [filter, setFilter] = useState<FilterType>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWalletData();
    }, []);

    useEffect(() => {
        applyFilter();
    }, [filter, transactions]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            setError(null);

            const balanceData = await CustomerService.getWalletBalance();
            setBalance(balanceData.balance);

            const transactionsData = await CustomerService.getTransactions();
            setTransactions(transactionsData);
        } catch (err) {
            console.error('Error fetching wallet data:', err);
            setError('فشل تحميل بيانات المحفظة');
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        if (filter === 'all') {
            setFilteredTransactions(transactions);
        } else {
            setFilteredTransactions(
                transactions.filter((t) => t.type === filter)
            );
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchWalletData();
        setRefreshing(false);
    };

    const handleAddFunds = () => {
        // TODO: Navigate to add funds screen
        router.push('/(customer)/wallet/add-funds');
    };

    const handleWithdraw = () => {
        // TODO: Navigate to withdraw screen
        router.push('/(customer)/wallet/withdraw');
    };

    if (loading) {
        return <LoadingState message="جاري تحميل المحفظة..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchWalletData} />;
    }

    return (
        <View style={styles.container}>
            <Header title="المحفظة" showBack onBack={() => router.back()} />

            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListHeaderComponent={
                    <>
                        {/* Balance Card */}
                        <Card style={styles.balanceCard} padding={20}>
                            <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
                            <Text style={styles.balanceAmount}>
                                {balance.toLocaleString('ar-SY')} ل.س
                            </Text>
                            <View style={styles.balanceActions}>
                                <TouchableOpacity
                                    style={styles.balanceButton}
                                    onPress={handleAddFunds}
                                >
                                    <Ionicons name="add-circle" size={20} color="#34C759" />
                                    <Text style={styles.balanceButtonText}>إضافة رصيد</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.balanceButton}
                                    onPress={handleWithdraw}
                                >
                                    <Ionicons name="cash-outline" size={20} color="#007AFF" />
                                    <Text style={styles.balanceButtonText}>سحب</Text>
                                </TouchableOpacity>
                            </View>
                        </Card>

                        {/* Filter Tabs */}
                        <View style={styles.filterContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    filter === 'all' && styles.filterTabActive,
                                ]}
                                onPress={() => setFilter('all')}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        filter === 'all' && styles.filterTabTextActive,
                                    ]}
                                >
                                    الكل
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    filter === 'credit' && styles.filterTabActive,
                                ]}
                                onPress={() => setFilter('credit')}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        filter === 'credit' && styles.filterTabTextActive,
                                    ]}
                                >
                                    إضافات
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    filter === 'debit' && styles.filterTabActive,
                                ]}
                                onPress={() => setFilter('debit')}
                            >
                                <Text
                                    style={[
                                        styles.filterTabText,
                                        filter === 'debit' && styles.filterTabTextActive,
                                    ]}
                                >
                                    مصروفات
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionTitle}>المعاملات الأخيرة</Text>
                    </>
                }
                renderItem={({ item }) => <TransactionCard transaction={item} />}
                ListEmptyComponent={
                    <EmptyState
                        icon="wallet-outline"
                        title="لا توجد معاملات"
                        message="لم تقم بأي معاملات بعد"
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    balanceCard: {
        marginBottom: 20,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 20,
    },
    balanceActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    balanceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    balanceButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    filterTabTextActive: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'right',
    },
});
