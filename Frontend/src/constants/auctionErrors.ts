// Error message catalog for auction system
// Provides consistent, localized, and actionable error messages

export const AUCTION_ERROR_CODES = {
    // Bid-related errors
    BID_TOO_LOW: 'BID_TOO_LOW',
    BID_INCREMENT_INVALID: 'BID_INCREMENT_INVALID',
    NOT_REGISTERED: 'NOT_REGISTERED',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    RATE_LIMITED: 'RATE_LIMITED',

    // Auction state errors
    AUCTION_NOT_LIVE: 'AUCTION_NOT_LIVE',
    AUCTION_ENDED: 'AUCTION_ENDED',
    AUCTION_NOT_STARTED: 'AUCTION_NOT_STARTED',

    // User/Permission errors
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    PROVIDER_CANNOT_BID: 'PROVIDER_CANNOT_BID',
    NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',

    // Network/System errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    TIMEOUT: 'TIMEOUT',

    // Registration errors
    ALREADY_REGISTERED: 'ALREADY_REGISTERED',
    REGISTRATION_FAILED: 'REGISTRATION_FAILED',
    DEPOSIT_HOLD_FAILED: 'DEPOSIT_HOLD_FAILED',
} as const;

export type AuctionErrorCode = typeof AUCTION_ERROR_CODES[keyof typeof AUCTION_ERROR_CODES];

export interface ErrorDetails {
    minimum_bid?: number;
    your_bid?: number;
    suggested_bid?: number;
    required_amount?: number;
    available_balance?: number;
    rate_limit_reset?: number;
    auction_start_time?: string;
    auction_end_time?: string;
}

export interface AuctionError {
    error: string;
    error_code: AuctionErrorCode;
    details?: ErrorDetails;
    action?: string;
}

// Arabic error messages with actionable suggestions
export const ERROR_MESSAGES: Record<AuctionErrorCode, (details?: ErrorDetails) => { message: string; action: string }> = {
    [AUCTION_ERROR_CODES.BID_TOO_LOW]: (details) => ({
        message: `الحد الأدنى للمزايدة هو $${details?.minimum_bid?.toLocaleString()}. مزايدتك: $${details?.your_bid?.toLocaleString()}`,
        action: `حاول المزايدة بـ $${details?.suggested_bid?.toLocaleString()} أو أكثر`,
    }),

    [AUCTION_ERROR_CODES.BID_INCREMENT_INVALID]: (details) => ({
        message: `يجب أن تكون المزايدة أكبر من المزايدة الحالية بمقدار $${details?.minimum_bid?.toLocaleString()} على الأقل`,
        action: `أدخل $${details?.suggested_bid?.toLocaleString()} أو أكثر`,
    }),

    [AUCTION_ERROR_CODES.NOT_REGISTERED]: () => ({
        message: 'يجب التسجيل في المزاد أولاً للمشاركة',
        action: 'اضغط على "سجّل الآن" للانضمام إلى المزاد',
    }),

    [AUCTION_ERROR_CODES.INSUFFICIENT_FUNDS]: (details) => ({
        message: `رصيدك غير كافٍ. المطلوب: $${details?.required_amount?.toLocaleString()}، المتاح: $${details?.available_balance?.toLocaleString()}`,
        action: 'اشحن محفظتك من صفحة الحساب',
    }),

    [AUCTION_ERROR_CODES.RATE_LIMITED]: (details) => ({
        message: 'عذراً، لقد تجاوزت الحد المسموح من المزايدات',
        action: `انتظر ${details?.rate_limit_reset || 1} ثانية وحاول مرة أخرى`,
    }),

    [AUCTION_ERROR_CODES.AUCTION_NOT_LIVE]: () => ({
        message: 'المزاد غير مباشر حالياً',
        action: 'انتظر حتى يبدأ المزاد أو فعّل تذكيراً',
    }),

    [AUCTION_ERROR_CODES.AUCTION_ENDED]: () => ({
        message: 'المزاد قد انتهى',
        action: 'تصفح المزادات النشطة الأخرى',
    }),

    [AUCTION_ERROR_CODES.AUCTION_NOT_STARTED]: (details) => ({
        message: 'المزاد لم يبدأ بعد',
        action: `سيبدأ في ${details?.auction_start_time || 'قريباً'}`,
    }),

    [AUCTION_ERROR_CODES.USER_NOT_FOUND]: () => ({
        message: 'الحساب غير موجود',
        action: 'تحقق من تسجيل دخولك',
    }),

    [AUCTION_ERROR_CODES.PROVIDER_CANNOT_BID]: () => ({
        message: 'مقدمو الخدمات لا يمكنهم المزايدة',
        action: 'استخدم حساب عميل للمشاركة في المزادات',
    }),

    [AUCTION_ERROR_CODES.NOT_AUTHENTICATED]: () => ({
        message: 'يرجى تسجيل الدخول للمتابعة',
        action: 'سجّل دخولك أو أنشئ حساباً جديداً',
    }),

    [AUCTION_ERROR_CODES.NETWORK_ERROR]: () => ({
        message: 'فقدان الاتصال بالإنترنت',
        action: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    }),

    [AUCTION_ERROR_CODES.SERVER_ERROR]: () => ({
        message: 'حدث خطأ في الخادم',
        action: 'يرجى المحاولة مرة أخرى بعد قليل',
    }),

    [AUCTION_ERROR_CODES.TIMEOUT]: () => ({
        message: 'انتهت مهلة الاتصال',
        action: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    }),

    [AUCTION_ERROR_CODES.ALREADY_REGISTERED]: () => ({
        message: 'أنت مسجل بالفعل في هذا المزاد',
        action: 'يمكنك البدء في المزايدة الآن',
    }),

    [AUCTION_ERROR_CODES.REGISTRATION_FAILED]: () => ({
        message: 'فشل التسجيل في المزاد',
        action: 'تحقق من رصيدك وحاول مرة أخرى',
    }),

    [AUCTION_ERROR_CODES.DEPOSIT_HOLD_FAILED]: (details) => ({
        message: `فشل حجز التأمين. المطلوب: $${details?.required_amount?.toLocaleString()}`,
        action: 'اشحن محفظتك وحاول مرة أخرى',
    }),
};

