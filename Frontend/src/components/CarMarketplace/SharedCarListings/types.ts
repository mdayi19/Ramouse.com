export interface Listing {
    id: number;
    title: string;
    model: string;
    year: number;
    mileage: number;
    photos: string[];
    is_hidden: boolean;
    listing_type: 'sale' | 'rent';
    price?: number;
    daily_rate?: number;
    weekly_rate?: number;
    monthly_rate?: number;
    rental_terms?: {
        daily_rate?: number;
        weekly_rate?: number;
        monthly_rate?: number;
    };
    views_count: number;
    unique_visitors?: number;
    contact_phone_count?: number;
    contact_whatsapp_count?: number;
    favorites_count?: number;
    shares_count?: number;
    created_at: string;
    is_sponsored: boolean;
    sponsored_until?: string;
}

export interface Stats {
    total_listings: number;
    active_listings: number;
    sponsored_listings: number;
    total_views: number;
    this_month_listings: number;
    wallet_balance: number;
    listing_limit: number;
    remaining_listings: number;
}
