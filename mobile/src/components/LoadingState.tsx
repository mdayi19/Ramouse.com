import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

interface LoadingStateProps {
    message?: string;
    size?: 'small' | 'large';
}

export function LoadingState({ message = 'جاري التحميل...', size = 'large' }: LoadingStateProps) {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color="#3498db" />
            {message && (
                <Text variant="bodyMedium" style={styles.message}>
                    {message}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    message: {
        marginTop: 16,
        color: '#666',
        textAlign: 'center',
    },
});
