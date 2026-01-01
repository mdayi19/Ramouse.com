import React from 'react';
import { Badge } from '../ui/Badge';
import Icon from '../Icon';

interface AuctionStatusBadgeProps {
    status: string;
    isLive?: boolean;
    className?: string;
}

export const AuctionStatusBadge: React.FC<AuctionStatusBadgeProps> = ({ status, isLive, className }) => {
    switch (status) {
        case 'live':
        case 'extended':
            return (
                <Badge variant="destructive" className={`shadow-lg bg-red-600 border-0 flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    <span className="font-bold text-[10px] tracking-wide text-white">مباشر</span>
                </Badge>
            );
        case 'scheduled':
            return (
                <Badge variant="info" className={`bg-blue-600 border-0 text-white shadow-lg flex items-center gap-1.5 px-2.5 py-1 ${className}`}>
                    <Icon name="Clock" className="w-3 h-3" />
                    <span className="font-bold text-[10px] tracking-wide">قريباً</span>
                </Badge>
            );
        case 'ended':
            return <Badge variant="secondary" className={`px-2.5 py-1 font-bold text-[10px] ${className}`}>انتهى</Badge>;
        case 'completed':
            return <Badge variant="success" className={`px-2.5 py-1 font-bold text-[10px] ${className}`}>تم البيع</Badge>;
        default:
            return null;
    }
};
