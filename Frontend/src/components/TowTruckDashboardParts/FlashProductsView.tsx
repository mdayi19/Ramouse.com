import React from 'react';
import { TowTruck, Notification, NotificationType, Settings } from '../../types';
import { SharedFlashProductsView } from '../Store/SharedFlashProductsView';
import { SYRIAN_CITIES } from '../../constants';

interface FlashProductsViewProps {
    towTruck: TowTruck;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
}

export const FlashProductsView: React.FC<FlashProductsViewProps> = ({ towTruck, showToast, addNotificationForUser, settings }) => {
    return (
        <SharedFlashProductsView
            userType="tow_truck"
            userId={towTruck.id}
            userName={towTruck.name}
            userCity={towTruck.city || SYRIAN_CITIES[0]}
            userAddress={towTruck.serviceArea || ''}
            userPhone={towTruck.id}
            showToast={showToast}
            addNotificationForUser={addNotificationForUser}
            settings={settings}
        />
    );
};