import React, { Component, ErrorInfo, ReactNode } from 'react';
import Icon from './Icon';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Here you would log to Sentry in the next step
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-white p-4">
                    <div className="bg-white dark:bg-darkcard p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="AlertTriangle" className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">عذراً، حدث خطأ ما</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            واجهنا مشكلة غير متوقعة. قام فريقنا التقني بتسجيل الخطأ وسنعمل على حله قريباً.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Icon name="RefreshCw" className="w-4 h-4" />
                            <span>تحديث الصفحة</span>
                        </button>
                        <a href="/" className="block mt-4 text-sm text-slate-500 hover:text-primary">
                            العودة للصفحة الرئيسية
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
