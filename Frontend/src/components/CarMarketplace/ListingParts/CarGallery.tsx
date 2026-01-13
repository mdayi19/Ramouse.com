import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { getImageUrl } from '../../../utils/helpers';

interface CarGalleryProps {
    images: string[];
    title: string;
    isSponsored?: boolean;
    isFeatured?: boolean;
    isRent?: boolean;
    videoUrl?: string;
    t: any;
}

const CarGallery: React.FC<CarGalleryProps> = ({
    images,
    title,
    isSponsored,
    isFeatured,
    isRent,
    videoUrl,
    t
}) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
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
            setShowVideoModal(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                {/* Main Image Container */}
                <div
                    className="relative aspect-[16/10] sm:aspect-[21/9] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg group"
                    onClick={() => setShowGalleryModal(true)}
                >
                    <AnimatePresence mode='wait'>
                        <motion.img
                            key={images[selectedImageIndex]}
                            src={getImageUrl(images[selectedImageIndex])}
                            alt={`${title} - Image ${selectedImageIndex + 1}`}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                            onLoad={() => setImageLoaded(true)}
                        />
                    </AnimatePresence>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                    {/* RAMOUSE.COM Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden">
                        <span className="text-white/20 font-black text-4xl sm:text-6xl md:text-8xl tracking-widest -rotate-45 select-none font-sans whitespace-nowrap"
                            style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                            RAMOUSE.COM
                        </span>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {isSponsored && (
                            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-bold shadow-md animate-fade-in-up">
                                {t.ui.sponsored}
                            </span>
                        )}
                        {isFeatured && (
                            <span className="px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md animate-fade-in-up">
                                {t.ui.featured}
                            </span>
                        )}
                        {isRent && (
                            <span className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md animate-fade-in-up">
                                {t.ui.rent}
                            </span>
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Video Button */}
                    {videoUrl && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVideoModal(true);
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-600 hover:text-white transition-all duration-300 group-hover:scale-110 z-20"
                        >
                            <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-current border-b-[10px] border-b-transparent ml-1" />
                        </button>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowGalleryModal(true);
                                }}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-all hover:scale-105"
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedImageIndex(idx);
                                    setImageLoaded(false);
                                }}
                                className={cn(
                                    "relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-300 snap-start border-2",
                                    selectedImageIndex === idx
                                        ? "border-blue-500 scale-95"
                                        : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <img
                                    src={getImageUrl(img)}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Modal */}
            <AnimatePresence>
                {showVideoModal && videoUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setShowVideoModal(false)}
                    >
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <div
                            className="w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <iframe
                                src={videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
                                    ? videoUrl.replace('watch?v=', 'embed/').split('&')[0]
                                    : videoUrl}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Enhanced Gallery Modal */}
            <AnimatePresence>
                {showGalleryModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md"
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowRight') nextImage();
                            if (e.key === 'ArrowLeft') prevImage();
                            if (e.key === 'Escape') {
                                setShowGalleryModal(false);
                                setIsZoomed(false);
                            }
                            if (e.key === '+' || e.key === '=') setIsZoomed(true);
                            if (e.key === '-' || e.key === '_') setIsZoomed(false);
                        }}
                        tabIndex={0}
                        autoFocus
                        onClick={() => !isZoomed && setShowGalleryModal(false)}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => {
                                setShowGalleryModal(false);
                                setIsZoomed(false);
                            }}
                            className="absolute top-4 right-4 p-3 glass-effect text-white hover:bg-white/20 rounded-xl transition-all z-10 touch-target"
                            aria-label="إغلاق"
                        >
                            <X className="w-6 h-6 sm:w-8 sm:h-8" />
                        </button>

                        {/* Zoom Controls */}
                        <div className="absolute top-4 left-4 flex gap-2 z-10">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsZoomed(!isZoomed);
                                }}
                                className={cn(
                                    "p-3 glass-effect rounded-xl transition-all touch-target",
                                    isZoomed
                                        ? "bg-primary text-white"
                                        : "text-white hover:bg-white/20"
                                )}
                                aria-label={isZoomed ? "تصغير" : "تكبير"}
                                title={isZoomed ? "تصغير (Esc أو -)" : "تكبير (+)"}
                            >
                                <ZoomIn className="w-6 h-6" />
                            </button>
                        </div>

                        <div
                            className="relative w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Navigation Buttons */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-0 sm:left-4 p-3 glass-effect text-white hover:bg-white/20 rounded-full transition-all z-10 hover:scale-110 active:scale-95"
                                        aria-label="الصورة السابقة (←)"
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>

                                    <button
                                        onClick={nextImage}
                                        className="absolute right-0 sm:right-4 p-3 glass-effect text-white hover:bg-white/20 rounded-full transition-all z-10 hover:scale-110 active:scale-95"
                                        aria-label="الصورة التالية (→)"
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                </>
                            )}

                            <div
                                className="relative max-w-7xl max-h-[90vh] mx-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <motion.img
                                    key={images[selectedImageIndex]}
                                    src={getImageUrl(images[selectedImageIndex])}
                                    alt={`${title} - معرض الصور ${selectedImageIndex + 1}`}
                                    className={cn(
                                        "max-h-[85vh] w-auto mx-auto rounded-lg shadow-2xl transition-transform duration-300",
                                        isZoomed && "scale-150 cursor-grab active:cursor-grabbing"
                                    )}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{
                                        opacity: 1,
                                        scale: isZoomed ? 1.5 : 1
                                    }}
                                    drag={isZoomed}
                                    dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
                                    dragElastic={0.1}
                                    whileDrag={{ cursor: 'grabbing' }}
                                />

                                {/* Modal Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none overflow-hidden">
                                    <span className="text-white/20 font-black text-5xl sm:text-8xl md:text-9xl tracking-widest -rotate-45 select-none font-sans whitespace-nowrap"
                                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                                        RAMOUSE.COM
                                    </span>
                                </div>
                            </div>

                            {/* Image Counter & Zoom Indicator */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                                <div className="glass-effect px-4 py-2 rounded-full text-white font-medium">
                                    {selectedImageIndex + 1} / {images.length}
                                </div>
                                {isZoomed && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="glass-effect px-3 py-2 rounded-full text-white text-sm flex items-center gap-1.5"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                        <span>150%</span>
                                    </motion.div>
                                )}
                            </div>

                            {/* Keyboard Hints */}
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 glass-effect px-4 py-2 rounded-full text-white/70 text-xs hidden sm:block">
                                استخدم ← → للتنقل • + - للتكبير • ESC للإغلاق
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default CarGallery;
