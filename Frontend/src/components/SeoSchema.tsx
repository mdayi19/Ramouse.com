import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoSchemaProps {
    type: 'Organization' | 'WebSite' | 'LocalBusiness' | 'Product' | 'BreadcrumbList' | 'Article' | 'BlogPosting' | 'AutoRepair' | 'AutomotiveBusiness';
    data: any;
}

const SeoSchema: React.FC<SeoSchemaProps> = ({ type, data }) => {
    // Base context
    const schemaWithContext = {
        '@context': 'https://schema.org',
        '@type': type,
        ...data
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schemaWithContext)}
            </script>
        </Helmet>
    );
};

export default SeoSchema;
