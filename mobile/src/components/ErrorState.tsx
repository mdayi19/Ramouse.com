import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
    retryLabel?: string;
}

export function ErrorState({
    message = 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    onRetry,
    retryLabel = 'إعادة المحاولة',
}: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <Text variant="headlineSmall" style={styles.emoji}>
                😕
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
                {message}
            </Text>
            {onRetry && (
                <Button mode="contained" onPress={onRetry} style={styles.button}>
                    {retryLabel}
                </Button>
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
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    message: {
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    button: {
        minWidth: 150,
    },
});
