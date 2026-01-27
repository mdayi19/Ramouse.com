import React from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Text, Surface, Divider, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Data {
    category: string;
    brand: string;
    model: string;
    year: string;
    transmission: string;
    parts: string[];
    description: string;
    city: string;
    contact: string;
}

interface Props {
    data: Data;
    city: string;
    contactMethod: 'phone' | 'whatsapp';
    onUpdate: (field: string, value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
}

const CITIES = ['دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس', 'ريف دمشق', 'درعا', 'السويداء'];

export default function Step6Review({ data, city, contactMethod, onUpdate, onSubmit, loading }: Props) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>
                مراجعة الطلب
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                تأكد من صحة المعلومات قبل الإرسال.
            </Text>

            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="car-sport" size={20} color="#3b82f6" />
                    <Text style={styles.sectionTitle}>السيارة</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.value}>{data.brand} {data.model} {data.year}</Text>
                    <Text style={styles.key}>السيارة:</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.row}>
                    <Text style={styles.value}>{data.transmission === 'auto' ? 'أوتوماتيك' : 'عادي'}</Text>
                    <Text style={styles.key}>الجير:</Text>
                </View>
            </Surface>

            <Surface style={styles.section} elevation={1}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="settings" size={20} color="#e67e22" />
                    <Text style={styles.sectionTitle}>القطع المطلوبة</Text>
                </View>
                <View style={styles.tags}>
                    {data.parts.map((p, i) => (
                        <View key={i} style={styles.tag}>
                            <Text style={styles.tagText}>{p}</Text>
                        </View>
                    ))}
                </View>
                <Divider style={styles.divider} />
                <Text style={styles.descLabel}>الوصف:</Text>
                <Text style={styles.description}>{data.description}</Text>
            </Surface>

            {/* City Selection - Final Step Input */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>المدينة (مكان التسليم)*</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityScroll}>
                    {CITIES.map((c) => (
                        <Button
                            key={c}
                            mode={city === c ? 'contained' : 'outlined'}
                            onPress={() => onUpdate('city', c)}
                            style={styles.cityBtn}
                            compact
                        >
                            {c}
                        </Button>
                    ))}
                </ScrollView>
                {/* Fallback if empty logic handled in parent */}
            </View>

            <Button
                mode="contained"
                onPress={onSubmit}
                style={styles.submitBtn}
                contentStyle={{ height: 50 }}
                loading={loading}
                disabled={loading || !city}
            >
                إرسال الطلب الآن
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        textAlign: 'center',
        color: '#64748b',
        marginBottom: 32,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
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
        marginVertical: 12,
        backgroundColor: '#f1f5f9',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#fff7ed',
        paddingHorizontal: 12,
        paddingVertical: 4,
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
    },
    cityBtn: {
        borderRadius: 20,
    },
    submitBtn: {
        borderRadius: 12,
        marginTop: 8,
        backgroundColor: '#22c55e',
    },
});
