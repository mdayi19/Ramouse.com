import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PROVIDER_TAB_SCREEN_OPTIONS } from '@/constants/navigation';

export default function CarProviderLayout() {
    return (
        <Tabs
            screenOptions={{
                ...PROVIDER_TAB_SCREEN_OPTIONS,
                tabBarActiveTintColor: '#2563eb', // Example: Darker blue for providers
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
                name="listings"
                options={{
                    title: 'سياراتي',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-sport-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-listing"
                options={{
                    title: 'إضافة',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
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
