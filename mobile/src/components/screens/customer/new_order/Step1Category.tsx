import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CAR_CATEGORIES } from '@/data/constants';

interface Props {
    selectedCategory: string;
    onSelect: (category: string) => void;
}

export default function Step1Category({ selectedCategory, onSelect }: Props) {
    return (
        <FlatList
            style={{ flex: 1 }}
            data={CAR_CATEGORIES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.container}
            columnWrapperStyle={styles.row}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🚗</Text>
                    <Text variant="headlineSmall" style={styles.title}>
                        ما هي سيارتك؟
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        اختر حسب بلد المنشأ
                    </Text>
                </View>
            }
            renderItem={({ item, index }) => {
                const isSelected = selectedCategory === item.name;
                return (
                    <Animated.View
                        entering={FadeInDown.delay(index * 50).duration(400)}
                        style={styles.cardWrapper}
                    >
                        <TouchableOpacity
                            onPress={() => onSelect(item.name)}
                            activeOpacity={0.8}
                        >
                            <Surface style={[styles.card, isSelected && styles.selectedCard]} elevation={isSelected ? 4 : 1}>
                                <View style={[styles.flagContainer, isSelected && styles.selectedFlagContainer]}>
                                    <Text style={styles.flag}>{item.flag}</Text>
                                </View>
                                <Text style={[styles.cardLabel, isSelected && styles.selectedLabel]}>
                                    {item.name}
                                </Text>

                                {isSelected && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                                    </View>
                                )}
                            </Surface>
                        </TouchableOpacity>
                    </Animated.View>
                );
            }}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    row: {
        gap: 12,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        color: '#1e293b',
    },
    subtitle: {
        textAlign: 'center',
        color: '#64748b',
    },
    cardWrapper: {
        flex: 1,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        height: 140,
    },
    selectedCard: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    flagContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectedFlagContainer: {
        backgroundColor: '#dbeafe',
        borderColor: '#bfdbfe',
    },
    flag: {
        fontSize: 32,
    },
    cardLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
    },
    selectedLabel: {
        color: '#1e293b',
    },
    checkIcon: {
        position: 'absolute',
        top: 8,
        left: 8,
    },
});
