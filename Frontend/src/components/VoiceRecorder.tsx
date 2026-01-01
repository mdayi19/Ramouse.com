import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface VoiceRecorderProps {
    voiceNote: Blob | null;
    setVoiceNote: (blob: Blob | null) => void;
    maxSizeMB?: number;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ voiceNote, setVoiceNote, maxSizeMB = 10 }) => {
    // --- State ---
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // --- Refs ---
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Visualizer (Recording)
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Waveform (Playback)
    const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);

    // --- Effects ---

    useEffect(() => {
        if (voiceNote) {
            const url = URL.createObjectURL(voiceNote);
            setAudioUrl(url);
            generateWaveform(voiceNote); // Generate static waveform & get accurate duration

            // Reset state
            setCurrentTime(0);
            setIsPlaying(false);
            setPlaybackRate(1);
            return () => URL.revokeObjectURL(url);
        } else {
            setAudioUrl(null);
            setTotalDuration(0);
            setWaveformPeaks([]);
        }
    }, [voiceNote]);

    useEffect(() => {
        return () => {

            stopVisualizer();
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
            }
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [isRecording]);

    // Redraw playback waveform when peaks or progress changes
    useEffect(() => {
        drawPlaybackWaveform();
    }, [waveformPeaks, currentTime, totalDuration]);


    // --- Visualizer Logic (Live Recording) ---

    const startVisualizer = (stream: MediaStream) => {
        if (!canvasRef.current) return;

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const audioCtx = new AudioContext();
        audioContextRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        sourceRef.current = source;

        drawLiveVisualizer();
    };

    const drawLiveVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        // If paused, stop updating visuals but don't clear
        if (isPaused) {
            animationFrameRef.current = requestAnimationFrame(drawLiveVisualizer);
            return;
        }

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        if (!canvasCtx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!analyserRef.current) return;
            animationFrameRef.current = requestAnimationFrame(draw);

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
                // optionally draw "paused" state
                return;
            }

            analyserRef.current.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#60a5fa');

                canvasCtx.fillStyle = gradient;
                roundRect(canvasCtx, x, canvas.height - barHeight, barWidth, barHeight, 2);
                x += barWidth + 1;
            }
        };

        draw();
    };

    const stopVisualizer = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };


    // --- Waveform Logic (Playback) ---

    const generateWaveform = async (blob: Blob) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContext();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            // Set precise duration from decoded buffer
            setTotalDuration(audioBuffer.duration);

            const rawData = audioBuffer.getChannelData(0); // Use first channel
            const samples = 100; // Number of bars to render
            const blockSize = Math.floor(rawData.length / samples);
            const filteredData = [];

            for (let i = 0; i < samples; i++) {
                let blockStart = blockSize * i;
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(rawData[blockStart + j]);
                }
                filteredData.push(sum / blockSize);
            }

            // Normalize
            const multiplier = Math.pow(Math.max(...filteredData), -1);
            setWaveformPeaks(filteredData.map(n => n * multiplier));

        } catch (error) {
            console.error("Error generating waveform:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const drawPlaybackWaveform = () => {
        if (!waveformCanvasRef.current || waveformPeaks.length === 0) return;

        const canvas = waveformCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = width / waveformPeaks.length;
        const gap = 1;

        ctx.clearRect(0, 0, width, height);

        const progressPercent = currentTime / (totalDuration || 1);

        waveformPeaks.forEach((peak, index) => {
            const barHeight = Math.max(2, peak * height);
            const x = index * barWidth;
            const y = (height - barHeight) / 2;

            // Color based on progress
            const isPlayed = (index / waveformPeaks.length) < progressPercent;
            ctx.fillStyle = isPlayed ? '#3b82f6' : '#e2e8f0'; // blue-500 vs slate-200
            if (document.documentElement.classList.contains('dark') && !isPlayed) {
                ctx.fillStyle = '#334155'; // slate-700 for dark mode unplayed
            }

            roundRect(ctx, x, y, barWidth - gap, barHeight, 2);
        });
    };

    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveformCanvasRef.current || !totalDuration) return;
        const rect = waveformCanvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / rect.width;
        const newTime = percent * totalDuration;

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };


    // --- Recording Control ---

    const startRecording = async () => {
        setPermissionError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            startVisualizer(stream);

            const options = getSupportedMimeType() ? { mimeType: getSupportedMimeType() } : undefined;
            mediaRecorderRef.current = new MediaRecorder(stream, options);

            mediaRecorderRef.current.ondataavailable = event => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const finalMimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
                if (audioBlob.size > maxSizeMB * 1024 * 1024) {
                    alert(`حجم الملف كبير جدًا (${maxSizeMB}MB max).`);
                } else {
                    setVoiceNote(audioBlob);
                }
                resetRecordingState();
                stream.getTracks().forEach(track => track.stop());
            };

            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);


        } catch (err) {
            console.error("Mic Error:", err);
            setPermissionError("يرجى السماح بالوصول للميكروفون");
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
    };

    const resetRecordingState = () => {
        setIsRecording(false);
        setIsPaused(false);
        stopVisualizer();
        audioChunksRef.current = [];
    };

    // Timer Effect
    useEffect(() => {
        let interval: number;
        if (isRecording && !isPaused) {
            interval = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, isPaused]);


    // --- Playback Control ---

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const togglePlaybackRate = () => {
        const speeds = [1, 1.5, 2];
        const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
        setPlaybackRate(next);
        if (audioRef.current) audioRef.current.playbackRate = next;
    };

    const downloadRecording = () => {
        if (!audioUrl) return;
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `recording-${new Date().getTime()}.webm`; // Most browsers will handle extension mapping or play it anyway
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };


    // --- Helpers ---

    const getSupportedMimeType = () => {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
        return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds) || seconds === Infinity) return "00:00";
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${secs}`;
    };

    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        // Check if roundRect is supported, otherwise fallback to arcTo
        if ((ctx as any).roundRect) {
            (ctx as any).roundRect(x, y, w, h, r);
        } else {
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + w, y, x + w, y + h, r);
            ctx.arcTo(x + w, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + w, y, r);
        }
        ctx.closePath();
        ctx.fill();
    };


    // --- Render ---

    if (audioUrl) {
        return (
            <div className="w-full flex flex-col gap-3 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all animate-fade-in">

                {/* Waveform Canvas (Clickable) */}
                <div className="relative w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden cursor-pointer group" onClick={handleWaveformClick}>
                    {isProcessing ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                            <Icon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                            جاري المعالجة...
                        </div>
                    ) : (
                        <canvas
                            ref={waveformCanvasRef}
                            width={300}
                            height={64}
                            className="w-full h-full"
                        />
                    )}
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-transform active:scale-95"
                        >
                            <Icon name={isPlaying ? "Pause" : "Play"} className="w-5 h-5 fill-current" />
                        </button>

                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {formatTime(currentTime)} / {formatTime(totalDuration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePlaybackRate}
                            className="px-2 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold transition-colors"
                        >
                            {playbackRate}x
                        </button>

                        <button
                            type="button"
                            onClick={downloadRecording}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            title="تحميل"
                        >
                            <Icon name="Download" className="w-4 h-4" />
                        </button>

                        <button
                            type="button"
                            onClick={() => { setVoiceNote(null); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            title="حذف"
                        >
                            <Icon name="Trash2" className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />
            </div>
        );
    }

    return (
        <div className={`relative w-full transition-all ${isRecording ? 'p-4 bg-slate-50 dark:bg-slate-800/50' : ''} rounded-2xl overflow-hidden border border-transparent ${isRecording ? 'border-red-100 dark:border-red-900/30' : ''}`}>

            {permissionError && (
                <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-sm text-red-500 font-bold mb-3">{permissionError}</p>
                    <button onClick={() => setPermissionError(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold hover:bg-slate-200 transition-colors">حاول مرة أخرى</button>
                </div>
            )}

            {isRecording ? (
                <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-orange-400' : 'bg-red-500 animate-pulse'}`} />
                        <span className={`font-mono text-xl font-bold ${isPaused ? 'text-orange-400' : 'text-red-500'}`}>
                            {formatTime(recordingTime)}
                        </span>
                    </div>

                    {/* Live Visualizer */}
                    <div className="w-full h-16 mb-4 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg overflow-hidden relative shadow-inner">
                        <canvas ref={canvasRef} width={300} height={64} className="w-full h-full opacity-90" />
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Stop Button */}
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
                            title="إيقاف وحفظ"
                        >
                            <div className="w-4 h-4 bg-white rounded-sm" />
                        </button>

                        {/* Pause/Resume Button */}
                        <button
                            type="button"
                            onClick={isPaused ? resumeRecording : pauseRecording}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${isPaused ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-400 hover:bg-orange-500'}`}
                            title={isPaused ? "استئناف" : "إيقاف مؤقت"}
                        >
                            <Icon name={isPaused ? "Mic" : "Pause"} className="w-5 h-5 fill-current" />
                        </button>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                        {isPaused ? 'تم الإيقاف المؤقت' : 'جاري التسجيل...'}
                    </p>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={startRecording}
                    className="group w-full flex flex-col items-center gap-3 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
                >
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm group-hover:shadow-blue-500/30">
                        <Icon name="Mic" className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">اضغط للبدء في التسجيل</span>
                </button>
            )}
        </div>
    );
};

export default VoiceRecorder;
