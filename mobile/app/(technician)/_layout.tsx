import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROVIDER_TAB_SCREEN_OPTIONS } from '@/constants/navigation';

export default function TechnicianLayout() {
    return (
        <Tabs
            screenOptions={{
                ...PROVIDER_TAB_SCREEN_OPTIONS,
                tabBarActiveTintColor: '#3b82f6', // Override color if needed or keep shared
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'الرئيسية',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="jobs"
                options={{
                    title: 'المهام',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="briefcase-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'ملفي',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
