import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../../Icon';

const AuctionCommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />

                {/* Palette */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-darkcard rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[60vh]"
                >
                    <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                        <Icon name="Search" className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                            autoFocus
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <div className="text-xs font-mono text-gray-400 border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">ESC</div>
                    </div>

                    <div className="overflow-y-auto p-2">
                        <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2">Quick Actions</div>
                        <CommandItem icon="Plus" label="Create New Auction" shortcut="N" />
                        <CommandItem icon="CheckCircle" label="Approve Pending Cars" />
                        <CommandItem icon="Download" label="Export Weekly Report" />

                        <div className="text-xs font-bold text-gray-400 uppercase px-3 py-2 mt-2">Navigation</div>
                        <CommandItem icon="LayoutGrid" label="Go to Dashboard" />
                        <CommandItem icon="Users" label="Manage Users" />
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CommandItem: React.FC<{ icon: string, label: string, shortcut?: string }> = ({ icon, label, shortcut }) => (
    <div className="flex items-center justify-between px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer group transition-colors">
        <div className="flex items-center gap-3">
            <Icon name={icon as any} className="w-4 h-4 text-gray-500 group-hover:text-blue-500" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">{label}</span>
        </div>
        {shortcut && (
            <span className="text-xs font-mono text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded">
                {shortcut}
            </span>
        )}
    </div>
);

export default AuctionCommandPalette;
