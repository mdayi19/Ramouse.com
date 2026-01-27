import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../shared';

interface Quote {
    id: string;
    providerId: string;
    providerUniqueId: string;
    price: number;
    partStatus: string;
    partSizeCategory?: string;
    notes?: string;
    timestamp: string;
    viewedByCustomer: boolean;
    media?: string[];
}

interface QuoteCardProps {
    quote: Quote;
    onAccept: () => void;
    onReject: () => void;
    disabled?: boolean;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({
    quote,
    onAccept,
    onReject,
    disabled,
}) => {
    const getStatusBadge = () => {
        // Status is determined by partStatus field
        if (quote.partStatus === 'available') {
            return <Badge variant="success" text="متوفر" />;
        }
        if (quote.partStatus === 'unavailable') {
            return <Badge variant="danger" text="غير متوفر" />;
        }
        return <Badge variant="warning" text={quote.partStatus} />;
    };

    return (
        <Card style={styles.card} padding={16}>
            <View style={styles.header}>
                <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>مزود #{quote.providerUniqueId}</Text>
                    {quote.partSizeCategory && (
                        <Text style={styles.categoryText}>{quote.partSizeCategory}</Text>
                    )}
                </View>
                {getStatusBadge()}
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.priceValue}>
                        {quote.price.toLocaleString('ar-SY')} ل.س
                    </Text>
                    <Text style={styles.detailLabel}>السعر:</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>
                        {new Date(quote.timestamp).toLocaleDateString('ar-SY')}
                    </Text>
                    <Text style={styles.detailLabel}>تاريخ العرض:</Text>
                </View>
                {quote.notes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>ملاحظات:</Text>
                        <Text style={styles.notesText}>{quote.notes}</Text>
                    </View>
                )}
            </View>

            {quote.partStatus === 'available' && !disabled && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={onReject}
                    >
                        <Ionicons name="close-circle" size={18} color="#FF3B30" />
                        <Text style={styles.rejectButtonText}>رفض</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={onAccept}
                    >
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.acceptButtonText}>قبول</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '600',
    },
    categoryText: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    details: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    detailValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 18,
        color: '#34C759',
        fontWeight: 'bold',
    },
    notesContainer: {
        marginTop: 8,
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
    },
    notesLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
        textAlign: 'right',
    },
    notesText: {
        fontSize: 13,
        color: '#1e293b',
        lineHeight: 18,
        textAlign: 'right',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    acceptButton: {
        backgroundColor: '#34C759',
    },
    acceptButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    rejectButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF3B30',
    },
});
