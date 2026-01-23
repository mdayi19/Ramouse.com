

export const generateStructuredData = (listing: any) => {
    const offers: any = {
        '@type': 'Offer',
        'price': listing.price || listing.daily_rate,
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock',
        'seller': {
            '@type': listing.listing_type === 'rent' ? 'Organization' : 'Person',
            'name': listing.provider?.name || listing.owner?.name
        }
    };

    if (listing.listing_type === 'rent') {
        offers.priceSpecification = {
            '@type': 'UnitPriceSpecification',
            'price': listing.daily_rate,
            'priceCurrency': 'USD',
            'unitCode': 'DAY'
        };
    }

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Car',
        'name': listing.title,
        'description': listing.description,
        'image': listing.photos || listing.images || [],
        'brand': {
            '@type': 'Brand',
            'name': listing.brand?.name || 'Unknown'
        },
        'model': listing.model || '',
        'vehicleModelDate': listing.year?.toString(),
        'mileageFromOdometer': {
            '@type': 'QuantitativeValue',
            'value': listing.mileage,
            'unitCode': 'KMT'
        },
        'offers': offers
    };

    return structuredData;
};

export const injectStructuredData = (data: any) => {
    const scriptId = 'structured-data-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(data);
};

