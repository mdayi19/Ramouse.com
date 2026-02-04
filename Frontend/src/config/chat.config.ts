/**
 * Chat Configuration
 * Centralized configuration for the chatbot system
 */

export interface ChatConfig {
    // Feature Flags
    STREAMING_ENABLED: boolean;
    VOICE_INPUT_ENABLED: boolean;
    FEEDBACK_ENABLED: boolean;

    // Message Limits
    MAX_MESSAGE_LENGTH: number;
    GUEST_DAILY_LIMIT: number;
    USER_DAILY_LIMIT: number;
    MAX_HISTORY_MESSAGES: number;

    // UI/UX Settings
    AUTO_SCROLL_ENABLED: boolean;
    AUTO_SCROLL_DELAY: number;
    TYPING_INDICATOR_DELAY: number;
    MESSAGE_ANIMATION_DURATION: number;

    // Voice Recognition
    VOICE_LANGUAGE: string;
    VOICE_CONTINUOUS: boolean;

    // Performance
    ENABLE_MESSAGE_VIRTUALIZATION: boolean;
    VIRTUALIZATION_THRESHOLD: number;
    OVERSCAN_COUNT: number;

    // Error Handling
    ERROR_DISPLAY_DURATION: number;
    MAX_RETRY_ATTEMPTS: number;
}

/**
 * Default configuration values
 */
export const defaultChatConfig: ChatConfig = {
    // Feature Flags
    STREAMING_ENABLED: true,
    VOICE_INPUT_ENABLED: true,
    FEEDBACK_ENABLED: true,

    // Message Limits
    MAX_MESSAGE_LENGTH: 500,
    GUEST_DAILY_LIMIT: 50,
    USER_DAILY_LIMIT: 500,
    MAX_HISTORY_MESSAGES: 50,

    // UI/UX Settings
    AUTO_SCROLL_ENABLED: true,
    AUTO_SCROLL_DELAY: 100,
    TYPING_INDICATOR_DELAY: 1000,
    MESSAGE_ANIMATION_DURATION: 200,

    // Voice Recognition
    VOICE_LANGUAGE: 'ar-SA',
    VOICE_CONTINUOUS: false,

    // Performance
    ENABLE_MESSAGE_VIRTUALIZATION: false,
    VIRTUALIZATION_THRESHOLD: 50,
    OVERSCAN_COUNT: 5,

    // Error Handling
    ERROR_DISPLAY_DURATION: 3000,
    MAX_RETRY_ATTEMPTS: 3,
};

/**
 * Chat configuration with environment variable overrides
 */
export const chatConfig: ChatConfig = {
    ...defaultChatConfig,

    // Environment overrides
    STREAMING_ENABLED:
        import.meta.env.VITE_CHAT_STREAMING_ENABLED === 'false'
            ? false
            : defaultChatConfig.STREAMING_ENABLED,

    VOICE_INPUT_ENABLED:
        import.meta.env.VITE_CHAT_VOICE_ENABLED === 'false'
            ? false
            : defaultChatConfig.VOICE_INPUT_ENABLED,

    ENABLE_MESSAGE_VIRTUALIZATION:
        import.meta.env.VITE_CHAT_VIRTUALIZATION === 'true'
            ? true
            : defaultChatConfig.ENABLE_MESSAGE_VIRTUALIZATION,
};

/**
 * Get the current chat configuration
 * @returns The active chat configuration
 */
export const getChatConfig = (): ChatConfig => chatConfig;

/**
 * Check if message virtualization should be used based on message count
 * @param messageCount - The current number of messages
 * @returns True if virtualization should be enabled
 */
export const shouldUseVirtualization = (messageCount: number): boolean => {
    return chatConfig.ENABLE_MESSAGE_VIRTUALIZATION &&
        messageCount > chatConfig.VIRTUALIZATION_THRESHOLD;
};

/**
 * Get the maximum message length
 * @returns The maximum allowed message length in characters
 */
export const getMaxMessageLength = (): number => {
    return chatConfig.MAX_MESSAGE_LENGTH;
};

/**
 * Get the daily message limit based on authentication status
 * @param isAuthenticated - Whether the user is authenticated
 * @returns The daily message limit
 */
export const getDailyLimit = (isAuthenticated: boolean): number => {
    return isAuthenticated
        ? chatConfig.USER_DAILY_LIMIT
        : chatConfig.GUEST_DAILY_LIMIT;
};

/**
 * Check if a feature is enabled
 * @param feature - The feature to check
 * @returns True if the feature is enabled
 */
export const isFeatureEnabled = (
    feature: 'streaming' | 'voice' | 'feedback'
): boolean => {
    switch (feature) {
        case 'streaming':
            return chatConfig.STREAMING_ENABLED;
        case 'voice':
            return chatConfig.VOICE_INPUT_ENABLED;
        case 'feedback':
            return chatConfig.FEEDBACK_ENABLED;
        default:
            return false;
    }
};
