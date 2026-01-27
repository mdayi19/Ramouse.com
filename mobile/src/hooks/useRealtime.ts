import { useState, useEffect } from 'react';
import createEcho from '@/config/echo';

export const useRealtime = () => {
    const [echo, setEcho] = useState<any>(null);

    useEffect(() => {
        let echoInstance: any;

        const initEcho = async () => {
            echoInstance = await createEcho();
            setEcho(echoInstance);
        };

        initEcho();

        return () => {
            if (echoInstance) {
                echoInstance.disconnect();
            }
        };
    }, []);

    return { echo };
};
