import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton } from 'react-native-paper';

interface PaymentMethodCardProps {
    methodName: string;
    details: string;
    onDelete: () => void;
}

export default function PaymentMethodCard({ methodName, details, onDelete }: PaymentMethodCardProps) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>💳</Text>
                    </View>
                    <View style={styles.content}>
                        <Text variant="titleMedium" style={styles.title}>
                            {methodName}
                        </Text>
                    </View>
                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#e74c3c"
                        onPress={onDelete}
                    />
                </View>
                <View style={styles.detailsContainer}>
                    <Text variant="bodySmall" style={styles.details}>
                        {details}
                    </Text>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e3f2fd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    content: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
    },
    detailsContainer: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    details: {
        fontFamily: 'monospace',
        color: '#666',
    },
});
