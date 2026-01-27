import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, TextInput as RNTextInput } from 'react-native';
import { Text, TextInput, SegmentedButtons } from 'react-native-paper';

interface Props {
    model: string;
    year: string;
    transmission: 'auto' | 'manual';
    onUpdate: (field: string, value: string) => void;
}

export default function Step3Model({ model, year, transmission, onUpdate }: Props) {
    const yearInputRef = useRef<RNTextInput>(null);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>
                تفاصيل الموديل
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                حدد موديل وسنة صنع السيارة بدقة.
            </Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>الموديل</Text>
                <TextInput
                    value={model}
                    onChangeText={(text) => onUpdate('model', text)}
                    mode="outlined"
                    style={styles.input}
                    placeholder="مثال: كامري، كورولا، أكسنت..."
                    outlineStyle={styles.inputOutline}
                    returnKeyType="next"
                    onSubmitEditing={() => yearInputRef.current?.focus()}
                    blurOnSubmit={false}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>سنة الصنع</Text>
                <TextInput
                    ref={yearInputRef as any}
                    value={year}
                    onChangeText={(text) => onUpdate('year', text)}
                    mode="outlined"
                    style={styles.input}
                    placeholder="مثال: 2022"
                    keyboardType="number-pad"
                    maxLength={4}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Icon icon="calendar" />}
                    returnKeyType="done"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>ناقل الحركة (الجير)</Text>
                <SegmentedButtons
                    value={transmission}
                    onValueChange={(value) => onUpdate('transmission', value)}
                    buttons={[
                        { value: 'auto', label: 'أوتوماتيك', icon: 'car-shift-pattern' },
                        { value: 'manual', label: 'عادي (ميكانيك)', icon: 'car-shift-pattern' },
                    ]}
                    style={styles.segmented}
                />
            </View>

            <View style={styles.tipBox}>
                <Text style={styles.tipEmoji}>💡</Text>
                <Text style={styles.tipText}>
                    تأكد من اختيار السنة الصحيحة، لأن القطع تختلف اختلافاً جذرياً بين السنوات.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
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
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    inputOutline: {
        borderRadius: 12,
        borderColor: '#e2e8f0',
    },
    segmented: {
        marginTop: 4,
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
