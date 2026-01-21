// Frontend/src/components/shared/StructuredData.tsx
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

export interface StructuredDataProps {
    data: object | object[];
}

/**
 * Component to inject JSON-LD structured data into page head
 * Supports single schema or array of schemas
 */
export const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
    const schemas = Array.isArray(data) ? data : [data];

    return (
        <Helmet>
            {schemas.map((schema, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(schema, null, 0)}
                </script>
            ))}
        </Helmet>
    );
};

/**
 * Hook to inject structured data dynamically
 * Useful for components that can't use Helmet directly
 */
export const useStructuredData = (data: object | object[]) => {
    useEffect(() => {
        const schemas = Array.isArray(data) ? data : [data];
        const scriptElements: HTMLScriptElement[] = [];

        schemas.forEach((schema) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(schema, null, 0);
            document.head.appendChild(script);
            scriptElements.push(script);
        });

        // Cleanup on unmount
        return () => {
            scriptElements.forEach((script) => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });
        };
    }, [data]);
};
