
import React, { useCallback, useState, useEffect } from 'react';

interface ImageUploadProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ files, setFiles, maxFiles = 10, maxSizeMB = 5 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fileLimitReached = files.length >= maxFiles;

  // Effect to handle index changes when the file list is modified
  useEffect(() => {
    if (files.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= files.length) {
      setCurrentIndex(Math.max(0, files.length - 1));
    }
  }, [files]);

  const processAndSetFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`لا يمكن تحميل أكثر من ${maxFiles} صور.`);
    }

    const validFiles = newFiles.filter(file => {
      const isTooLarge = file.size > maxSizeMB * 1024 * 1024;
      if (isTooLarge) {
        alert(`حجم الملف ${file.name} كبير جدًا. الحد الأقصى هو ${maxSizeMB}MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const combined = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(combined);

      if (files.length === 0 && combined.length > 0) {
        setCurrentIndex(0);
      } else if (newFiles.length > 0) {
        setCurrentIndex(files.length);
      }
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        processAndSetFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (fileLimitReached) {
      alert(`لا يمكن تحميل أكثر من ${maxFiles} صور.`);
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndSetFiles(Array.from(e.dataTransfer.files));
    }
  }, [files, setFiles, fileLimitReached, maxFiles, maxSizeMB]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging && !fileLimitReached) setIsDragging(true);
  }, [isDragging, fileLimitReached]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? files.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === files.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  }


  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex justify-center items-center w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          fileLimitReached
            ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 cursor-not-allowed'
            : isDragging 
            ? 'border-primary bg-primary-50 dark:bg-primary-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input 
            id="file-upload" 
            name="file-upload" 
            type="file" 
            className={`absolute inset-0 w-full h-full opacity-0 z-10 ${fileLimitReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            multiple 
            onChange={handleFileChange} 
            accept="image/*" 
            disabled={fileLimitReached} 
        />
        <div className="space-y-1 text-center pointer-events-none">
          <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
            <span className={`font-medium text-primary ${fileLimitReached ? 'text-slate-400' : ''}`}>
              {fileLimitReached ? 'تم الوصول للحد الأقصى' : 'اضغط لرفع صور'}
            </span>
            <p className="ps-1 hidden sm:block">{fileLimitReached ? '' : 'أو اسحب وأفلت'}</p>
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, GIF (الحد الأقصى: {maxFiles} صور, {maxSizeMB}MB/صورة)</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">الصور المرفوعة: {files.length} / {maxFiles}</h4>
          
          {/* Main Image Viewer */}
          <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden mb-2">
             <img 
                src={URL.createObjectURL(files[currentIndex])} 
                alt={`preview ${currentIndex}`} 
                className="w-full h-full object-contain" 
              />
              
              {/* Navigation Buttons */}
              {files.length > 1 && (
                <>
                  <button onClick={goToPrevious} aria-label="Previous image" className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/75 transition-colors z-10">
                    &#10094;
                  </button>
                  <button onClick={goToNext} aria-label="Next image" className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/75 transition-colors z-10">
                    &#10095;
                  </button>
                </>
              )}
              
              {/* Remove Button */}
              <button 
                onClick={() => removeFile(currentIndex)} 
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600 transition-colors z-10"
                aria-label="Remove image"
              >
                &times;
              </button>
          </div>
          
          {/* Thumbnails */}
          {files.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md">
              {files.map((file, index) => (
                <button 
                  key={index} 
                  className={`border-2 rounded-md transition-colors w-16 h-16 overflow-hidden ${currentIndex === index ? 'border-primary' : 'border-transparent'}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name} 
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
