import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Vehicle } from '../types';
import Icon from './Icon';

interface AISuggestionsProps {
    vehicleContext?: Vehicle | null;
}

interface GroundingSource {
    uri: string;
    title: string;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ vehicleContext }) => {
    const [prompt, setPrompt] = useState('');
    const [result, setResult] = useState('');
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState<'diagnostic' | 'search'>('diagnostic');

    useEffect(() => {
        if (vehicleContext) {
            if (mode === 'diagnostic') {
                setPrompt(`سيارتي هي ${vehicleContext.brand} ${vehicleContext.model} موديل ${vehicleContext.year} (محرك ${vehicleContext.engineType}). المشكلة هي `);
            } else {
                setPrompt(`أبحث عن معلومات حول ${vehicleContext.brand} ${vehicleContext.model} موديل ${vehicleContext.year}: `);
            }
        } else {
            setPrompt('');
        }
        setResult('');
        setSources([]);
        setError('');
    }, [vehicleContext, mode]);

    const handleGetSuggestions = async () => {
        if (!prompt.trim()) {
            setError('الرجاء إدخال استفسارك.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult('');
        setSources([]);
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
            // For now, we use a simple placeholder as the AI integration is pending.
            // In a real implementation, you would call genAI.getGenerativeModel and fetch results.
            setResult('نتيجة تجريبية: تم استلام الطلب بنجاح.');
        } catch (e: any) {
            setError(e.message || 'حدث خطأ أثناء جلب الاقتراحات.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-8 bg-white dark:bg-darkcard rounded-xl shadow-lg animate-fade-in w-full h-full">
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon name="Sparkles" className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">مساعد الذكاء الاصطناعي</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">اختر نوع المساعدة التي تحتاجها.</p>
                    </div>
                </div>
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                        onClick={() => setMode('diagnostic')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${mode === 'diagnostic'
                                ? 'bg-white dark:bg-darkcard text-primary shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Icon name="Wrench" className="w-4 h-4" />
                        تشخيص الأعطال (Deep Thinking)
                    </button>
                    <button
                        onClick={() => setMode('search')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-bold transition-all ${mode === 'search'
                                ? 'bg-white dark:bg-darkcard text-blue-600 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Icon name="Search" className="w-4 h-4" />
                        بحث مباشر (Google Search)
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="promptInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {mode === 'diagnostic' ? 'صف مشكلة سيارتك' : 'عن ماذا تبحث؟'}
                    </label>
                    <textarea
                        id="promptInput"
                        rows={4}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder={mode === 'diagnostic' ? 'مثال: أسمع صوت طقطقة عند لف المقود إلى اليمين بسرعة منخفضة.' : 'مثال: ما هي أسعار قطع غيار تويوتا كورولا 2022 في السوق؟ أو استدعاءات الأمان الأخيرة لسيارات هيونداي.'}
                    />
                </div>
                <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading}
                    className={`w-full sm:w-auto font-bold px-6 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed text-white'
                            : mode === 'diagnostic'
                                ? 'bg-primary hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                >
                    {isLoading ? (
                        <>
                            <Icon name="Loader" className="animate-spin w-5 h-5" />
                            <span>{mode === 'diagnostic' ? 'جاري التحليل والتفكير...' : 'جاري البحث...'}</span>
                        </>
                    ) : (
                        <>
                            {mode === 'diagnostic' ? <Icon name="Stethoscope" className="w-5 h-5" /> : <Icon name="Search" className="w-5 h-5" />}
                            <span>{mode === 'diagnostic' ? 'تشخيص المشكلة' : 'بحث الآن'}</span>
                        </>
                    )}
                </button>
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300">
                        <Icon name="AlertTriangle" className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {result && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4">
                            {mode === 'diagnostic' ? <Icon name="BrainCircuit" className="w-6 h-6 text-primary" /> : <Icon name="Globe" className="w-6 h-6 text-blue-600" />}
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                {mode === 'diagnostic' ? 'التحليل والتشخيص:' : 'نتائج البحث:'}
                            </h3>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200">
                                <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 leading-relaxed">{result}</pre>
                            </div>
                        </div>
                        {sources.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                                    <Icon name="Link" className="w-4 h-4" /> المصادر والمراجع:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {sources.map((source, idx) => (
                                        <a
                                            key={idx}
                                            href={source.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                                        >
                                            <span className="truncate max-w-[150px]">{source.title || source.uri}</span>
                                            <Icon name="ExternalLink" className="w-3 h-3" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                            <div className="flex gap-2">
                                <Icon name="Info" className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                                <p className="text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed">
                                    <strong>إخلاء مسؤولية:</strong> {mode === 'diagnostic'
                                        ? 'هذه الاقتراحات تم إنشاؤها بواسطة الذكاء الاصطناعي (Gemini 3 Pro) وهي لأغراض إعلامية فقط. لا تعتبر بديلاً عن فحص متخصص من قبل ميكانيكي محترف.'
                                        : 'نتائج البحث مقدمة من Google Search وتتم معالجتها بواسطة الذكاء الاصطناعي. يرجى التحقق من المصادر للحصول على أدق التفاصيل.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AISuggestions;
