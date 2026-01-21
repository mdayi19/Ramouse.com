// Frontend/src/utils/structuredData.ts

const BASE_URL = import.meta.env.VITE_APP_URL || 'https://ramouse.com';

/**
 * Generate Schema.org JSON-LD for car listings (sale)
 */
export const generateCarListingSchema = (listing: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Car',
        '@id': `${BASE_URL}/entity/car-listing/${listing.id}`,
        identifier: listing.id,
        name: listing.title,
        description: listing.description,
        url: `${BASE_URL}/car-listings/${listing.slug}`,
        brand: listing.brand ? {
            '@type': 'Brand',
            name: listing.brand.name,
        } : undefined,
        model: listing.model,
        vehicleModelDate: listing.year,
        mileageFromOdometer: listing.mileage ? {
            '@type': 'QuantitativeValue',
            value: listing.mileage,
            unitCode: 'KMT',
        } : undefined,
        fuelType: listing.fuel_type,
        vehicleTransmission: listing.transmission,
        numberOfDoors: listing.doors_count,
        seatingCapacity: listing.seats_count,
        color: listing.exterior_color,
        itemCondition: listing.condition === 'new'
            ? 'https://schema.org/NewCondition'
            : 'https://schema.org/UsedCondition',
        offers: {
            '@type': 'Offer',
            price: listing.price,
            priceCurrency: 'USD',
            availability: listing.is_available
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            priceValidUntil: listing.sponsored_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            seller: {
                '@type': listing.seller_type === 'provider' ? 'LocalBusiness' : 'Person',
                '@id': `${BASE_URL}/entity/car-provider/${listing.owner_id}`,
                name: listing.owner?.name,
                telephone: listing.contact_phone,
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: listing.city,
                    addressCountry: 'SY',
                },
            },
        },
        image: listing.photos?.map((photo: string) => `${BASE_URL}/storage/${photo}`),
        location: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: listing.city,
                addressCountry: 'SY',
            },
        },
        datePosted: listing.created_at,
        dateModified: listing.updated_at,
        aggregateRating: listing.owner?.average_rating ? {
            '@type': 'AggregateRating',
            ratingValue: listing.owner.average_rating,
            reviewCount: listing.owner.reviews?.length || 0,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
    };
};

/**
 * Generate Schema.org JSON-LD for car rentals
 */
export const generateRentalSchema = (listing: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'RentalCarReservation',
        '@id': `${BASE_URL}/entity/car-listing/${listing.id}`,
        identifier: listing.id,
        url: `${BASE_URL}/car-listings/${listing.slug}`,
        reservationFor: {
            '@type': 'Car',
            name: listing.title,
            brand: listing.brand?.name,
            model: listing.model,
            vehicleModelDate: listing.year,
            image: listing.photos?.map((photo: string) => `${BASE_URL}/storage/${photo}`),
        },
        provider: {
            '@type': 'LocalBusiness',
            '@id': `${BASE_URL}/entity/car-provider/${listing.owner_id}`,
            name: listing.owner?.name,
            address: {
                '@type': 'PostalAddress',
                addressLocality: listing.city,
                addressCountry: 'SY',
            },
            telephone: listing.contact_phone,
        },
        offers: {
            '@type': 'Offer',
            price: listing.rental_terms?.daily_rate,
            priceCurrency: 'USD',
            priceSpecification: [
                listing.rental_terms?.daily_rate ? {
                    '@type': 'UnitPriceSpecification',
                    price: listing.rental_terms.daily_rate,
                    priceCurrency: 'USD',
                    unitText: 'DAY',
                } : null,
                listing.rental_terms?.weekly_rate ? {
                    '@type': 'UnitPriceSpecification',
                    price: listing.rental_terms.weekly_rate,
                    priceCurrency: 'USD',
                    unitText: 'WEEK',
                } : null,
                listing.rental_terms?.monthly_rate ? {
                    '@type': 'UnitPriceSpecification',
                    price: listing.rental_terms.monthly_rate,
                    priceCurrency: 'USD',
                    unitText: 'MONTH',
                } : null,
            ].filter(Boolean),
        },
        datePosted: listing.created_at,
        dateModified: listing.updated_at,
    };
};

/**
 * Generate Schema.org JSON-LD for car providers
 */
