import React from 'react';
import { Technician, Notification, NotificationType, Settings } from '../../types';
import { SharedFlashProductsView } from '../Store/SharedFlashProductsView';
import { SYRIAN_CITIES } from '../../constants';

interface FlashProductsViewProps {
    technician: Technician;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
}

export const FlashProductsView: React.FC<FlashProductsViewProps> = ({ technician, showToast, addNotificationForUser, settings }) => {
    return (
        <SharedFlashProductsView
            userType="technician"
            userId={technician.id}
            userName={technician.name}
            userCity={(technician as any).city || SYRIAN_CITIES[0]}
            userAddress={(technician as any).workshopAddress || ''}
            userPhone={technician.id}
            userSpecialty={(technician as any).specialty}
            showToast={showToast}
            addNotificationForUser={addNotificationForUser}
            settings={settings}
        />
    );
};
