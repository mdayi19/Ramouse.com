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
        description: listing.description
            ? `${listing.description} - ${listing.year} ${listing.brand?.name} ${listing.model} - ${listing.mileage}km`
            : `${listing.year} ${listing.brand?.name} ${listing.model} - ${listing.mileage}km - ${listing.transmission} - ${listing.city}`,
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
        url: `${BASE_URL}/rent-car/${listing.slug}`,
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
/**
 * Helper to get absolute image URL
 */
const getImageUrl = (img: any): string | undefined => {
    if (!img) return undefined;
    const path = typeof img === 'string' ? img : (img.url || img.data || img.path);
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    if (path.startsWith('data:')) return undefined; // Skip base64 for schema if possible, or allow it
    return `${BASE_URL}/${path.startsWith('/') ? path.substring(1) : `storage/${path}`}`;
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
            streetAddress: technician.workshopAddress || technician.workshop_address,
            addressLocality: technician.city,
            addressCountry: 'SY',
        },
        geo: technician.location ? {
            '@type': 'GeoCoordinates',
            latitude: technician.location.latitude,
            longitude: technician.location.longitude,
        } : undefined,
        telephone: technician.user?.phone || technician.phone || technician.id,
        image: getImageUrl(technician.profilePhoto || technician.profile_photo),
        aggregateRating: (technician.averageRating || technician.average_rating) ? {
            '@type': 'AggregateRating',
            ratingValue: technician.averageRating || technician.average_rating,
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
        telephone: towTruck.user?.phone || towTruck.phone || towTruck.id,
        image: getImageUrl(towTruck.profilePhoto || towTruck.profile_photo),
        aggregateRating: (towTruck.averageRating || towTruck.average_rating) ? {
            '@type': 'AggregateRating',
            ratingValue: towTruck.averageRating || towTruck.average_rating,
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
    const images = product.media?.map(getImageUrl).filter(Boolean);
    const stock = product.totalStock !== undefined ? product.totalStock : product.total_stock;

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${BASE_URL}/entity/product/${product.id}`,
        identifier: product.id,
        name: product.name,
        description: product.description,
        category: product.category?.name,
        sku: product.id,
        url: `${BASE_URL}/store/product/${product.id}`,
        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'USD',
            availability: stock > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            inventoryLevel: {
                '@type': 'QuantitativeValue',
                value: stock,
            },
        },
        image: images,
        aggregateRating: (product.averageRating || product.average_rating) ? {
            '@type': 'AggregateRating',
            ratingValue: product.averageRating || product.average_rating,
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
            'https://www.facebook.com/ramouse',
            'https://www.instagram.com/ramouse',
            'https://twitter.com/ramouse'
        ],
        knowsAbout: [
            'Automotive Industry',
            'Vehicle Listings',
            'Car Rentals',
            'Automotive Technicians',
            'Tow Truck Services',
            'Car Spare Parts'
        ]
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
    };
};

/**
 * Generate Dataset schema (Google recommendation for data authority)
 */
/**
 * BASE DATASET GENERATOR (Internal Helper)
 */
const generateBaseDataset = (name: string, description: string, feedUrl: string, keywords: string[]) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: name,
        description: description,
        url: BASE_URL,
        isAccessibleForFree: true,
        keywords: keywords,
        creator: {
            '@type': 'Organization',
            name: 'Ramouse.com',
            url: BASE_URL
        },
        distribution: [
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}${feedUrl}`
            }
        ],
        includedInDataCatalog: {
            '@type': 'DataCatalog',
            name: 'Google Dataset Search'
        },
        isPartOf: {
            '@type': 'Dataset',
            name: 'Ramouse.com Automotive Marketplace Data',
            url: BASE_URL
        }
    };
};

/**
 * Car Listings Dataset Schema
 */
export const generateCarListingsDataset = () => {
    return generateBaseDataset(
        'Ramouse Car Listings Dataset',
        'Real-time dataset of cars for sale in Syria, including prices, specs, and availability.',
        '/feed/car-listings.xml',
        ['Cars for Sale', 'Used Cars Syria', 'Car Prices', 'Vehicle Listings']
    );
};

/**
 * Car Rentals Dataset Schema
 */
export const generateCarRentalsDataset = () => {
    return generateBaseDataset(
        'Ramouse Car Rentals Dataset',
        'Dataset of available car rentals in Syria with daily/weekly rates and terms.',
        '/feed/car-rentals.xml',
        ['Car Rentals', 'Rent a Car Syria', 'Rental Rates', 'Vehicle Hire']
    );
};

/**
 * Technicians Dataset Schema
 */
export const generateTechniciansDataset = () => {
    return generateBaseDataset(
        'Ramouse Technicians Registry',
        'Directory of verified automotive technicians and mechanics in Syria.',
        '/feed/technicians.xml',
        ['Mechanics', 'Auto Technicians', 'Car Repair', 'Syria Mechanics']
    );
};

/**
 * Tow Trucks Dataset Schema
 */
export const generateTowTrucksDataset = () => {
    return generateBaseDataset(
        'Ramouse Tow Truck Services',
        'Real-time registry of active tow truck providers in Syria.',
        '/feed/tow-trucks.xml',
        ['Tow Trucks', 'Roadside Assistance', 'Car Recovery', 'Towing Services']
    );
};

/**
 * Products Dataset Schema
 */
