import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Button } from '../../shared';

interface OrderData {
    category: string;
    brand: string;
    model: string;
    year: string;
    transmission: string;
    parts: string[];
    description: string;
    partNumber?: string;
}

interface Step6ReviewProps {
    data: OrderData;
    city: string;
    contactMethod: 'phone' | 'whatsapp';
    onUpdate: (field: string, value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
}

const CITIES = [
    'دمشق',
    'حلب',
    'حمص',
    'حماة',
    'اللاذقية',
    'طرطوس',
    'ريف دمشق',
    'درعا',
    'السويداء',
];

export const Step6Review: React.FC<Step6ReviewProps> = ({
    data,
    city,
    contactMethod,
    onUpdate,
    onSubmit,
    loading,
}) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>مراجعة الطلب</Text>
            <Text style={styles.subtitle}>تأكد من صحة المعلومات قبل الإرسال.</Text>

            {/* Car Info */}
            <Card style={styles.section} padding={16}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="car-sport" size={20} color="#007AFF" />
                    <Text style={styles.sectionTitle}>السيارة</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.value}>
                        {data.brand} {data.model} {data.year}
                    </Text>
                    <Text style={styles.key}>السيارة:</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.value}>
                        {data.transmission === 'auto' ? 'أوتوماتيك' : 'عادي'}
                    </Text>
                    <Text style={styles.key}>الجير:</Text>
                </View>
            </Card>

            {/* Parts Info */}
            <Card style={styles.section} padding={16}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="settings" size={20} color="#FF9500" />
                    <Text style={styles.sectionTitle}>القطع المطلوبة</Text>
                </View>
                <View style={styles.tags}>
                    {data.parts.map((p, i) => (
                        <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{p}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.divider} />
                <Text style={styles.descLabel}>الوصف:</Text>
                <Text style={styles.description}>{data.description}</Text>
                {data.partNumber && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.value}>{data.partNumber}</Text>
                            <Text style={styles.key}>رقم القطعة:</Text>
                        </View>
                    </>
                )}
            </Card>

            {/* City Selection */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>المدينة (مكان التسليم) *</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cityScroll}
                >
                    {CITIES.map((c) => (
                        <TouchableOpacity
                            key={c}
                            style={[
                                styles.cityButton,
                                city === c && styles.cityButtonActive,
                            ]}
                            onPress={() => onUpdate('city', c)}
                        >
                            <Text
                                style={[
                                    styles.cityButtonText,
                                    city === c && styles.cityButtonTextActive,
                                ]}
                            >
                                {c}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Submit Button */}
            <Button
                title="إرسال الطلب الآن"
                onPress={onSubmit}
                loading={loading}
                disabled={loading || !city}
                variant="primary"
                style={styles.submitBtn}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingBottom: 40,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#64748b',
        marginBottom: 32,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    key: {
        color: '#64748b',
        fontSize: 14,
    },
    value: {
        color: '#1e293b',
        fontWeight: '600',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 12,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffedd5',
    },
    tagText: {
        color: '#c2410c',
        fontSize: 12,
        fontWeight: 'bold',
    },
    descLabel: {
        color: '#64748b',
        marginBottom: 4,
        fontSize: 12,
        textAlign: 'right',
    },
    description: {
        color: '#334155',
        lineHeight: 20,
        textAlign: 'right',
        fontSize: 14,
    },
    formGroup: {
        marginBottom: 24,
        marginTop: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'right',
    },
    cityScroll: {
        gap: 8,
        paddingVertical: 4,
    },
    cityButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#FFFFFF',
    },
    cityButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    cityButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    cityButtonTextActive: {
        color: '#FFFFFF',
    },
    submitBtn: {
        marginTop: 8,
        backgroundColor: '#34C759',
    },
});
