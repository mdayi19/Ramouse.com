import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
    text: string;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'default',
    style,
    textStyle,
}) => {
    return (
        <View style={[styles.badge, styles[variant], style]}>
            <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
                {text}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Variants
    default: {
        backgroundColor: '#E5E5EA',
    },
    defaultText: {
        color: '#666',
    },
    success: {
        backgroundColor: '#34C759',
    },
    successText: {
        color: '#FFFFFF',
    },
    warning: {
        backgroundColor: '#FF9500',
    },
    warningText: {
        color: '#FFFFFF',
    },
    danger: {
        backgroundColor: '#FF3B30',
    },
    dangerText: {
        color: '#FFFFFF',
    },
    info: {
        backgroundColor: '#007AFF',
    },
    infoText: {
        color: '#FFFFFF',
    },
});
