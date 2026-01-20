import { useEffect, useRef, useState } from 'react';

export interface SwipeHandlers {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
}

export interface UseSwipeOptions extends SwipeHandlers {
    threshold?: number; // Minimum distance for swipe (default: 50px)
    preventDefaultTouchmoveEvent?: boolean;
}

export const useSwipe = (options: UseSwipeOptions) => {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        preventDefaultTouchmoveEvent = false,
    } = options;

    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const touchEnd = useRef<{ x: number; y: number } | null>(null);

    const handleTouchStart = (e: TouchEvent) => {
        touchEnd.current = null;
        touchStart.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (preventDefaultTouchmoveEvent) {
            e.preventDefault();
        }
        touchEnd.current = {
            x: e.targetTouches[0].clientX,
            y: e.targetTouches[0].clientY,
        };
    };

    const handleTouchEnd = () => {
        if (!touchStart.current || !touchEnd.current) return;

        const distanceX = touchStart.current.x - touchEnd.current.x;
        const distanceY = touchStart.current.y - touchEnd.current.y;
        const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

        if (isHorizontalSwipe) {
            if (distanceX > threshold && onSwipeLeft) {
                onSwipeLeft();
            } else if (distanceX < -threshold && onSwipeRight) {
                onSwipeRight();
            }
        } else {
            if (distanceY > threshold && onSwipeUp) {
                onSwipeUp();
            } else if (distanceY < -threshold && onSwipeDown) {
                onSwipeDown();
            }
        }
    };

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
};

export const useIntersectionObserver = (
    options: IntersectionObserverInit = {}
) => {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const targetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const target = targetRef.current;
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [options]);

    return { targetRef, isIntersecting };
};

export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener('change', listener);

        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

export const useDebounce = <T,>(value: T, delay: number): T => {
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
};

export const useLocalStorage = <T,>(
    key: string,
    initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    };

    return [storedValue, setValue];
};
