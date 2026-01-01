import React, { Component, ReactNode, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import Icon from '../Icon';
import { Button } from '../ui/Button';

interface Props {
    children: ReactNode;
    /** Optional callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Optional fallback UI */
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    isRetrying: boolean;
}

/**
 * Error boundary specifically for auction components
 * Provides graceful error handling with retry and navigation options
 */
export class AuctionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isRetrying: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 Auction Error Boundary caught an error:', error, errorInfo);

        // Log to error tracking service (e.g., Sentry)
        // Sentry.captureException(error, { extra: errorInfo });

        this.setState({ errorInfo });

        // Call optional error callback
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ isRetrying: true });

        // Simulate retry delay
        setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                isRetrying: false,
            });
        }, 300);
    };

    handleGoBack = () => {
        window.history.back();
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-2xl w-full"
                    >
                        <div className="bg-white dark:bg-darkcard rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {/* Header with Gradient */}
                            <div className="relative bg-gradient-to-br from-red-500 to-red-700 p-8 text-white">
                                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
                                <div className="relative z-10 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <Icon name="AlertTriangle" className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black mb-1">عذراً، حدث خطأ!</h1>
                                        <p className="text-red-100 text-sm">
                                            واجهنا مشكلة أثناء عرض المزاد
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Error Details */}
                            <div className="p-8">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
                                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                                        تفاصيل الخطأ
                                    </h2>
                                    <p className="text-slate-800 dark:text-slate-200 font-mono text-sm bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        {this.state.error?.message || 'خطأ غير معروف'}
                                    </p>

                                    {/* Show stack trace in development */}
                                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium">
                                                عرض التفاصيل التقنية
                                            </summary>
                                            <pre className="mt-3 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>

                                {/* Suggested Actions */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
                                        ماذا يمكنك فعله؟
                                    </h3>
                                    <ul className="space-y-2">
                                        {[
                                            'حاول إعادة تحميل الصفحة',
                                            'تحقق من اتصالك بالإنترنت',
                                            'امسح ذاكرة التخزين المؤقت للمتصفح',
                                            'تواصل مع الدعم الفني إذا استمرت المشكلة',
                                        ].map((suggestion, index) => (
                                            <li key={index} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                                <Icon name="CheckCircle" className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="primary"
                                        onClick={this.handleRetry}
                                        isLoading={this.state.isRetrying}
                                        className="flex-1 min-w-[140px] rounded-xl py-3 font-bold shadow-lg shadow-blue-200 dark:shadow-blue-900/30"
                                        leftIcon={<Icon name="RefreshCw" className="w-4 h-4" />}
                                    >
                                        إعادة المحاولة
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={this.handleGoBack}
                                        className="flex-1 min-w-[140px] rounded-xl py-3 font-bold border-2"
                                        leftIcon={<Icon name="ArrowRight" className="w-4 h-4" />}
                                    >
                                        العودة
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={this.handleReload}
                                        className="min-w-[140px] rounded-xl py-3 font-bold border-2"
                                        leftIcon={<Icon name="RotateCw" className="w-4 h-4" />}
                                    >
                                        تحديث الصفحة
                                    </Button>
                                </div>

                                {/* Support Contact */}
                                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        هل تحتاج إلى مساعدة؟{' '}
                                        <a
                                            href="/support"
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                        >
                                            تواصل مع الدعم الفني
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AuctionErrorBoundary;
