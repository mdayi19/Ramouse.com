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
    };
}

export const ResultCards: React.FC<ResultCardsProps> = ({ results }) => {
    // Empty state
    if (results.count === 0 && results.message) {
        return (
            <div className="text-sm text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                {results.message}
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
        </div>
    );
};
