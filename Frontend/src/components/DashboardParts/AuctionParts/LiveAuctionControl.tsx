import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';
import { Button } from '../../ui/Button';

interface LiveAuction {
    id: string;
    title: string;
    currentBid: number;
    timeRemaining: string; // "12:30"
    bidders: number;
}

interface LiveAuctionControlProps {
    /** Callback when emergency stop is triggered */
    onEmergencyStop?: () => Promise<void>;
    /** Callback when view auction is clicked */
    onViewAuction?: (auctionId: string) => void;
    /** Callback when extend auction is clicked */
    onExtendAuction?: (auctionId: string) => void;
    /** Toast notification function */
    showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    /** Optional external live auctions data */
    liveAuctions?: LiveAuction[];
}

const LiveAuctionControl: React.FC<LiveAuctionControlProps> = ({
    onEmergencyStop,
    onViewAuction,
    onExtendAuction,
    showToast,
    liveAuctions: externalAuctions,
}) => {
    // Use external data if provided, otherwise use internal state
    const [internalAuctions] = useState<LiveAuction[]>([]);
    const liveAuctions = externalAuctions ?? internalAuctions;
    const [isStoppingAll, setIsStoppingAll] = useState(false);

    const handleEmergencyPause = async () => {
        if (onEmergencyStop) {
            setIsStoppingAll(true);
            try {
                await onEmergencyStop();
                showToast?.('تم إيقاف جميع المزادات بنجاح', 'success');
            } catch (error) {
                showToast?.('فشل في إيقاف المزادات', 'error');
            } finally {
                setIsStoppingAll(false);
            }
        } else {
            showToast?.('وظيفة الإيقاف غير متاحة', 'info');
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-lg animate-pulse">
                            <Icon name="Radio" className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">غرفة التحكم المباشرة</h3>
                            <p className="text-xs text-gray-400 font-medium">{liveAuctions.length} مزاد نشط</p>
                        </div>
                    </div>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={handleEmergencyPause}
                        disabled={isStoppingAll || liveAuctions.length === 0}
                        isLoading={isStoppingAll}
                        className="bg-red-500/10 hover:bg-red-500 border border-red-500/50 text-red-200 hover:text-white"
                    >
                        <Icon name="PauseCircle" className="w-4 h-4 ml-2" />
                        إيقاف طوارئ
                    </Button>
                </div>

                {/* Ticker List */}
                <div className="space-y-3">
                    {liveAuctions.map(auction => (
                        <div key={auction.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${parseInt(auction.timeRemaining) < 1 ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500/20 text-green-400'}`}>
                                    {auction.timeRemaining}
                                </span>
                                <span className="font-bold truncate">{auction.title}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-gray-400 text-xs font-mono">{auction.bidders} مزايد</span>
                                <span className="font-mono font-bold text-green-400">${auction.currentBid.toLocaleString()}</span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className="p-1.5 hover:bg-white/10 rounded-lg"
                                        title="عرض"
                                        onClick={() => onViewAuction?.(auction.id)}
                                    >
                                        <Icon name="Eye" className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-yellow-400"
                                        title="تمديد الوقت"
                                        onClick={() => onExtendAuction?.(auction.id)}
                                    >
                                        <Icon name="Clock" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {liveAuctions.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            لا توجد مزادات مباشرة حالياً
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveAuctionControl;

