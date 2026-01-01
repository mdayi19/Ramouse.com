
import React, { useCallback, useState } from 'react';
import Icon from './Icon';

interface MediaUploadProps {
  files: File[];
  setFiles: (files: File[]) => void;
  maxFiles?: number;
  maxImageSizeMB?: number;
  maxVideoSizeMB?: number;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ files, setFiles, maxFiles = 10, maxImageSizeMB = 5, maxVideoSizeMB = 25 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileLimitReached = files.length >= maxFiles;

  const processFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
        alert(`لا يمكن تحميل أكثر من ${maxFiles} ملفات.`);
    }

    const validFiles = newFiles.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage) {
        const isTooLarge = file.size > maxImageSizeMB * 1024 * 1024;
        if (isTooLarge) {
          alert(`حجم الصورة ${file.name} كبير جدًا. الحد الأقصى هو ${maxImageSizeMB}MB.`);
          return false;
        }
      } else if (isVideo) {
        const isTooLarge = file.size > maxVideoSizeMB * 1024 * 1024;
        if (isTooLarge) {
          alert(`حجم الفيديو ${file.name} كبير جدًا. الحد الأقصى هو ${maxVideoSizeMB}MB.`);
          return false;
        }
      } else {
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const combined = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(combined);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      processFiles(droppedFiles.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/')));
    }
  }, [files, maxFiles, setFiles, maxImageSizeMB, maxVideoSizeMB]);

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

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex justify-center items-center w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors duration-300 ${
          fileLimitReached ? 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800 cursor-not-allowed'
          : isDragging ? 'border-primary bg-primary-50 dark:bg-primary-900/20' 
          : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input 
            id="media-upload" 
            name="media-upload" 
            type="file" 
            className={`absolute inset-0 w-full h-full opacity-0 z-10 ${fileLimitReached ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            multiple 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            disabled={fileLimitReached} 
        />
        <div className="space-y-1 text-center pointer-events-none">
          <Icon name="CloudUpload" className="mx-auto h-12 w-12 text-slate-400" />
          <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
            <span className={`font-medium text-primary ${fileLimitReached ? 'text-slate-400' : ''}`}>
              {fileLimitReached ? 'تم الوصول للحد الأقصى' : 'اضغط لرفع ملفات'}
            </span>
            <p className="ps-1 hidden sm:block">{fileLimitReached ? '' : 'أو اسحب وأفلت'}</p>
          </div>
          <p className="text-xs text-slate-500">صور (حتى {maxImageSizeMB}MB) أو فيديوهات (حتى {maxVideoSizeMB}MB). الحد الأقصى: {maxFiles} ملفات.</p>
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">الملفات المحددة: {files.length} / {maxFiles}</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {files.map((file, index) => (
              <div key={index} className="relative group aspect-square">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <div className="w-full h-full relative bg-black rounded-md">
                     <video src={URL.createObjectURL(file)} className="w-full h-full object-contain rounded-md" />
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                         <Icon name="PlayCircle" className="w-8 h-8 text-white/80" />
                     </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10 shadow-md"
                  aria-label="Remove file"
                >&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
