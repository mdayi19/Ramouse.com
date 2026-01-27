import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Button, Divider, Portal, Modal, TextInput, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useWalletBalance,
    useTransactions,
    useDeposits,
    useWithdrawals,
    useSubmitDeposit,
    useSubmitWithdrawal,
    useSavedPaymentMethods,
    useDeletePaymentMethod
} from '@/hooks';
import { LoadingState, ErrorState, ImagePicker, PaymentMethodCard } from '@/components';

type TabType = 'transactions' | 'deposits' | 'withdrawals' | 'payment-methods';

export default function WalletScreen() {
    const { data: walletData, isLoading: balanceLoading, refetch: refetchBalance } = useWalletBalance();
    const { data: transactions = [], isLoading: transactionsLoading, error, refetch: refetchTransactions, isRefetching } = useTransactions();
    const { data: deposits = [], refetch: refetchDeposits } = useDeposits();
    const { data: withdrawals = [], refetch: refetchWithdrawals } = useWithdrawals();
    const { data: paymentMethods = [], refetch: refetchPaymentMethods } = useSavedPaymentMethods();

    const submitDeposit = useSubmitDeposit();
    const submitWithdrawal = useSubmitWithdrawal();
    const deletePaymentMethod = useDeletePaymentMethod();

    const [activeTab, setActiveTab] = useState<TabType>('transactions');
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

    // Deposit form
    const [depositAmount, setDepositAmount] = useState('');
    const [depositMethod, setDepositMethod] = useState('');
    const [depositReceipt, setDepositReceipt] = useState('');

    // Withdrawal form
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('');
    const [withdrawDetails, setWithdrawDetails] = useState('');
    const [saveMethod, setSaveMethod] = useState(false);

    // Payment methods (mock data - should come from settings)
    const availablePaymentMethods = [
        { id: '1', name: 'سيرياتيل كاش' },
        { id: '2', name: 'MTN كاش' },
        { id: '3', name: 'حوالة بنكية' },
        { id: '4', name: 'ويسترن يونيون' },
    ];

    if (balanceLoading || transactionsLoading) {
        return <LoadingState message="جاري تحميل المحفظة..." />;
    }

    if (error) {
        console.error('Wallet error:', error);
        return (
            <ErrorState
                message="فشل تحميل المحفظة. يرجى المحاولة مرة أخرى."
                onRetry={() => {
                    refetchTransactions();
                    refetchBalance();
                }}
            />
        );
    }

    const balance = walletData?.balance || walletData?.availableBalance || 0;

    const handleRefresh = () => {
        refetchTransactions();
        refetchBalance();
        refetchDeposits();
        refetchWithdrawals();
        refetchPaymentMethods();
    };

    const handleSubmitDeposit = async () => {
        if (!depositAmount || !depositMethod || !depositReceipt) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول وإرفاق إيصال الدفع');
            return;
        }

        try {
            await submitDeposit.mutateAsync({
                amount: parseFloat(depositAmount),
                paymentMethodId: depositMethod,
                paymentMethodName: availablePaymentMethods.find(m => m.id === depositMethod)?.name || '',
                receipt: { uri: depositReceipt, type: 'image/jpeg', name: 'receipt.jpg' },
            });

            Alert.alert('نجح', 'تم تقديم طلب الإيداع بنجاح');
            setShowDepositModal(false);
            setDepositAmount('');
            setDepositMethod('');
            setDepositReceipt('');
        } catch (err) {
            Alert.alert('خطأ', 'فشل تقديم طلب الإيداع');
        }
    };

    const handleSubmitWithdrawal = async () => {
        if (!withdrawAmount || !withdrawMethod || !withdrawDetails) {
            Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
            return;
        }

        if (parseFloat(withdrawAmount) > balance) {
            Alert.alert('خطأ', 'المبلغ المطلوب أكبر من الرصيد المتاح');
            return;
        }

        try {
            await submitWithdrawal.mutateAsync({
                amount: parseFloat(withdrawAmount),
                paymentMethodId: withdrawMethod,
                paymentMethodName: availablePaymentMethods.find(m => m.id === withdrawMethod)?.name || '',
                details: withdrawDetails,
            });

            Alert.alert('نجح', 'تم تقديم طلب السحب بنجاح');
            setShowWithdrawalModal(false);
            setWithdrawAmount('');
            setWithdrawMethod('');
            setWithdrawDetails('');
            setSaveMethod(false);
        } catch (err) {
            Alert.alert('خطأ', 'فشل تقديم طلب السحب');
        }
    };

    const handleDeletePaymentMethod = (methodId: string) => {
        Alert.alert(
            'تأكيد الحذف',
            'هل أنت متأكد من حذف طريقة الدفع هذه؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePaymentMethod.mutateAsync(methodId);
                            Alert.alert('نجح', 'تم حذف طريقة الدفع بنجاح');
                        } catch (err) {
                            Alert.alert('خطأ', 'فشل حذف طريقة الدفع');
                        }
                    },
                },
            ]
        );
    };

    const getTransactionIcon = (type: string) => {
        const icons: Record<string, string> = {
            deposit: '⬇️',
            withdrawal: '⬆️',
            payment: '💳',
            refund: '↩️',
        };
        return icons[type] || '💰';
    };

    const getTransactionColor = (type: string) => {
        const colors: Record<string, string> = {
            deposit: '#2ecc71',
            withdrawal: '#e74c3c',
            payment: '#3498db',
            refund: '#f39c12',
        };
        return colors[type] || '#95a5a6';
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: '#f39c12',
            approved: '#2ecc71',
            rejected: '#e74c3c',
        };
        return colors[status] || '#95a5a6';
    };

    const renderTransaction = ({ item }: { item: any }) => (
        <Card style={styles.transactionCard}>
            <Card.Content>
                <View style={styles.transactionRow}>
                    <View style={styles.transactionInfo}>
                        <Text variant="titleMedium" style={styles.transactionTitle}>
                            {getTransactionIcon(item.type)} {item.description || 'معاملة'}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                            {new Date(item.timestamp || item.created_at).toLocaleDateString('ar-SA')}
                        </Text>
                    </View>
                    <Text
                        variant="titleLarge"
                        style={[
                            styles.transactionAmount,
                            { color: getTransactionColor(item.type) },
                        ]}
                    >
                        {item.type === 'deposit' || item.type === 'refund' ? '+' : '-'}$
                        {item.amount?.toLocaleString()}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );

    const renderDeposit = ({ item }: { item: any }) => (
        <Card style={styles.transactionCard}>
            <Card.Content>
                <View style={styles.transactionRow}>
                    <View style={styles.transactionInfo}>
                        <Text variant="titleMedium">${item.amount}</Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                            {item.payment_method_name || item.paymentMethodName}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                            {new Date(item.created_at || item.requestTimestamp).toLocaleDateString('ar-SA')}
                        </Text>
                    </View>
                    <Chip
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: '#fff' }}
                    >
                        {item.status === 'pending' ? 'قيد المراجعة' : item.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );

    const renderWithdrawal = ({ item }: { item: any }) => (
        <Card style={styles.transactionCard}>
            <Card.Content>
                <View style={styles.transactionRow}>
                    <View style={styles.transactionInfo}>
                        <Text variant="titleMedium">${item.amount}</Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                            {item.payment_method_name || item.paymentMethodName}
                        </Text>
                        <Text variant="bodySmall" style={styles.transactionDate}>
                            {new Date(item.created_at || item.requestTimestamp).toLocaleDateString('ar-SA')}
                        </Text>
                    </View>
                    <Chip
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: '#fff' }}
                    >
                        {item.status === 'pending' ? 'قيد المراجعة' : item.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                    />
                }
            >
                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text variant="titleMedium" style={styles.balanceLabel}>
                        💰 الرصيد الحالي
                    </Text>
                    <Text variant="displaySmall" style={styles.balance}>
                        ${balance.toLocaleString()}
                    </Text>

                    <View style={styles.actionButtons}>
                        <Button
                            mode="contained"
                            onPress={() => setShowDepositModal(true)}
                            style={styles.actionButton}
                        >
                            إيداع
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => setShowWithdrawalModal(true)}
                            style={styles.actionButton}
                            disabled={balance <= 0}
                        >
                            سحب
                        </Button>
                    </View>
                </View>

                <Divider style={styles.divider} />

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <Button
                        mode={activeTab === 'transactions' ? 'contained' : 'outlined'}
                        onPress={() => setActiveTab('transactions')}
                        style={styles.tabButton}
                    >
                        المعاملات
                    </Button>
                    <Button
                        mode={activeTab === 'deposits' ? 'contained' : 'outlined'}
                        onPress={() => setActiveTab('deposits')}
                        style={styles.tabButton}
                    >
                        الإيداعات
                    </Button>
                    <Button
                        mode={activeTab === 'withdrawals' ? 'contained' : 'outlined'}
                        onPress={() => setActiveTab('withdrawals')}
                        style={styles.tabButton}
                    >
                        السحوبات
                    </Button>
                    <Button
                        mode={activeTab === 'payment-methods' ? 'contained' : 'outlined'}
                        onPress={() => setActiveTab('payment-methods')}
                        style={styles.tabButton}
                    >
                        طرق الدفع
                    </Button>
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'transactions' && (
                        transactions.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text variant="headlineSmall" style={styles.emptyEmoji}>💸</Text>
                                <Text variant="titleMedium" style={styles.emptyTitle}>لا توجد معاملات</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={transactions}
                                renderItem={renderTransaction}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                scrollEnabled={false}
                            />
                        )
                    )}

                    {activeTab === 'deposits' && (
                        deposits.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text variant="headlineSmall" style={styles.emptyEmoji}>⬇️</Text>
                                <Text variant="titleMedium" style={styles.emptyTitle}>لا توجد طلبات إيداع</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={deposits}
                                renderItem={renderDeposit}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                scrollEnabled={false}
                            />
                        )
                    )}

                    {activeTab === 'withdrawals' && (
                        withdrawals.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text variant="headlineSmall" style={styles.emptyEmoji}>⬆️</Text>
                                <Text variant="titleMedium" style={styles.emptyTitle}>لا توجد طلبات سحب</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={withdrawals}
                                renderItem={renderWithdrawal}
                                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                                scrollEnabled={false}
                            />
                        )
                    )}

                    {activeTab === 'payment-methods' && (
                        paymentMethods.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text variant="headlineSmall" style={styles.emptyEmoji}>💳</Text>
                                <Text variant="titleMedium" style={styles.emptyTitle}>لا توجد طرق دفع محفوظة</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={paymentMethods}
                                renderItem={({ item }) => (
                                    <PaymentMethodCard
                                        methodName={item.methodName || item.method_name}
                                        details={item.details}
                                        onDelete={() => handleDeletePaymentMethod(item.methodId || item.id)}
                                    />
                                )}
                                keyExtractor={(item, index) => item.methodId?.toString() || item.id?.toString() || index.toString()}
                                scrollEnabled={false}
                            />
                        )
                    )}
                </View>
            </ScrollView>

            {/* Deposit Modal */}
            <Portal>
                <Modal
                    visible={showDepositModal}
                    onDismiss={() => setShowDepositModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="headlineSmall" style={styles.modalTitle}>إيداع رصيد</Text>

                    <TextInput
                        label="المبلغ ($)"
                        value={depositAmount}
                        onChangeText={setDepositAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="طريقة الدفع"
                        value={depositMethod}
                        onChangeText={setDepositMethod}
                        mode="outlined"
                        style={styles.input}
                        right={<TextInput.Icon icon="chevron-down" />}
                    />

                    <Text variant="bodyMedium" style={styles.label}>إيصال الدفع</Text>
                    <ImagePicker
                        onImageSelected={setDepositReceipt}
                        currentImage={depositReceipt}
                    />

                    <View style={styles.modalButtons}>
                        <Button mode="outlined" onPress={() => setShowDepositModal(false)} style={styles.modalButton}>
                            إلغاء
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmitDeposit}
                            loading={submitDeposit.isPending}
                            style={styles.modalButton}
                        >
                            تقديم
                        </Button>
                    </View>
                </Modal>
            </Portal>

            {/* Withdrawal Modal */}
            <Portal>
                <Modal
                    visible={showWithdrawalModal}
                    onDismiss={() => setShowWithdrawalModal(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <Text variant="headlineSmall" style={styles.modalTitle}>سحب رصيد</Text>

                    <TextInput
                        label="المبلغ ($)"
                        value={withdrawAmount}
                        onChangeText={setWithdrawAmount}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                    />

                    <TextInput
                        label="طريقة الاستلام"
                        value={withdrawMethod}
                        onChangeText={setWithdrawMethod}
                        mode="outlined"
                        style={styles.input}
                        right={<TextInput.Icon icon="chevron-down" />}
                    />

                    <TextInput
                        label="تفاصيل الحساب"
                        value={withdrawDetails}
                        onChangeText={setWithdrawDetails}
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                        style={styles.input}
                    />

                    <View style={styles.modalButtons}>
                        <Button mode="outlined" onPress={() => setShowWithdrawalModal(false)} style={styles.modalButton}>
                            إلغاء
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleSubmitWithdrawal}
                            loading={submitWithdrawal.isPending}
                            style={styles.modalButton}
                        >
                            تقديم
                        </Button>
                    </View>
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    balanceCard: {
        backgroundColor: '#fff',
        padding: 24,
        margin: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
    },
    balanceLabel: {
        marginBottom: 8,
        color: '#666',
    },
    balance: {
        fontWeight: 'bold',
        color: '#2ecc71',
        marginBottom: 24,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionButton: {
        flex: 1,
    },
    divider: {
        marginVertical: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        flexWrap: 'wrap',
    },
    tabButton: {
        flex: 1,
        minWidth: 100,
    },
    tabContent: {
        padding: 16,
    },
    transactionCard: {
        marginBottom: 8,
    },
    transactionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionInfo: {
        flex: 1,
    },
    transactionTitle: {
        marginBottom: 4,
    },
    transactionDate: {
        color: '#999',
    },
    transactionAmount: {
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        marginBottom: 8,
    },
    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    modalTitle: {
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        marginTop: 8,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
    },
});
