import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared';

interface Transaction {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'failed';
}

interface TransactionCardProps {
    transaction: Transaction;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
    transaction,
}) => {
    const isCredit = transaction.type === 'credit';
    const isPending = transaction.status === 'pending';
    const isFailed = transaction.status === 'failed';

    const getIcon = () => {
        if (isCredit) return 'arrow-down-circle';
        return 'arrow-up-circle';
    };

    const getIconColor = () => {
        if (isFailed) return '#FF3B30';
        if (isPending) return '#FF9500';
        return isCredit ? '#34C759' : '#FF3B30';
    };

    const getAmountColor = () => {
        if (isFailed) return '#94a3b8';
        if (isPending) return '#64748b';
        return isCredit ? '#34C759' : '#FF3B30';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Card style={styles.card} padding={12}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={getIcon()} size={32} color={getIconColor()} />
                </View>

                <View style={styles.details}>
                    <Text style={styles.description}>{transaction.description}</Text>
                    <Text style={styles.date}>{formatDate(transaction.date)}</Text>
                    {isPending && (
                        <Text style={styles.statusPending}>قيد المعالجة</Text>
                    )}
                    {isFailed && <Text style={styles.statusFailed}>فشلت</Text>}
                </View>

                <View style={styles.amountContainer}>
                    <Text style={[styles.amount, { color: getAmountColor() }]}>
                        {isCredit ? '+' : '-'}
                        {transaction.amount.toLocaleString('ar-SY')} ل.س
                    </Text>
                </View>
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    details: {
        flex: 1,
    },
    description: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'right',
    },
    date: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'right',
    },
    statusPending: {
        fontSize: 11,
        color: '#FF9500',
        marginTop: 2,
        textAlign: 'right',
    },
    statusFailed: {
        fontSize: 11,
        color: '#FF3B30',
        marginTop: 2,
        textAlign: 'right',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
