import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    FlatList,
    RefreshControl,
    Alert,
    Text,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../layout';
import { Button, EmptyState, LoadingState, ErrorState } from '../shared';
import { VehicleCard } from './VehicleCard';
import { CustomerService } from '@/services/customer.service';

interface Vehicle {
    id: string;
    brand: string;
    model: string;
    year: string;
    color?: string;
    plateNumber?: string;
    isDefault: boolean;
}

export const GarageScreen: React.FC = () => {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await CustomerService.getGarage();
            setVehicles(response);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setError('فشل تحميل المركبات');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchVehicles();
        setRefreshing(false);
    };

    const handleAddVehicle = () => {
        // TODO: Navigate to add vehicle screen
        router.push('/(customer)/garage/add');
    };

    const handleEditVehicle = (vehicleId: string) => {
        // TODO: Navigate to edit vehicle screen
        router.push(`/(customer)/garage/edit/${vehicleId}`);
    };

    const handleDeleteVehicle = (vehicleId: string) => {
        Alert.alert(
            'حذف المركبة',
            'هل أنت متأكد من حذف هذه المركبة؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'حذف',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await CustomerService.removeFromGarage(vehicleId);
                            setVehicles((prev) =>
                                prev.filter((v) => v.id !== vehicleId)
                            );
                        } catch (err) {
                            Alert.alert('خطأ', 'فشل حذف المركبة');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (vehicleId: string) => {
        try {
            // Note: CustomerService doesn't have setDefaultVehicle yet
            // This will update locally for now
            setVehicles((prev) =>
                prev.map((v) => ({
                    ...v,
                    isDefault: v.id === vehicleId,
                }))
            );
        } catch (err) {
            Alert.alert('خطأ', 'فشل تعيين المركبة الافتراضية');
        }
    };

    if (loading) {
        return <LoadingState message="جاري تحميل المركبات..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchVehicles} />;
    }

    return (
        <View style={styles.container}>
            <Header title="مركباتي" showBack onBack={() => router.back()} />

            <FlatList
                data={vehicles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                renderItem={({ item }) => (
                    <VehicleCard
                        vehicle={item}
                        onEdit={() => handleEditVehicle(item.id)}
                        onDelete={() => handleDeleteVehicle(item.id)}
                        onSetDefault={() => handleSetDefault(item.id)}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="car-outline"
                        title="لا توجد مركبات"
                        message="أضف مركبتك الأولى لتسهيل طلب القطع"
                    />
                }
                ListHeaderComponent={
                    vehicles.length > 0 ? (
                        <Text style={styles.headerText}>
                            لديك {vehicles.length} مركبة مسجلة
                        </Text>
                    ) : null
                }
            />

            <View style={styles.footer}>
                <Button
                    title="إضافة مركبة جديدة"
                    onPress={handleAddVehicle}
                    variant="primary"

                />
            </View>
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
        paddingBottom: 100,
    },
    headerText: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 16,
        textAlign: 'right',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
});
