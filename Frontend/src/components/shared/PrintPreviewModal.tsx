import React, { useRef, useEffect, useState } from 'react';
import { Download, Printer, X, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrintPreviewModalProps {
    title: string;
    onClose: () => void;
    onPrint: () => void;
    onDownloadPdf: () => void;
    isGeneratingPdf: boolean;
    isReadyForPrint: boolean;
    children: React.ReactNode;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
    title,
    onClose,
    onPrint,
    onDownloadPdf,
    isGeneratingPdf,
    isReadyForPrint,
    children
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Dynamic Scale Calculation
    useEffect(() => {
        const calculateScale = () => {
            if (!containerRef.current) return;

            // A4 Width in pixels at 96 DPI is ~794px (210mm)
            const A4_WIDTH_PX = 794;
            const PADDING = 32; // 16px padding on each side

            // Get available width from window or container parent
            const availableWidth = window.innerWidth - PADDING;

            // Calculate scale to fit A4 width into available width
            // Max scale is 1 (don't scale up on large screens)
            const newScale = Math.min(1, availableWidth / A4_WIDTH_PX);

            setScale(newScale);
        };

        // Initial Calc
        calculateScale();

        // Listen for resize
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    // Wrapper to ensure scroll is reset before printing
    const handlePrintClick = () => {
        // Reset scroll positions to ensure full content is captured from the top
        window.scrollTo(0, 0);
        if (containerRef.current) {
            containerRef.current.scrollTop = 0;
        }

        // Small timeout to allow potential layout updates (optional but safe)
        setTimeout(() => {
            onPrint();
        }, 10);
    };

    // Print Styles Injection
    const printStyles = `
        @media print {
            @page { 
                size: A4 portrait; 
                margin: 0; 
            }
            html, body { 
                height: 297mm !important; 
                width: 210mm !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                overflow: hidden !important; 
            }
            body * { 
                visibility: hidden; 
            }
            .printable-area, .printable-area * { 
                visibility: visible; 
            }
            .printable-area { 
                position: absolute; 
                top: 0; 
                left: 0 !important; 
                width: 210mm !important; 
                height: 297mm !important; 
                max-height: 297mm !important;
                margin: 0; 
                padding: 0; 
                background: white; 
                z-index: 99999; 
                overflow: hidden !important;
            }
            .printable-area > div { 
                transform: none !important; 
                width: 100% !important; 
                height: 100% !important;
            }
            .print-hidden { 
                display: none !important; 
            }
        }
    `;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center z-[100] p-4 print:p-0 print:bg-white overflow-hidden"
            onClick={onClose}
        >
            <style>{printStyles}</style>

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[210mm] flex flex-col gap-0 max-h-full"
            >
                {/* Header */}
                <div className="w-full bg-white dark:bg-slate-800 p-4 rounded-t-2xl shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4 print-hidden z-50 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <div className="text-center sm:text-right">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            جاهز للطباعة بحجم A4
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-center bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-xl">
                        <button
                            onClick={onDownloadPdf}
                            disabled={isGeneratingPdf || !isReadyForPrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-sm px-4 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                        >
                            {isGeneratingPdf ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={handlePrintClick}
                            disabled={!isReadyForPrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            <span>طباعة</span>
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 sm:static w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview Area */}
                <div
                    ref={containerRef}
                    className="printable-area w-full flex-grow overflow-y-auto bg-gray-100/50 dark:bg-black/50 backdrop-blur-sm px-4 py-8 rounded-b-2xl shadow-inner custom-scrollbar flex justify-center items-start sticky-scrollbar print:overflow-visible print:bg-white print:p-0"
                >
                    <div
                        className="relative shadow-2xl bg-white transition-transform duration-300 origin-top flex-shrink-0"
                        style={{
                            width: '210mm',
                            height: '297mm',
                            transform: `scale(${scale})`,
                            marginBottom: `${(297 * scale) - 297}mm` // Adjust margin to reduce whitespace below scaled element
                        }}
                    >
                        {children}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
