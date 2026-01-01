import React from 'react';
import { NotificationType, NotificationSettings } from '../types';

interface NotificationSettingsFormProps {
    availableNotifications: { type: NotificationType; label: string }[];
    userSettings: Partial<NotificationSettings>;
    globalSettings: NotificationSettings;
    onSettingsChange: (newSettings: Partial<NotificationSettings>) => void;
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ availableNotifications, userSettings, globalSettings, onSettingsChange }) => {
    const handleChange = (type: NotificationType, checked: boolean) => {
        onSettingsChange({ ...userSettings, [type]: checked });
    };

    return (
        <div className="space-y-3">
            {availableNotifications.map(({ type, label }) => {
                const isGloballyDisabled = !globalSettings[type];
                // Default to ON if the user hasn't set a preference for this type.
                const isChecked = userSettings[type] ?? true; 

                return (
                    <label 
                        key={type} 
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isGloballyDisabled 
                            ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60 border-slate-200 dark:border-slate-700' 
                            : 'bg-slate-50 dark:bg-darkbg/50 border-slate-200 dark:border-slate-700 cursor-pointer'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={!isGloballyDisabled && isChecked}
                            disabled={isGloballyDisabled}
                            onChange={(e) => handleChange(type, e.target.checked)}
                            className="rounded text-primary focus:ring-primary disabled:opacity-50"
                        />
                        <div>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
                            {isGloballyDisabled && <span className="text-xs text-slate-500 dark:text-slate-400 block"> (معطل من قبل الإدارة)</span>}
                        </div>
                    </label>
                );
            })}
        </div>
    );
};

export default NotificationSettingsForm;