import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Input } from '../../shared';
import { Ionicons } from '@expo/vector-icons';

interface Step3ModelProps {
    model: string;
    year: string;
    transmission: 'auto' | 'manual';
    onUpdate: (field: string, value: string) => void;
}

export const Step3Model: React.FC<Step3ModelProps> = ({
    model,
    year,
    transmission,
    onUpdate,
}) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>تفاصيل الموديل</Text>
            <Text style={styles.subtitle}>حدد موديل وسنة صنع السيارة بدقة.</Text>

            <View style={styles.formGroup}>
                <Input
                    label="الموديل"
                    value={model}
                    onChangeText={(text) => onUpdate('model', text)}
                    placeholder="مثال: كامري، كورولا، أكسنت..."
                    returnKeyType="next"
                />
            </View>

            <View style={styles.formGroup}>
                <Input
                    label="سنة الصنع"
                    value={year}
                    onChangeText={(text) => onUpdate('year', text)}
                    placeholder="مثال: 2022"
                    keyboardType="number-pad"
                    maxLength={4}
                    returnKeyType="done"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>ناقل الحركة (الجير)</Text>
                <View style={styles.segmentedContainer}>
                    <TouchableOpacity
                        style={[
                            styles.segmentButton,
                            styles.segmentButtonLeft,
                            transmission === 'auto' && styles.segmentButtonActive,
                        ]}
                        onPress={() => onUpdate('transmission', 'auto')}
                    >
                        <Ionicons
                            name="car-sport"
                            size={20}
                            color={transmission === 'auto' ? '#FFFFFF' : '#64748b'}
                        />
                        <Text
                            style={[
                                styles.segmentText,
                                transmission === 'auto' && styles.segmentTextActive,
                            ]}
                        >
                            أوتوماتيك
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.segmentButton,
                            styles.segmentButtonRight,
                            transmission === 'manual' && styles.segmentButtonActive,
                        ]}
                        onPress={() => onUpdate('transmission', 'manual')}
                    >
                        <Ionicons
                            name="settings"
                            size={20}
                            color={transmission === 'manual' ? '#FFFFFF' : '#64748b'}
                        />
                        <Text
                            style={[
                                styles.segmentText,
                                transmission === 'manual' && styles.segmentTextActive,
                            ]}
                        >
                            عادي (ميكانيك)
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.tipBox}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={styles.tipText}>
                    تأكد من اختيار السنة الصحيحة، لأن القطع تختلف اختلافاً جذرياً بين
                    السنوات.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
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
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'right',
    },
    segmentedContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    segmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        gap: 8,
    },
    segmentButtonLeft: {
        borderRightWidth: 0.5,
        borderRightColor: '#e2e8f0',
    },
    segmentButtonRight: {
        borderLeftWidth: 0.5,
        borderLeftColor: '#e2e8f0',
    },
    segmentButtonActive: {
        backgroundColor: '#007AFF',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
    tipBox: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fcd34d',
        marginTop: 8,
    },
    tipEmoji: {
        fontSize: 20,
        marginRight: 12,
    },
    tipText: {
        flex: 1,
        color: '#92400e',
        fontSize: 13,
        lineHeight: 20,
    },
});
