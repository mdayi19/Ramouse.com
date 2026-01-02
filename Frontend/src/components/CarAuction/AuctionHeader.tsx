import React from 'react';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import { Badge } from '../ui/Badge';

interface AuctionHeaderProps {
    onBack: () => void;
    isImmersive: boolean;
    setIsImmersive: (value: boolean) => void;
    isAuthenticated: boolean;
    isInWatchlist: boolean;
    handleToggleWatchlist: () => void;
    watchlistLoading: boolean;
    isLive: boolean;
    participantsCount: number;
    setShowParticipantsList: (value: boolean) => void;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export const AuctionHeader: React.FC<AuctionHeaderProps> = ({
    onBack,
    isImmersive,
    setIsImmersive,
    isAuthenticated,
    isInWatchlist,
    handleToggleWatchlist,
    watchlistLoading,
    isLive,
    participantsCount,
    setShowParticipantsList,
    connectionStatus,
}) => {
    return (
        <div className={`bg-slate-900/80 backdrop-blur-xl border-b border-white/10 sticky z-50 ${connectionStatus !== 'connected' ? 'top-14' : 'top-0'}`}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="!text-white/70 hover:!text-white hover:!bg-white/10"
                >
                    <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
                    العودة
                </Button>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* Immersive Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsImmersive(!isImmersive)}
                        className={`!w-8 !h-8 md:!w-10 md:!h-10 rounded-xl transition-all ${isImmersive ? '!bg-white !text-black shadow-white/20' : '!bg-white/10 !text-white/50'}`}
                        title="وضع التركيز"
                    >
                        <Icon name={isImmersive ? "Minimize2" : "Maximize2"} className="w-4 h-4 md:w-5 md:h-5" />
                    </Button>
                    {/* Watchlist Toggle */}
                    {isAuthenticated && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleWatchlist}
                            disabled={watchlistLoading}
                            className={`!w-8 !h-8 md:!w-10 md:!h-10 rounded-xl transition-all ${isInWatchlist ? '!bg-red-500 !text-white shadow-lg shadow-red-500/20' : '!bg-white/10 !text-white/50 hover:!text-red-400'}`}
                        >
                            <Icon name="Heart" className={`w-4 h-4 md:w-5 md:h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
                        </Button>
                    )}
                    {/* Live Badge */}
                    {isLive && (
                        <Badge variant="destructive" className="animate-pulse flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 shadow-lg shadow-red-500/20">
                            <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 md:h-2.5 w-2 md:w-2.5 bg-white"></span>
                            </span>
                            <span className="hidden md:inline">مباشر</span>
                        </Badge>
                    )}

                    {/* Online Participants - Clickable */}
                    <button
                        onClick={() => setShowParticipantsList(true)}
                        className="flex items-center gap-1.5 md:gap-2 text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-2 md:px-3 py-1 md:py-1.5 rounded-xl backdrop-blur-sm text-xs md:text-sm transition-all"
                    >
                        <Icon name="Users" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="font-semibold">{participantsCount}</span>
                    </button>

                </div>
            </div>
        </div>
    );
};
