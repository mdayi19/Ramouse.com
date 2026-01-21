import React from 'react';
import { Helmet } from 'react-helmet-async';
import SeoSchema from './SeoSchema';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    openGraph?: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
        type?: 'website' | 'article' | 'profile';
    };
    schema?: {
        type: 'Organization' | 'WebSite' | 'LocalBusiness' | 'Product' | 'BreadcrumbList' | 'Article' | 'BlogPosting' | 'AutoRepair' | 'AutomotiveBusiness' | 'Dataset';
        data: any;
    };
}

const SEO: React.FC<SEOProps> = ({
    title = 'راموسة | المنصة الأولى لخدمات السيارات في سوريا',
    description = 'حلك المتكامل لصيانة وخدمات السيارات. نربطك بأفضل الفنيين، سطحات النقل، ومزودي قطع الغيار في مكان واحد.',
    canonical,
    openGraph,
    schema
}) => {
    const siteUrl = 'https://ramouse.com';
    const finalCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
    const ogImage = openGraph?.image || '/og-image.jpg';

    return (
        <>
            <Helmet>
                <title>{title}</title>
                <meta name="description" content={description} />
                <link rel="canonical" href={finalCanonical} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content={openGraph?.type || 'website'} />
                <meta property="og:url" content={openGraph?.url || finalCanonical} />
                <meta property="og:title" content={openGraph?.title || title} />
                <meta property="og:description" content={openGraph?.description || description} />
                <meta property="og:image" content={ogImage} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={openGraph?.url || finalCanonical} />
                <meta name="twitter:title" content={openGraph?.title || title} />
                <meta name="twitter:description" content={openGraph?.description || description} />
                <meta name="twitter:image" content={ogImage} />
            </Helmet>

            {/* Default Organization Schema for every page (optional, or move to App root) */}
            <SeoSchema
                type="Organization"
                data={{
                    "name": "Ramouse",
                    "url": "https://ramouse.com",
                    "logo": "https://ramouse.com/logo.png",
                    "description": "Electronic shipping and logistics platform connecting customers with shipping companies",
                    "sameAs": [
                        "https://www.facebook.com/ramouse",
                        "https://www.instagram.com/ramouse"
                    ],
                    "contactPoint": {
                        "@type": "ContactPoint",
                        "telephone": "+963912345678",
                        "contactType": "customer service",
                        "areaServed": "SY",
                        "availableLanguage": ["Arabic", "English"]
                    }
                }}
            />

            {/* Page Specific Schema */}
            {schema && <SeoSchema type={schema.type} data={schema.data} />}
        </>
    );
};

export default SEO;
