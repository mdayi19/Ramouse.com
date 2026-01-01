import { useState, useEffect, useCallback } from 'react';

export const usePWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            console.log('UsePWA: Captured beforeinstallprompt event');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const installApp = useCallback(async () => {
        if (!deferredPrompt) {
            console.log('UsePWA: No deferred prompt available');
            return false;
        }

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again
        setDeferredPrompt(null);

        return outcome === 'accepted';
    }, [deferredPrompt]);

    return {
        deferredPrompt,
        installApp,
        isInstalled
    };
};
