import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoSchemaProps {
    type: string;
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
                {JSON.stringify(schemaWithContext).replace(/</g, '\\u003c')}
            </script>
        </Helmet>
    );
};

export default SeoSchema;
