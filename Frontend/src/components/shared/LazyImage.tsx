import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholderSrc?: string;
    threshold?: number;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    placeholderSrc,
    threshold = 0.1,
    className,
    onLoad,
    onError,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
    const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!imageRef) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setImageSrc(src);
                        observer.disconnect();
                    }
                });
            },
            { threshold }
        );

        observer.observe(imageRef);

        return () => {
            observer.disconnect();
        };
    }, [imageRef, src, threshold]);

    const handleLoad = () => {
        setIsLoaded(true);
        onLoad?.();
    };

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    return (
        <img
            ref={setImageRef}
            src={imageSrc}
            alt={alt}
            className={cn(
                'transition-opacity duration-300',
                isLoaded ? 'opacity-100' : 'opacity-0',
                hasError && 'bg-slate-200 dark:bg-slate-700',
                className
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            {...props}
        />
    );
};

LazyImage.displayName = 'LazyImage';

export interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    placeholderSrc: string;
    alt: string;
    className?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
    src,
    placeholderSrc,
    alt,
    className,
    ...props
}) => {
    const [currentSrc, setCurrentSrc] = useState(placeholderSrc);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoading(false);
        };
    }, [src]);

    return (
        <div className={cn('relative overflow-hidden', className)}>
            <img
                src={currentSrc}
                alt={alt}
                className={cn(
                    'w-full h-full object-cover transition-all duration-500',
                    isLoading && 'blur-sm scale-105'
                )}
                {...props}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 animate-pulse" />
            )}
        </div>
    );
};

ProgressiveImage.displayName = 'ProgressiveImage';
