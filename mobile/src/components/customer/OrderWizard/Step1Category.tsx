import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../shared';
import { CAR_CATEGORIES } from '@/data/constants';

interface Step1CategoryProps {
    selectedCategory: string;
    onSelect: (category: string) => void;
}

export const Step1Category: React.FC<Step1CategoryProps> = ({
    selectedCategory,
    onSelect,
}) => {
    return (
        <FlatList
            style={styles.container}
            data={CAR_CATEGORIES}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.contentContainer}
            columnWrapperStyle={styles.row}
            ListHeaderComponent={
                <View style={styles.header}>
                    <Text style={styles.headerEmoji}>🚗</Text>
                    <Text style={styles.title}>ما هي سيارتك؟</Text>
                    <Text style={styles.subtitle}>اختر حسب بلد المنشأ</Text>
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
                            <Card
                                style={[
                                    styles.card,
                                    isSelected && styles.selectedCard,
                                ]}
                                padding={16}
                            >
                                <View
                                    style={[
                                        styles.flagContainer,
                                        isSelected && styles.selectedFlagContainer,
                                    ]}
                                >
                                    <Text style={styles.flag}>{item.flag}</Text>
                                </View>
                                <Text
                                    style={[
                                        styles.cardLabel,
                                        isSelected && styles.selectedLabel,
                                    ]}
                                >
                                    {item.name}
                                </Text>

                                {isSelected && (
                                    <View style={styles.checkIcon}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color="#007AFF"
                                        />
                                    </View>
                                )}
                            </Card>
                        </TouchableOpacity>
                    </Animated.View>
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
    row: {
        gap: 12,
    },
    cardWrapper: {
        flex: 1,
        marginBottom: 12,
    },
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        height: 140,
    },
    selectedCard: {
        borderColor: '#007AFF',
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
        right: 8,
    },
});
