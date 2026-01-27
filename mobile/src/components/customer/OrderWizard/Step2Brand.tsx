import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, TextInput, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CAR_CATEGORIES } from '@/data/constants';

interface Step2BrandProps {
    selectedBrand: string;
    category: string;
    onSelect: (brand: string) => void;
}

export const Step2Brand: React.FC<Step2BrandProps> = ({
    selectedBrand,
    category,
    onSelect,
}) => {
    const [search, setSearch] = useState('');
    const [otherBrand, setOtherBrand] = useState('');

    // Get brands for the selected category
    const relevantBrands = useMemo(() => {
        const cat = CAR_CATEGORIES.find((c) => c.name === category);
        return cat ? cat.brands : [];
    }, [category]);

    const filteredBrands = relevantBrands.filter((b) =>
        b.toLowerCase().includes(search.toLowerCase())
    );

    const handleOtherBrand = (text: string) => {
        setOtherBrand(text);
        onSelect(text);
    };

    return (
        <FlatList
            style={styles.container}
            data={filteredBrands}
            keyExtractor={(item) => item}
            numColumns={3}
            contentContainerStyle={styles.contentContainer}
            columnWrapperStyle={styles.columnWrapper}
            ListHeaderComponent={
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerEmoji}>🏭</Text>
                        <Text style={styles.title}>ما هي الشركة؟</Text>
                        <Text style={styles.subtitle}>اختر شركة السيارة من القائمة</Text>
                    </View>

                    {relevantBrands.length > 6 && (
                        <View style={styles.searchContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color="#94a3b8"
                                style={styles.searchIcon}
                            />
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
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() => onSelect(item)}
                    style={[styles.card, selectedBrand === item && styles.selectedCard]}
                >
                    <View
                        style={[
                            styles.iconCircle,
                            selectedBrand === item && styles.selectedIconCircle,
                        ]}
                    >
                        <Text style={styles.brandInitial}>{item[0]}</Text>
                    </View>

                    <Text
                        numberOfLines={1}
                        style={[
                            styles.brandName,
                            selectedBrand === item && styles.selectedBrandName,
                        ]}
                    >
                        {item}
                    </Text>

                    {selectedBrand === item && (
                        <View style={styles.checkIcon}>
                            <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
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
        alignItems: 'center',
        marginBottom: 24,
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
        borderColor: '#007AFF',
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
        right: 6,
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
        fontSize: 14,
    },
});
