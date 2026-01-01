import { useCallback } from 'react';

const telegramQueue: any[] = [];
let isProcessingTelegramQueue = false;

export const useTelegram = (showToast: (message: string, type: 'success' | 'error' | 'info') => void) => {
    
    const processTelegramQueue = useCallback(async () => {
        if (telegramQueue.length === 0) {
            isProcessingTelegramQueue = false;
            return;
        }
    
        isProcessingTelegramQueue = true;
        const job = telegramQueue.shift();
        if (!job) {
            isProcessingTelegramQueue = false;
            return;
        }
    
        const { botToken, channelId, message, media } = job;
        const { images = [], video = null, voiceNote = null } = media || {};
    
        let mainMessageSentAsCaption = false;
        let anyMediaSent = false;
        const mediaCount = images.length + (video ? 1 : 0);
    
        const reply_markup = undefined;
    
        const sendRequest = async (url: string, body: FormData | string, headers?: HeadersInit): Promise<boolean> => {
            try {
                const response = await fetch(url, { method: 'POST', body, headers });
                const data = await response.json();
                if (data.ok) {
                    return true;
                } else {
                    console.error(`Telegram API Error (${url}):`, data.description);
                    return false;
                }
            } catch (error) {
                console.error(`Failed to send Telegram request (${url}):`, error);
                return false;
            }
        };
        
        if (mediaCount > 1) {
            const formData = new FormData();
            formData.append('chat_id', channelId);
            
            const mediaPayload: any[] = [];
            let attachmentIndex = 0;
            images.forEach((img: File) => {
                const name = `photo_${attachmentIndex++}`;
                formData.append(name, img);
                mediaPayload.push({ type: 'photo', media: `attach://${name}` });
            });
            if (video) {
                const name = `video_${attachmentIndex++}`;
                formData.append(name, video);
                mediaPayload.push({ type: 'video', media: `attach://${name}` });
            }
            
            if (mediaPayload.length > 0) {
                mediaPayload[0].caption = message;
                mediaPayload[0].parse_mode = 'MarkdownV2';
            }
    
            formData.append('media', JSON.stringify(mediaPayload));
            if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));
    
            if (await sendRequest(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, formData)) {
                mainMessageSentAsCaption = true;
                anyMediaSent = true;
            }
        } else if (mediaCount === 1) {
            if (images.length === 1) {
                const formData = new FormData();
                formData.append('chat_id', channelId);
                formData.append('photo', images[0]);
                // @ts-ignore
                formData.append('caption', message);
                // @ts-ignore
                formData.append('parse_mode', 'MarkdownV2');
                if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));
                if (await sendRequest(`https://api.telegram.org/bot${botToken}/sendPhoto`, formData)) {
                    mainMessageSentAsCaption = true;
                    anyMediaSent = true;
                }
            } else if (video) {
                const formData = new FormData();
                formData.append('chat_id', channelId);
                formData.append('video', video);
                // @ts-ignore
                formData.append('caption', message);
                // @ts-ignore
                formData.append('parse_mode', 'MarkdownV2');
                if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));
                if (await sendRequest(`https://api.telegram.org/bot${botToken}/sendVideo`, formData)) {
                    mainMessageSentAsCaption = true;
                    anyMediaSent = true;
                }
            }
        }
    
        if (voiceNote) {
            const formData = new FormData();
            formData.append('chat_id', channelId);
            formData.append('voice', voiceNote, 'voicenote.webm');
            if (!mainMessageSentAsCaption) {
                // @ts-ignore
                formData.append('caption', message);
                // @ts-ignore
                formData.append('parse_mode', 'MarkdownV2');
                if (reply_markup) formData.append('reply_markup', JSON.stringify(reply_markup));
            }
            if (await sendRequest(`https://api.telegram.org/bot${botToken}/sendVoice`, formData)) {
                anyMediaSent = true;
                if (!mainMessageSentAsCaption) mainMessageSentAsCaption = true;
            }
        }
        
        if (!mainMessageSentAsCaption) {
            const bodyObject: any = { chat_id: channelId, text: message, parse_mode: 'MarkdownV2' };
            if (reply_markup) bodyObject.reply_markup = reply_markup;
            const body = JSON.stringify(bodyObject);
            if (await sendRequest(`https://api.telegram.org/bot${botToken}/sendMessage`, body, { 'Content-Type': 'application/json' })) {
                anyMediaSent = true;
            }
        }
        
        if (anyMediaSent) {
             // Success
        } else if (mediaCount > 0 || voiceNote) {
            showToast('فشل إرسال إشعار تيليجرام.', 'error');
        }
    
        setTimeout(processTelegramQueue, 1500);
    }, [showToast]);

    const sendTelegramNotification = useCallback(async (
        botToken: string, channelId: string, message: string,
        media?: { images: File[], video?: File | null, voiceNote?: Blob | null },
        orderNumber?: string, domain?: string
    ) => {
        telegramQueue.push({ botToken, channelId, message, media, orderNumber, domain });
        if (!isProcessingTelegramQueue) {
            processTelegramQueue();
        }
    }, [processTelegramQueue]);

    return { sendTelegramNotification };
};