/**
 * Error handling utilities for CarMarketplace
 * Provides standardized error handling patterns and user-friendly error messages
 */

export interface APIError {
    message: string;
    code?: string;
    status?: number;
    details?: any;
}

/**
 * Standard error handler for API calls
 * @param error - Error object from API call
 * @returns User-friendly error message in Arabic
 */
export const handleAPIError = (error: any): string => {
    // Network errors
    if (!navigator.onLine) {
        return 'لا يوجد اتصال بالإنترنت. يرجى التحقق من الاتصال والمحاولة مرة أخرى';
    }

    // Server errors (500-599)
    if (error?.status >= 500) {
        return 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً';
    }

    // Client errors (400-499)
    if (error?.status === 404) {
        return 'الصفحة أو البيانات المطلوبة غير موجودة';
    }

    if (error?.status === 401) {
        return 'يجب تسجيل الدخول للمتابعة';
    }

    if (error?.status === 403) {
        return 'ليس لديك صلاحية للوصول إلى هذا المحتوى';
    }

    if (error?.status === 429) {
        return 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل';
    }

    // Validation errors
    if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        return Array.isArray(firstError) ? firstError[0] : String(firstError);
    }

    // Generic error message from backend
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    // Default fallback
    return error?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى';
};

/**
 * Log error to console in development and to analytics in production
 * @param error - Error object
 * @param context - Additional context about where the error occurred
 */
export const logError = (error: any, context?: string): void => {
    if (process.env.NODE_ENV === 'development') {
        console.error(`[CarMarketplace Error]${context ? ` ${context}:` : ''}`, error);
    }

    // In production, send to analytics/monitoring service
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        // Example: Send to Google Analytics
        if ((window as any).gtag) {
            (window as any).gtag('event', 'exception', {
                description: error?.message || 'Unknown error',
                fatal: false,
                context
            });
        }

        // Example: Send to Sentry
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, { tags: { context } });
        // }
    }
};

/**
 * Retry a failed operation with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delay - Initial delay in milliseconds
 * @returns Promise with the result
 */
export const retryOperation = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            if (i < maxRetries - 1) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }

    throw lastError;
};

export default { handleAPIError, logError, retryOperation };
