import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../lib/analytics';

const RouteTracker: React.FC = () => {
    const location = useLocation();

    useEffect(() => {
        logPageView();
    }, [location]);

    return null;
};

export default RouteTracker;
