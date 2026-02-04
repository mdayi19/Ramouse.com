import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
    /** Whether shortcuts are enabled */
    enabled: boolean;
    /** Callback when Escape is pressed */
    onEscape?: () => void;
    /** Callback when Ctrl/Cmd+K is pressed */
    onClearChat?: () => void;
}

/**
 * Custom hook for managing keyboard shortcuts
 * Handles Escape and Ctrl/Cmd+K shortcuts for the chatbot
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   enabled: isOpen,
 *   onEscape: handleClose,
 *   onClearChat: handleClear
 * });
 * ```
 */
export const useKeyboardShortcuts = ({
    enabled,
    onEscape,
    onClearChat
}: KeyboardShortcutsOptions) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Escape to close
            if (e.key === 'Escape' && onEscape) {
                onEscape();
            }

            // Ctrl/Cmd + K to clear chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k' && onClearChat) {
                e.preventDefault();
                onClearChat();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [enabled, onEscape, onClearChat]);
};
