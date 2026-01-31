import React from 'react';
import { motion } from 'framer-motion';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ProductCardProps {
    id: number;
    name: string;
    price: string;
    inStock: boolean;
    image?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    name,
    price,
    inStock,
    image
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-800",
                !inStock && "opacity-60"
            )}
        >
            {/* Product Image */}
            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Package className="w-8 h-8" />
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                {/* Name & Price */}
                <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 mb-1">
                        {name}
                    </h4>
                    <div className="text-lg font-bold text-primary">
                        {price}
                    </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-1.5 text-xs">
                    {inStock ? (
                        <>
                            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                                متوفر
                            </span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            <span className="text-red-600 dark:text-red-400 font-medium">
                                غير متوفر
                            </span>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
