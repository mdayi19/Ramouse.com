import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, List, Avatar, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCurrentUser, useLogout, useWalletBalance } from '@/hooks';
import { LoadingState } from '@/components';

export default function ProfileScreen() {
    const router = useRouter();
    const user = useCurrentUser();
    const logout = useLogout();
    const { data: walletData } = useWalletBalance();

    if (!user) {
        return <LoadingState message="جاري التحميل..." />;
    }

    const handleLogout = () => {
        logout.mutate();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView>
                {/* Profile Header */}
                <View style={styles.header}>
                    <Avatar.Text
                        size={80}
                        label={user.name?.charAt(0) || 'U'}
                        style={styles.avatar}
                    />
                    <Text variant="headlineSmall" style={styles.name}>
                        {user.name}
                    </Text>
                    <Text variant="bodyMedium" style={styles.phone}>
                        {user.phone}
                    </Text>
                    {user.email && (
                        <Text variant="bodySmall" style={styles.email}>
                            {user.email}
                        </Text>
                    )}
                </View>

                {/* Wallet Section */}
                {walletData && (
                    <View style={styles.walletCard}>
                        <Text variant="titleMedium" style={styles.walletTitle}>
                            💰 رصيد المحفظة
                        </Text>
                        <Text variant="headlineLarge" style={styles.balance}>
                            ${walletData.balance?.toLocaleString() || 0}
                        </Text>
                    </View>
                )}

                <Divider style={styles.divider} />

                {/* Menu Items */}
                <List.Section>
                    <List.Item
                        title="تعديل الملف الشخصي"
                        left={(props) => <List.Icon {...props} icon="account-edit" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/(customer)/edit-profile')}
                    />
                    <List.Item
                        title="المفضلة"
                        left={(props) => <List.Icon {...props} icon="heart" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/(customer)/favorites')}
                    />
                    <List.Item
                        title="طلباتي"
                        left={(props) => <List.Icon {...props} icon="clipboard-list" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/(customer)/orders')}
                    />
                    <List.Item
                        title="المحفظة"
                        left={(props) => <List.Icon {...props} icon="wallet" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/(customer)/wallet')}
                    />
                    <List.Item
                        title="الإعدادات"
                        left={(props) => <List.Icon {...props} icon="cog" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => router.push('/(customer)/settings')}
                    />
                </List.Section>

                <Divider style={styles.divider} />

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <Button
                        mode="outlined"
                        onPress={handleLogout}
                        loading={logout.isPending}
                        disabled={logout.isPending}
                        textColor="#d32f2f"
                        style={styles.logoutButton}
                    >
                        تسجيل الخروج
                    </Button>
                </View>

                {/* App Info */}
                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.version}>
                        رموس v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
    },
    avatar: {
        backgroundColor: '#6366f1',
        marginBottom: 16,
    },
    name: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    phone: {
        color: '#666',
    },
    email: {
        color: '#999',
        marginTop: 4,
    },
    walletCard: {
        backgroundColor: '#fff',
        padding: 20,
        margin: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 2,
    },
    walletTitle: {
        marginBottom: 8,
    },
    balance: {
        color: '#2ecc71',
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 8,
    },
    logoutContainer: {
        padding: 16,
    },
    logoutButton: {
        borderColor: '#d32f2f',
    },
    footer: {
        padding: 16,
        alignItems: 'center',
    },
    version: {
        color: '#999',
    },
});
