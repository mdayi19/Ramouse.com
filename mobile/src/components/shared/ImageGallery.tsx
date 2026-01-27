import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    Dimensions,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ImageGalleryProps {
    images: string[];
    initialIndex?: number;
    visible: boolean;
    onClose: () => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    initialIndex = 0,
    visible,
    onClose,
}) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const handleScroll = (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / width);
        setCurrentIndex(index);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.container}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Ionicons name="close" size={32} color="#FFFFFF" />
                </TouchableOpacity>

                <FlatList
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    initialScrollIndex={initialIndex}
                    getItemLayout={(_, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
                        </View>
                    )}
                />

                <View style={styles.indicator}>
                    <Ionicons name="images" size={16} color="#FFFFFF" />
                    <View style={styles.indicatorText}>
                        {currentIndex + 1} / {images.length}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height,
    },
    indicator: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    indicatorText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
