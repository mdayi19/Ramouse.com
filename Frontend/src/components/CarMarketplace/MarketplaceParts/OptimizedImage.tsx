import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string; // e.g., 'aspect-[16/10]'
    priority?: boolean; // Load immediately without lazy loading
    onLoad?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className,
    aspectRatio = 'aspect-video',
    priority = false,
    onLoad,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (priority || !imgRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading slightly before visible
            }
        );

        observer.observe(imgRef.current);

        return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    return (
        <div
            ref={imgRef}
            className={cn(
                'relative overflow-hidden bg-slate-200 dark:bg-slate-700',
                aspectRatio,
                className
            )}
        >
            {/* Blur placeholder */}
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
            )}

            {/* Actual image - only load when in view */}
            {isInView && (
                <img
                    src={src}
                    alt={alt}
                    className={cn(
                        'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                        isLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={handleLoad}
                    loading={priority ? 'eager' : 'lazy'}
                />
            )}
        </div>
    );
};

export default OptimizedImage;
