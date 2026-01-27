import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Props {
    description: string;
    partNumber: string;
    images: string[]; // URIs
    onUpdate: (field: string, value: any) => void;
    onAddImage: () => Promise<void>;
    onRemoveImage: (index: number) => void;
}

export default function Step5Details({
    description,
    partNumber,
    images,
    onUpdate,
    onAddImage,
    onRemoveImage
}: Props) {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text variant="headlineSmall" style={styles.title}>
                التفاصيل والصور
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
                كلما كان الوصف دقيقاً، حصلت على عروض أفضل.
            </Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>وصف القطعة *</Text>
                <TextInput
                    value={description}
                    onChangeText={(text) => onUpdate('description', text)}
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                    style={styles.textArea}
                    placeholder="صف العطل أو القطعة المطلوبة بالتفصيل (مثل: يمين/يسار، أمامي/خلفي)..."
                    outlineStyle={styles.inputOutline}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>رقم القطعة (اختياري)</Text>
                <TextInput
                    value={partNumber}
                    onChangeText={(text) => onUpdate('partNumber', text)}
                    mode="outlined"
                    style={styles.input}
                    placeholder="Part Number"
                    outlineStyle={styles.inputOutline}
                    left={<TextInput.Icon icon="barcode" />}
                    returnKeyType="done"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>صور توضيحية ({images.length}/5)</Text>

                <View style={styles.imagesGrid}>
                    {/* Add Button */}
                    <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={onAddImage}
                        disabled={images.length >= 5}
                    >
                        <Ionicons name="camera" size={32} color={images.length >= 5 ? '#cbd5e1' : '#3b82f6'} />
                        <Text style={[styles.addImageText, images.length >= 5 && { color: '#cbd5e1' }]}>
                            إضافة صورة
                        </Text>
                    </TouchableOpacity>

                    {/* Image List */}
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri }} style={styles.imageThumbnail} />
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => onRemoveImage(index)}
                            >
                                <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 24,
    },
    title: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        textAlign: 'center',
        color: '#64748b',
        marginBottom: 32,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#fff',
        textAlign: 'right',
    },
    textArea: {
        backgroundColor: '#fff',
        textAlign: 'right',
        minHeight: 120,
    },
    inputOutline: {
        borderRadius: 12,
        borderColor: '#e2e8f0',
    },
    imagesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    addImageButton: {
        width: 100,
        height: 100,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3b82f6',
        borderStyle: 'dashed',
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageText: {
        fontSize: 12,
        color: '#3b82f6',
        marginTop: 4,
        fontWeight: 'bold',
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    imageThumbnail: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        left: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
