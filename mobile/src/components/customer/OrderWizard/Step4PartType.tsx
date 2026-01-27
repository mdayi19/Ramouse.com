import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../shared';
import { PART_TYPES } from '@/data/constants';

interface Step4PartTypeProps {
    selectedParts: string[];
    onToggle: (part: string) => void;
}

export const Step4PartType: React.FC<Step4PartTypeProps> = ({
    selectedParts,
    onToggle,
}) => {
    return (
        <FlatList
            style={styles.container}
            data={PART_TYPES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.contentContainer}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🔧</Text>
                    <Text style={styles.title}>ماذا تحتاج؟</Text>
                    <Text style={styles.subtitle}>
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
                        <Card
                            style={isSelected ? styles.selectedCard : styles.card}
                            padding={16}
                        >
                            <View
                                style={[
                                    styles.iconContainer,
                                    isSelected && styles.selectedIconContainer,
                                ]}
                            >
                                <Text style={styles.emojiIcon}>{item.emoji}</Text>
                            </View>
                            <Text
                                style={[styles.label, isSelected && styles.selectedLabel]}
                            >
                                {item.name}
                            </Text>
                            {isSelected && (
                                <View style={styles.badge}>
                                    <Ionicons name="checkmark" size={12} color="#fff" />
                                </View>
                            )}
                        </Card>
                    </TouchableOpacity>
                );
            }}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    contentContainer: {
        padding: 16,
    },
    columnWrapper: {
        gap: 12,
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
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#64748b',
    },
    cardWrapper: {
        flex: 1,
        aspectRatio: 1.2,
        marginBottom: 12,
    },
    card: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#007AFF',
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
        textAlign: 'center',
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
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
