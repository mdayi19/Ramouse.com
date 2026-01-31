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
                "rounded-2xl shadow-lg overflow-hidden transition-all duration-300",
                "hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary/30",
                "bg-white dark:bg-slate-800 flex flex-col"
            )}
        >
            {/* Cover Image / Header */}
            <div className="h-16 bg-gradient-to-r from-red-500/20 to-orange-500/20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                {distance && (
                    <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-lg border border-white/30">
                        <MapPin className="w-3 h-3" />
                        {distance}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-3 flex flex-col flex-grow relative -mt-8">
                <div className="flex items-end gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/30 to-orange-500/20 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-md">
                            <Truck className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>

                    {/* Rating */}
                    {rating > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                                {rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Name & Type */}
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2 truncate">
                    {name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">{vehicleType}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{city}</span>
                </div>

                {/* Request Service Button */}
                <button
                    onClick={handleRequest}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold mt-3"
                >
                    <Phone className="w-3.5 h-3.5" />
                    طلب الخدمة الآن
                </button>
            </div>
        </motion.div>
    );
};
