/**
 * Device Detection Utility
 * Purpose: Detect device type and browser capabilities for mobile print/PDF functionality
 * Created: 2026-02-02
 */

export interface DeviceInfo {
    type: 'ios' | 'android' | 'desktop';
    os: string;
    browser: string;
    isMobile: boolean;
    supportsNativePrint: boolean;
}

/**
 * Detect if the current device is iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Check for iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);

    // Check for iPad on iOS 13+ (reports as Mac with touch support)
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    return isIOSDevice || isIPadOS;
}

/**
 * Detect if the current device is Android
 */
export function isAndroid(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    return /android/i.test(userAgent);
}

/**
 * Detect if the current device is mobile
 */
export function isMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return false;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

/**
 * Check if the browser supports native print functionality well
 */
export function supportsNativePrint(): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    // iOS Safari has poor window.print() support
    if (isIOS()) {
        return false;
    }

    // All other browsers have good print support
    return typeof window.print === 'function';
}

/**
 * Get detailed device information
 */
export function getDeviceInfo(): DeviceInfo {
    const ios = isIOS();
    const android = isAndroid();
    const mobile = isMobile();

    let type: 'ios' | 'android' | 'desktop' = 'desktop';
    if (ios) type = 'ios';
    else if (android) type = 'android';

    return {
        type,
        os: ios ? 'iOS' : android ? 'Android' : 'Other',
        browser: getBrowserName(),
        isMobile: mobile,
        supportsNativePrint: supportsNativePrint(),
    };
}

/**
 * Get browser name
 */
function getBrowserName(): string {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return 'Unknown';
    }

    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';

    return 'Unknown';
}

/**
 * Cached device type (detect once per session)
 */
let cachedDeviceType: 'ios' | 'android' | 'desktop' | null = null;

/**
 * Get device type (cached for performance)
 */
export function getDeviceType(): 'ios' | 'android' | 'desktop' {
    if (cachedDeviceType) {
        return cachedDeviceType;
    }

    if (isIOS()) {
        cachedDeviceType = 'ios';
    } else if (isAndroid()) {
        cachedDeviceType = 'android';
    } else {
        cachedDeviceType = 'desktop';
    }

    return cachedDeviceType;
}

/**
 * Check if should use PDF generation instead of native print
 */
export function shouldUsePDFGeneration(): boolean {
    return isIOS() || !supportsNativePrint();
}
