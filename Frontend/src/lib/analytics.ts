import ReactGA from 'react-ga4';
import TagManager from 'react-gtm-module';

// Initialize Google Analytics and Tag Manager
export const initAnalytics = () => {
    // GA4
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
        ReactGA.initialize(measurementId);
    }

    // GTM
    const gtmId = import.meta.env.VITE_GTM_ID;
    if (gtmId) {
        TagManager.initialize({ gtmId });
    }

    if (!measurementId && !gtmId) {
        console.warn('Analytics: No VITE_GA_MEASUREMENT_ID or VITE_GTM_ID found.');
    }
};

// Track Page View (Hybrid: Sends to GA4 directly + Pushes Data Layer event)
export const logPageView = () => {
    const page = window.location.pathname + window.location.search;

    // Direct GA4
    ReactGA.send({ hitType: "pageview", page });

    // GTM Data Layer
    TagManager.dataLayer({
        dataLayer: {
            event: 'page_view',
            pagePath: page
        }
    });
};

// Track Custom Events
export const logEvent = (category: string, action: string, label?: string) => {
    // Direct GA4
    ReactGA.event({ category, action, label });

    // GTM Data Layer
    TagManager.dataLayer({
        dataLayer: {
            event: 'custom_event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        }
    });
};
