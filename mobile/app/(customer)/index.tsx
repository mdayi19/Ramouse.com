import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Surface, Card } from 'react-native-paper';
import { useAuthStore } from '@/store/authStore';

export default function CustomerDashboard() {
    const { user, logout } = useAuthStore();

    return (
        <ScrollView style={styles.container}>
            <Surface style={styles.header}>
                <Text variant="headlineMedium" style={styles.welcome}>
                    مرحباً {user?.name || 'عزيزي العميل'}
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                    لوحة تحكم العميل
                </Text>
            </Surface>

            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">🚗 سوق السيارات</Text>
                        <Text variant="bodyMedium" style={styles.cardText}>
                            تصفح آلاف السيارات المعروضة للبيع والإيجار
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="contained">تصفح الآن</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">⭐ المفضلة</Text>
                        <Text variant="bodyMedium" style={styles.cardText}>
                            السيارات والإعلانات المحفوظة
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="outlined">عرض المفضلة</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">🔨 المزادات</Text>
                        <Text variant="bodyMedium" style={styles.cardText}>
                            شارك في مزادات السيارات المباشرة
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="outlined">المزادات الحالية</Button>
                    </Card.Actions>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleLarge">💰 المحفظة</Text>
                        <Text variant="bodyMedium" style={styles.cardText}>
                            إدارة رصيدك والمعاملات المالية
                        </Text>
                    </Card.Content>
                    <Card.Actions>
                        <Button mode="outlined">عرض المحفظة</Button>
                    </Card.Actions>
                </Card>

                <Button
                    mode="text"
                    onPress={logout}
                    style={styles.logoutButton}
                    textColor="#d32f2f"
                >
                    تسجيل الخروج
                </Button>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 24,
        elevation: 2,
    },
    welcome: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#666',
        marginTop: 4,
    },
    content: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    cardText: {
        marginTop: 8,
        color: '#666',
    },
    logoutButton: {
        marginTop: 24,
    },
});
