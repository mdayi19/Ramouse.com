// Input validation utilities for CarMarketplace

export const validators = {
    // Car details
    title: {
        required: true,
        minLength: 10,
        maxLength: 100,
        pattern: /^[\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s,.-]+$/,
        message: 'العنوان يجب أن يكون بين 10-100 حرف'
    },

    description: {
        required: true,
        minLength: 50,
        maxLength: 2000,
        message: 'الوصف يجب أن يكون بين 50-2000 حرف'
    },

    price: {
        required: true,
        min: 1000000,
        max: 1000000000,
        message: 'السعر يجب أن يكون بين 1,000,000 - 1,000,000,000 $ '
    },

    year: {
        required: true,
        min: 1990,
        max: new Date().getFullYear() + 1,
        message: `سنة الصنع يجب أن تكون بين 1990 - ${new Date().getFullYear() + 1}`
    },

    mileage: {
        required: true,
        min: 0,
        max: 1000000,
        message: 'الممشى يجب أن يكون بين 0 - 1,000,000 كم'
    },

    phone: {
        required: true,
        pattern: /^(09|07)\d{8}$/,
        message: 'رقم الهاتف يجب أن يبدأ بـ 09 أو 07 ويتكون من 10 أرقام'
    },

    images: {
        required: true,
        minCount: 3,
        maxCount: 20,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        message: 'يجب رفع 3-20 صورة بحجم أقصى 5MB لكل صورة'
    }
};

export const validateField = (field: string, value: any): string | null => {
    const validator = validators[field as keyof typeof validators];
    if (!validator) return null;

    // Required check
    if ('required' in validator && validator.required && !value) {
        return validator.message;
    }

    // String length
    if ('minLength' in validator && value.length < validator.minLength) {
        return validator.message;
    }
    if ('maxLength' in validator && value.length > validator.maxLength) {
        return validator.message;
    }

    // Number range
    if ('min' in validator && Number(value) < validator.min) {
        return validator.message;
    }
    if ('max' in validator && Number(value) > validator.max) {
        return validator.message;
    }

    // Pattern
    if ('pattern' in validator && !validator.pattern.test(value)) {
        return validator.message;
    }

    // Array/Images
    if ('minCount' in validator && Array.isArray(value) && value.length < validator.minCount) {
        return validator.message;
    }
    if ('maxCount' in validator && Array.isArray(value) && value.length > validator.maxCount) {
        return validator.message;
    }

    return null;
};

export const validateAllFields = (data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};

    Object.keys(data).forEach(field => {
        const error = validateField(field, data[field]);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
};

export const sanitizeInput = (input: string): string => {
    // Remove potential XSS scripts
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
};

export default validators;