export const generateProductsDataset = () => {
    return generateBaseDataset(
        'Ramouse Automotive Parts Dataset',
        'Catalog of car spare parts and accessories available in Syria.',
        '/feed/products.xml',
        ['Spare Parts', 'Car Accessories', 'Auto Parts', 'Car Batteries']
    );
};

/**
 * Generate CollectionPage schema for list pages
 */
export const generateCollectionPageSchema = (title: string, description: string, items: any[], itemBaseUrl: string = '/car-listings') => {
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description: description,
        url: typeof window !== 'undefined' ? window.location.href : '',
        mainEntity: {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                url: `${BASE_URL}${itemBaseUrl}/${item.slug || item.id}`,
                name: item.title || item.name
            }))
        }
    };
};

/**
 * Generate Main Dataset Schema (Parent Dataset)
 */
export const generateMainDatasetSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'Ramouse.com Automotive Marketplace Data',
        description: 'Comprehensive real-time dataset of the Ramouse.com platform including car listings, rentals, technicians, tow trucks, and spare parts.',
        url: BASE_URL,
        isAccessibleForFree: true,
        keywords: ['Automotive', 'Syria', 'Car Listings', 'Car Rentals', 'Mechanics', 'Tow Trucks', 'Spare Parts', 'Vehicle Data'],
        creator: {
            '@type': 'Organization',
            name: 'Ramouse.com',
            url: BASE_URL
        },
        distribution: [
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/feed/car-listings.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/feed/car-rentals.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/feed/technicians.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/feed/tow-trucks.xml`
            },
            {
                '@type': 'DataDownload',
                encodingFormat: 'application/atom+xml',
                contentUrl: `${BASE_URL}/feed/products.xml`
            }
        ],
        includedInDataCatalog: {
            '@type': 'DataCatalog',
            name: 'Google Dataset Search'
        },
        license: 'https://creativecommons.org/licenses/by-nc/4.0/'
    };
};
/**
 * Generate Schema.org JSON-LD for Blog Articles with Deep Entity Linking
 */
export const generateBlogArticleSchema = (article: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        '@id': `${BASE_URL}/blog/${article.slug}#article`,
        headline: article.title,
        description: article.summary || article.excerpt,
        image: getImageUrl(article.imageUrl || article.cover_image),
        datePublished: article.publishedAt || article.created_at,
        dateModified: article.updated_at || article.publishedAt || article.created_at,
        author: {
            '@type': 'Organization',
            '@id': `${BASE_URL}/#organization`,
            name: 'Ramouse Platform',
            url: BASE_URL,
            logo: `${BASE_URL}/logo.png`
        },
        publisher: {
            '@id': `${BASE_URL}/#organization`
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${BASE_URL}/blog/${article.slug}`
        },
        "about": [
            {
                "@type": "Dataset",
                "@id": `${BASE_URL}/entity/dataset/car-listings`,
                "name": "Syrian Car Market Live Data"
            }
        ],
        "spatialCoverage": {
            "@type": "Place",
            "name": "Syria",
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "SY"
            }
        },
        "keywords": article.tags?.map((t: any) => t.name).join(', ') || "سيارات سوريا, أسعار السيارات 2026, راموسة",
        "mainEntity": article.faqs ? article.faqs.map((faq: any) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        })) : undefined
    };
};

/**
 * Generate Schema.org JSON-LD for Auction Listing
 */
export const generateAuctionListingSchema = (auction: any) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': `${BASE_URL}/entity/auction/${auction.id}`,
        name: auction.title,
        description: auction.car ? `${auction.car.year} ${auction.car.brand} ${auction.car.model}` : auction.title,
        image: auction.car?.media?.images?.[0] ? getImageUrl(auction.car.media.images[0]) : undefined,
        offers: {
            '@type': 'Offer',
            priceCurrency: 'USD',
            price: auction.current_bid || auction.starting_bid,
            availability: (auction.is_live || auction.status === 'scheduled') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${BASE_URL}/auctions/${auction.id}`,
            validFrom: auction.scheduled_start,
            validThrough: auction.actual_end || auction.scheduled_end,
            offeredBy: {
                '@type': 'Organization',
                name: 'Ramouse Auctions'
            }
        },
        brand: auction.car?.brand ? {
            '@type': 'Brand',
            name: auction.car.brand
        } : undefined,
        model: auction.car?.model,
        productionDate: auction.car?.year,
        itemCondition: 'https://schema.org/UsedCondition'
    };
};

/**
 * Generate CollectionPage schema for Auctions
 */
export const generateAuctionCollectionSchema = (auctions: any[]) => {
    return generateCollectionPageSchema(
        'Ramouse Car Auctions',
        'Live and scheduled car auctions in Syria. Bid on verified cars with competitive prices.',
        auctions.map(auction => ({
            id: auction.id,
            title: auction.title,
            slug: auction.id, // Auctions use ID in URL
            url: `/auctions/${auction.id}`
        }))
    );
};

/**
 * Generate CollectionPage schema for Announcements
 */
export const generateAnnouncementCollectionSchema = (announcements: any[]) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Ramouse Announcements',
        description: 'Latest news, updates, and announcements from Ramouse platform.',
        url: `${BASE_URL}/announcements`,
        blogPost: announcements.map(post => ({
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.timestamp,
            articleBody: post.message,
            image: post.imageUrl ? getImageUrl(post.imageUrl) : undefined,
            author: {
                '@type': 'Organization',
                name: 'Ramouse Team'
            }
        }))
    };
};
