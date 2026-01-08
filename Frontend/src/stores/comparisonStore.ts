import { CarListing } from '../services/carprovider.service';

const STORAGE_KEY = 'car-comparison-items';

class ComparisonService {
    private listeners: Set<() => void> = new Set();

    getItems(): CarListing[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    addItem(listing: CarListing): boolean {
        const items = this.getItems();

        // Max 4 items
        if (items.length >= 4) {
            return false;
        }

        // Don't add duplicates
        if (items.some(item => item.id === listing.id)) {
            return false;
        }

        items.push(listing);
        this.saveItems(items);
        this.notifyListeners();
        return true;
    }

    removeItem(listingId: number): void {
        const items = this.getItems().filter(item => item.id !== listingId);
        this.saveItems(items);
        this.notifyListeners();
    }

    clearAll(): void {
        this.saveItems([]);
        this.notifyListeners();
    }

    isInComparison(listingId: number): boolean {
        return this.getItems().some(item => item.id === listingId);
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private saveItems(items: CarListing[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Failed to save comparison items:', error);
        }
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }
}

export const comparisonService = new ComparisonService();
