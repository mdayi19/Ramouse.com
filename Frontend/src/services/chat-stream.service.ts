export interface StreamEvent {
    type: 'status' | 'chunk' | 'done' | 'error';
    message?: string;
    content?: string;
    session_id?: string;
}

export class ChatStreamService {
    private eventSource: EventSource | null = null;
    private abortController: AbortController | null = null;

    /**
     * Stream a chat message using Server-Sent Events
     */
    async streamMessage(
        message: string,
        sessionId: string,
        onChunk: (chunk: string) => void,
        onStatus: (status: string) => void,
        onComplete: (sessionId: string) => void,
        onError: (error: string) => void,
        latitude?: number,
        longitude?: number
    ): Promise<void> {
        this.abortController = new AbortController();

        try {
            const body = {
                message,
                session_id: sessionId,
                latitude,
                longitude
            };

            const response = await fetch('/api/chatbot/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                },
                body: JSON.stringify(body),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Response body is null');
            }

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonData = line.substring(6);

                        try {
                            const event: StreamEvent = JSON.parse(jsonData);

                            switch (event.type) {
                                case 'status':
                                    if (event.message) {
                                        onStatus(event.message);
                                    }
                                    break;
                                case 'chunk':
                                    if (event.content) {
                                        onChunk(event.content);
                                    }
                                    break;
                                case 'done':
                                    if (event.session_id) {
                                        onComplete(event.session_id);
                                    }
                                    return;
                                case 'error':
                                    if (event.message) {
                                        onError(event.message);
                                    }
                                    return;
                            }
                        } catch (e) {
                            console.error('Failed to parse SSE event:', e);
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted by user');
            } else {
                console.error('Streaming error:', error);
                onError('حدث خطأ أثناء الاتصال');
            }
        }
    }

    /**
     * Cancel the current stream
     */
    cancelStream(): void {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }

    /**
     * Check if streaming is currently active
     */
    isStreaming(): boolean {
        return this.abortController !== null || this.eventSource !== null;
    }
}

export const chatStreamService = new ChatStreamService();
