import React from 'react';
import { CarCard } from './CarCard';
import { TechnicianCard } from './TechnicianCard';
import { TowTruckCard } from './TowTruckCard';
import { ProductCard } from './ProductCard';

interface ResultCardsProps {
    results: {
        type: 'car_listings' | 'technicians' | 'tow_trucks' | 'products';
        count: number;
        message?: string;
        items: any[];
        suggestions?: string[];
    };
    onSuggestionClick?: (suggestion: string) => void;
}

export const ResultCards: React.FC<ResultCardsProps> = ({ results, onSuggestionClick }) => {
    // Empty state
    if (results.count === 0 && results.message) {
        return (
            <div className="space-y-3">
                <div className="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                    {results.message}
                </div>
                {/* Suggestions for empty results */}
                {results.suggestions && results.suggestions.length > 0 && onSuggestionClick && (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">💡 جرب هذه الاقتراحات</p>
                        <div className="flex flex-wrap gap-2">
                            {results.suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Render appropriate card based on type
    return (
        <div className="flex flex-col gap-2">
            {/* Results Count */}
            <div className="text-xs text-slate-500 dark:text-slate-400 px-1">
                {results.count === 1 ? 'نتيجة واحدة' : `${results.count} نتائج`}
            </div>

            {/* Result Cards */}
            {results.type === 'car_listings' && results.items.map((item, index) => (
                <CarCard key={item.id || index} {...item} />
            ))}

            {results.type === 'technicians' && results.items.map((item, index) => (
                <TechnicianCard key={item.id || index} {...item} />
            ))}

            {results.type === 'tow_trucks' && results.items.map((item, index) => (
                <TowTruckCard key={item.id || index} {...item} />
            ))}

            {results.type === 'products' && results.items.map((item, index) => (
                <ProductCard key={item.id || index} {...item} />
            ))}

            {/* Suggestions */}
            {results.suggestions && results.suggestions.length > 0 && onSuggestionClick && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-1 mb-2">💡 اقتراحات أخرى</p>
                    <div className="flex flex-wrap gap-2">
                        {results.suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="text-xs px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
