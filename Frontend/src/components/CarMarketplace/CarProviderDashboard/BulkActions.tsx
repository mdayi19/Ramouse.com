import React, { useState } from 'react';
import { Edit2, Eye, EyeOff, Trash2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CarListing } from '../../../services/carprovider.service';

interface BulkActionsProps {
    selectedListings: number[];
    onHide: (ids: number[]) => void;
    onShow: (ids: number[]) => void;
    onDelete: (ids: number[]) => void;
    className?: string;
}

/**
 * Bulk actions toolbar for managing multiple listings
 * @param selectedListings - Array of selected listing IDs
 * @param onHide - Callback to hide listings
 * @param onShow - Callback to show listings
 * @param onDelete - Callback to delete listings
 */
export const BulkActions: React.FC<BulkActionsProps> = ({
    selectedListings,
    onHide,
    onShow,
    onDelete,
    className
}) => {
    if (selectedListings.length === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 ${className}`}
            >
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary">
                            {selectedListings.length} محدد
                        </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onShow(selectedListings)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">إظهار</span>
                        </button>

                        <button
                            onClick={() => onHide(selectedListings)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <EyeOff className="w-4 h-4" />
                            <span className="text-sm font-medium">إخفاء</span>
                        </button>

                        <button
                            onClick={() => onDelete(selectedListings)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm font-medium">حذف</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

interface QuickEditProps {
    listing: CarListing;
    onSave: (id: number, newPrice: number) => void;
    onCancel: () => void;
}

/**
 * Quick edit modal for updating listing price
 * @param listing - Listing to edit
 * @param onSave - Callback when price is saved
 * @param onCancel - Callback when edit is cancelled
 */
export const QuickEditPrice: React.FC<QuickEditProps> = ({
    listing,
    onSave,
    onCancel
}) => {
    const [price, setPrice] = useState(listing.price || 0);

    const handleSave = () => {
        onSave(listing.id, price);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full"
            >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    تعديل السعر
                </h3>

                <div className="mb-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        {listing.title}
                    </p>
                    <div className="relative">
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-lg font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            autoFocus
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                            ل.س
                        </span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                        حفظ
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export { BulkActions as default };
