import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MarketplaceService, type MarketplaceFilters } from '@/services/marketplace.service';
import type { CarListing } from '@/types';

/**
 * Hook to fetch car listings with filters
 */
export function useCarListings(filters?: MarketplaceFilters) {
    return useQuery({
        queryKey: ['car-listings', filters],
        queryFn: () => MarketplaceService.getListings(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch sale listings
 */
export function useSaleListings(filters?: Omit<MarketplaceFilters, 'listing_type'>) {
    return useQuery({
        queryKey: ['sale-listings', filters],
        queryFn: () => MarketplaceService.getSaleListings(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch rent listings
 */
export function useRentListings(filters?: Omit<MarketplaceFilters, 'listing_type'>) {
    return useQuery({
        queryKey: ['rent-listings', filters],
        queryFn: () => MarketplaceService.getRentListings(filters),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch car details by ID
 */
export function useCarDetails(id: number, enabled: boolean = true) {
    return useQuery({
        queryKey: ['car-details', id],
        queryFn: () => MarketplaceService.getListingById(id),
        enabled,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
}

/**
 * Hook to search car listings
 */
export function useSearchListings(query: string, filters?: MarketplaceFilters) {
    return useQuery({
        queryKey: ['search-listings', query, filters],
        queryFn: () => MarketplaceService.searchListings(query, filters),
        enabled: query.length > 0,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook to fetch featured listings
 */
export function useFeaturedListings() {
    return useQuery({
        queryKey: ['featured-listings'],
        queryFn: () => MarketplaceService.getFeaturedListings(),
        staleTime: 10 * 60 * 1000,
    });
}

/**
 * Hook to fetch latest listings
 */
export function useLatestListings(limit: number = 10) {
    return useQuery({
        queryKey: ['latest-listings', limit],
        queryFn: () => MarketplaceService.getLatestListings(limit),
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch categories
 */
export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => MarketplaceService.getCategories(),
        staleTime: 60 * 60 * 1000, // 1 hour
    });
}

/**
 * Hook to fetch brands
 */
export function useBrands(category?: string) {
    return useQuery({
        queryKey: ['brands', category],
        queryFn: () => MarketplaceService.getBrands(category),
        staleTime: 60 * 60 * 1000,
    });
}

/**
 * Hook to fetch models by brand
 */
export function useModels(brand: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['models', brand],
        queryFn: () => MarketplaceService.getModels(brand),
        enabled: enabled && brand.length > 0,
        staleTime: 60 * 60 * 1000,
    });
}

/**
 * Hook to fetch cities
 */
export function useCities() {
    return useQuery({
        queryKey: ['cities'],
        queryFn: () => MarketplaceService.getCities(),
        staleTime: 60 * 60 * 1000,
    });
}

/**
 * Hook to fetch provider listings
 */
export function useProviderListings(providerId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['provider-listings', providerId],
        queryFn: () => MarketplaceService.getProviderListings(providerId),
        enabled: enabled && providerId.length > 0,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to fetch provider profile
 */
export function useProviderProfile(providerId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: ['provider-profile', providerId],
        queryFn: () => MarketplaceService.getProviderProfile(providerId),
        enabled: enabled && providerId.length > 0,
        staleTime: 10 * 60 * 1000,
    });
}
