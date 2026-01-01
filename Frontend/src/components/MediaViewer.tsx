import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { GalleryItem } from '../types';

interface MediaViewerProps {
    items: GalleryItem[];
    activeIndex: number;
    onClose: () => void;
    onIndexChange: (index: number) => void;
}

/**
 * MediaViewer Component
 * Full-screen media viewer with advanced video controls and gallery navigation
 */
const MediaViewer: React.FC<MediaViewerProps> = ({ items, activeIndex, onClose, onIndexChange }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const currentItem = items[activeIndex];
    const isVideo = currentItem?.type === 'video';

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && activeIndex > 0) onIndexChange(activeIndex - 1);
            if (e.key === 'ArrowRight' && activeIndex < items.length - 1) onIndexChange(activeIndex + 1);
            if (e.key === ' ' && isVideo) {
                e.preventDefault();
                togglePlayPause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, items.length, isVideo]);

    // Reset video state when changing media
    useEffect(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    }, [activeIndex]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const handleEnded = () => setIsPlaying(false);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [activeIndex]);

    // Auto-hide controls for videos
    useEffect(() => {
        if (!isVideo || !isPlaying) return;

        const hideControls = () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        hideControls();
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [isVideo, isPlaying]);

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying && isVideo) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        if (newVolume === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const goToPrevious = () => {
        if (activeIndex > 0) onIndexChange(activeIndex - 1);
    };

    const goToNext = () => {
        if (activeIndex < items.length - 1) onIndexChange(activeIndex + 1);
    };

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={onClose}
            onMouseMove={handleMouseMove}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className={`absolute top-4 right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md ${showControls || !isVideo ? 'opacity-100' : 'opacity-0'}`}
                aria-label="Close"
            >
                <Icon name="X" className="w-6 h-6" />
            </button>

            {/* Counter */}
            <div className={`absolute top-4 left-4 z-50 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white font-medium text-sm transition-opacity ${showControls || !isVideo ? 'opacity-100' : 'opacity-0'}`}>
                {activeIndex + 1} / {items.length}
            </div>

            {/* Navigation Buttons */}
            {activeIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md hover:scale-110 ${showControls || !isVideo ? 'opacity-100' : 'opacity-0'}`}
                    aria-label="Previous"
                >
                    <Icon name="ChevronRight" className="w-8 h-8" />
                </button>
            )}

            {activeIndex < items.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); goToNext(); }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md hover:scale-110 ${showControls || !isVideo ? 'opacity-100' : 'opacity-0'}`}
                    aria-label="Next"
                >
                    <Icon name="ChevronLeft" className="w-8 h-8" />
                </button>
            )}

            {/* Media Content */}
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                {isVideo ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <video
                            ref={videoRef}
                            src={currentItem.data}
                            className="max-w-full max-h-[calc(90vh-120px)] rounded-lg shadow-2xl cursor-pointer"
                            onClick={togglePlayPause}
                        />

                        {/* Video Controls */}
                        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 rounded-b-lg transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                            {/* Progress Bar */}
                            <div className="mb-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 0}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer 
                                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-lg"
                                    style={{
                                        background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`
                                    }}
                                />
                                <div className="flex justify-between text-white text-xs mt-2 font-medium px-1">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(duration)}</span>
                                </div>
                            </div>

                            {/* Control Buttons */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Play/Pause */}
                                    <button
                                        onClick={togglePlayPause}
                                        className="p-2.5 rounded-full hover:bg-white/20 text-white transition-all hover:scale-110"
                                        aria-label={isPlaying ? 'Pause' : 'Play'}
                                    >
                                        <Icon name={isPlaying ? 'Pause' : 'Play'} className="w-6 h-6" />
                                    </button>

                                    {/* Volume */}
                                    <div className="flex items-center gap-2 group">
                                        <button
                                            onClick={toggleMute}
                                            className="p-2 rounded-full hover:bg-white/20 text-white transition-all"
                                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                                        >
                                            <Icon name={isMuted || volume === 0 ? 'VolumeX' : volume < 0.5 ? 'Volume1' : 'Volume2'} className="w-5 h-5" />
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={isMuted ? 0 : volume}
                                            onChange={handleVolumeChange}
                                            className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity
                                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                                                [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Fullscreen */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-2 rounded-full hover:bg-white/20 text-white transition-all hover:scale-110"
                                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                >
                                    <Icon name={isFullscreen ? 'Minimize' : 'Maximize'} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Play Overlay (when paused) */}
                        {!isPlaying && showControls && (
                            <button
                                onClick={togglePlayPause}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-all hover:scale-110 animate-fade-in"
                                aria-label="Play"
                            >
                                <Icon name="Play" className="w-20 h-20 text-white ml-2" />
                            </button>
                        )}
                    </div>
                ) : (
                    <img
                        src={currentItem?.data}
                        alt="Product media"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                )}
            </div>

            {/* Thumbnails */}
            {items.length > 1 && (
                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 p-3 rounded-full bg-white/10 backdrop-blur-md max-w-[90vw] overflow-x-auto no-scrollbar transition-opacity ${showControls || !isVideo ? 'opacity-100' : 'opacity-0'}`}>
                    {items.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); onIndexChange(idx); }}
                            className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${idx === activeIndex
                                    ? 'border-white ring-2 ring-white/50 scale-110'
                                    : 'border-white/30 hover:border-white/60 opacity-60 hover:opacity-100'
                                }`}
                        >
                            {item.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/50">
                                    <Icon name="Play" className="w-6 h-6 text-white" />
                                </div>
                            ) : (
                                <img src={item.data} alt="" className="w-full h-full object-cover" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MediaViewer;

