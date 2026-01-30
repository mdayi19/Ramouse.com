import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SeoSchemaProps {
    type: string;
    data: any;
}

const SeoSchema: React.FC<SeoSchemaProps> = ({ type, data }) => {
    // Base context - prioritize data properties to avoid duplication
    const schemaWithContext = {
        ...data
    };

    // Apply defaults if not present in data
    if (!schemaWithContext['@context']) {
        schemaWithContext['@context'] = 'https://schema.org';
    }
    if (!schemaWithContext['@type']) {
        schemaWithContext['@type'] = type;
    }

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schemaWithContext).replace(/</g, '\\u003c')}
            </script>
        </Helmet>
    );
};

export default SeoSchema;
