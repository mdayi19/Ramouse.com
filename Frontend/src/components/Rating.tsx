

import React from 'react';

interface RatingProps {
  rating: number;
  onRating?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md';
}

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <svg
    className={`w-6 h-6 transition-colors ${filled ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'} ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const Rating: React.FC<RatingProps> = ({ rating, onRating, readOnly = false, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

  return (
    <div className="flex items-center" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onRating && onRating(star)}
          className={`
            ${!readOnly ? 'cursor-pointer' : 'cursor-default'}
            group
          `}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <StarIcon
            filled={star <= rating}
            className={`
              ${sizeClasses}
              ${!readOnly ? 'group-hover:text-yellow-300' : ''}
            `}
          />
        </button>
      ))}
    </div>
  );
};

export default Rating;