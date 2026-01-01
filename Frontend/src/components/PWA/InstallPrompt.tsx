import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { Button } from '../ui/Button';

interface InstallPromptProps {
    deferredPrompt: any;
    installApp: () => Promise<boolean>;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ deferredPrompt, installApp }) => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (deferredPrompt) {
            // Check if user has dismissed it recently
            const promptDismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!promptDismissed) {
                // Delay prompt slightly for better UX
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }
    }, [deferredPrompt]);

    const handleInstallClick = async () => {
        const installed = await installApp();
        if (installed) {
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Remember dismissal for session or 24h (simple toggle for now)
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 z-[100] animate-slide-up-fade">
            <div className="relative overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700 max-w-sm w-full">
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                >
                    <Icon name="X" className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center shadow-lg shadow-primary/25 shrink-0">
                        <span className="text-xl font-black text-white">R</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white mb-1">تثبيت التطبيق</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            احصل على تجربة أفضل، إشعارات فورية، ووصول أسرع لخدماتنا.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleInstallClick}
                                className="bg-primary hover:bg-primary-700 text-white h-auto py-2 px-4 rounded-lg text-xs font-bold shadow-lg shadow-primary/20 border-0"
                            >
                                <Icon name="Download" className="w-3.5 h-3.5 ml-2" />
                                تثبيت الآن
                            </Button>
                            <button
                                onClick={handleDismiss}
                                className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            >
                                ليس الآن
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
