import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Alert,
    Text,
    TouchableOpacity,
    Image,
    Linking,
    Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../layout';
import { Card, Badge, Button, LoadingState, ErrorState } from '../shared';
import apiClient from '@/api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    category: string;
    brand: string;
    model: string;
    year: string;
    transmission: string;
    parts: string[];
    description: string;
    city: string;
    createdAt: string;
    images?: string[];
    customerImages?: string[];
    paymentReceiptUrl?: string;
}

interface Quote {
    id: string;
    providerId: string;
    providerName?: string;
    providerUniqueId: string;
    providerPhone?: string;
    provider_phone?: string;
    price: number;
    partStatus: string;
    partSizeCategory?: string;
    notes?: string;
    timestamp: string;
    viewedByCustomer: boolean;
    media?: {
        images?: string[];
        video?: string;
        voiceNote?: string;
    };
}

export const OrderDetailScreen: React.FC = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderNumber = params.id as string;

    const [order, setOrder] = useState<OrderData | null>(null);
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [acceptedQuoteId, setAcceptedQuoteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (orderNumber) {
            fetchOrderDetails();
        }
    }, [orderNumber]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/orders/${orderNumber}`);
            const orderData = response.data.data || response.data;

            setOrder({
                id: orderData.id?.toString() || orderData.orderNumber,
                orderNumber: orderData.orderNumber,
                status: orderData.status,
                category: orderData.formData?.category || '',
                brand: orderData.formData?.brand || orderData.formData?.brandManual || '',
                model: orderData.formData?.model || '',
                year: orderData.formData?.year || '',
                transmission: orderData.formData?.transmission || 'auto',
                parts: orderData.formData?.partTypes || [],
                description: orderData.formData?.partDescription || '',
                city: orderData.formData?.city || '',
                createdAt: orderData.createdAt || '',
                customerImages: orderData.formData?.images || [],
                paymentReceiptUrl: orderData.paymentReceiptUrl,
            });

            setQuotes(orderData.quotes || []);
            setAcceptedQuoteId(orderData.acceptedQuote?.id || null);
        } catch (err) {
            console.error('Error fetching order details:', err);
            setError('فشل تحميل تفاصيل الطلب');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrderDetails();
        setRefreshing(false);
    };

    const handleWhatsAppContact = (phone: string, providerName: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`مرحباً ${providerName}، بخصوص العرض المقدم للطلب رقم ${orderNumber} في تطبيق راموسة.`);
        const url = `https://wa.me/${cleanPhone}?text=${message}`;
        Linking.openURL(url);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { text: string; variant: any }> = {
            pending: { text: 'قيد المراجعة', variant: 'warning' },
            quoted: { text: 'عروض متاحة', variant: 'info' },
            payment_pending: { text: 'بانتظار الدفع', variant: 'warning' },
            processing: { text: 'جاري التجهيز', variant: 'default' },
            ready_for_pickup: { text: 'جاهز للاستلام', variant: 'success' },
            provider_received: { text: 'استلمه المزود', variant: 'info' },
            shipped: { text: 'تم الشحن', variant: 'info' },
            out_for_delivery: { text: 'قيد التوصيل', variant: 'info' },
            delivered: { text: 'تم التوصيل', variant: 'success' },
            completed: { text: 'مكتمل', variant: 'success' },
            cancelled: { text: 'ملغي', variant: 'danger' },
        };
        return statusMap[status] || { text: status, variant: 'default' };
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Header title="تفاصيل الطلب" showBack onBack={() => router.back()} />
                <LoadingState message="جاري تحميل تفاصيل الطلب..." />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.container}>
                <Header title="تفاصيل الطلب" showBack onBack={() => router.back()} />
                <ErrorState message={error || 'الطلب غير موجود'} onRetry={fetchOrderDetails} />
            </View>
        );
    }

    const statusBadge = getStatusBadge(order.status);
    const quoteStats = quotes.length > 0 ? {
        count: quotes.length,
        min: Math.min(...quotes.map(q => q.price)),
        max: Math.max(...quotes.map(q => q.price)),
        avg: Math.round(quotes.reduce((sum, q) => sum + q.price, 0) / quotes.length),
    } : null;

    return (
        <View style={styles.container}>
            <Header title="تفاصيل الطلب" showBack onBack={() => router.back()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Status Header */}
                <View style={styles.statusHeader}>
                    <Badge text={statusBadge.text} variant={statusBadge.variant} />
                    <Text style={styles.orderNumberText}>طلب #{order.orderNumber}</Text>
                </View>

                {/* Car Info Card */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="car-sport" size={20} color="#007AFF" />
                        <Text style={styles.sectionTitle}>معلومات السيارة</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>السيارة:</Text>
                        <Text style={styles.infoValue}>
                            {order.brand} {order.model} {order.year}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>الفئة:</Text>
                        <Text style={styles.infoValue}>{order.category}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>المدينة:</Text>
                        <Text style={styles.infoValue}>{order.city}</Text>
                    </View>
                </Card>

                {/* Parts Card */}
                <Card style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings" size={20} color="#FF9500" />
                        <Text style={styles.sectionTitle}>القطع المطلوبة</Text>
                    </View>
                    <View style={styles.tags}>
                        {order.parts.map((part, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>{part}</Text>
                            </View>
                        ))}
                    </View>
                    {order.description && (
                        <>
                            <View style={styles.divider} />
                            <Text style={styles.descLabel}>الوصف:</Text>
                            <Text style={styles.descText}>{order.description}</Text>
                        </>
                    )}
                </Card>

                {/* Customer Images Gallery */}
                {order.customerImages && order.customerImages.length > 0 && (
                    <Card style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="images" size={20} color="#8B5CF6" />
                            <Text style={styles.sectionTitle}>الصور المرفقة</Text>
                        </View>
                        <View style={styles.imageGrid}>
                            {order.customerImages.map((img, index) => (
                                <TouchableOpacity key={index} style={styles.imageGridItem}>
                                    <Image
                                        source={{ uri: img }}
                                        style={styles.gridImage}
                                        resizeMode="cover"
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Card>
                )}

                {/* Quote Statistics */}
                {quoteStats && (
                    <Card style={[styles.section, styles.statsCard] as any}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="stats-chart" size={20} color="#10B981" />
                            <Text style={styles.sectionTitle}>إحصائيات العروض</Text>
                        </View>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>عدد العروض</Text>
                                <Text style={styles.statValue}>{quoteStats.count}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>أقل سعر</Text>
                                <Text style={[styles.statValue, styles.statValueGreen]}>
                                    ${quoteStats.min.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>أعلى سعر</Text>
                                <Text style={styles.statValue}>
                                    ${quoteStats.max.toLocaleString()}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>المتوسط</Text>
                                <Text style={[styles.statValue, styles.statValueBlue]}>
                                    ${quoteStats.avg.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Quotes Section */}
                <View style={styles.quotesSection}>
                    <View style={styles.quotesSectionHeader}>
                        <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                        <Text style={styles.quotesTitle}>
                            عروض الأسعار {quotes.length > 0 && `(${quotes.length})`}
                        </Text>
                    </View>

                    {quotes.length > 0 ? (
                        <View style={styles.quoteslist}>
                            {quotes
                                .sort((a, b) => {
                                    if (a.id === acceptedQuoteId) return -1;
                                    if (b.id === acceptedQuoteId) return 1;
                                    return a.price - b.price;
                                })
                                .map((quote) => (
                                    <QuoteCardEnhanced
                                        key={quote.id}
                                        quote={quote}
                                        isAccepted={quote.id === acceptedQuoteId}
                                        onWhatsAppPress={handleWhatsAppContact}
                                    />
                                ))}
                        </View>
                    ) : (
                        <Card style={styles.emptyQuotes}>
                            <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyQuotesText}>
                                لم يتم استلام أي عروض أسعار بعد
                            </Text>
                        </Card>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

// Enhanced Quote Card Component
const QuoteCardEnhanced: React.FC<{
    quote: Quote;
    isAccepted: boolean;
    onWhatsAppPress: (phone: string, name: string) => void;
}> = ({ quote, isAccepted, onWhatsAppPress }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = quote.media?.images || [];
    const phone = quote.providerPhone || quote.provider_phone;

    return (
        <Card style={isAccepted ? [styles.quoteCard, styles.quoteCardAccepted] as any : styles.quoteCard}>
            {/* Accepted Badge */}
            {isAccepted && (
                <View style={styles.acceptedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                    <Text style={styles.acceptedBadgeText}>العرض المقبول</Text>
                </View>
            )}

            {/* Provider Info */}
            <View style={styles.quoteHeader}>
                <View style={styles.providerInfo}>
                    <View style={[styles.providerAvatar, isAccepted && styles.providerAvatarAccepted]}>
                        <Text style={styles.providerAvatarText}>
                            {quote.providerName?.charAt(0) || '؟'}
                        </Text>
                    </View>
                    <View style={styles.providerDetails}>
                        <Text style={styles.providerName}>
                            {quote.providerName || 'مزود مجهول'}
                        </Text>
                        <Text style={styles.providerIdText}>#{quote.providerUniqueId}</Text>
                    </View>
                </View>
                <Text style={styles.quoteTime}>
                    {new Date(quote.timestamp).toLocaleDateString('ar-SY', {
                        day: 'numeric',
                        month: 'short'
                    })}
                </Text>
            </View>

            {/* Price & Status */}
            <View style={styles.quotePriceRow}>
                <Text style={[styles.quotePrice, isAccepted && styles.quotePriceAccepted]}>
                    ${quote.price.toLocaleString()}
                </Text>
                <View style={[styles.partStatusBadge, quote.partStatus === 'new' ? styles.newBadge : styles.usedBadge]}>
                    <Text style={styles.partStatusText}>
                        {quote.partStatus === 'new' ? 'جديد' : 'مستعمل'}
                    </Text>
                </View>
            </View>

            {/* Notes */}
            {quote.notes && (
                <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>"{quote.notes}"</Text>
                </View>
            )}

            {/* Image Carousel */}
            {images.length > 0 && (
                <View style={styles.imageCarousel}>
                    <Image
                        source={{ uri: images[currentImageIndex] }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                    />
                    {images.length > 1 && (
                        <>
                            <TouchableOpacity
                                style={[styles.carouselButton, styles.carouselButtonLeft]}
                                onPress={() => setCurrentImageIndex(prev =>
                                    prev === 0 ? images.length - 1 : prev - 1
                                )}
                            >
                                <Ionicons name="chevron-back" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.carouselButton, styles.carouselButtonRight]}
                                onPress={() => setCurrentImageIndex(prev =>
                                    prev === images.length - 1 ? 0 : prev + 1
                                )}
                            >
                                <Ionicons name="chevron-forward" size={20} color="#FFF" />
                            </TouchableOpacity>
                            <View style={styles.imageCounter}>
                                <Text style={styles.imageCounterText}>
                                    {currentImageIndex + 1} / {images.length}
                                </Text>
                            </View>
                            <View style={styles.carouselDots}>
                                {images.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.carouselDot,
                                            i === currentImageIndex && styles.carouselDotActive
                                        ]}
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* WhatsApp Button */}
            {phone && (
                <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => onWhatsAppPress(phone, quote.providerName || 'المزود')}
                >
                    <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
                    <Text style={styles.whatsappButtonText}>تواصل عبر واتساب</Text>
                </TouchableOpacity>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    orderNumberText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        fontFamily: 'monospace',
    },
    section: {
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#64748b',
    },
    infoValue: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFEDD5',
        shadowColor: '#FB923C',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    tagText: {
        color: '#C2410C',
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },
    descLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
        textAlign: 'right',
    },
    descText: {
        fontSize: 14,
        color: '#1e293b',
        lineHeight: 20,
        textAlign: 'right',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    imageGridItem: {
        width: (SCREEN_WIDTH - 64) / 3,
        height: (SCREEN_WIDTH - 64) / 3,
        borderRadius: 8,
        overflow: 'hidden',
    },
    gridImage: {
        width: '100%',
        height: '100%',
    },
    statsCard: {
        backgroundColor: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
        borderWidth: 2,
        borderColor: '#6EE7B7',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#FFF',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    statValueGreen: {
        color: '#10B981',
    },
    statValueBlue: {
        color: '#3B82F6',
    },
    quotesSection: {
        marginTop: 8,
    },
    quotesSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    quotesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    quoteslist: {
        gap: 12,
    },
    quoteCard: {
        marginBottom: 0,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderRadius: 16,
        overflow: 'hidden',
    },
    quoteCardAccepted: {
        backgroundColor: '#ECFDF5',
        borderWidth: 2,
        borderColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5,
    },
    acceptedBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#10B981',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        zIndex: 1,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    acceptedBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    quoteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    providerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    providerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerAvatarAccepted: {
        backgroundColor: '#D1FAE5',
    },
    providerAvatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    providerDetails: {
        gap: 2,
    },
    providerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    providerIdText: {
        fontSize: 11,
        color: '#94A3B8',
        fontFamily: 'monospace',
    },
    quoteTime: {
        fontSize: 11,
        color: '#94A3B8',
    },
    quotePriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    quotePrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    quotePriceAccepted: {
        color: '#10B981',
    },
    partStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    newBadge: {
        backgroundColor: '#DBEAFE',
    },
    usedBadge: {
        backgroundColor: '#FEF3C7',
    },
    partStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    notesContainer: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#E5E7EB',
    },
    notesText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontStyle: 'italic',
    },
    imageCarousel: {
        position: 'relative',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#F3F4F6',
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    carouselButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -20 }],
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    carouselButtonLeft: {
        left: 12,
    },
    carouselButtonRight: {
        right: 12,
    },
    imageCounter: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    imageCounterText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    carouselDots: {
        position: 'absolute',
        bottom: 12,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    carouselDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    carouselDotActive: {
        width: 20,
        backgroundColor: '#FFF',
    },
    whatsappButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#25D366',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    whatsappButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
    },
    emptyQuotes: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyQuotesText: {
        marginTop: 12,
        fontSize: 14,
        color: '#9CA3AF',
    },
});
