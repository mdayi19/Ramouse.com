import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

export default function WelcomeScreen() {
    const router = useRouter();

    const roles = [
        {
            title: 'عميل',
            description: 'ابحث عن قطع غيار وخدمات',
            icon: 'person',
            route: '/(auth)/register-customer',
            color: '#3498db',
            gradient: ['#3498db', '#2980b9']
        },
        {
            title: 'فني صيانة',
            description: 'انضم كفني محترف',
            icon: 'construct',
            route: '/(auth)/register-technician',
            color: '#e67e22',
            gradient: ['#e67e22', '#d35400']
        },
        {
            title: 'ونش سحب',
            description: 'سجل شاحنتك',
            icon: 'car-sport',
            route: '/(auth)/register-tow-truck',
            color: '#e74c3c',
            gradient: ['#e74c3c', '#c0392b']
        },
        {
            title: 'معرض سيارات',
            description: 'بع سياراتك',
            icon: 'business',
            route: '/(auth)/register-car-provider',
            color: '#9b59b6',
            gradient: ['#9b59b6', '#8e44ad']
        }
    ];

    const publicServices = [
        {
            title: 'المزادات',
            icon: 'hammer',
            route: '/(customer)/auctions',
            color: '#e74c3c'
        },
        {
            title: 'سوق السيارات',
            icon: 'car',
            route: '/(customer)/marketplace',
            color: '#2ecc71'
        },
        {
            title: 'بحث عن فني',
            icon: 'people',
            route: '/(customer)/technicians',
            color: '#f1c40f'
        },
        {
            title: 'بحث عن ونش',
            icon: 'bus', // Using bus/truck icon
            route: '/(customer)/tow-trucks',
            color: '#34495e'
        }
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#ffffff', '#f0f2f5']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="car-sport" size={50} color="#2c3e50" />
                        </View>
                        <Text variant="displaySmall" style={styles.appName}>Ramouse</Text>
                        <Text variant="bodyLarge" style={styles.tagline}>
                            منصتك الشاملة لخدمات السيارات
                        </Text>
                    </Animated.View>

                    {/* Roles Grid */}
                    <Animated.View entering={FadeInDown.delay(400).duration(1000)} style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            تسجيل جديد
                        </Text>
                        <View style={styles.grid}>
                            {roles.map((role, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.card}
                                    activeOpacity={0.9}
                                    onPress={() => router.push(role.route as any)}
                                >
                                    <LinearGradient
                                        colors={role.gradient}
                                        style={styles.cardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons name={role.icon as any} size={28} color="#fff" />
                                        <Text style={styles.cardTitle}>{role.title}</Text>
                                        <Text style={styles.cardDesc} numberOfLines={1}>
                                            {role.description}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Public Services */}
                    <Animated.View entering={FadeInDown.delay(600).duration(1000)} style={styles.section}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            تصفح كزائر
                        </Text>
                        <View style={styles.publicGrid}>
                            {publicServices.map((service, index) => (
                                <Surface key={index} style={styles.publicCard} elevation={2}>
                                    <TouchableOpacity
                                        style={styles.publicCardContent}
                                        onPress={() => router.push(service.route as any)}
                                    >
                                        <View style={[styles.iconCircle, { backgroundColor: service.color + '20' }]}>
                                            <Ionicons name={service.icon as any} size={24} color={service.color} />
                                        </View>
                                        <Text style={styles.publicTitle}>{service.title}</Text>
                                        <Ionicons name="chevron-back" size={16} color="#bdc3c7" style={{ marginTop: 4 }} />
                                    </TouchableOpacity>
                                </Surface>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Login Link */}
                    <Animated.View entering={FadeInDown.delay(800).duration(1000)} style={styles.loginContainer}>
                        <Button
                            mode="contained"
                            onPress={() => router.push('/(auth)/login')}
                            style={styles.loginButton}
                            labelStyle={styles.loginButtonLabel}
                            icon="login"
                        >
                            تسجيل الدخول
                        </Button>
                        <Text style={styles.versionText}>الإصدار 1.0.0</Text>
                    </Animated.View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 16,
    },
    appName: {
        fontWeight: '900',
        color: '#2c3e50',
        letterSpacing: 0.5,
    },
    tagline: {
        color: '#7f8c8d',
        marginTop: 4,
        textAlign: 'center',
        fontSize: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        marginBottom: 16,
        color: '#34495e',
        fontWeight: 'bold',
        textAlign: 'right', // Arabic alignment
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: (width - 48 - 12) / 2,
        height: 120,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    cardGradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 2,
    },
    cardDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        textAlign: 'center',
    },
    publicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    publicCard: {
        width: (width - 48 - 12) / 2,
        borderRadius: 16,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    publicCardContent: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    publicTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    loginContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginButton: {
        borderRadius: 12,
        backgroundColor: '#2c3e50',
        width: '100%',
        paddingVertical: 6,
    },
    loginButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        marginTop: 16,
        color: '#bdc3c7',
        fontSize: 12,
    },
});
