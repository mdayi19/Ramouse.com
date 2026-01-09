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

    // Helper to determine embed strategy
    const getEmbedConfig = (url: string) => {
        // YouTube
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
        const youtubeMatch = url.match(youtubeRegex);
        if (youtubeMatch) {
            return {
                type: 'iframe',
                src: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`,
                aspect: 'aspect-video'
            };
        }

        // Vimeo
        const vimeoRegex = /vimeo\.com\/(\d+)/;
        const vimeoMatch = url.match(vimeoRegex);
        if (vimeoMatch) {
            return {
                type: 'iframe',
                src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
                aspect: 'aspect-video'
            };
        }

        // Facebook
        if (url.includes('facebook.com') || url.includes('fb.watch')) {
            return {
                type: 'iframe',
                src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=1`,
                aspect: 'aspect-square' // Facebook videos vary, safer default
            };
        }

        // Instagram
        if (url.includes('instagram.com')) {
            // Ensure URL ends with /embed
            const cleanUrl = url.split('?')[0].replace(/\/$/, '');
            return {
                type: 'iframe',
                src: `${cleanUrl}/embed`,
                aspect: 'aspect-[9/16]' // Reels are usually vertical
            };
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            const videoIdMatch = url.match(/video\/(\d+)/);
            if (videoIdMatch) {
                return {
                    type: 'tiktok',
                    id: videoIdMatch[1],
                    originalUrl: url
                };
            }
        }

        return null;
    };

    const config = getEmbedConfig(videoUrl);

    if (!config) {
        return (
            <div className={cn('bg-slate-100 dark:bg-slate-800 rounded-xl p-6 text-center', className)}>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    عذراً، تنسيق الفيديو غير مدعوم
                </p>
                <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                    مشاهدة الرابط الأصلي
                </a>
            </div>
        );
    }

    // TikTok Special Render
    if (isPlaying && config.type === 'tiktok') {
        // Inject script dynamically
        React.useEffect(() => {
            const script = document.createElement('script');
            script.src = "https://www.tiktok.com/embed.js";
            script.async = true;
            document.body.appendChild(script);
            return () => {
                try { document.body.removeChild(script); } catch (e) { }
            };
        }, []);

        return (
            <div className={cn('relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800', className)}>
                <button
                    onClick={() => setIsPlaying(false)}
                    className="absolute top-2 right-2 z-10 p-2 bg-slate-100/80 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 text-slate-600" />
                </button>
                <div className="flex justify-center items-center min-h-[300px]">
                    <blockquote
                        className="tiktok-embed"
                        cite={config.originalUrl}
                        data-video-id={config.id}
                        style={{ maxWidth: '605px', minWidth: '325px' }}
                    >
                        <section>
                            <a target="_blank" href={config.originalUrl}>
                                {title}
                            </a>
                        </section>
                    </blockquote>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(`relative rounded-xl overflow-hidden bg-black ${config.aspect || 'aspect-video'}`, className)}>
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
                        {/* Thumbnail - Try to use meaningful thumbnail or generic placeholder */}
                        <img
                            src={thumbnail || '/images/video-placeholder.png'}
                            onError={(e) => {
                                // Fallback if no thumbnail
                                e.currentTarget.src = 'https://placehold.co/600x400/1e293b/FFF?text=Video+Preview';
                            }}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />

                        {/* Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-xl backdrop-blur-sm"
                            >
                                <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="currentColor" />
                            </motion.div>
                        </div>

                        {/* Platform Badge */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-medium border border-white/10 uppercase">
                            {config.type === 'tiktok' ? 'TikTok' : config.src?.includes('facebook') ? 'Facebook' : config.src?.includes('instagram') ? 'Instagram' : 'Video'}
                        </div>

                        {/* Title */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-12">
                            <p className="text-white font-medium line-clamp-2 md:text-lg">{title}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="player"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black"
                    >
                        <iframe
                            src={config.src}
                            title={title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />

                        {/* Close button */}
                        <button
                            onClick={() => setIsPlaying(false)}
                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors z-10 transform hover:scale-110"
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
