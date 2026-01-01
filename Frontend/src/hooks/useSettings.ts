import { useState, useCallback, useEffect } from 'react';
import { Settings, LimitSettings, NotificationSettings, SeoSettings, ShippingPriceByCity } from '../types';
import { SYRIAN_CITIES } from '../constants';
import { AdminService } from '../services/admin.service';

const initialShippingPrices: ShippingPriceByCity[] = SYRIAN_CITIES.map(city => ({
    city,
    xs: city === 'أخرى' ? 10 : 5,
    s: city === 'أخرى' ? 15 : 10,
    m: city === 'أخرى' ? 25 : 20,
    l: city === 'أخرى' ? 40 : 35,
    vl: city === 'أخرى' ? 60 : 50,
}));

const initialLimitSettings: LimitSettings = {
    maxActiveOrders: 5, maxImagesPerOrder: 10, maxVerificationAttempts: 3, verificationWindowMinutes: 10,
    maxImagesPerQuote: 5, minWithdrawalAmount: 50, maxWithdrawalAmount: 1000, maxWithdrawalRequestsPerPeriod: 5,
    withdrawalRequestsPeriodDays: 30, withdrawalCooldownHours: 24, highValueTransactionThreshold: 1000,
    maxQuotesPerOrder: 15, quoteValidityDays: 7, orderAutoCancelDays: 30, maxActiveBidsPerProvider: 20,
    providerInactivityDeactivationDays: 90, shippingPrices: initialShippingPrices,
    maxImageSizeMB: 5, maxVideoSizeMB: 25, maxVoiceNoteSizeMB: 10,
};

const initialNotificationSettings: NotificationSettings = {
    FIRST_QUOTE_RECEIVED: true, QUOTE_EXPIRING_SOON: true, ORDER_STATUS_CHANGED: true, PAYMENT_REJECTED: true,
    STALE_ORDER_CUSTOMER: true, NEW_ANNOUNCEMENT_CUSTOMER: true, NEW_ORDER_FOR_PROVIDER: true,
    QUOTE_VIEWED_BY_CUSTOMER: true, OFFER_ACCEPTED_PROVIDER_WIN: true, OFFER_ACCEPTED_PROVIDER_LOSS: true,
    ORDER_CANCELLED: true, WITHDRAWAL_REQUEST_CONFIRMATION: true, WITHDRAWAL_PROCESSED_APPROVED: true,
    WITHDRAWAL_PROCESSED_REJECTED: true, FUNDS_DEPOSITED: true, PROVIDER_INACTIVITY_WARNING: true,
    NEW_ANNOUNCEMENT_PROVIDER: true, TECHNICIAN_VERIFIED: true, NEW_ANNOUNCEMENT_TECHNICIAN: true,
    TOW_TRUCK_VERIFIED: true, NEW_ANNOUNCEMENT_TOW_TRUCK: true, FLASH_PRODUCT_REQUEST_APPROVED: true,
    FLASH_PRODUCT_REQUEST_REJECTED: true, HIGH_VALUE_TRANSACTION: true, STALE_ORDER_ADMIN: true,
    PROVIDER_INACTIVITY_ADMIN: true, WITHDRAWAL_REQUEST_ADMIN: true, NEW_PROVIDER_REQUEST: true,
    NEW_TECHNICIAN_REQUEST: true, NEW_TOW_TRUCK_REQUEST: true, NEW_FLASH_PRODUCT_REQUEST: true,
    REFUND_PROCESSED: true, MANUAL_DEPOSIT_PROCESSED: true,
    ORDER_CREATED_CUSTOMER: true, ORDER_CREATED_ADMIN: true, ORDER_READY_FOR_PICKUP: true,
    PROVIDER_RECEIVED_ORDER: true, ORDER_SHIPPED: true, ORDER_OUT_FOR_DELIVERY: true,
    ORDER_DELIVERED: true, ORDER_COMPLETED_CUSTOMER: true, ORDER_COMPLETED_PROVIDER: true,
    ORDER_COMPLETED_ADMIN: true, ORDER_CANCELLED_CUSTOMER: true, ORDER_CANCELLED_PROVIDER: true,
    ORDER_CANCELLED_ADMIN: true, SHIPPING_NOTES_UPDATED: true, NEW_REVIEW_PROVIDER: true,
    NEW_REVIEW_ADMIN: true, PAYMENT_UPLOADED_ADMIN: true, PAYMENT_REUPLOADED_ADMIN: true,
    quote_received: true, DEPOSIT_REQUEST: true, WITHDRAWAL_REQUEST: true, new_store_order: true,
};

