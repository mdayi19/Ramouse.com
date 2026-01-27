import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { CAR_CATEGORIES } from '@/data/constants';

interface Props {
    selectedBrand: string;
    category: string;
    onSelect: (brand: string) => void;
}

export default function Step2Brand({ selectedBrand, category, onSelect }: Props) {
    const [search, setSearch] = useState('');
    const [otherBrand, setOtherBrand] = useState('');

    // Get brands for the selected category
    const relevantBrands = useMemo(() => {
        const cat = CAR_CATEGORIES.find(c => c.name === category);
        return cat ? cat.brands : [];
    }, [category]);

    const filteredBrands = relevantBrands.filter(b =>
        b.toLowerCase().includes(search.toLowerCase())
    );

    const handleOtherBrand = (text: string) => {
        setOtherBrand(text);
        onSelect(text);
    };

    return (
        <FlatList
            style={{ flex: 1 }}
            data={filteredBrands}
            keyExtractor={(item) => item}
            numColumns={3}
            contentContainerStyle={styles.container}
            columnWrapperStyle={{ gap: 12 }}
            ListHeaderComponent={
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerEmoji}>🏭</Text>
                        <Text variant="headlineSmall" style={styles.title}>
                            ما هي الشركة؟
                        </Text>
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            اختر شركة السيارة من القائمة
                        </Text>
                    </View>

                    {relevantBrands.length > 6 && (
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="ابحث عن الماركة..."
                                value={search}
                                onChangeText={setSearch}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    )}
                </>
            }
            ListFooterComponent={
                <View style={styles.otherContainer}>
                    <Text style={styles.otherLabel}>ماركة أخرى / غير موجود؟</Text>
                    <TextInput
                        style={styles.otherInput}
                        placeholder="اكتب اسم الشركة يدوياً..."
                        value={otherBrand}
                        onChangeText={handleOtherBrand}
                    />
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => onSelect(item)}
                    style={[
                        styles.card,
                        selectedBrand === item && styles.selectedCard
                    ]}
                >
                    <View style={[styles.iconCircle, selectedBrand === item && styles.selectedIconCircle]}>
                        <Text style={styles.brandInitial}>{item[0]}</Text>
                    </View>

                    <Text
                        numberOfLines={1}
                        style={[styles.brandName, selectedBrand === item && styles.selectedBrandName]}
                    >
                        {item}
                    </Text>

                    {selectedBrand === item && (
                        <View style={styles.checkIcon}>
                            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                        </View>
                    )}
                </TouchableOpacity>
            )}
            ListEmptyComponent={
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>لا توجد نتائج مطابقة</Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 24,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        textAlign: 'right',
        fontSize: 16,
    },
    card: {
        flex: 1,
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f1f5f9',
        marginBottom: 12,
        padding: 4,
    },
    selectedCard: {
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedIconCircle: {
        backgroundColor: '#dbeafe',
    },
    brandInitial: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#64748b',
    },
    brandName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1e293b',
        textAlign: 'center',
    },
    selectedBrandName: {
        color: '#1d4ed8',
    },
    checkIcon: {
        position: 'absolute',
        top: 6,
        left: 6,
    },
    otherContainer: {
        width: '100%',
        marginTop: 24,
        paddingBottom: 40,
    },
    otherLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'right',
    },
    otherInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        textAlign: 'right',
        fontSize: 16,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94a3b8',
    }
});
