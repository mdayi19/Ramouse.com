/**
 * Universal Print Hook
 * Purpose: Unified hook for print/PDF functionality across all devices
 * Created: 2026-02-02
 */

import { useState, useCallback, useEffect, RefObject } from 'react';
import { getDeviceType, shouldUsePDFGeneration } from '../utils/deviceDetection';
import { downloadPDF, prepareElementForPDF, PDFOptions } from '../services/pdfGenerator';

export interface UsePrintOptions {
    elementRef: RefObject<HTMLElement>;
    filename?: string;
    pageSize?: 'A4' | 'A5' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    onComplete?: () => void;
    onError?: (error: Error) => void;
    autoDetectDevice?: boolean;
}

export interface UsePrintReturn {
    handlePrint: () => Promise<void>;
    isGenerating: boolean;
    progress: number;
    error: Error | null;
    deviceType: 'ios' | 'android' | 'desktop';
    isPDFMode: boolean;
}

/**
 * Universal print hook that works on all devices
 * Automatically detects device and chooses best print method
 */
export function usePrint(options: UsePrintOptions): UsePrintReturn {
    const {
        elementRef,
        filename = 'document.pdf',
        pageSize = 'A4',
        orientation = 'portrait',
        onComplete,
        onError,
        autoDetectDevice = true,
    } = options;

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<Error | null>(null);
    const [deviceType] = useState<'ios' | 'android' | 'desktop'>(() =>
        autoDetectDevice ? getDeviceType() : 'desktop'
    );
    const [isPDFMode] = useState(() =>
        autoDetectDevice ? shouldUsePDFGeneration() : false
    );

    /**
     * Handle print using window.print() (for Android/Desktop)
     */
    const handleNativePrint = useCallback(() => {
        try {
            // Reset scroll to top
            window.scrollTo(0, 0);
            if (elementRef.current) {
                elementRef.current.scrollTop = 0;
            }

            // Add afterprint event listener
            const afterPrintHandler = () => {
                window.removeEventListener('afterprint', afterPrintHandler);
                onComplete?.();
            };

            window.addEventListener('afterprint', afterPrintHandler);

            // Delay to ensure rendering is complete
            setTimeout(() => {
                window.print();
            }, 100);

            setError(null);
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Print failed');
            setError(error);
            onError?.(error);
        }
    }, [elementRef, onComplete, onError]);

    /**
     * Handle PDF generation (for iOS)
     */
    const handlePDFGeneration = useCallback(async () => {
        if (!elementRef.current) {
            const error = new Error('Element not found');
            setError(error);
            onError?.(error);
            return;
        }

        setIsGenerating(true);
        setProgress(0);
        setError(null);

        try {
            // Step 1: Prepare element (wait for images/canvases)
            setProgress(20);
            await prepareElementForPDF(elementRef.current);

            // Step 2: Generate PDF
            setProgress(50);

            const pdfOptions: PDFOptions = {
                filename,
                pageSize,
                orientation,
                quality: 0.95,
                imageQuality: 0.95,
            };

            await downloadPDF(elementRef.current, filename, pdfOptions);

            // Step 3: Complete
            setProgress(100);
            setIsGenerating(false);
            onComplete?.();

            // Reset progress after delay
            setTimeout(() => setProgress(0), 1000);
        } catch (err) {
            console.error('PDF generation error:', err);
            const error = err instanceof Error ? err : new Error('PDF generation failed');
            setError(error);
            setIsGenerating(false);
            setProgress(0);
            onError?.(error);

            // Fallback to native print if PDF generation fails
            console.log('Falling back to native print...');
            handleNativePrint();
        }
    }, [elementRef, filename, pageSize, orientation, onComplete, onError, handleNativePrint]);

    /**
     * Main print handler - chooses method based on device
     */
    const handlePrint = useCallback(async () => {
        if (isPDFMode) {
            await handlePDFGeneration();
        } else {
            handleNativePrint();
        }
    }, [isPDFMode, handlePDFGeneration, handleNativePrint]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Clean up any event listeners
            window.removeEventListener('afterprint', () => { });
        };
    }, []);

    return {
        handlePrint,
        isGenerating,
        progress,
        error,
        deviceType,
        isPDFMode,
    };
}

/**
 * Simple print hook for components that just need window.print()
 * Use this for components that don't need PDF generation
 */
export function useSimplePrint(onComplete?: () => void): () => void {
    return useCallback(() => {
        const afterPrintHandler = () => {
            window.removeEventListener('afterprint', afterPrintHandler);
            onComplete?.();
        };

        window.addEventListener('afterprint', afterPrintHandler);

        setTimeout(() => {
            window.print();
        }, 100);
    }, [onComplete]);
}
