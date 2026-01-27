import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TowTruckLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#d97706', // Amber 600
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#e2e8f0',
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
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
                name="requests"
                options={{
                    title: 'الطلبات',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-sport-outline" size={size} color={color} />
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
            {/* Hidden Profile Tab - maybe reuse similar component */}
        </Tabs>
    );
}
