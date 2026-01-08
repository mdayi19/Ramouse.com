import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface CarGalleryProps {
    images: string[];
    title: string;
    isSponsored?: boolean;
    isFeatured?: boolean;
    isRent?: boolean;
    t: any;
}

const CarGallery: React.FC<CarGalleryProps> = ({
    images,
    title,
    isSponsored,
    isFeatured,
    isRent,
    t
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
        setImageLoaded(false);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
        setImageLoaded(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') {
            setShowGalleryModal(false);
            setIsZoomed(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden"
            >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-700 group overflow-hidden">
                    {/* Main Image */}
                    <motion.img
                        src={images[selectedImageIndex]}
                        alt={title}
                        className={cn(
                            "w-full h-full object-cover cursor-pointer transition-transform duration-300",
                            "hover:scale-105"
                        )}
                        onClick={() => setShowGalleryModal(true)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Loading shimmer */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 animate-shimmer-loading bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700" />
                    )}

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className={cn(
                                    "absolute left-4 top-1/2 -translate-y-1/2 p-2.5",
                                    "glass-effect text-white",
                                    "rounded-full transition-all",
                                    "opacity-0 group-hover:opacity-100",
                                    "hover:scale-110 active:scale-95",
                                    "md:opacity-0 touch-target"
                                )}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextImage}
                                className={cn(
                                    "absolute right-4 top-1/2 -translate-y-1/2 p-2.5",
                                    "glass-effect text-white",
                                    "rounded-full transition-all",
                                    "opacity-0 group-hover:opacity-100",
                                    "hover:scale-110 active:scale-95",
                                    "md:opacity-0 touch-target"
                                )}
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                        {isSponsored && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg animate-fade-in">
                                {t.ui.sponsored}
                            </span>
                        )}
                        {isFeatured && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full shadow-lg animate-fade-in">
                                {t.ui.featured}
                            </span>
                        )}
                        {isRent && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg animate-fade-in">
                                {t.ui.rent}
                            </span>
                        )}
                    </div>

                    {/* Image Counter & Zoom Button */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                            onClick={() => setShowGalleryModal(true)}
                            className="glass-effect p-2 rounded-full text-white hover:scale-110 transition-transform touch-target"
                            aria-label="View fullscreen"
                        >
                            <Maximize2 className="w-4 h-4" />
                        </button>
                        <div className="px-3 py-1.5 glass-effect text-white text-sm rounded-full font-medium">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="p-4 flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar scroll-smooth-mobile">
                        {images.map((img, idx) => (
                            <motion.button
                                key={idx}
                                onClick={() => {
                                    setSelectedImageIndex(idx);
                                    setImageLoaded(false);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn(
                                    "flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all",
                                    idx === selectedImageIndex
                                        ? 'border-primary ring-2 ring-primary/20 shadow-md'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-primary/50'
                                )}
                            >
                                <img
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </motion.button>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Enhanced Gallery Modal */}
            <AnimatePresence>
                {showGalleryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                        autoFocus
                        onClick={() => !isZoomed && setShowGalleryModal(false)}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowGalleryModal(false)}
                            className="absolute top-4 right-4 p-3 glass-effect text-white hover:bg-white/20 rounded-xl transition-all z-10 touch-target"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        {/* Zoom Toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsZoomed(!isZoomed);
                            }}
                            className="absolute top-4 left-4 p-3 glass-effect text-white hover:bg-white/20 rounded-xl transition-all z-10 touch-target"
                            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                        >
                            <ZoomIn className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        <div
                            className="relative max-w-7xl w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <motion.img
                                key={selectedImageIndex}
                                src={images[selectedImageIndex]}
                                alt={title}
                                className={cn(
                                    "object-contain rounded-lg shadow-2xl transition-all duration-300",
                                    isZoomed ? "max-w-none max-h-none w-auto h-auto cursor-zoom-out" : "max-w-full max-h-[85vh] cursor-zoom-in"
                                )}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => setIsZoomed(!isZoomed)}
                                drag={isZoomed}
                                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                dragElastic={0.1}
                            />

                            {/* Navigation Arrows */}
                            {images.length > 1 && !isZoomed && (
                                <>
                                    <motion.button
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 glass-effect hover:bg-white/20 rounded-full text-white transition-all touch-target"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </motion.button>
                                    <motion.button
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 glass-effect hover:bg-white/20 rounded-full text-white transition-all touch-target"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </motion.button>
                                </>
                            )}

                            {/* Image Counter */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-effect text-white rounded-full font-medium"
                            >
                                {selectedImageIndex + 1} / {images.length}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CarGallery;
