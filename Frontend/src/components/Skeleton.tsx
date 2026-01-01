import React from 'react';

interface SkeletonProps {
    className?: string; // Tailwind classes for width/height/margin
    count?: number; // Number of skeletons to render
    wrapperClass?: string; // Class for the wrapper div if count > 1
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1, wrapperClass = '' }) => {
    // Base classes for the shimmer effect
    const baseClass = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

    if (count === 1) {
        return <div className={`${baseClass} ${className}`} aria-hidden="true" />;
    }

    return (
        <div className={wrapperClass}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={`${baseClass} ${className}`} aria-hidden="true" />
            ))}
        </div>
    );
};

export default Skeleton;
