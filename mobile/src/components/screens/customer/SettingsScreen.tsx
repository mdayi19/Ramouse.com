import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView>
                <View style={styles.header}>
                    <Text variant="headlineMedium" style={styles.title}>
                        ⚙️ الإعدادات
                    </Text>
                </View>

                {/* Notifications Section */}
                <List.Section>
                    <List.Subheader>الإشعارات</List.Subheader>
                    <List.Item
                        title="إشعارات التطبيق"
                        description="تلقي إشعارات حول الطلبات والعروض"
                        left={(props) => <List.Icon {...props} icon="bell" />}
                        right={() => (
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                            />
                        )}
                    />
                    <List.Item
                        title="إشعارات البريد الإلكتروني"
                        description="تلقي رسائل بريد إلكتروني"
                        left={(props) => <List.Icon {...props} icon="email" />}
                        right={() => (
                            <Switch
                                value={emailNotifications}
                                onValueChange={setEmailNotifications}
                            />
                        )}
                    />
                </List.Section>

                <Divider />

                {/* Appearance Section */}
                <List.Section>
                    <List.Subheader>المظهر</List.Subheader>
                    <List.Item
                        title="الوضع الليلي"
                        description="تفعيل الوضع الداكن"
                        left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
                        right={() => (
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                            />
                        )}
                    />
                    <List.Item
                        title="اللغة"
                        description="العربية"
                        left={(props) => <List.Icon {...props} icon="translate" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Language selection
                        }}
                    />
                </List.Section>

                <Divider />

                {/* Account Section */}
                <List.Section>
                    <List.Subheader>الحساب</List.Subheader>
                    <List.Item
                        title="تغيير كلمة المرور"
                        left={(props) => <List.Icon {...props} icon="lock-reset" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Change password
                        }}
                    />
                    <List.Item
                        title="الخصوصية والأمان"
                        left={(props) => <List.Icon {...props} icon="shield-account" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Privacy settings
                        }}
                    />
                </List.Section>

                <Divider />

                {/* About Section */}
                <List.Section>
                    <List.Subheader>حول التطبيق</List.Subheader>
                    <List.Item
                        title="الشروط والأحكام"
                        left={(props) => <List.Icon {...props} icon="file-document" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Terms
                        }}
                    />
                    <List.Item
                        title="سياسة الخصوصية"
                        left={(props) => <List.Icon {...props} icon="shield-check" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Privacy policy
                        }}
                    />
                    <List.Item
                        title="تواصل معنا"
                        left={(props) => <List.Icon {...props} icon="email-outline" />}
                        right={(props) => <List.Icon {...props} icon="chevron-right" />}
                        onPress={() => {
                            // TODO: Contact
                        }}
                    />
                    <List.Item
                        title="الإصدار"
                        description="1.0.0"
                        left={(props) => <List.Icon {...props} icon="information" />}
                    />
                </List.Section>
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
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
