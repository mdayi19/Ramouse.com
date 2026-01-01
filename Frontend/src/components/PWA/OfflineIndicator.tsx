import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

export const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500 text-white px-4 py-2 text-center text-sm font-medium shadow-md animate-in slide-in-from-top-full fade-in duration-300 flex items-center justify-center gap-2">
            <Icon name="WifiOff" className="w-4 h-4" />
            <span>لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك.</span>
        </div>
    );
};
