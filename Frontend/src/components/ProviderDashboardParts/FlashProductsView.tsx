import React from 'react';
import { Provider, Notification, NotificationType, Settings } from '../../types';
import { SharedFlashProductsView } from '../Store/SharedFlashProductsView';
import { SYRIAN_CITIES } from '../../constants';

interface FlashProductsViewProps {
    provider: Provider;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
}

export const FlashProductsView: React.FC<FlashProductsViewProps> = ({ provider, showToast, addNotificationForUser, settings }) => {
    return (
        <SharedFlashProductsView
            userType="provider"
            userId={provider.id}
            userName={provider.name}
            userCity={SYRIAN_CITIES[0]} // Default as provider doesn't have city in interface
            userAddress="" // Default as provider doesn't have address in interface
            userPhone={provider.id} // Assuming ID is phone
            showToast={showToast}
            addNotificationForUser={addNotificationForUser}
            settings={settings}
        />
    );
};
