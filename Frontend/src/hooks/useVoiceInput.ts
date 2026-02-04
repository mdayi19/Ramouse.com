import { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceInputOptions {
    language?: string;
    onTranscript: (text: string) => void;
    onError?: (error: string) => void;
}

/**
 * Custom hook for managing voice input using the Web Speech API
 * Provides start, stop, and toggle methods for voice recognition
 */
export const useVoiceInput = ({
    language = 'ar-SA',
    onTranscript,
    onError
}: VoiceInputOptions) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        setIsSupported(true);

        // Initialize speech recognition
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // Handle successful recognition
        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
            setIsListening(false);
        };

        // Handle errors
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            const errorMessage = getErrorMessage(event.error);
            onError?.(errorMessage);
            setIsListening(false);
        };

        // Handle end of recognition
        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [language, onTranscript, onError]);

    /**
     * Start listening for voice input
     */
    const startListening = useCallback(() => {
        if (!recognitionRef.current || !isSupported) {
            onError?.('المتصفح لا يدعم البحث الصوتي');
            return;
        }

        try {
            if (!isListening) {
                recognitionRef.current.start();
                setIsListening(true);
            }
        } catch (error) {
            console.error('Failed to start recognition:', error);
            setIsListening(false);
        }
    }, [isListening, isSupported, onError]);

    /**
     * Stop listening for voice input
     */
    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    /**
     * Toggle voice input on/off
     */
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    return {
        isListening,
        isSupported,
        startListening,
        stopListening,
        toggleListening
    };
};

/**
 * Convert speech recognition error codes to user-friendly Arabic messages
 */
const getErrorMessage = (error: string): string => {
    switch (error) {
        case 'no-speech':
            return 'لم يتم اكتشاف صوت';
        case 'audio-capture':
            return 'لم يتم اكتشاف ميكروفون';
        case 'not-allowed':
            return 'الرجاء السماح بالوصول للميكروفون';
        case 'network':
            return 'خطأ في الاتصال بالشبكة';
        default:
            return 'حدث خطأ في التعرف على الصوت';
    }
};
