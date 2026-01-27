import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../shared';

interface Review {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    date: string;
}

interface ReviewCardProps {
    review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
    const renderStars = () => {
        return Array.from({ length: 5 }).map((_, index) => (
            <Ionicons
                key={index}
                name={index < review.rating ? 'star' : 'star-outline'}
                size={14}
                color="#FF9500"
            />
        ));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-SY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card style={styles.card} padding={12}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{review.userName}</Text>
                    <View style={styles.rating}>{renderStars()}</View>
                </View>
                <Text style={styles.date}>{formatDate(review.date)}</Text>
            </View>
            <Text style={styles.comment}>{review.comment}</Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    rating: {
        flexDirection: 'row',
        gap: 2,
    },
    date: {
        fontSize: 12,
        color: '#94a3b8',
    },
    comment: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        textAlign: 'right',
    },
});
