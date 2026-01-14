import React, { useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface VideoPlayerProps {
    videoUrl?: string;
    thumbnail?: string;
    title?: string;
    className?: string;
}

/**
 * Video player component - embeds YouTube, opens other platforms in new tab
 * @param videoUrl - Video URL (YouTube embeds, others open in new tab)
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

    // Check if URL is YouTube (the only platform we embed)
    const isYouTube = (url: string) => {
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
        return youtubeRegex.test(url);
    };

    // Get YouTube embed URL
    const getYouTubeEmbedUrl = (url: string) => {
        const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
        const match = url.match(youtubeRegex);
        if (match) {
            return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
        }
        return null;
    };

    // Get platform name for badge
    const getPlatformName = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
        if (url.includes('facebook.com') || url.includes('fb.watch')) return 'Facebook';
        if (url.includes('instagram.com')) return 'Instagram';
        if (url.includes('tiktok.com')) return 'TikTok';
        if (url.includes('vimeo.com')) return 'Vimeo';
        if (url.includes('twitter.com') || url.includes('x.com')) return 'X/Twitter';
        return 'Video';
    };

    const isYouTubeVideo = isYouTube(videoUrl);
    const platformName = getPlatformName(videoUrl);

    // Handle click - open in new tab for non-YouTube, play embed for YouTube
    const handlePlayClick = () => {
        if (isYouTubeVideo) {
            setIsPlaying(true);
        } else {
            // Open video in new tab
            window.open(videoUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div className={cn('relative rounded-xl overflow-hidden bg-black aspect-video', className)}>
            <AnimatePresence>
                {!isPlaying ? (
                    <motion.div
                        key="thumbnail"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 cursor-pointer group"
                        onClick={handlePlayClick}
                    >
                        {/* Thumbnail */}
                        <img
                            src={thumbnail || '/images/video-placeholder.png'}
                            onError={(e) => {
                                e.currentTarget.src = 'https://placehold.co/600x400/1e293b/FFF?text=Video+Preview';
                            }}
                            alt={title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                        />

                        {/* Play/Open Button - Top Left */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 shadow-xl border border-white/10"
                        >
                            {isYouTubeVideo ? (
                                <Play className="w-5 h-5 text-white" fill="currentColor" />
                            ) : (
                                <ExternalLink className="w-5 h-5 text-white" />
                            )}
                            <span className="text-white text-sm font-medium uppercase">{platformName}</span>
                        </motion.div>

                        {/* Title & Action Text */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-12">
                            <p className="text-white font-medium line-clamp-2 md:text-lg">{title}</p>
                            {!isYouTubeVideo && (
                                <p className="text-white/70 text-sm mt-1">
                                    انقر لفتح الفيديو في صفحة جديدة
                                </p>
                            )}
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
                            src={getYouTubeEmbedUrl(videoUrl) || ''}
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
