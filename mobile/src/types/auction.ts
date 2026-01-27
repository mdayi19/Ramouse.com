import { GalleryItem } from './index';

export type AuctionStatus = 'scheduled' | 'live' | 'ended' | 'extended' | 'cancelled' | 'paused';

export interface AuctionCar {
    id: string;
    brand: string;
    model: string;
    year: number;
    mileage?: number;
    color?: string;
    engine_type?: string;
    transmission?: string;
    media: {
        images: string[];
        videos?: string[];
    };
    description?: string;
    features?: string[];
    location?: string;
    reserve_price?: number;
    buy_now_price?: number;
}

export interface Auction {
    id: string;
    title: string;
    status: AuctionStatus;
    car: AuctionCar;

    // Timing
    scheduled_start: string;
    scheduled_end: string;
    actual_start?: string;
    actual_end?: string;

    // Bidding
    starting_bid: number;
    minimum_bid: number; // Increment
    current_bid: number;
    bid_count: number;
    winner_id?: string;
    winner_name?: string;
    final_price?: number;

    // State
    is_live: boolean;
    has_reminder?: boolean;

    created_at: string;
    updated_at: string;
}

export interface AuctionStats {
    total_auctions: number;
    live_auctions: number;
    upcoming_auctions: number;
    total_revenue: number;
}
