import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (images.length === 0) return;
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'Escape') setShowGalleryModal(false);
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 group">
                    <img
                        src={images[selectedImageIndex]}
                        alt={title}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setShowGalleryModal(true)}
                    />

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100 mobile:opacity-100"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100 mobile:opacity-100"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        {isSponsored && (
                            <span className="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full shadow-sm">
                                {t.ui.sponsored}
                            </span>
                        )}
                        {isFeatured && (
                            <span className="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-sm">
                                {t.ui.featured}
                            </span>
                        )}
                        {isRent && (
                            <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full shadow-sm">
                                {t.ui.rent}
                            </span>
                        )}
                    </div>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
                        {selectedImageIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                    }`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Gallery Modal */}
            {showGalleryModal && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    autoFocus
                >
                    <button
                        onClick={() => setShowGalleryModal(false)}
                        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="relative max-w-7xl w-full h-full flex items-center justify-center">
                        <img
                            src={images[selectedImageIndex]}
                            alt={title}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />

                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            </>
                        )}

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full backdrop-blur-sm">
                            {selectedImageIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CarGallery;
