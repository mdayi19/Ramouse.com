import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge } from '../shared';

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: string;
    color?: string;
    plateNumber?: string;
    isDefault: boolean;
}

interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit: () => void;
    onDelete: () => void;
    onSetDefault: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
    vehicle,
    onEdit,
    onDelete,
    onSetDefault,
}) => {
    return (
        <Card style={styles.card} padding={16}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>
                        {vehicle.brand} {vehicle.model}
                    </Text>
                    {vehicle.isDefault && (
                        <Badge variant="success" text="افتراضي" size="small" />
                    )}
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
                        <Ionicons name="pencil" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailValue}>{vehicle.year}</Text>
                    <Text style={styles.detailLabel}>السنة:</Text>
                </View>
                {vehicle.color && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailValue}>{vehicle.color}</Text>
                        <Text style={styles.detailLabel}>اللون:</Text>
                    </View>
                )}
                {vehicle.plateNumber && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailValue}>{vehicle.plateNumber}</Text>
                        <Text style={styles.detailLabel}>رقم اللوحة:</Text>
                    </View>
                )}
            </View>

            {!vehicle.isDefault && (
                <TouchableOpacity
                    style={styles.defaultButton}
                    onPress={onSetDefault}
                >
                    <Ionicons name="star-outline" size={16} color="#007AFF" />
                    <Text style={styles.defaultButtonText}>تعيين كافتراضي</Text>
                </TouchableOpacity>
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
    titleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 4,
    },
    details: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
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
    defaultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#F0F9FF',
    },
    defaultButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
});
