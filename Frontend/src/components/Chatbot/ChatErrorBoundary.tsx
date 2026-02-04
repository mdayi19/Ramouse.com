import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    children: ReactNode;
    onReset?: () => void;
    fallbackUI?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component for the chatbot
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app
 */
export class ChatErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    /**
     * Update state when an error is caught
     */
    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error
        };
    }

    /**
     * Log error details and send to monitoring service
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Chatbot error:', error, errorInfo);

        this.setState({
            errorInfo
        });

        // Send to error tracking service (e.g., Sentry)
        // Sentry.captureException(error, { 
        //     contexts: { react: { componentStack: errorInfo.componentStack } } 
        // });
    }

    /**
     * Reset the error boundary
     */
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
        this.props.onReset?.();
    };

    /**
     * Reload the page (last resort)
     */
    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallbackUI) {
                return this.props.fallbackUI;
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center p-8 h-full bg-white dark:bg-slate-900 rounded-3xl">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-6"
                    >
                        <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </motion.div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                        حدث خطأ غير متوقع
                    </h3>

                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 max-w-xs">
                        نعتذر عن الإزعاج. يرجى إعادة تحميل المحادثة أو الصفحة.
                    </p>

                    {/* Development-only error details */}
                    {import.meta.env.DEV && this.state.error && (
                        <details className="mb-6 max-w-md w-full">
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer mb-2 font-medium hover:text-slate-700 dark:hover:text-slate-300">
                                تفاصيل الخطأ (للمطورين)
                            </summary>
                            <div className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto max-h-40 font-mono">
                                <div className="text-red-600 dark:text-red-400 font-bold mb-2">
                                    {this.state.error.name}: {this.state.error.message}
                                </div>
                                {this.state.errorInfo && (
                                    <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm hover:shadow-md"
                            aria-label="إعادة تحميل المحادثة"
                        >
                            <RefreshCw className="w-4 h-4" />
                            إعادة تحميل المحادثة
                        </button>

                        <button
                            onClick={this.handleReload}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors font-medium"
                            aria-label="إعادة تحميل الصفحة"
                        >
                            <Home className="w-4 h-4" />
                            إعادة تحميل الصفحة
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center max-w-sm">
                        إذا استمرت المشكلة، يرجى مسح ذاكرة التخزين المؤقت للمتصفح أو الاتصال بالدعم الفني.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