export const generateCarProviderSchema = (provider: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'AutomotiveBusiness',
        '@id': `${BASE_URL}/entity/car-provider/${provider.id}`,
        identifier: provider.id,
        name: provider.name,
        description: provider.description,
        url: `${BASE_URL}/car-providers/${provider.id}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: provider.address,
            addressLocality: provider.city,
            addressCountry: 'SY',
        },
        geo: provider.latitude && provider.longitude ? {
            '@type': 'GeoCoordinates',
            latitude: provider.latitude,
            longitude: provider.longitude,
        } : undefined,
        telephone: provider.primary_phone?.phone || provider.phones?.[0]?.phone,
        image: provider.profile_photo ? `${BASE_URL}/storage/${provider.profile_photo}` : undefined,
        aggregateRating: provider.average_rating ? {
            '@type': 'AggregateRating',
            ratingValue: provider.average_rating,
            reviewCount: provider.reviews?.length || 0,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
        priceRange: '$$',
        openingHours: provider.working_hours || 'Mo-Sa 08:00-18:00',
        areaServed: {
            '@type': 'City',
            name: provider.city,
            containedInPlace: {
                '@type': 'Country',
                name: 'Syria',
            },
        },
    };
};

/**
 * Generate Schema.org JSON-LD for technicians
 */
export const generateTechnicianSchema = (technician: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'AutomotiveBusiness',
        '@id': `${BASE_URL}/entity/technician/${technician.id}`,
        identifier: technician.id,
        name: technician.name,
        description: technician.description,
        url: `${BASE_URL}/technicians/${technician.id}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: technician.workshop_address,
            addressLocality: technician.city,
            addressCountry: 'SY',
        },
        geo: technician.location ? {
            '@type': 'GeoCoordinates',
            latitude: technician.location.latitude,
            longitude: technician.location.longitude,
        } : undefined,
        telephone: technician.user?.phone,
        image: technician.profile_photo ? `${BASE_URL}/storage/${technician.profile_photo}` : undefined,
        aggregateRating: technician.average_rating ? {
            '@type': 'AggregateRating',
            ratingValue: technician.average_rating,
            reviewCount: technician.reviews?.length || 0,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
        priceRange: '$$',
        paymentAccepted: 'Cash, Card',
        openingHours: 'Mo-Sa 08:00-18:00',
        areaServed: {
            '@type': 'City',
            name: technician.city,
            containedInPlace: {
                '@type': 'Country',
                name: 'Syria',
            },
        },
    };
};

/**
 * Generate Schema.org JSON-LD for tow trucks
 */
export const generateTowTruckSchema = (towTruck: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'AutoRepair',
        '@id': `${BASE_URL}/entity/tow-truck/${towTruck.id}`,
        identifier: towTruck.id,
        name: towTruck.name,
        description: towTruck.description,
        url: `${BASE_URL}/tow-trucks/${towTruck.id}`,
        address: {
            '@type': 'PostalAddress',
            addressLocality: towTruck.city,
            addressCountry: 'SY',
        },
        geo: towTruck.location ? {
            '@type': 'GeoCoordinates',
            latitude: towTruck.location.latitude,
            longitude: towTruck.location.longitude,
        } : undefined,
        telephone: towTruck.user?.phone,
        image: towTruck.profile_photo ? `${BASE_URL}/storage/${towTruck.profile_photo}` : undefined,
        aggregateRating: towTruck.average_rating ? {
            '@type': 'AggregateRating',
            ratingValue: towTruck.average_rating,
            reviewCount: towTruck.reviews?.length || 0,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
        priceRange: '$$',
        areaServed: {
            '@type': 'City',
            name: towTruck.city,
            containedInPlace: {
                '@type': 'Country',
                name: 'Syria',
            },
        },
    };
};

/**
 * Generate Schema.org JSON-LD for products (spare parts)
 */
export const generateProductSchema = (product: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${BASE_URL}/entity/product/${product.id}`,
        identifier: product.id,
        name: product.name,
        description: product.description,
        category: product.category?.name,
        sku: product.id,
        url: `${BASE_URL}/store/products/${product.id}`,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'USD',
            availability: product.total_stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            inventoryLevel: {
                '@type': 'QuantitativeValue',
                value: product.total_stock,
            },
        },
        image: product.media?.map((img: string) => `${BASE_URL}/storage/${img}`),
        aggregateRating: product.average_rating ? {
            '@type': 'AggregateRating',
            ratingValue: product.average_rating,
            reviewCount: product.reviews?.length || 0,
            bestRating: 5,
            worstRating: 1,
        } : undefined,
    };
};

/**
 * Generate breadcrumb list schema
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${BASE_URL}${item.url}`,
        })),
    };
};

/**
 * Generate organization schema (for homepage)
 */
export const generateOrganizationSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ramouse.com',
        url: BASE_URL,
        logo: `${BASE_URL}/logo.png`,
        description: 'Syria\'s leading automotive marketplace for car sales, rentals, spare parts, technicians, and tow services',
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'SY',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'info@ramouse.com',
        },
        sameAs: [
            // Add social media URLs when available
        ],
    };
};

/**
 * Generate website schema (for homepage)
 */
export const generateWebsiteSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Ramouse.com',
        url: BASE_URL,
        description: 'Buy, sell, and rent cars in Syria. Find spare parts, technicians, and tow services.',
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/car-marketplace?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    },
    };
};

/**
 * Generate Dataset schema (Google recommendation for data authority)
 */
export const generateDatasetSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Ramouse.com Automotive Marketplace Data',
        description: 'Comprehensive dataset of car listings, rentals, providers, technicians, and tow trucks in Syria. Updated in real-time.',
        url: BASE_URL,
        isAccessibleForFree: true,
        keywords: [
            'Cars in Syria',
            'Automotive Data',
            'Car Listings',
            'Car Rentals',
            'Mechanics Syria',
            'Tow Trucks Syria'
        ],
        creator: {
            '@type': 'Organization',
            name: 'Ramouse.com',
            url: BASE_URL
        },
        distribution: [
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/car-listings.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/car-rentals.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/products.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/car-providers.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/technicians.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/api/feed/tow-trucks.xml`
            }
        ],
        includedInDataCatalog: {
            '@type': 'DataCatalog',
            name: 'Google Dataset Search'
        }
    };
};
