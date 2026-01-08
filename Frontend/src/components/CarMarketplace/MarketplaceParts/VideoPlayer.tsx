import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface VideoPlayerProps {
    videoUrl?: string;
    thumbnail?: string;
    title?: string;
    className?: string;
}

/**
 * Video player component supporting YouTube and Vimeo
 * @param videoUrl - YouTube or Vimeo URL
 * @param thumbnail - Thumbnail image URL
 * @param title - Video title for accessibility
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoUrl,
    thumbnail,
    title = 'Car Video',
    className
}) => {
    const [isPlaying, setIsPlaying] = useState(false);

    if (!videoUrl) return null;

    // Extract video ID and platform
    const getEmbedUrl = (url: string): string | null => {
        // YouTube
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
        }

        // Vimeo
        const vimeoRegex = /vimeo\.com\/(\d+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
        }

        return null;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    if (!embedUrl) {
        return (
            <div className={cn('bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center', className)}>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    عذراً، رابط الفيديو غير صالح
                </p>
            </div>
        );
    }

    return (
        <div className={cn('relative aspect-video rounded-xl overflow-hidden bg-slate-900', className)}>
            <AnimatePresence>
                {!isPlaying ? (
                    <motion.div
                        key="thumbnail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 cursor-pointer group"
                        onClick={() => setIsPlaying(true)}
                    >
                        {/* Thumbnail */}
                        <img
                            src={thumbnail || `https://img.youtube.com/vi/${getEmbedUrl(videoUrl)?.split('/')[4]}/maxresdefault.jpg`}
                            alt={title}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-xl"
                            >
                                <Play className="w-10 h-10 text-slate-900 mr-1" fill="currentColor" />
                            </motion.div>
                        </div>

                        {/* Title */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                            <p className="text-white font-medium">{title}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0"
                    >
                        <iframe
                            src={embedUrl}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />

                        {/* Close button */}
                        <button
                            onClick={() => setIsPlaying(false)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10"
                            aria-label="Close video"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoPlayer;
