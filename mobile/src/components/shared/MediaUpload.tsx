import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface MediaUploadProps {
    maxFiles?: number;
    files: string[]; // Array of URIs
    setFiles: (files: string[]) => void;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
    maxFiles = 5,
    files,
    setFiles,
}) => {
    const pickImage = async () => {
        if (files.length >= maxFiles) {
            Alert.alert('الحد الأقصى', `يمكنك تحميل ${maxFiles} صور فقط`);
            return;
        }

        // Request permission
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('إذن مطلوب', 'نحتاج إلى إذن للوصول إلى معرض الصور');
                return;
            }
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets) {
            const newUris = result.assets.map(asset => asset.uri);
            const combinedFiles = [...files, ...newUris].slice(0, maxFiles);
            setFiles(combinedFiles);
        }
    };

    const takePhoto = async () => {
        if (files.length >= maxFiles) {
            Alert.alert('الحد الأقصى', `يمكنك تحميل ${maxFiles} صور فقط`);
            return;
        }

        // Request permission
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('إذن مطلوب', 'نحتاج إلى إذن للوصول إلى الكاميرا');
                return;
            }
        }

        // Take photo
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            const newFiles = [...files, result.assets[0].uri];
            setFiles(newFiles);
        }
    };

    const removeImage = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        setFiles(newFiles);
    };

    return (
        <View style={styles.container}>
            {/* Upload Actions */}
            <View style={styles.actionsRow}>
                <TouchableOpacity onPress={pickImage} style={styles.actionButton} activeOpacity={0.7}>
                    <Ionicons name="images-outline" size={24} color="#007AFF" />
                    <Text style={styles.actionText}>اختر من المعرض</Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && (
                    <TouchableOpacity onPress={takePhoto} style={styles.actionButton} activeOpacity={0.7}>
                        <Ionicons name="camera-outline" size={24} color="#007AFF" />
                        <Text style={styles.actionText}>التقط صورة</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Images Grid */}
            {files.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                    {files.map((uri, index) => (
                        <View key={index} style={styles.imageContainer}>
                            <Image source={{ uri }} style={styles.image} />
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeImage(index)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close-circle" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            )}

            {/* Count Info */}
            <Text style={styles.countText}>
                {files.length} / {maxFiles} صور
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 12,
        borderStyle: 'dashed',
        backgroundColor: '#F0F7FF',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    imagesScroll: {
        marginBottom: 12,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 12,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFF',
        borderRadius: 12,
    },
    countText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});
