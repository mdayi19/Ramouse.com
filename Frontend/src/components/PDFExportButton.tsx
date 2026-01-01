import React from 'react';
import Icon from './Icon';

interface PDFExportButtonProps {
    onClick: () => void;
    isExporting?: boolean;
    label?: string;
    className?: string;
    disabled?: boolean;
}

const PDFExportButton: React.FC<PDFExportButtonProps> = ({
    onClick,
    isExporting = false,
    label = 'تصدير PDF',
    className = '',
    disabled = false
}) => {
    return (
        <button
            onClick={onClick}
            disabled={isExporting || disabled}
            className={`
                flex items-center gap-2 px-4 py-2 
                bg-primary-600 hover:bg-primary-700 
                text-white font-medium rounded-lg
                transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                print:hidden
                ${className}
            `}
            aria-label={label}
        >
            {isExporting ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري التصدير...</span>
                </>
            ) : (
                <>
                    <Icon name="Download" className="w-5 h-5" />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
};

export default PDFExportButton;