// Helper function to get formatted error message
export const getErrorMessage = (error: AuctionError): { message: string; action: string } => {
    const errorConfig = ERROR_MESSAGES[error.error_code];
    if (errorConfig) {
        return errorConfig(error.details);
    }

    // Fallback for unknown errors
    return {
        message: error.error || 'حدث خطأ غير متوقع',
        action: 'يرجى المحاولة مرة أخرى',
    };
};

// Helper to parse backend error responses
export const parseAuctionError = (errorResponse: any): AuctionError => {
    if (errorResponse?.error_code) {
        return errorResponse as AuctionError;
    }

    // Try to infer error code from message
    const errorMsg = errorResponse?.error || errorResponse?.message || '';

    if (errorMsg.includes('minimum') || errorMsg.includes('الحد الأدنى')) {
        return {
            error: errorMsg,
            error_code: AUCTION_ERROR_CODES.BID_TOO_LOW,
            details: errorResponse?.details,
        };
    }

    if (errorMsg.includes('register') || errorMsg.includes('التسجيل')) {
        return {
            error: errorMsg,
            error_code: AUCTION_ERROR_CODES.NOT_REGISTERED,
        };
    }

    if (errorMsg.includes('balance') || errorMsg.includes('رصيد')) {
        return {
            error: errorMsg,
            error_code: AUCTION_ERROR_CODES.INSUFFICIENT_FUNDS,
            details: errorResponse?.details,
        };
    }

    if (errorMsg.includes('rate') || errorMsg.includes('الانتظار')) {
        return {
            error: errorMsg,
            error_code: AUCTION_ERROR_CODES.RATE_LIMITED,
        };
    }

    if (!navigator.onLine) {
        return {
            error: 'Network error',
            error_code: AUCTION_ERROR_CODES.NETWORK_ERROR,
        };
    }

    // Default server error
    return {
        error: errorMsg,
        error_code: AUCTION_ERROR_CODES.SERVER_ERROR,
    };
};
