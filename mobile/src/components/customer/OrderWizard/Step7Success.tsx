import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import { Button } from '../../shared';

interface Step7SuccessProps {
    onViewOrders: () => void;
    onGoHome: () => void;
}

export const Step7Success: React.FC<Step7SuccessProps> = ({
    onViewOrders,
    onGoHome,
}) => {
    const scale = useSharedValue(0);

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
                <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
            </Animated.View>

            <Text style={styles.title}>تم إرسال الطلب بنجاح!</Text>
            <Text style={styles.subtitle}>
                تم تعميم طلبك على جميع الموردين في منطقتك. ستصلك إشعارات بالعروض
                قريباً.
            </Text>

            <View style={styles.buttons}>
                <Button
                    title="متابعة حالة الطلب"
                    onPress={onViewOrders}
                    variant="primary"
                    style={styles.button}
                />

                <Button
                    title="العودة للرئيسية"
                    onPress={onGoHome}
                    variant="outline"
                    style={styles.textButton}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#FFFFFF',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#34C759',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
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
        backgroundColor: '#34C759',
    },
    textButton: {
        marginTop: 8,
    },
});
