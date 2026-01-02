import React from 'react';
import { Loader2, Upload, X, Video } from 'lucide-react';

interface AuctionFormMediaProps {
    formData: any;
    updateFormData: (data: any) => void;
    handleRemoveImage: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    isDragging: boolean;
    uploadingImages: boolean;
    mode?: 'admin' | 'user';
}

export const AuctionFormMedia: React.FC<AuctionFormMediaProps> = ({
    formData,
    updateFormData,
    handleRemoveImage,
    fileInputRef,
    handleImageChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
    uploadingImages,
    mode
}) => {
    return (
        <div className="space-y-6">
            <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    {uploadingImages ? (
                        <Loader2 className="animate-spin text-blue-600" size={28} />
                    ) : (
                        <Upload className="text-blue-600" size={28} />
                    )}
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {isDragging ? 'أفلت الصور هنا' : 'اضغط للرفع أو اسحب الصور'}
                </h4>
                <p className="text-sm text-gray-500">
                    الحد الأقصى 20 ميجابايت • JPG, PNG
                    {mode === 'user' && <span className="text-red-500 mr-1 block mt-1 font-medium">* مطلوب 3 صور على الأقل</span>}
                </p>
            </div>

            {formData.media.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in duration-500">
                    {formData.media.images.map((url: string, idx: number) => (
                        <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                            <img
                                src={url}
                                alt={`Car ${idx}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx); }}
                                    className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            {idx === 0 && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md shadow-sm">
                                    الرئيسية
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1.5">رابط فيديو يوتيوب (اختياري)</label>
                <div className="relative">
                    <Video className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="url"
                        value={formData.media.videos?.[0] || ''}
                        onChange={e => updateFormData({
                            ...formData,
                            media: { ...formData.media, videos: e.target.value ? [e.target.value] : [] }
                        })}
                        className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-red-500 focus:ring-4 focus:ring-red-50/50 dark:focus:ring-red-900/20 transition-all font-mono text-sm"
                        placeholder="https://youtu.be/..."
                    />
                </div>
            </div>
        </div>
    );
};
