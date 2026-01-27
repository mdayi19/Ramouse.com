import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

export default function Step7Success() {
    const scale = useSharedValue(0);
    const router = useRouter();

    useEffect(() => {
        scale.value = withSpring(1, { damping: 10 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconContainer, animatedStyle]}>
                <Ionicons name="checkmark" size={60} color="#fff" />
            </Animated.View>

            <Text variant="headlineMedium" style={styles.title}>
                تم إرسال الطلب بنجاح!
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
                تم تعميم طلبك على جميع الموردين في منطقتك. ستصلك إشعارات بالعروض قريباً.
            </Text>

            <View style={styles.buttons}>
                <Button
                    mode="contained"
                    onPress={() => router.replace('/(customer)/orders')} // Go to My Orders
                    style={styles.button}
                >
                    متابعة حالة الطلب
                </Button>

                <Button
                    mode="text"
                    onPress={() => router.replace('/(customer)')} // Go Home
                    style={styles.textButton}
                >
                    العودة للرئيسية
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#22c55e',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#1e293b',
    },
    subtitle: {
        textAlign: 'center',
        color: '#64748b',
        marginBottom: 48,
        lineHeight: 24,
    },
    buttons: {
        width: '100%',
        gap: 16,
    },
    button: {
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: '#22c55e',
    },
    textButton: {
        borderRadius: 12,
        color: '#64748b',
    },
});
