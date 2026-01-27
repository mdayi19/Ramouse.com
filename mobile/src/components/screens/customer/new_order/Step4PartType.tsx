import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PART_TYPES } from '@/data/constants';

interface Props {
    selectedParts: string[];
    onToggle: (part: string) => void;
}

export default function Step4PartType({ selectedParts, onToggle }: Props) {
    return (
        <FlatList
            style={{ flex: 1 }}
            data={PART_TYPES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.container}
            columnWrapperStyle={{ gap: 12 }}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🔧</Text>
                    <Text variant="headlineSmall" style={styles.title}>
                        ماذا تحتاج؟
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        👇 اختر نوع القطعة (يمكنك اختيار أكثر من واحد)
                    </Text>
                </View>
            }
            renderItem={({ item }) => {
                const isSelected = selectedParts.includes(item.name);
                return (
                    <TouchableOpacity
                        onPress={() => onToggle(item.name)}
                        activeOpacity={0.8}
                        style={styles.cardWrapper}
                    >
                        <Surface style={[styles.card, isSelected && styles.selectedCard]} elevation={isSelected ? 4 : 1}>
                            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                                <Text style={styles.emojiIcon}>{item.emoji}</Text>
                            </View>
                            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                                {item.name}
                            </Text>
                            {isSelected && (
                                <View style={styles.badge}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            )}
                        </Surface>
                    </TouchableOpacity>
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
        aspectRatio: 1.2,
        marginBottom: 12, // Add vertical spacing
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectedIconContainer: {
        backgroundColor: '#dbeafe',
    },
    emojiIcon: {
        fontSize: 32,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    selectedLabel: {
        color: '#1d4ed8',
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
