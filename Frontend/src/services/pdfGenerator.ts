/**
 * PDF Generator Service
 * Purpose: Generate PDFs from HTML elements using html2pdf.js
 * Created: 2026-02-02
 */

import html2pdf from 'html2pdf.js';

export interface PDFOptions {
    filename?: string;
    pageSize?: 'A4' | 'A5' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margin?: number | [number, number, number, number];
    quality?: number;
    imageQuality?: number;
}

/**
 * Default PDF options
 */
const DEFAULT_OPTIONS: PDFOptions = {
    filename: 'document.pdf',
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 10,
    quality: 0.95,
    imageQuality: 0.95,
};

/**
 * Generate PDF from an HTML element
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise that resolves when PDF is generated
 */
export async function generatePDF(
    element: HTMLElement,
    options: PDFOptions = {}
): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const html2pdfOptions = {
        margin: opts.margin,
        filename: opts.filename,
        image: {
            type: 'jpeg' as const,
            quality: opts.imageQuality
        },
        html2canvas: {
            scale: 2, // Higher quality
            useCORS: true, // Load external images
            logging: false,
            letterRendering: true,
            allowTaint: false,
        },
        jsPDF: {
            unit: 'mm',
            format: opts.pageSize?.toLowerCase() || 'a4',
            orientation: opts.orientation || 'portrait',
            compress: true,
        },
        pagebreak: {
            mode: ['avoid-all', 'css', 'legacy'],
            before: '.page-break-before',
            after: '.page-break-after',
            avoid: '.page-break-avoid'
        },
    };

    try {
        await html2pdf().set(html2pdfOptions).from(element).save();
    } catch (error) {
        console.error('PDF generation failed:', error);
        throw new Error('Failed to generate PDF. Please try again.');
    }
}

/**
 * Download PDF from an HTML element
 * @param element - The HTML element to convert to PDF
 * @param filename - Name of the PDF file
 * @param options - PDF generation options
 */
export async function downloadPDF(
    element: HTMLElement,
    filename: string,
    options: PDFOptions = {}
): Promise<void> {
    return generatePDF(element, {
        ...options,
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    });
}

/**
 * Get PDF as Blob (for sharing or custom handling)
 * @param element - The HTML element to convert to PDF
 * @param options - PDF generation options
 * @returns Promise that resolves with PDF Blob
 */
export async function getPDFBlob(
    element: HTMLElement,
    options: PDFOptions = {}
): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const html2pdfOptions = {
        margin: opts.margin,
        image: {
            type: 'jpeg' as const,
            quality: opts.imageQuality
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            allowTaint: false,
        },
        jsPDF: {
            unit: 'mm',
            format: opts.pageSize?.toLowerCase() || 'a4',
            orientation: opts.orientation || 'portrait',
            compress: true,
        },
    };

    try {
        const pdf = await html2pdf().set(html2pdfOptions).from(element).output('blob');
        return pdf;
    } catch (error) {
        console.error('PDF blob generation failed:', error);
        throw new Error('Failed to generate PDF blob');
    }
}

/**
 * Share PDF using Web Share API (for mobile)
 * @param element - The HTML element to convert to PDF
 * @param filename - Name of the PDF file
 * @param options - PDF generation options
 */
export async function sharePDF(
    element: HTMLElement,
    filename: string,
    options: PDFOptions = {}
): Promise<void> {
    // Check if Web Share API Level 2 is supported (for file sharing)
    if (!navigator.share || !navigator.canShare) {
        throw new Error('Web Share API is not supported on this device');
    }

    const blob = await getPDFBlob(element, options);
    const file = new File(
        [blob],
        filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
        { type: 'application/pdf' }
    );

    const shareData = {
        files: [file],
        title: filename,
    };

    if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
    } else {
        // Fallback to download if file sharing is not supported
        await downloadPDF(element, filename, options);
    }
}

/**
 * Prepare element for PDF generation
 * (Ensures QR codes, images, etc. are fully rendered)
 */
export function prepareElementForPDF(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
        // Wait for images to load
        const images = element.querySelectorAll('img');
        const canvases = element.querySelectorAll('canvas');

        const allMedia = [...Array.from(images), ...Array.from(canvases)];

        if (allMedia.length === 0) {
            resolve();
            return;
        }

        let loadedCount = 0;
        const totalCount = images.length;

        if (totalCount === 0) {
            resolve();
            return;
        }

        const checkComplete = () => {
            loadedCount++;
            if (loadedCount >= totalCount) {
                // Add small delay to ensure rendering is complete
                setTimeout(resolve, 100);
            }
        };

        images.forEach((img) => {
            if (img.complete) {
                checkComplete();
            } else {
                img.addEventListener('load', checkComplete);
                img.addEventListener('error', checkComplete);
            }
        });
    });
}
