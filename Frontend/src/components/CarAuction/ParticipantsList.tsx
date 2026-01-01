import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon';

interface Participant {
    id: string | number;
    name?: string;
    isOnline: boolean;
    lastSeen?: Date;
}

interface ParticipantsListProps {
    /** Total number of participants */
    totalParticipants: number;
    /** List of online participants (optional for presence feature) */
    onlineParticipants?: Participant[];
    /** Show detailed list or just count */
    showList?: boolean;
    /** Compact mode */
    compact?: boolean;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
    totalParticipants,
    onlineParticipants = [],
    showList = false,
    compact = false,
}) => {
    const onlineCount = onlineParticipants.filter(p => p.isOnline).length;

    const getParticipantDisplay = (name: string | undefined, id: string | number) => {
        if (!name) return `مشارك ${id}`;
        // Privacy: show first letter + ***
        return `${name.charAt(0)}***`;
    };

    if (compact) {
        return (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                <div className="relative flex items-center">
                    <Icon name="Users" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    {onlineCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    )}
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {totalParticipants}
                </span>
                {onlineCount > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        ({onlineCount} متصل)
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon name="Users" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-bold text-slate-800 dark:text-white">
                            المشاركون
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {onlineCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                    {onlineCount} متصل
                                </span>
                            </div>
                        )}
                        <span className="text-lg font-black text-slate-700 dark:text-slate-300">
                            {totalParticipants}
                        </span>
                    </div>
                </div>
            </div>

            {/* Participants List */}
            {showList && onlineParticipants.length > 0 ? (
                <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    <AnimatePresence>
                        {onlineParticipants.slice(0, 10).map((participant, index) => (
                            <motion.div
                                key={participant.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                        {getParticipantDisplay(participant.name, participant.id).charAt(0)}
                                    </div>
                                    {/* Online Indicator */}
                                    {participant.isOnline && (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-darkcard rounded-full" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                        {getParticipantDisplay(participant.name, participant.id)}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {participant.isOnline ? (
                                            <span className="text-emerald-600 dark:text-emerald-400">نشط الآن</span>
                                        ) : (
                                            participant.lastSeen && `آخر تواجد: ${new Date(participant.lastSeen).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`
                                        )}
                                    </p>
                                </div>

                                {/* Activity Indicator */}
                                {participant.isOnline && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Icon name="Activity" className="w-4 h-4 text-emerald-500" />
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {onlineParticipants.length > 10 && (
                        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
                            +{onlineParticipants.length - 10} مشارك آخر
                        </p>
                    )}
                </div>
            ) : (
                <div className="p-6 text-center">
                    <Icon name="Users" className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {totalParticipants > 0
                            ? `${totalParticipants} مشارك مسجل في هذا المزاد`
                            : 'لا يوجد مشاركون بعد'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default ParticipantsList;
