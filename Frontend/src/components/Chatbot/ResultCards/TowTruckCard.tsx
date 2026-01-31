import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Star, Truck } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface TowTruckCardProps {
    id: number;
    name: string;
    vehicleType: string;
    rating: number;
    city: string;
    distance?: string;
    phone: string;
}

export const TowTruckCard: React.FC<TowTruckCardProps> = ({
    name,
    vehicleType,
    rating,
    city,
    distance,
    phone
}) => {
    const handleRequest = (e: React.MouseEvent) => {
        e.preventDefault();
        // Open WhatsApp with pre-filled message
        const message = encodeURIComponent(`مرحباً، أحتاج خدمة سطحة`);
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800"
            )}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                        <Truck className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>

                    {/* Name & Type */}
                    <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{vehicleType}</p>
                    </div>
                </div>

                {/* Rating */}
                {rating > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            {rating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{city}</span>
                {distance && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                        {distance}
                    </span>
                )}
            </div>

            {/* Request Service Button */}
            <button
                onClick={handleRequest}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600 transition-all text-sm font-bold shadow-lg hover:shadow-xl mt-1"
            >
                <Phone className="w-4 h-4" />
                طلب الخدمة الآن
            </button>
        </motion.div>
    );
};
