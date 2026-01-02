import { useCallback, useRef, useEffect, useState } from 'react';

type AnnouncementType = 'bid' | 'timer' | 'sold' | 'welcome';

export const useAIAuctioneer = (enabled: boolean = true) => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const synth = window.speechSynthesis;
    const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

    // Initialize voice
    useEffect(() => {
        const loadVoice = () => {
            const voices = synth.getVoices();
            // Prefer Arabic Google voice, then any Arabic, then generic
            const arabicVoice = voices.find(v => v.lang.includes('ar-SA') || v.lang.includes('ar')) || voices[0];
            voiceRef.current = arabicVoice;
        };

        loadVoice();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoice;
        }
    }, []);

    const speak = useCallback((text: string, priority: 'high' | 'normal' = 'normal') => {
        if (!enabled || !synth) return;

        // Cancel current speech if high priority (e.g. SOLD!)
        if (priority === 'high') {
            synth.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        if (voiceRef.current) {
            utterance.voice = voiceRef.current;
        }
        utterance.lang = 'ar-SA';
        utterance.rate = 1.1; // Slightly faster for excitement
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
    }, [enabled, synth]);

    const announceBid = useCallback((amount: number, bidderName: string) => {
        const messages = [
            `مزايدة جديدة بقيمة ${amount} دولار من ${bidderName}`,
            `${amount} دولار! هل من مزيد؟`,
            `${bidderName} يرفع السعر إلى ${amount} دولار`,
            `رقم جديد! ${amount} دولار واصلة`,
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        speak(randomMsg);
    }, [speak]);

    const announceTimer = useCallback((seconds: number) => {
        if (seconds === 10) speak("عشر ثواني متبقية!", 'high');
        if (seconds === 5) speak("خمسة.. أربعة.. ثلاث.. اثنان.. واحد..", 'high');
    }, [speak]);

    const announceSold = useCallback((amount: number, winnerName: string) => {
        speak(`تم البيع! مبروك ${winnerName}, رست الصفقة على ${amount} دولار`, 'high');
    }, [speak]);

    return {
        speak,
        announceBid,
        announceTimer,
        announceSold,
        isSpeaking
    };
};
