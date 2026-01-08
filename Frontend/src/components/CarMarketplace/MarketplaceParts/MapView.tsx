import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface MapViewProps {
    listings: Array<{
        id: number;
        title: string;
        price: number;
        location?: string;
        lat?: number;
        lng?: number;
        images?: string[];
    }>;
    center?: { lat: number; lng: number };
    zoom?: number;
    className?: string;
}

/**
 * Map view component for displaying car listings on a map
 * Note: This is a placeholder implementation. In production, integrate with:
 * - Google Maps JavaScript API
 * - Mapbox GL JS
 * - Leaflet
 * 
 * @param listings - Array of listings with coordinates
 * @param center - Map center coordinates
 * @param zoom - Initial zoom level
 */
export const MapView: React.FC<MapViewProps> = ({
    listings,
    center = { lat: 33.5138, lng: 36.2765 }, // Damascus
    zoom = 12,
    className
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [selectedListing, setSelectedListing] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Placeholder map implementation
    // In production, replace with actual map library initialization
    useEffect(() => {
        if (!mapRef.current) return;

        // TODO: Initialize Google Maps or Mapbox here
        console.log('Map initialization placeholder');

        // Example for Google Maps:
        // const map = new google.maps.Map(mapRef.current, {
        //     center,
        //     zoom,
        // });

        // Example for Mapbox:
        // const map = new mapboxgl.Map({
        //     container: mapRef.current,
        //     style: 'mapbox://styles/mapbox/streets-v11',
        //     center: [center.lng, center.lat],
        //     zoom,
        // });
    }, []);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ar-SY', {
            style: 'currency',
            currency: 'SYP',
            notation: 'compact'
        }).format(price);
    };

    const selected = listings.find(l => l.id === selectedListing);

    return (
        <div className={cn('relative rounded-2xl overflow-hidden', isFullscreen && 'fixed inset-0 z-50', className)}>
            {/* Map Container */}
            <div
                ref={mapRef}
                className={cn(
                    'bg-slate-200 dark:bg-slate-700',
                    isFullscreen ? 'h-screen' : 'h-[500px]'
                )}
            >
                {/* Placeholder content - remove when integrating real map */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                    <div className="text-center">
                        <MapPin className="w-16 h-16 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            عرض الخريطة
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md">
                            يتطلب التكامل مع Google Maps أو Mapbox<br />
                            {listings.length} سيارة متاحة
                        </p>
                    </div>
                </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    {isFullscreen ? <X className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>

                <button
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>

                <button
                    className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
            </div>

            {/* Listing Preview Card */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-20"
                    >
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 flex gap-4">
                            <img
                                src={selected.images?.[0] || '/placeholder-car.jpg'}
                                alt={selected.title}
                                className="w-24 h-24 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                    {selected.title}
                                </h4>
                                <p className="text-primary font-bold text-lg">
                                    {formatPrice(selected.price)}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                    <MapPin className="w-3 h-3 inline mr-1" />
                                    {selected.location || 'غير محدد'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedListing(null)}
                                className="self-start p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MapView;
