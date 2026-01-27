import apiClient from '@/api/client';

export interface CreateOrderData {
    category: string;
    brand: string;
    model: string;
    year: string;
    vin?: string;
    engineType?: string;
    transmission?: string;
    partTypes: string[];
    partDescription: string;
    partNumber?: string;
    additionalDetails?: string;
    contactMethod: string;
    city: string;
    images?: string[];
}

export interface Quote {
    id: string;
    providerId: string;
    providerUniqueId: string;
    price: number;
    partStatus: string;
    partSizeCategory?: string;
    notes?: string;
    timestamp: string;
    viewedByCustomer: boolean;
    media?: string[];
}

export interface Order {
    id: number;
    orderNumber: string;
    customer_id: number;
    category: string;
    brand: string;
    model: string;
    year: string;
    part_types: string[];
    part_description: string;
    status: string;
    city: string;
    quotes?: Quote[];
    acceptedQuote?: Quote;
    paymentMethodId?: string;
    paymentMethodName?: string;
    paymentReceiptUrl?: string;
    deliveryMethod?: 'shipping' | 'pickup';
    shippingPrice?: number;
    customerName?: string;
    customerAddress?: string;
    customerPhone?: string;
    rejectionReason?: string;
    review?: {
        id: string;
        rating: number;
        comment: string;
        timestamp: string;
    };
    created_at: string;
    updated_at: string;
}

export interface AcceptQuoteData {
    quote_id: string;
    payment_method_id: string;
    payment_method_name: string;
    delivery_method: 'shipping' | 'pickup';
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    shipping_price: number;
    payment_receipt?: File;
}

/**
 * Order Service
 * Handles order-related API calls
 */
export const OrderService = {
    /**
     * Create a new order
     */
    async createOrder(data: CreateOrderData): Promise<Order> {
        const hasImages = data.images && data.images.length > 0;

        if (hasImages) {
            const formData = new FormData();

            // Append simple fields
            formData.append('category', data.category);
            formData.append('brand', data.brand);
            formData.append('model', data.model);
            formData.append('year', data.year);
            if (data.transmission) formData.append('transmission', data.transmission);
            formData.append('part_description', data.partDescription); // Helper naming convention
            if (data.partNumber) formData.append('part_number', data.partNumber);
            formData.append('city', data.city);
            formData.append('contact_method', data.contactMethod);

            // Append Arrays (partTypes)
            data.partTypes.forEach((type, index) => {
                formData.append(`part_types[${index}]`, type);
            });

            // Append Images
            data.images?.forEach((uri, index) => {
                // Infer type from extension or default to jpeg
                const filename = uri.split('/').pop() || `image_${index}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('images[]', {
                    uri,
                    name: filename,
                    type,
                } as any);
            });

            const response = await apiClient.post('/orders', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        }

        // Fallback to JSON if no images (or original behavior)
        const response = await apiClient.post('/orders', data);
        return response.data;
    },

    /**
     * Get order by ID
     */
    async getOrderById(id: number): Promise<Order> {
        const response = await apiClient.get(`/orders/${id}`);
        return response.data;
    },

    /**
     * Accept a quote
     */
    async acceptQuote(orderNumber: string, data: AcceptQuoteData): Promise<Order> {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (key === 'payment_receipt' && value instanceof File) {
                    formData.append(key, value);
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        const response = await apiClient.post(`/orders/${orderNumber}/accept`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    /**
     * Submit review for order
     */
    async submitReview(orderNumber: string, rating: number, comment: string): Promise<void> {
        await apiClient.post('/reviews/', {
            order_number: orderNumber,
            rating,
            comment,
        });
    },

    /**
     * Update order
     */
    async updateOrder(id: number, data: Partial<CreateOrderData>): Promise<Order> {
        const response = await apiClient.put(`/orders/${id}`, data);
        return response.data;
    },

    /**
     * Cancel order
     */
    async cancelOrder(id: number): Promise<void> {
        await apiClient.post(`/orders/${id}/cancel`);
    },

    /**
     * Get categories
     */
    async getCategories(): Promise<any[]> {
        const response = await apiClient.get('/categories');
        return response.data;
    },

    /**
     * Get brands by category
     */
    async getBrandsByCategory(category: string): Promise<any[]> {
        const response = await apiClient.get(`/categories/${category}/brands`);
        return response.data;
    },

    /**
     * Get part types
     */
    async getPartTypes(): Promise<any[]> {
        const response = await apiClient.get('/part-types');
        return response.data;
    },

    /**
     * Get payment methods
     */
    async getPaymentMethods(): Promise<any[]> {
        const response = await apiClient.get('/wallet/payment-methods');
        return response.data;
    },
};
