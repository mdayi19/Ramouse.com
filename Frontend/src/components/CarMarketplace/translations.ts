// Translation utilities for car listing data
export const TRANSLATIONS = {
    // Colors
    colors: {
        white: 'أبيض',
        black: 'أسود',
        silver: 'فضي',
        gray: 'رمادي',
        red: 'أحمر',
        blue: 'أزرق',
        green: 'أخضر',
        yellow: 'أصفر',
        brown: 'بني',
        gold: 'ذهبي'
    },

    // Transmission
    transmission: {
        automatic: 'أوتوماتيك',
        manual: 'يدوي'
    },

    // Fuel types
    fuelType: {
        gasoline: 'بنزين',
        diesel: 'ديزل',
        electric: 'كهرباء',
        hybrid: 'هايبرد'
    },

    // Condition
    condition: {
        new: 'جديدة',
        used: 'مستعملة',
        certified_pre_owned: 'مستعملة ومعتمدة'
    },

    // Listing type
    listingType: {
        sale: 'للبيع',
        rent: 'للإيجار'
    },

    // Rent period
    rentPeriod: {
        daily: 'يومي',
        weekly: 'أسبوعي',
        monthly: 'شهري'
    }
};

// Helper function to translate a value
export const translate = (category: keyof typeof TRANSLATIONS, value: string): string => {
    const translations = TRANSLATIONS[category] as Record<string, string>;
    return translations[value] || value;
};

// Export individual translation functions for convenience
export const translateColor = (color: string) => translate('colors', color);
export const translateTransmission = (transmission: string) => translate('transmission', transmission);
export const translateFuelType = (fuelType: string) => translate('fuelType', fuelType);
export const translateCondition = (condition: string) => translate('condition', condition);
export const translateListingType = (listingType: string) => translate('listingType', listingType);
export const translateRentPeriod = (rentPeriod: string) => translate('rentPeriod', rentPeriod);
