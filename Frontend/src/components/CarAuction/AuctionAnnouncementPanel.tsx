import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import Icon from '../Icon';
import * as auctionService from '../../services/auction.service';

interface AuctionAnnouncementPanelProps {
    auctionId: string;
    auctionTitle: string;
    isLive: boolean;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    onClose?: () => void;
}

type AnnouncementType = 'info' | 'warning' | 'going_once' | 'going_twice' | 'sold';

interface QuickMessage {
    type: AnnouncementType;
    label: string;
    message: string;
    icon: string;
    color: string;
}

const quickMessages: QuickMessage[] = [
    { type: 'going_once', label: 'المرة الأولى', message: 'المرة الأولى! 🔨', icon: 'Hammer', color: 'bg-yellow-500' },
    { type: 'going_twice', label: 'المرة الثانية', message: 'المرة الثانية! 🔨🔨', icon: 'Hammer', color: 'bg-orange-500' },
    { type: 'sold', label: 'بيعت!', message: 'بيعت! 🎉', icon: 'Check', color: 'bg-green-500' },
    { type: 'warning', label: 'تنبيه', message: 'تبقى وقت قليل!', icon: 'AlertTriangle', color: 'bg-red-500' },
];

export const AuctionAnnouncementPanel: React.FC<AuctionAnnouncementPanelProps> = ({
    auctionId,
    auctionTitle,
    isLive,
    showToast,
    onClose,
}) => {
    const [customMessage, setCustomMessage] = useState('');
    const [selectedType, setSelectedType] = useState<AnnouncementType>('info');
    const [sending, setSending] = useState(false);

    const sendAnnouncement = async (message: string, type: AnnouncementType) => {
        if (!message.trim()) {
            showToast('الرجاء كتابة رسالة', 'error');
            return;
        }

        try {
            setSending(true);
            await auctionService.announceAuction(auctionId, message, type);
            showToast('تم إرسال الإعلان بنجاح', 'success');
            setCustomMessage('');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'فشل إرسال الإعلان', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleQuickMessage = (quick: QuickMessage) => {
        sendAnnouncement(quick.message, quick.type);
    };

    const handleCustomSend = () => {
        sendAnnouncement(customMessage, selectedType);
    };

    if (!isLive) {
        return (
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 text-center">
                <Icon name="Radio" className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-bold">
                    الإعلانات متاحة فقط للمزادات المباشرة
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-darkcard rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Icon name="Megaphone" className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">إعلانات المزاد</h3>
                        <p className="text-white/80 text-sm">{auctionTitle}</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <Icon name="X" className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className="p-5 space-y-5">
                {/* Quick Messages */}
                <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Icon name="Zap" className="w-4 h-4" />
                        رسائل سريعة
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        {quickMessages.map((quick) => (
                            <motion.button
                                key={quick.type}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickMessage(quick)}
                                disabled={sending}
                                className={`${quick.color} text-white rounded-xl p-4 flex items-center gap-3 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50`}
                            >
                                <Icon name={quick.icon as any} className="w-6 h-6" />
                                <span>{quick.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400 font-bold">أو</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Custom Message */}
                <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <Icon name="Edit3" className="w-4 h-4" />
                        رسالة مخصصة
                    </p>

                    {/* Type Selector */}
                    <div className="flex gap-2 mb-3">
                        {(['info', 'warning'] as AnnouncementType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedType === type
                                        ? type === 'warning'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {type === 'info' ? 'معلومات' : 'تنبيه'}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            placeholder="اكتب رسالتك هنا..."
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSend()}
                        />
                        <Button
                            variant="primary"
                            onClick={handleCustomSend}
                            disabled={sending || !customMessage.trim()}
                            className="px-6"
                        >
                            {sending ? (
                                <Icon name="Loader" className="w-5 h-5 animate-spin" />
                            ) : (
                                <Icon name="Send" className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Live Indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    الرسائل تُرسل مباشرة لجميع المشاركين
                </div>
            </div>
        </motion.div>
    );
};

export default AuctionAnnouncementPanel;
