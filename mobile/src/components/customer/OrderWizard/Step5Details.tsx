import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Step5DetailsProps {
    description: string;
    partNumber: string;
    images: string[];
    onUpdate: (field: string, value: any) => void;
    onAddImage: () => Promise<void>;
    onRemoveImage: (index: number) => void;
}

export const Step5Details: React.FC<Step5DetailsProps> = ({
    description,
    partNumber,
    images,
    onUpdate,
    onAddImage,
    onRemoveImage,
}) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>التفاصيل والصور</Text>
            <Text style={styles.subtitle}>
                كلما كان الوصف دقيقاً، حصلت على عروض أفضل.
            </Text>

            <View style={styles.formGroup}>
                <Text style={styles.label}>وصف القطعة *</Text>
                <TextInput
                    value={description}
                    onChangeText={(text) => onUpdate('description', text)}
                    multiline
                    numberOfLines={6}
                    style={styles.textArea}
                    placeholder="صف العطل أو القطعة المطلوبة بالتفصيل (مثل: يمين/يسار، أمامي/خلفي)..."
                    placeholderTextColor="#94a3b8"
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>رقم القطعة (اختياري)</Text>
                <View style={styles.inputContainer}>
                    <Ionicons name="barcode-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                        value={partNumber}
                        onChangeText={(text) => onUpdate('partNumber', text)}
                        style={styles.input}
                        placeholder="Part Number"
                        placeholderTextColor="#94a3b8"
                        returnKeyType="done"
                    />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>صور توضيحية ({images.length}/5)</Text>

                <View style={styles.imagesGrid}>
                    {/* Add Button */}
                    <TouchableOpacity
                        style={[
                            styles.addImageButton,
                            images.length >= 5 && styles.addImageButtonDisabled,
                        ]}
                        onPress={onAddImage}
                        disabled={images.length >= 5}
                    >
                        <Ionicons
                            name="camera"
                            size={32}
                            color={images.length >= 5 ? '#cbd5e1' : '#007AFF'}
                        />
                        <Text
                            style={[
                                styles.addImageText,
                                images.length >= 5 && styles.addImageTextDisabled,
                            ]}
                        >
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
};

const styles = StyleSheet.create({
    container: {
        padding: 24,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        textAlign: 'right',
        fontSize: 16,
        color: '#1e293b',
    },
    textArea: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        textAlign: 'right',
        fontSize: 16,
        minHeight: 120,
        color: '#1e293b',
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
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageButtonDisabled: {
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
    },
    addImageText: {
        fontSize: 12,
        color: '#007AFF',
        marginTop: 4,
        fontWeight: 'bold',
    },
    addImageTextDisabled: {
        color: '#cbd5e1',
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
        right: 4,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
