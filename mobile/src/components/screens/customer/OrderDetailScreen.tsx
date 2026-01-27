import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Text, Card, Button, Chip, Divider, TextInput, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderById, useAcceptQuote, useSubmitReview } from '@/hooks/useOrders';
import { LoadingState, ErrorState } from '@/components';
import type { Quote } from '@/services/order.service';

const PAYMENT_METHODS = [
    { id: '1', name: 'سيرياتيل كاش' },
    { id: '2', name: 'MTN كاش' },
    { id: '3', name: 'حوالة بنكية' },
    { id: '4', name: 'نقداً عند الاستلام' },
];

export default function OrderDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { data: order, isLoading, error, refetch } = useOrderById(id);
    const acceptQuote = useAcceptQuote();
    const submitReview = useSubmitReview();

    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping');
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentReceipt, setPaymentReceipt] = useState<any>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Review state
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');

    if (isLoading) {
        return <LoadingState message="جاري تحميل تفاصيل الطلب..." />;
    }

    if (error || !order) {
        return (
            <ErrorState
                message="فشل تحميل تفاصيل الطلب"
                onRetry={() => refetch()}
            />
        );
    }

    const handleSelectQuote = (quote: Quote) => {
        setSelectedQuote(quote);
        setShowAcceptModal(true);
    };

    const handlePickReceipt = async () => {
        // TODO: Implement file picker when expo-document-picker is installed
        Alert.alert(
            'رفع الإيصال',
            'سيتم إضافة إمكانية رفع الإيصال قريباً',
            [{ text: 'حسناً' }]
        );
        // For now, mark as uploaded
        setPaymentReceipt({ name: 'receipt.jpg' });
    };

    const validateAcceptForm = () => {
        const newErrors: Record<string, string> = {};

        if (!paymentMethodId) newErrors.payment = 'يرجى اختيار طريقة الدفع';
        if (!customerName) newErrors.name = 'يرجى إدخال الاسم';
        if (deliveryMethod === 'shipping' && !customerAddress) {
            newErrors.address = 'يرجى إدخال العنوان';
        }
        if (!customerPhone) newErrors.phone = 'يرجى إدخال رقم الهاتف';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAcceptQuote = async () => {
        if (!validateAcceptForm() || !selectedQuote) return;

        try {
            const paymentMethod = PAYMENT_METHODS.find(m => m.id === paymentMethodId);

            await acceptQuote.mutateAsync({
                orderNumber: order.orderNumber,
                data: {
                    quote_id: selectedQuote.id,
                    payment_method_id: paymentMethodId,
                    payment_method_name: paymentMethod?.name || '',
                    delivery_method: deliveryMethod,
                    customer_name: customerName,
                    customer_address: customerAddress,
                    customer_phone: customerPhone,
                    shipping_price: 0, // Calculate based on settings
                    payment_receipt: paymentReceipt,
                },
            });

            setShowAcceptModal(false);
            router.back();
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل قبول العرض' });
        }
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            setErrors({ rating: 'يرجى اختيار التقييم' });
            return;
        }

        try {
            await submitReview.mutateAsync({
                orderNumber: order.orderNumber,
                rating,
                comment: reviewComment,
            });

            setShowReviewModal(false);
            setRating(0);
            setReviewComment('');
        } catch (error: any) {
            setErrors({ general: error.response?.data?.message || 'فشل إرسال التقييم' });
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'قيد المراجعة': '#f39c12',
            'في انتظار العروض': '#3498db',
            'تم قبول العرض': '#2ecc71',
            'قيد التوصيل': '#9b59b6',
            'تم التوصيل': '#27ae60',
            'ملغي': '#e74c3c',
        };
        return colors[status] || '#95a5a6';
    };

    const quotesCount = order.quotes?.length || 0;
    const newQuotesCount = order.quotes?.filter(q => !q.viewedByCustomer).length || 0;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Text variant="headlineSmall" style={styles.orderNumber}>
                            طلب #{order.orderNumber}
                        </Text>
                        <Chip
                            style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                            textStyle={styles.statusText}
                        >
                            {order.status}
                        </Chip>
                    </View>
                    <Text variant="bodyMedium" style={styles.orderDate}>
                        📅 {new Date(order.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                </View>

                {/* Car Info */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            🚗 معلومات السيارة
                        </Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>الماركة:</Text>
                            <Text style={styles.value}>{order.brand}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>الموديل:</Text>
                            <Text style={styles.value}>{order.model}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>السنة:</Text>
                            <Text style={styles.value}>{order.year}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>المدينة:</Text>
                            <Text style={styles.value}>{order.city}</Text>
                        </View>
                    </Card.Content>
                </Card>

                {/* Part Info */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                            🔧 معلومات القطعة
                        </Text>
                        <Text variant="bodyMedium" style={styles.description}>
                            {order.part_description}
                        </Text>
                        {order.part_types && order.part_types.length > 0 && (
                            <View style={styles.chipsContainer}>
                                {order.part_types.map((type, index) => (
                                    <Chip key={index} style={styles.partChip}>
                                        {type}
                                    </Chip>
                                ))}
                            </View>
                        )}
                    </Card.Content>
                </Card>

                {/* Quotes */}
                {quotesCount > 0 && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <View style={styles.quotesHeader}>
                                <Text variant="titleMedium" style={styles.sectionTitle}>
                                    💰 العروض ({quotesCount})
                                </Text>
                                {newQuotesCount > 0 && (
                                    <Chip style={styles.newBadge} textStyle={styles.newBadgeText}>
                                        {newQuotesCount} جديد
                                    </Chip>
                                )}
                            </View>

                            {order.quotes?.map((quote) => (
                                <Card key={quote.id} style={styles.quoteCard}>
                                    <Card.Content>
                                        <View style={styles.quoteHeader}>
                                            <Text variant="titleLarge" style={styles.quotePrice}>
                                                ${quote.price.toLocaleString()}
                                            </Text>
                                            <Chip
                                                style={styles.statusBadge}
                                                textStyle={styles.statusBadgeText}
                                            >
                                                {quote.partStatus}
                                            </Chip>
                                        </View>

                                        {quote.notes && (
                                            <Text variant="bodyMedium" style={styles.quoteNotes}>
                                                📝 {quote.notes}
                                            </Text>
                                        )}

                                        {!order.acceptedQuote && (
                                            <Button
                                                mode="contained"
                                                onPress={() => handleSelectQuote(quote)}
                                                style={styles.acceptButton}
                                            >
                                                قبول العرض
                                            </Button>
                                        )}
                                    </Card.Content>
                                </Card>
                            ))}
                        </Card.Content>
                    </Card>
                )}

                {/* Accepted Quote Info */}
                {order.acceptedQuote && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                ✅ العرض المقبول
                            </Text>
                            <Text variant="headlineMedium" style={styles.acceptedPrice}>
                                ${order.acceptedQuote.price.toLocaleString()}
                            </Text>
                            <Text variant="bodyMedium" style={styles.deliveryInfo}>
                                طريقة التوصيل: {order.deliveryMethod === 'shipping' ? 'شحن' : 'استلام'}
                            </Text>
                            {order.deliveryMethod === 'shipping' && order.customerAddress && (
                                <Text variant="bodySmall" style={styles.address}>
                                    العنوان: {order.customerAddress}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Review Section */}
                {order.status === 'تم التوصيل' && !order.review && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                ⭐ تقييم الطلب
                            </Text>
                            <Text variant="bodyMedium" style={styles.reviewPrompt}>
                                شاركنا تجربتك مع هذا الطلب
                            </Text>
                            <Button
                                mode="contained"
                                onPress={() => setShowReviewModal(true)}
                                style={styles.reviewButton}
                            >
                                إضافة تقييم
                            </Button>
                        </Card.Content>
                    </Card>
                )}

                {/* Existing Review */}
                {order.review && (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text variant="titleMedium" style={styles.sectionTitle}>
                                ⭐ تقييمك
                            </Text>
                            <View style={styles.ratingRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Text key={star} style={styles.star}>
                                        {star <= order.review!.rating ? '⭐' : '☆'}
                                    </Text>
                                ))}
                            </View>
                            {order.review.comment && (
                                <Text variant="bodyMedium" style={styles.reviewComment}>
                                    {order.review.comment}
                                </Text>
                            )}
                        </Card.Content>
                    </Card>
                )}

                {/* Accept Quote Modal (simplified - would be a proper modal component) */}
                {showAcceptModal && selectedQuote && (
                    <Card style={styles.modalCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                تأكيد قبول العرض
                            </Text>

                            <Text variant="headlineMedium" style={styles.modalPrice}>
                                ${selectedQuote.price.toLocaleString()}
                            </Text>

                            <Divider style={styles.divider} />

                            {/* Payment Method */}
                            <Text variant="titleSmall" style={styles.fieldLabel}>
                                طريقة الدفع *
                            </Text>
                            {PAYMENT_METHODS.map((method) => (
                                <Chip
                                    key={method.id}
                                    selected={paymentMethodId === method.id}
                                    onPress={() => setPaymentMethodId(method.id)}
                                    style={styles.methodChip}
                                >
                                    {method.name}
                                </Chip>
                            ))}
                            <HelperText type="error" visible={!!errors.payment}>
                                {errors.payment}
                            </HelperText>

                            {/* Delivery Method */}
                            <Text variant="titleSmall" style={styles.fieldLabel}>
                                طريقة التوصيل *
                            </Text>
                            <View style={styles.deliveryButtons}>
                                <Chip
                                    selected={deliveryMethod === 'shipping'}
                                    onPress={() => setDeliveryMethod('shipping')}
                                    style={styles.methodChip}
                                >
                                    شحن
                                </Chip>
                                <Chip
                                    selected={deliveryMethod === 'pickup'}
                                    onPress={() => setDeliveryMethod('pickup')}
                                    style={styles.methodChip}
                                >
                                    استلام
                                </Chip>
                            </View>

                            <TextInput
                                label="الاسم *"
                                value={customerName}
                                onChangeText={setCustomerName}
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.name}
                            />
                            <HelperText type="error" visible={!!errors.name}>
                                {errors.name}
                            </HelperText>

                            {deliveryMethod === 'shipping' && (
                                <>
                                    <TextInput
                                        label="العنوان *"
                                        value={customerAddress}
                                        onChangeText={setCustomerAddress}
                                        mode="outlined"
                                        multiline
                                        numberOfLines={2}
                                        style={styles.input}
                                        error={!!errors.address}
                                    />
                                    <HelperText type="error" visible={!!errors.address}>
                                        {errors.address}
                                    </HelperText>
                                </>
                            )}

                            <TextInput
                                label="رقم الهاتف *"
                                value={customerPhone}
                                onChangeText={setCustomerPhone}
                                keyboardType="phone-pad"
                                mode="outlined"
                                style={styles.input}
                                error={!!errors.phone}
                            />
                            <HelperText type="error" visible={!!errors.phone}>
                                {errors.phone}
                            </HelperText>

                            <Button
                                mode="outlined"
                                onPress={handlePickReceipt}
                                style={styles.uploadButton}
                            >
                                {paymentReceipt ? 'تم رفع الإيصال ✓' : 'رفع إيصال الدفع'}
                            </Button>

                            {errors.general && (
                                <HelperText type="error" visible={true}>
                                    {errors.general}
                                </HelperText>
                            )}

                            <View style={styles.modalButtons}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowAcceptModal(false)}
                                    style={styles.modalButton}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleAcceptQuote}
                                    loading={acceptQuote.isPending}
                                    disabled={acceptQuote.isPending}
                                    style={styles.modalButton}
                                >
                                    تأكيد
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* Review Modal (simplified) */}
                {showReviewModal && (
                    <Card style={styles.modalCard}>
                        <Card.Content>
                            <Text variant="titleLarge" style={styles.modalTitle}>
                                تقييم الطلب
                            </Text>

                            <Text variant="bodyMedium" style={styles.ratingLabel}>
                                التقييم *
                            </Text>
                            <View style={styles.ratingRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Text
                                        key={star}
                                        style={styles.starButton}
                                        onPress={() => setRating(star)}
                                    >
                                        {star <= rating ? '⭐' : '☆'}
                                    </Text>
                                ))}
                            </View>
                            <HelperText type="error" visible={!!errors.rating}>
                                {errors.rating}
                            </HelperText>

                            <TextInput
                                label="التعليق (اختياري)"
                                value={reviewComment}
                                onChangeText={setReviewComment}
                                mode="outlined"
                                multiline
                                numberOfLines={4}
                                style={styles.input}
                            />

                            <View style={styles.modalButtons}>
                                <Button
                                    mode="outlined"
                                    onPress={() => setShowReviewModal(false)}
                                    style={styles.modalButton}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={handleSubmitReview}
                                    loading={submitReview.isPending}
                                    disabled={submitReview.isPending}
                                    style={styles.modalButton}
                                >
                                    إرسال
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: {
        fontWeight: 'bold',
    },
    statusChip: {
        height: 32,
    },
    statusText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    orderDate: {
        color: '#666',
    },
    card: {
        margin: 16,
        marginTop: 0,
    },
    sectionTitle: {
        fontWeight: 'bold',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#666',
    },
    value: {
        fontWeight: '600',
    },
    description: {
        color: '#666',
        lineHeight: 22,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    partChip: {
        backgroundColor: '#e3f2fd',
    },
    quotesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    newBadge: {
        backgroundColor: '#e74c3c',
    },
    newBadgeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    quoteCard: {
        marginBottom: 12,
        backgroundColor: '#f8f9fa',
    },
    quoteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    quotePrice: {
        fontWeight: 'bold',
        color: '#2ecc71',
    },
    statusBadge: {
        backgroundColor: '#3498db',
    },
    statusBadgeText: {
        color: '#fff',
        fontSize: 12,
    },
    quoteNotes: {
        color: '#666',
        marginBottom: 12,
    },
    acceptButton: {
        marginTop: 8,
    },
    acceptedPrice: {
        fontWeight: 'bold',
        color: '#2ecc71',
        marginBottom: 8,
    },
    deliveryInfo: {
        color: '#666',
        marginBottom: 4,
    },
    address: {
        color: '#999',
    },
    reviewPrompt: {
        color: '#666',
        marginBottom: 12,
    },
    reviewButton: {
        marginTop: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 12,
    },
    star: {
        fontSize: 32,
    },
    starButton: {
        fontSize: 32,
        padding: 4,
    },
    reviewComment: {
        color: '#666',
        marginTop: 8,
    },
    modalCard: {
        margin: 16,
        padding: 8,
    },
    modalTitle: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    modalPrice: {
        textAlign: 'center',
        color: '#2ecc71',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    divider: {
        marginVertical: 16,
    },
    fieldLabel: {
        marginTop: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    methodChip: {
        marginRight: 8,
        marginBottom: 8,
    },
    deliveryButtons: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    input: {
        marginBottom: 4,
    },
    uploadButton: {
        marginVertical: 12,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    modalButton: {
        flex: 1,
    },
    ratingLabel: {
        marginTop: 8,
        fontWeight: '600',
    },
});
