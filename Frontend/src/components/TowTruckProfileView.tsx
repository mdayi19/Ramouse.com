import React, { useState } from 'react';
import PrintableTowTruckProfile from './PrintableTowTruckProfile';
import PDFExportButton from './PDFExportButton';
import type { TowTruck, Settings } from '../types';

interface TowTruckProfileViewProps {
    towTruck: TowTruck;
    settings: Settings;
}

const TowTruckProfileView: React.FC<TowTruckProfileViewProps> = ({ towTruck, settings }) => {
    const profileRef = React.useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isProfileReady, setIsProfileReady] = useState(false);

    const handleProfileReady = () => {
        setIsProfileReady(true);
    };

    const handleExportPDF = async () => {
        if (isExporting || !profileRef.current || !isProfileReady) return;

        setIsExporting(true);
        try {
            // Add extra delay to ensure base64 images are fully rendered
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error('Failed to export PDF:', error);
            alert('فشل تصدير PDF. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="w-full">
            {/* Export Button - Hidden in print */}
            <div className="flex justify-center mb-4 print:hidden">
                <PDFExportButton
                    onClick={handleExportPDF}
                    isExporting={isExporting}
                    label="تحميل كـ PDF"
                    disabled={!isProfileReady}
                />
            </div>

            {/* Printable Profile */}
            <PrintableTowTruckProfile
                ref={profileRef}
                towTruck={towTruck}
                settings={settings}
                onReady={handleProfileReady}
            />
        </div>
    );
};

export default TowTruckProfileView;
