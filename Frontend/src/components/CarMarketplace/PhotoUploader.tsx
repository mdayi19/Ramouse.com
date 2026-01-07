import React, { useCallback } from 'react';
import { Upload, X, Star } from 'lucide-react';

interface PhotoUploaderProps {
    photos: (File | string)[];
    onPhotosChange: (photos: (File | string)[]) => void;
    maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
    photos,
    onPhotosChange,
    maxPhotos = 15
}) => {
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPhotos = [...photos, ...files].slice(0, maxPhotos);
        onPhotosChange(newPhotos);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        const newPhotos = [...photos, ...imageFiles].slice(0, maxPhotos);
        onPhotosChange(newPhotos);
    }, [photos, maxPhotos, onPhotosChange]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };

    const moveToFirst = (index: number) => {
        const newPhotos = [...photos];
        const [photo] = newPhotos.splice(index, 1);
        newPhotos.unshift(photo);
        onPhotosChange(newPhotos);
    };

    const getPreviewUrl = (file: File | string) => {
        if (typeof file === 'string') return file;
        return URL.createObjectURL(file);
    };

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
                <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />
                <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 dark:text-white mb-1">
                            📸 اسحب الصور هنا أو اضغط للاختيار
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            (1-{maxPhotos} صورة، حد أقصى 5MB لكل صورة)
                        </p>
                    </div>
                </label>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((file, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={getPreviewUrl(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                            />
                            {/* Action Buttons */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                {index !== 0 && (
                                    <button
                                        type="button"
                                        onClick={() => moveToFirst(index)}
                                        className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                                        title="تعيين كصورة رئيسية"
                                    >
                                        <Star className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removePhoto(index)}
                                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    title="حذف"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {/* Cover Badge */}
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" />
                                    الصورة الرئيسية
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
