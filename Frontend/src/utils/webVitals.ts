/**
 * Core Web Vitals monitoring and optimization utilities
 * Tracks and reports key performance metrics for SEO
 */

interface WebVitalsMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report Core Web Vitals to analytics
 * Tracks LCP, FID, CLS for SEO optimization
 */
export const reportWebVitals = (onPerfEntry?: (metric: WebVitalsMetric) => void) => {
    if (onPerfEntry && typeof window !== 'undefined') {
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
            getCLS(onPerfEntry as any);
            getFID(onPerfEntry as any);
            getFCP(onPerfEntry as any);
            getLCP(onPerfEntry as any);
            getTTFB(onPerfEntry as any);
        }).catch(() => {
            // web-vitals not installed, skip
        });
    }
};

/**
 * Preload critical resources for better performance
 * @param resources - Array of resource URLs to preload
 */
export const preloadCriticalResources = (resources: Array<{ href: string; as: string }>) => {
    if (typeof document === 'undefined') return;

    resources.forEach(({ href, as }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;
        document.head.appendChild(link);
    });
};

/**
 * Prefetch resources for next navigation
 * @param urls - Array of URLs to prefetch
 */
export const prefetchPages = (urls: string[]) => {
    if (typeof document === 'undefined') return;

    urls.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    });
};

/**
 * Optimize images for better LCP
 * Adds fetchpriority="high" to above-fold images
 */
export const optimizeLCPImage = (imageElement: HTMLImageElement) => {
    if (imageElement) {
        imageElement.setAttribute('fetchpriority', 'high');
        imageElement.setAttribute('decoding', 'async');
    }
};

/**
 * Report performance metrics to Google Analytics
 */
export const reportToAnalytics = ({ name, value, rating }: WebVitalsMetric) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', name, {
            event_category: 'Web Vitals',
            value: Math.round(name === 'CLS' ? value * 1000 : value),
            event_label: rating,
            non_interaction: true,
        });
    }
};

/**
 * Lazy load below-fold content
 * Uses Intersection Observer for performance
 */
export const setupLazyLoading = () => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        return;
    }

    const lazyElements = document.querySelectorAll('[data-lazy]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target as HTMLElement;
                const src = element.getAttribute('data-lazy-src');

                if (src && element instanceof HTMLImageElement) {
                    element.src = src;
                    element.removeAttribute('data-lazy-src');
                    element.removeAttribute('data-lazy');
                    observer.unobserve(element);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });

    lazyElements.forEach(el => observer.observe(el));
};

/**
 * Get rating for metric value
 */
const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds: Record<string, [number, number]> = {
        'LCP': [2500, 4000],
        'FID': [100, 300],
        'CLS': [0.1, 0.25],
        'FCP': [1800, 3000],
        'TTFB': [800, 1800]
    };

    const [good, poor] = thresholds[name] || [0, 0];

    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
};

export default {
    reportWebVitals,
    preloadCriticalResources,
    prefetchPages,
    optimizeLCPImage,
    reportToAnalytics,
    setupLazyLoading
};
