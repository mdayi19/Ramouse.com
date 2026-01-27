import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DirectoryService } from '@/services/directory.service';
import { Technician } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TechnicianDirectoryScreen() {
    const router = useRouter();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('');

    useEffect(() => {
        loadTechnicians();
    }, [searchTerm, cityFilter]);

    const loadTechnicians = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (cityFilter) params.city = cityFilter;

            const data: any = await DirectoryService.getTechnicians(params);
            setTechnicians(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Failed to load technicians:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTechnicianCard = ({ item }: { item: Technician }) => {
        const coverImage = item.gallery && item.gallery.length > 0 && item.gallery[0].type === 'image'
            ? { uri: item.gallery[0].url } // Adjust based on your API response structure for media
            : null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/(customer)/technicians/${item.id}`)}
            >
                <View style={styles.coverImageContainer}>
                    {coverImage ? (
                        <Image source={coverImage} style={styles.coverImage} resizeMode="cover" />
                    ) : (
                        <View style={[styles.coverImage, { backgroundColor: '#e2e8f0' }]} />
                    )}
                    <View style={styles.overlay} />
                </View>

                <View style={styles.cardContent}>
                    <View style={styles.profileHeader}>
                        <Image
                            source={item.profilePhoto ? { uri: item.profilePhoto } : { uri: 'https://placehold.co/100' }}
                            style={styles.profilePhoto}
                        />
                        {item.isVerified && (
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
                            </View>
                        )}
                    </View>

                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="construct-outline" size={14} color="#64748b" />
                        <Text style={styles.infoText}>{item.specialty}</Text>
                        <Text style={styles.divider}>|</Text>
                        <Ionicons name="location-outline" size={14} color="#64748b" />
                        <Text style={styles.infoText}>{item.city}</Text>
                    </View>

                    {item.averageRating ? (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#eab308" />
                            <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
                        </View>
                    ) : null}

                    <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>دليل الفنيين</Text>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="ابحث عن فني..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholderTextColor="#94a3b8"
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3b82f6" />
                </View>
            ) : (
                <FlatList
                    data={technicians}
                    renderItem={renderTechnicianCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>لا يوجد فنيون متاحون حالياً</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        items: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    backButton: {
        padding: 4,
    },
    filterButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: '#1e293b',
        textAlign: 'right', // For Arabic
    },
    listContent: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#64748b',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    coverImageContainer: {
        height: 100,
        backgroundColor: '#e2e8f0',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    cardContent: {
        padding: 16,
        paddingTop: 0,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: -30,
        marginBottom: 8,
    },
    profilePhoto: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#f1f5f9',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'left',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#64748b',
        marginHorizontal: 4,
    },
    divider: {
        color: '#cbd5e1',
        marginHorizontal: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#fef9c3',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#854d0e',
        marginLeft: 4,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
    },
});
