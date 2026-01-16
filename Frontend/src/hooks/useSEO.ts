import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'product';
    price?: number;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
}

export const useSEO = ({
    title,
    description,
    image,
    url,
    type = 'website',
    price,
    currency = 'USD',
    availability
}: SEOProps) => {
    useEffect(() => {
        // Set document title
        document.title = `${title} | Ramouse.com`;

        // Meta description
        updateMetaTag('description', description);

        // Open Graph tags
        updateMetaTag('og:title', title, 'property');
        updateMetaTag('og:description', description, 'property');
        updateMetaTag('og:type', type, 'property');

        if (image) {
            updateMetaTag('og:image', image, 'property');
            updateMetaTag('og:image:alt', title, 'property');
        }

        if (url) {
            updateMetaTag('og:url', url, 'property');
        }

        // Twitter Card tags
        updateMetaTag('twitter:card', 'summary_large_image', 'name');
        updateMetaTag('twitter:title', title, 'name');
        updateMetaTag('twitter:description', description, 'name');
        if (image) {
            updateMetaTag('twitter:image', image, 'name');
        }

        // Product-specific tags
        if (type === 'product' && price) {
            updateMetaTag('product:price:amount', price.toString(), 'property');
            updateMetaTag('product:price:currency', currency, 'property');
            if (availability) {
                updateMetaTag('product:availability', availability, 'property');
            }
        }

        // Cleanup function
        return () => {
            document.title = 'Ramouse.com';
        };
    }, [title, description, image, url, type, price, currency, availability]);
};

const updateMetaTag = (name: string, content: string, attributeName: 'name' | 'property' = 'name') => {
    let element = document.querySelector(`meta[${attributeName}="${name}"]`);

    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, name);
        document.head.appendChild(element);
    }

    element.setAttribute('content', content);
};

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

export default useSEO;
