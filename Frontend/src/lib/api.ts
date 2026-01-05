
import axios from 'axios';
import { apiCache, createCacheKey, shouldCache, invalidateCache } from './apiCache';

// Use import.meta.env for Vite
export const API_URL = '/api';
export const BASE_URL = '';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor for authentication and caching
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token} `;
        }

        // Check cache for GET requests
        if (shouldCache(config.method || 'GET', config.url || '')) {
            const cacheKey = createCacheKey(config.url || '', config.method || 'GET', config.params);

            // Check for pending request (deduplication)
            const pendingRequest = apiCache.getPendingRequest(cacheKey);
            if (pendingRequest) {
                console.log(`⚡ Deduplicating request: ${cacheKey} `);
                return Promise.reject({ __deduplicated: true, promise: pendingRequest });
            }

            // Check cache
            const cachedData = apiCache.get(cacheKey);
            if (cachedData) {
                console.log(`💾 Cache hit: ${cacheKey} `);
                return Promise.reject({ __cached: true, data: cachedData });
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for caching and error handling
api.interceptors.response.use(
    (response) => {
        // Cache successful GET responses
        const config = response.config;
        if (shouldCache(config.method || 'GET', config.url || '')) {
            const cacheKey = createCacheKey(config.url || '', config.method || 'GET', config.params);
            apiCache.set(cacheKey, response.data);
        }

        // Invalidate cache on mutations
        const method = config.method?.toUpperCase();
        if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH') {
            const url = config.url || '';
            // Invalidate related caches
            if (url.includes('/orders')) {
                invalidateCache(['/orders', '/provider/orders', '/admin/orders']);
            } else if (url.includes('/providers')) {
                invalidateCache(['/providers', '/admin/providers']);
            } else if (url.includes('/products')) {
                invalidateCache(['/products', '/store/products']);
            }
        }

        return response;
    },
    (error) => {
        // Handle cached responses
        if (error.__cached) {
            return Promise.resolve({ data: error.data, config: {}, headers: {}, status: 200, statusText: 'OK (Cached)' });
        }

        // Handle deduplicated requests
        if (error.__deduplicated) {
            return error.promise;
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            console.log('🔒 401 Unauthorized - clearing auth');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            if (window.location.pathname !== '/') {
                console.log('🔀 Redirecting to / due to 401');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export const providerAPI = {
    getOverviewData: (forceRefresh = false) => api.get('/provider/overview-data', forceRefresh ? { params: { _t: Date.now() } } : {}),
    getTransactions: (forceRefresh = false) => api.get('/provider/transactions', forceRefresh ? { params: { _t: Date.now() } } : {}),
    getWithdrawals: (forceRefresh = false) => api.get('/provider/withdrawals', forceRefresh ? { params: { _t: Date.now() } } : {}),
    getWalletBalance: (forceRefresh = false) => api.get('/provider/wallet-balance', forceRefresh ? { params: { _t: Date.now() } } : {}),
    requestWithdrawal: (amount: number, paymentMethodId: string) =>
        api.post('/provider/withdrawals', { amount, paymentMethodId }),
    updateProfile: (data: any) => api.put('/provider/profile', data),
    getOpenOrders: async (forceRefresh = false) => {
        const response = await api.get('/provider/open-orders', forceRefresh ? { params: { _t: Date.now() } } : {});
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    getMyBids: async (forceRefresh = false) => {
        const response = await api.get('/provider/my-bids', forceRefresh ? { params: { _t: Date.now() } } : {});
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    getAcceptedOrders: async (forceRefresh = false) => {
        const response = await api.get('/provider/accepted-orders', forceRefresh ? { params: { _t: Date.now() } } : {});
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    updateAcceptedOrderStatus: async (orderNumber: string, status: string, notes?: string) => {
        const response = await api.put(`/provider/orders/${orderNumber}/status`, { status, notes });
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    }
};

export const ordersAPI = {
    getOrders: async (forceRefresh = false) => {
        const response = await api.get('/orders', forceRefresh ? { params: { _t: Date.now() } } : {});
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    submitQuote: async (orderNumber: string, data: any, mediaFiles?: { images: File[], video: File | null, voiceNote: Blob | null }) => {
        const uploadedMedia: { images: string[], video: string | null, voiceNote: string | null } = {
            images: [],
            video: null,
            voiceNote: null
        };

        try {
            // Upload images
            if (mediaFiles?.images && mediaFiles.images.length > 0) {
                const imageFormData = new FormData();
                mediaFiles.images.forEach((img: File) => imageFormData.append('files[]', img));
                const imgResponse = await api.post('/upload/multiple', imageFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedMedia.images = imgResponse.data.data?.map((f: any) => f.full_url) || [];
            }

            // Upload video
            if (mediaFiles?.video) {
                const videoFormData = new FormData();
                videoFormData.append('file', mediaFiles.video);
                const vidResponse = await api.post('/upload', videoFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedMedia.video = vidResponse.data.data?.full_url || null;
            }

            // Upload voice note
            if (mediaFiles?.voiceNote) {
                const voiceFormData = new FormData();
                voiceFormData.append('file', mediaFiles.voiceNote, 'voice_note.webm');
                const voiceResponse = await api.post('/upload', voiceFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedMedia.voiceNote = voiceResponse.data.data?.full_url || null;
            }
        } catch (uploadError) {
            console.error('Quote media upload error:', uploadError);
            throw new Error('فشل في رفع ملفات الوسائط');
        }

        return api.post(`/orders/${orderNumber}/quotes`, {
            ...data,
            media: uploadedMedia
        });
    },
    create: async (formData: any) => {
        const uploadedFiles: { images: string[], video: string | null, voiceNote: string | null } = {
            images: [],
            video: null,
            voiceNote: null
        };

        try {
            // Upload images - backend returns:  { data: [{ url, full_url }] }
            if (formData.images && formData.images.length > 0) {
                const imageFormData = new FormData();
                formData.images.forEach((img: File) => imageFormData.append('files[]', img));
                const imgResponse = await api.post('/upload/multiple', imageFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedFiles.images = imgResponse.data.data?.map((f: any) => f.full_url) || [];
            }

            // Upload video - backend returns: { data: { url, full_url } }
            if (formData.video) {
                const videoFormData = new FormData();
                videoFormData.append('file', formData.video);
                const vidResponse = await api.post('/upload', videoFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedFiles.video = vidResponse.data.data?.full_url || null;
            }

            // Upload voice note
            if (formData.voiceNote) {
                const voiceFormData = new FormData();
                voiceFormData.append('file', formData.voiceNote, 'voice_note.webm');
                const voiceResponse = await api.post('/upload', voiceFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedFiles.voiceNote = voiceResponse.data.data?.full_url || null;
            }
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error('فشل في رفع الملفات');
        }

        return api.post('/orders', {
            form_data: {
                category: formData.category,
                brand: formData.brand,
                brandManual: formData.brandManual,
                model: formData.model,
                year: formData.year,
                vin: formData.vin,
                engineType: formData.engineType,
                transmission: formData.transmission,
                additionalDetails: formData.additionalDetails,
                partTypes: formData.partTypes,
                partDescription: formData.partDescription,
                partNumber: formData.partNumber,
                images: uploadedFiles.images,
                video: uploadedFiles.video,
                voiceNote: uploadedFiles.voiceNote,
                contactMethod: formData.contactMethod,
                city: formData.city
            },
            customer_name: formData.customerName,
            customer_address: formData.customerAddress,
            customer_phone: formData.customerPhone
        });
    },
    acceptQuote: async (orderNumber: string, data: any) => {
        const formData = new FormData();
        formData.append('quote_id', data.quote_id);
        formData.append('payment_method_id', data.payment_method_id);
        if (data.payment_method_name) formData.append('payment_method_name', data.payment_method_name);
        formData.append('delivery_method', data.delivery_method);

        if (data.delivery_method === 'shipping') {
            formData.append('customer_name', data.customer_name);
            formData.append('customer_address', data.customer_address);
            formData.append('customer_phone', data.customer_phone);
            formData.append('shipping_price', data.shipping_price.toString());
        }

        if (data.payment_receipt) {
            formData.append('payment_receipt', data.payment_receipt);
        }

        return api.post(`/orders/${orderNumber}/accept`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// Helper to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    } else if (obj !== null && obj !== undefined && typeof obj === 'object') {
        return Object.keys(obj).reduce((result, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = toCamelCase(obj[key]);
            return result;
        }, {} as any);
    }
    return obj;
};

export const adminAPI = {
    // Financial endpoints
    getWithdrawals: (forceRefresh = false) => api.get('/admin/withdrawals', forceRefresh ? { params: { _t: Date.now() } } : {}),
    approveWithdrawal: (id: string, receiptUrl?: string) =>
        api.post(`/admin/withdrawals/${id}/approve`, { receiptUrl }),
    rejectWithdrawal: (id: string, reason: string) =>
        api.post(`/admin/withdrawals/${id}/reject`, { reason }),
    getTransactions: (forceRefresh = false) => api.get('/admin/transactions', forceRefresh ? { params: { _t: Date.now() } } : {}),
    addFunds: (providerId: string, amount: number, description: string) =>
        api.post(`/admin/providers/${providerId}/add-funds`, { amount, description }),

    // Provider management
    getProviders: (forceRefresh = false) => api.get('/admin/providers', forceRefresh ? { params: { _t: Date.now() } } : {}),

    // Product Management
    getProducts: (forceRefresh = false) => api.get('/admin/products', forceRefresh ? { params: { _t: Date.now() } } : {}), // For Flash Products
    createProduct: (productData: any) =>
        api.post('/admin/products', productData),
    updateProduct: (id: string, productData: any) =>
        api.put(`/admin/products/${id}`, productData),
    deleteProduct: (id: string) =>
        api.delete(`/admin/products/${id}`),

    // Order Payment Approval/Rejection
    approveOrderPayment: (orderNumber: string) => api.post(`/admin/orders/${orderNumber}/approve-payment`),
    rejectOrderPayment: (orderNumber: string, reason: string) => api.post(`/admin/orders/${orderNumber}/reject-payment`, { reason }),

    // Order Management
    getOrders: (forceRefresh = false) => api.get('/admin/orders', forceRefresh ? { params: { _t: Date.now() } } : {}),
    updateOrderStatus: (orderNumber: string, status: string) => api.patch(`/admin/orders/${orderNumber}/status`, { status }),
    updateShippingNotes: (orderNumber: string, notes: string) => api.put(`/admin/orders/${orderNumber}/shipping-notes`, { notes }),

    //  International Licenses
    getInternationalLicenseRequests: (params?: any) => api.get('/admin/international-license-requests', { params }),
    updateInternationalLicenseStatus: (id: string, status: string, note?: string, rejection_type?: 'payment' | 'documents' | 'other', rejected_documents?: string[]) =>
        api.patch(`/admin/international-license-requests/${id}/status`, {
            status,
            admin_note: note,
            rejection_type,
            rejected_documents
        }),
};

export const storeAPI = {
    //Products
    getProducts: async (filters?: { category_id?: string; is_flash?: boolean; per_page?: number; cursor?: string }) => {
        const response = await api.get('/store/products', { params: filters });
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    getProduct: async (id: string) => {
        const response = await api.get(`/store/products/${id}`);
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    getCategories: () =>
        api.get('/store/categories'),

    // Orders
    purchase: (orderData: {
        items: Array<{ product_id: string; quantity: number }>;
        delivery_method: 'shipping' | 'pickup';
        shipping_address?: string;
        contact_phone: string;
        payment_method_id: string;
        payment_method_name?: string;
        payment_receipt?: string;
    }) => api.post('/store/purchase', orderData),
    getMyOrders: async (params?: { status?: string; per_page?: number; cursor?: string }) => {
        const response = await api.get('/store/orders', { params });
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    addReview: (productId: string, rating: number, comment: string) =>
        api.post(`/store/products/${productId}/review`, { rating, comment }),
    cancelOrder: (orderId: string) =>
        api.post(`/store/orders/${orderId}/cancel`),
    getSavedAddress: () =>
        api.get('/store/saved-address'),
    calculateShipping: (data: { items: Array<{ product_id: string; quantity: number }>; city: string }) =>
        api.post('/store/calculate-shipping', data),
};

export const adminStoreAPI = {
    // Orders Management
    getAllOrders: async (filters?: { status?: string; search?: string }) => {
        const response = await api.get('/admin/store/orders', { params: filters });
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    updateOrderStatus: (orderId: string, status: string, adminNotes?: string) =>
        api.patch(`/admin/store/orders/${orderId}`, { status, admin_notes: adminNotes }),

    // Statistics
    getStats: () =>
        api.get('/admin/store/stats'),

    // Category Management
    getCategories: async () => {
        const response = await api.get('/admin/store/categories');
        return { ...response, data: { ...response.data, data: toCamelCase(response.data.data) } };
    },
    createCategory: (categoryData: { name: string; icon: string; subcategories?: any[]; isFeatured?: boolean }) =>
        api.post('/admin/store/categories', categoryData),
    updateCategory: (id: string, categoryData: { name?: string; icon?: string; subcategories?: any[]; isFeatured?: boolean }) =>
        api.put(`/admin/store/categories/${id}`, categoryData),
    deleteCategory: (id: string) =>
        api.delete(`/admin/store/categories/${id}`),
};
