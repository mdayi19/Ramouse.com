import React from 'react';
import { Customer, Notification, NotificationType, Settings } from '../../types';
import { SharedFlashProductsView } from '../Store/SharedFlashProductsView';

interface FlashProductsViewProps {
    customer: Customer;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
    addNotificationForUser: (userPhone: string, notification: Omit<Notification, 'id' | 'timestamp' | 'read'>, type: NotificationType, context?: Record<string, any>) => void;
    settings: Settings;
}

export const FlashProductsView: React.FC<FlashProductsViewProps> = ({ customer, showToast, addNotificationForUser, settings }) => {
    return (
        <SharedFlashProductsView
            userType="customer"
            userId={customer.id}
            userName={customer.name}
            userAddress={customer.address}
            userPhone={customer.id} // Assuming ID is phone for customer as per original code
            showToast={showToast}
            addNotificationForUser={addNotificationForUser}
            settings={settings}
        />
    );
};
