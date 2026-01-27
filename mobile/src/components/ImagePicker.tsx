import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

interface ImagePickerComponentProps {
    onImageSelected: (uri: string) => void;
    currentImage?: string;
}

export default function ImagePickerComponent({ onImageSelected, currentImage }: ImagePickerComponentProps) {
    const [imageUri, setImageUri] = useState<string | undefined>(currentImage);

    const pickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى معرض الصور');
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            onImageSelected(uri);
        }
    };

    const takePhoto = async () => {
        // Request permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('خطأ', 'نحتاج إلى إذن للوصول إلى الكاميرا');
            return;
        }

        // Take photo
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;
            setImageUri(uri);
            onImageSelected(uri);
        }
    };

    const removeImage = () => {
        setImageUri(undefined);
        onImageSelected('');
    };

    const showOptions = () => {
        Alert.alert(
            'اختر مصدر الصورة',
            '',
            [
                { text: 'الكاميرا', onPress: takePhoto },
                { text: 'المعرض', onPress: pickImage },
                { text: 'إلغاء', style: 'cancel' },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {imageUri ? (
                <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <IconButton
                        icon="close-circle"
                        size={24}
                        iconColor="#fff"
                        style={styles.removeButton}
                        onPress={removeImage}
                    />
                </View>
            ) : (
                <TouchableOpacity style={styles.placeholder} onPress={showOptions}>
                    <Text variant="titleMedium" style={styles.placeholderText}>
                        📷
                    </Text>
                    <Text variant="bodySmall" style={styles.placeholderSubtext}>
                        اضغط لإضافة صورة
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    placeholder: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    placeholderText: {
        fontSize: 48,
        marginBottom: 8,
    },
    placeholderSubtext: {
        color: '#666',
    },
});
