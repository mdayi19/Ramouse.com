import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';

interface OtpInputProps {
    value: string[];
    onChange: (otp: string[]) => void;
    length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({
    value,
    onChange,
    length = 6,
}) => {
    const inputsRef = useRef<(TextInput | null)[]>([]);

    const handleChange = (text: string, index: number) => {
        // Only allow digits
        if (text && !/^\d+$/.test(text)) return;

        const newOtp = [...value];

        // Handle paste (multiple characters)
        if (text.length > 1) {
            const chars = text.split('').slice(0, length);
            chars.forEach((char, i) => {
                if (index + i < length) {
                    newOtp[index + i] = char;
                }
            });
            onChange(newOtp);

            // Focus next empty input or last input
            const nextFocus = Math.min(index + chars.length, length - 1);
            inputsRef.current[nextFocus]?.focus();
            return;
        }

        // Handle single character
        newOtp[index] = text;
        onChange(newOtp);

        // Auto-focus next input
        if (text && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        // Handle backspace on empty input
        if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {Array.from({ length }).map((_, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => {
                        inputsRef.current[index] = ref;
                    }}
                    style={styles.input}
                    value={value[index] || ''}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    input: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#DDD',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        backgroundColor: '#FFF',
    },
});
