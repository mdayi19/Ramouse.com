import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

export const PROVIDER_TAB_SCREEN_OPTIONS: BottomTabNavigationOptions = {
    headerShown: false,
    tabBarActiveTintColor: '#2563eb', // Default Blue
    tabBarInactiveTintColor: '#64748b', // Slate 500
    tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: 'bold',
    },
};
