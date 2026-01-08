/**
 * Marketplace Filters Context
 * Provides filter state management across marketplace components
 * Reduces prop drilling and improves performance with memoization
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { MarketplaceFilters as FilterType } from '../services/carprovider.service';

interface MarketplaceContextType {
    filters: FilterType;
    updateFilter: (key: string, value: any) => void;
    resetFilters: () => void;
    listingType: 'sale' | 'rent';
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

interface MarketplaceProviderProps {
    children: React.ReactNode;
    initialType?: 'sale' | 'rent';
}

export const MarketplaceProvider: React.FC<MarketplaceProviderProps> = ({
    children,
    initialType = 'sale'
}) => {
    const [listingType] = useState(initialType);
    const [filters, setFilters] = useState<FilterType>({
        listing_type: initialType,
        page: 1
    });

    const updateFilter = useCallback((key: string, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            page: key === 'page' ? value : 1 // Reset to page 1 on filter change
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            listing_type: listingType,
            page: 1
        });
    }, [listingType]);

    const value = useMemo(
        () => ({
            filters,
            updateFilter,
            resetFilters,
            listingType
        }),
        [filters, updateFilter, resetFilters, listingType]
    );

    return (
        <MarketplaceContext.Provider value={value}>
            {children}
        </MarketplaceContext.Provider>
    );
};

export const useMarketplaceContext = () => {
    const context = useContext(MarketplaceContext);
    if (!context) {
        throw new Error('useMarketplaceContext must be used within MarketplaceProvider');
    }
    return context;
};

export default MarketplaceContext;
