import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export interface ProfileField {
    key: string;
    label: string;
    placeholder?: string;
    multiline?: boolean;
    editable?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

interface ProviderProfileFormProps {
    initialData: any;
    fields: ProfileField[];
    onSave: (data: any) => Promise<void>;
    onLogout: () => void;
    photoLabel?: string;
}

export const ProviderProfileForm: React.FC<ProviderProfileFormProps> = ({
    initialData,
    fields,
    onSave,
    onLogout,
    photoLabel = 'تغيير الصورة'
}) => {
    const [formData, setFormData] = useState<any>(initialData || {});
    const [saving, setSaving] = useState(false);

    // Update internal state when initialData changes
    React.useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleSavePress = async () => {
        setSaving(true);
        try {
            await onSave(formData);
        } finally {
            setSaving(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData({ ...formData, profilePhoto: base64Img });
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>الملف الشخصي</Text>
                <TouchableOpacity onPress={handleSavePress} disabled={saving}>
                    {saving ? <ActivityIndicator color="#3b82f6" /> : <Text style={styles.saveButton}>حفظ</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Photo Section */}
                <View style={styles.photoSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.photoContainer}>
                        <Image
                            source={formData.profilePhoto ? { uri: formData.profilePhoto } : { uri: 'https://placehold.co/100?text=User' }}
                            style={styles.profilePhoto}
                        />
                        <View style={styles.photoBadge}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.changePhotoText}>{photoLabel}</Text>
                </View>

                {/* Dynamic Fields */}
                <View style={styles.formSection}>
                    {fields.map((field) => (
                        <View key={field.key}>
                            <Text style={styles.label}>{field.label}</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    field.editable === false && styles.disabledInput,
                                    field.multiline && styles.textArea
                                ]}
                                value={formData[field.key]}
                                onChangeText={text => setFormData({ ...formData, [field.key]: text })}
                                editable={field.editable !== false}
                                multiline={field.multiline}
                                numberOfLines={field.multiline ? 4 : 1}
                                placeholder={field.placeholder}
                                keyboardType={field.keyboardType}
                            />
                        </View>
                    ))}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>تسجيل الخروج</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    saveButton: {
        color: '#3b82f6',
        fontWeight: 'bold',
        fontSize: 16,
    },
    content: {
        padding: 20,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    photoContainer: {
        position: 'relative',
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e2e8f0',
    },
    photoBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#3b82f6',
        padding: 8,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoText: {
        marginTop: 8,
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '600',
    },
    formSection: {
        gap: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8, // Fixed margin
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#0f172a',
        textAlign: 'right',
    },
    disabledInput: {
        backgroundColor: '#f1f5f9',
        color: '#94a3b8',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    logoutButton: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        backgroundColor: '#fee2e2',
        borderRadius: 12,
    },
    logoutText: {
        color: '#ef4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
