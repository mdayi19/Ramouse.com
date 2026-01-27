import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TabBarItem {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: number;
}

interface TabBarProps {
    items: TabBarItem[];
    activeItem: string;
    onItemPress: (id: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ items, activeItem, onItemPress }) => {
    return (
        <View style={styles.container}>
            {items.map((item) => {
                const isActive = activeItem === item.id;
                return (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.tab}
                        onPress={() => onItemPress(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={isActive ? item.icon : (`${item.icon}-outline` as any)}
                                size={24}
                                color={isActive ? '#007AFF' : '#8E8E93'}
                            />
                            {item.badge && item.badge > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.label, isActive && styles.activeLabel]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 4,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 11,
        color: '#8E8E93',
    },
    activeLabel: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