const initialSeoSettings: SeoSettings = {
    title: 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
    description: 'راموسة لقطع غيار السيارات: تطبيق ويب حديث ومتجاوب لطلب قطع غيار السيارات بسهولة في سوريا.',
    keywords: 'قطع غيار سيارات, سوريا, راموسة لقطع غيار السيارات',
    canonicalUrl: 'https://ramouse.com/',
    themeColor: '#0284c7', ogType: 'website',
    ogUrl: 'https://ramouse.com/', ogTitle: 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
    ogDescription: 'تطبيق ويب حديث ومتجاوب لطلب قطع غيار السيارات بسهولة في سوريا.',
    ogImage: 'https://ramouse.com/og-image.png', twitterCard: 'summary_large_image',
    twitterUrl: 'https://ramouse.com/', twitterTitle: 'Ramouse Auto Parts | راموسة لقطع غيار السيارات',
    twitterDescription: 'تطبيق ويب حديث ومتجاوب لطلب قطع غيار السيارات بسهولة في سوريا.',
    twitterImage: 'https://ramouse.com/og-image.png',
    jsonLd: `{"@context": "https://schema.org","@type": "Organization","name": "Ramouse Auto Parts","url": "https://ramouse.com/"}`
};

const initialSettings: Settings = {
    logoUrl: '/logo without name.svg',
    appName: 'راموسة لقطع غيار السيارات', adminPhone: '+905319624826', adminPassword: 'adminpassword123',
    facebookUrl: '#', instagramUrl: '#', twitterUrl: '#', whatsappUrl: '#', telegramUrl: '#', youtubeUrl: '#', linkedinUrl: '#',
    ceoName: 'اسم المدير التنفيذي', ceoMessage: 'رسالة ترحيبية من المدير التنفيفي...',
    companyAddress: 'العنوان الكامل للشركة', companyPhone: '+963 XXX XXX XXX', companyEmail: 'email@example.com',
    mainDomain: 'ramouse.com',
    paymentMethods: [
        { id: 'pm-1', name: 'تحويل بنكي', details: 'بنك بيمو...', iconUrl: '', isActive: true },
        { id: 'pm-2', name: 'سيريتل كاش', details: 'يرجى التحويل...', iconUrl: '', isActive: true },
        { id: 'pm-cod', name: 'الدفع عند الاستلام', details: 'تحصيل نقدي...', iconUrl: '', isActive: true },
    ],
    storePaymentMethods: [
        { id: 'spm-cod', name: 'الدفع عند الاستلام', details: 'الدفع نقداً عند استلام الطلب.', iconUrl: '', isActive: true },
    ],
    storeBanners: [],
    limitSettings: initialLimitSettings, notificationSettings: initialNotificationSettings,
    verificationApis: [{ id: 'api-def', name: 'Whatso', apiUrl: 'https://whatsoio.com/api/create-message', appKey: 'key', authKey: 'auth', isActive: true }],
    notificationApis: [{ id: 'api-def', name: 'Whatso', apiUrl: 'https://whatsoio.com/api/create-message', appKey: 'key', authKey: 'auth', isActive: true }],
    lastUsedVerificationApiIndex: 0, lastUsedNotificationApiIndex: 0,
    messageTemplates: {}, whatsappNotificationsActive: false, seoSettings: initialSeoSettings,
};

export const useSettings = (isAdmin: boolean, showToast: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem('app_settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migration: If the logoUrl is the old "R" logo (base64 svg), reset it to the default
                if (parsed.logoUrl && parsed.logoUrl.startsWith('data:image/svg+xml;base64')) {
                    parsed.logoUrl = initialSettings.logoUrl;
                    localStorage.setItem('app_settings', JSON.stringify(parsed));
                }
                return { ...initialSettings, ...parsed };
            }
        } catch (e) {
            console.error('Failed to parse settings from local storage', e);
        }
        return initialSettings;
    });

    useEffect(() => {
        // Fetch settings for ALL users (public endpoint) with a slight delay
        // This ensures the UI is ready and animations are smooth before network activity starts
        const timer = setTimeout(() => {
            AdminService.getSettings()
                .then(fetchedSettings => {
                    if (fetchedSettings && Object.keys(fetchedSettings).length > 0) {
                        setSettings(prev => {
                            const merged = { ...prev, ...fetchedSettings };
                            // Migration: If the logoUrl is the old "R" logo (base64 svg), reset it to the default
                            if (merged.logoUrl && merged.logoUrl.startsWith('data:image/svg+xml;base64')) {
                                merged.logoUrl = initialSettings.logoUrl;
                            }
                            return merged;
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch settings:', err));
        }, 1200); // 1.2s delay for smoother startup

        return () => clearTimeout(timer);
    }, []);

    const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('app_settings', JSON.stringify(updated));
            return updated;
        });

        if (isAdmin) {
            try {
                await AdminService.updateSettings(newSettings);
                showToast('تم حفظ الإعدادات بنجاح!', 'success');
            } catch (error) {
                console.error('Failed to save settings to backend:', error);
                showToast('تم الحفظ محلياً فقط (فشل الاتصال بالخادم)', 'info');
            }
        } else {
            showToast('تم حفظ الإعدادات محلياً', 'success');
        }
    }, [showToast, isAdmin]);

    return {
        isDarkMode, setIsDarkMode,
        settings, setSettings,
        updateSettings
    };
};
