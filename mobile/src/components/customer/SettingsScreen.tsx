import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Text,
    Alert,
    Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Avatar } from '../shared';
import { CustomerService } from '@/services/customer.service';

export const SettingsScreen: React.FC = () => {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [language, setLanguage] = useState<'ar' | 'en'>('ar');

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const profile = await CustomerService.getProfile();
            setUser(profile);
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        // TODO: Navigate to edit profile screen or show modal
        router.push('/(customer)/profile/edit');
    };

    const handleChangeLanguage = () => {
        Alert.alert(
            'تغيير اللغة',
            'اختر اللغة',
            [
                {
                    text: 'العربية',
                    onPress: () => setLanguage('ar'),
                },
                {
                    text: 'English',
                    onPress: () => setLanguage('en'),
                },
                {
                    text: 'إلغاء',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'تسجيل الخروج',
            'هل أنت متأكد من تسجيل الخروج؟',
            [
                { text: 'إلغاء', style: 'cancel' },
                {
                    text: 'تسجيل الخروج',
                    style: 'destructive',
                    onPress: async () => {
                        // TODO: Call logout API
                        // await AuthService.logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const renderSettingItem = (
        icon: string,
        title: string,
        onPress: () => void,
        rightElement?: React.ReactNode
    ) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress}>
            <View style={styles.settingLeft}>
                <Ionicons name={icon as any} size={22} color="#64748b" />
                <Text style={styles.settingTitle}>{title}</Text>
            </View>
            {rightElement || (
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header title="الإعدادات" showBack onBack={() => router.back()} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <Card style={styles.profileCard} padding={16}>
                    <View style={styles.profileHeader}>
                        <Avatar
                            name={user.name}
                            size={64}
                            imageUrl={user.avatar}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user.name}</Text>
                            <Text style={styles.profilePhone}>{user.phone}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={handleEditProfile}
                    >
                        <Ionicons name="pencil" size={16} color="#007AFF" />
                        <Text style={styles.editButtonText}>تعديل الملف الشخصي</Text>
                    </TouchableOpacity>
                </Card>

                {/* Notifications */}
                <Card style={styles.section} padding={0}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>الإشعارات</Text>
                    </View>
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="notifications-outline" size={22} color="#64748b" />
                            <Text style={styles.settingTitle}>تفعيل الإشعارات</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="mail-outline" size={22} color="#64748b" />
                            <Text style={styles.settingTitle}>إشعارات البريد</Text>
                        </View>
                        <Switch
                            value={emailNotifications}
                            onValueChange={setEmailNotifications}
                            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                            thumbColor="#FFFFFF"
                            disabled={!notificationsEnabled}
                        />
                    </View>
                </Card>

                {/* App Settings */}
                <Card style={styles.section} padding={0}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>إعدادات التطبيق</Text>
                    </View>
                    {renderSettingItem(
                        'language-outline',
                        'اللغة',
                        handleChangeLanguage,
                        <Text style={styles.languageText}>
                            {language === 'ar' ? 'العربية' : 'English'}
                        </Text>
                    )}
                </Card>

                {/* Support */}
                <Card style={styles.section} padding={0}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>المساعدة والدعم</Text>
                    </View>
                    {renderSettingItem(
                        'help-circle-outline',
                        'مركز المساعدة',
                        () => router.push('/(customer)/help')
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(
                        'document-text-outline',
                        'الشروط والأحكام',
                        () => router.push('/(customer)/terms')
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(
                        'shield-checkmark-outline',
                        'سياسة الخصوصية',
                        () => router.push('/(customer)/privacy')
                    )}
                    <View style={styles.divider} />
                    {renderSettingItem(
                        'information-circle-outline',
                        'عن التطبيق',
                        () => router.push('/(customer)/about')
                    )}
                </Card>

                {/* Version */}
                <Text style={styles.version}>الإصدار 1.0.0</Text>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                    <Text style={styles.logoutText}>تسجيل الخروج</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    content: {
        padding: 16,
        paddingBottom: 32,
    },
    profileCard: {
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    profilePhone: {
        fontSize: 14,
        color: '#64748b',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#F0F9FF',
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: '#1e293b',
    },
    languageText: {
        fontSize: 14,
        color: '#64748b',
        marginRight: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginLeft: 50,
    },
    version: {
        fontSize: 12,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 10,
        backgroundColor: '#FFF5F5',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
    },
});
