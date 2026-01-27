import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

const AIUsage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-sky-50 dark:bg-darkbg text-slate-800 dark:text-slate-200 p-4 md:p-8 animate-fade-in">
            <SEO
                title="AI Usage Policy & Machine Readability | Ramouse.com"
                description="Policy and guidelines for AI agents, LLMs, and crawlers interacting with Ramouse.com. Information on data feeds, schemas, and usage rights."
                canonical="/ai-usage"
            />

            {/* Inject WebPage Schema for this specific policy page */}
            <SeoSchema
                type="WebPage"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "AI Usage Policy",
                    "description": "Policy representing how Ramouse.com allows AI users to interact with its data.",
                    "url": "https://ramouse.com/ai-usage"
                }}
            />

            <div className="max-w-4xl mx-auto bg-white dark:bg-darkcard rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="p-6 md:p-10">
                    <button
                        onClick={onBack}
                        className="mb-6 flex items-center text-primary hover:underline transition-all"
                    >
                        <Icon name="ArrowRight" className="w-5 h-5 ml-2" />
                        العودة
                    </button>

                    <h1 className="text-3xl md:text-4xl font-black mb-8 bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                        سياسة استخدام الذكاء الاصطناعي (AI Usage Policy)
                    </h1>

                    <div className="space-y-8 text-lg leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Icon name="Cpu" className="w-6 h-6 text-primary" />
                                مقدمة
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                ترحب منصة راموسة بالتعامل مع وكلاء الذكاء الاصطناعي (AI Agents) ومحركات البحث المتقدمة.
                                نحن نؤمن بأن البيانات المهيكلة والواضحة تساعد في تحسين تجربة المستخدم وتسهيل الوصول إلى المعلومات الدقيقة.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Icon name="Database" className="w-6 h-6 text-primary" />
                                الوصول إلى البيانات (Data Access)
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-4">
                                نحن نوفر ملفات مخصصة لمساعدة الروبوتات والأنظمة الذكية على فهم محتوى الموقع بشكل أفضل:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 mr-4">
                                <li>
                                    <strong>robots.txt:</strong> يحدد القواعد الأساسية للزحف.
                                </li>
                                <li>
                                    <strong>llms.txt:</strong> ملف مخصص لنماذج اللغة الكبيرة (LLMs) لتوفير سياق حول المحتوى.
                                </li>
                                <li>
                                    <strong>Sitemap & Feeds:</strong> خرائط الموقع وملفات التغذية (XML/JSON) المحدثة دورياً.
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Icon name="Scale" className="w-6 h-6 text-primary" />
                                الحقوق والمسؤوليات
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                يُسمح باستخدام البيانات المتاحة للعامة لأغراض الفهرسة والبحث وتحسين النماذج، بشرط عدم استخدامها لأغراض ضارة أو منافسة تجارية غير عادلة.
                                تحتفظ راموسة بجميع حقوق الملكية الفكرية للمحتوى الأصلي.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-3">
                                يُسمح للأنظمة الذكية بقراءة وتلخيص البيانات مع ضرورة الإشارة إلى Ramouse.com كمصدر.
                                لا يُسمح بإعادة بيع البيانات الخام أو استخدامها لإنشاء قواعد بيانات منافسة.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Icon name="Code" className="w-6 h-6 text-primary" />
                                البيانات المهيكلة (Structured Data)
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400">
                                نستخدم معيار Schema.org بشكل مكثف (Datasets, Organization, Product, Offer) لضمان أن تكون البيانات
                                مفهومة آلياً بدقة عالية، مما يساعد في ظهور أفضل في نتائج البحث المتقدمة (SGE).
                            </p>
                        </section>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mt-8">
                            <h3 className="font-bold mb-2">للمطورين والباحثين:</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                يمكن العثور على التفاصيل التقنية الكاملة في ملف <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">/llms.txt</code> في الجذر الرئيسي للموقع.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIUsage;
