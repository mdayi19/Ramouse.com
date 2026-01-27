import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../shared';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    showNotifications?: boolean;
    notificationCount?: number;
    onNotificationsPress?: () => void;
    userName?: string;
    userAvatar?: string;
    onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    showBack = false,
    onBack,
    showNotifications = true,
    notificationCount = 0,
    onNotificationsPress,
    userName,
    userAvatar,
    onProfilePress,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Left Side */}
                <View style={styles.leftSide}>
                    {showBack && onBack ? (
                        <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={onProfilePress} style={styles.profileButton}>
                            <Avatar name={userName} imageUrl={userAvatar} size={36} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Center */}
                {title && (
                    <View style={styles.center}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>
                )}

                {/* Right Side */}
                <View style={styles.rightSide}>
                    {showNotifications && (
                        <TouchableOpacity onPress={onNotificationsPress} style={styles.iconButton}>
                            <Ionicons name="notifications-outline" size={24} color="#333" />
                            {notificationCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {notificationCount > 9 ? '9+' : notificationCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        paddingHorizontal: 16,
    },
    leftSide: {
        width: 40,
        alignItems: 'flex-start',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    rightSide: {
        width: 40,
        alignItems: 'flex-end',
    },
    iconButton: {
        padding: 8,
        position: 'relative',
    },
    profileButton: {
        padding: 0,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
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
});
