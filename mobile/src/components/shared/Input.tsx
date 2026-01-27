import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
    label?: React.ReactNode;
    error?: string;
    containerStyle?: ViewStyle;
    rightElement?: React.ReactNode;
    leftElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    rightElement,
    leftElement,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputWrapper}>
                {leftElement && <View style={styles.leftElement}>{leftElement}</View>}
                <TextInput
                    style={[
                        styles.input,
                        error && styles.inputError,
                        rightElement ? styles.inputWithRight : undefined,
                        leftElement ? styles.inputWithLeft : undefined,
                        style
                    ]}
                    placeholderTextColor="#999"
                    {...props}
                />
                {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        backgroundColor: '#FFF',
        minHeight: 44,
    },
    inputWithRight: {
        paddingRight: 48,
    },
    inputError: {
        borderColor: '#FF3B30',
    },
    rightElement: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    leftElement: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        zIndex: 1,
    },
    inputWithLeft: {
        paddingLeft: 48,
    },
    errorText: {
        fontSize: 12,
        color: '#FF3B30',
        marginTop: 4,
    },
});
