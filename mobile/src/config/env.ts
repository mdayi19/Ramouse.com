import Constants from 'expo-constants';

const ENV = {
    dev: {
        apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://ramouse.com/api',
        apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
        reverbAppKey: process.env.EXPO_PUBLIC_REVERB_APP_KEY || 'ramouse-app-key',
        reverbHost: process.env.EXPO_PUBLIC_REVERB_HOST || 'ramouse.com',
        reverbPort: parseInt(process.env.EXPO_PUBLIC_REVERB_PORT || '443'),
        reverbScheme: process.env.EXPO_PUBLIC_REVERB_SCHEME || 'https',
        environment: 'development' as const,
        enableBiometrics: process.env.EXPO_PUBLIC_ENABLE_BIOMETRICS === 'true',
        enableCertificatePinning: false,
        enableOfflineMode: process.env.EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',
        debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
        logLevel: (process.env.EXPO_PUBLIC_LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error',
    },
    prod: {
        apiUrl: 'https://ramouse.com/api',
        apiTimeout: 30000,
        reverbAppKey: 'ramouse-app-key',
        reverbHost: 'ramouse.com',
        reverbPort: 443,
        reverbScheme: 'https' as const,
        environment: 'production' as const,
        enableBiometrics: true,
        enableCertificatePinning: true,
        enableOfflineMode: true,
        debugMode: false,
        logLevel: 'error' as const,
    },
};

const getEnvVars = () => {
    if (__DEV__) {
        return ENV.dev;
    }
    return ENV.prod;
};

export default getEnvVars();
