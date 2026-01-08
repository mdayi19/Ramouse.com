import { useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing values
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Custom hook for throttling function calls
 * @param callback - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 500
): T {
    const lastRan = useRef(Date.now());

    return ((...args) => {
        const now = Date.now();
        if (now - lastRan.current >= delay) {
            callback(...args);
            lastRan.current = now;
        }
    }) as T;
}

/**
 * Custom hook for keyboard navigation
 * @param onEnter - Callback for Enter key
 * @param onEscape - Callback for Escape key
 */
export function useKeyboardNav(
    onEnter?: () => void,
    onEscape?: () => void
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && onEnter) {
                onEnter();
            }
            if (e.key === 'Escape' && onEscape) {
                onEscape();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onEnter, onEscape]);
}

/**
 * Custom hook for focus management
 * @param refs - Array of refs to manage focus
 */
export function useFocusTrap(refs: React.RefObject<HTMLElement>[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = refs
                .map(ref => ref.current)
                .filter(Boolean) as HTMLElement[];

            if (focusableElements.length === 0) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [refs]);
}

import { useState } from 'react';

export default { useDebounce, useThrottle, useKeyboardNav, useFocusTrap };
