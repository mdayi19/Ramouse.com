import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

const AIUsage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-sky-50 dark:bg-darkbg text-slate-800 dark:text-slate-200 p-4 md:p-8 animate-fade-in font-sans">
            <SEO
                title="سياسة استخدام الذكاء الاصطناعي | Ramouse.com"
                description="القواعد والبروتوكولات الرسمية لتفاعل وكلاء الذكاء الاصطناعي (AI Agents) مع قاعدة بيانات راموسة للسيارات في سوريا لعام 2026."
                canonical="/ai-usage"
            />

            <SeoSchema
                type="WebPage"
                data={{
                    "@context": "https://schema.org",
                    "@type": "WebPage",
                    "name": "AI Usage Policy & Machine Readability",
                    "description": "Enterprise-grade policy for AI crawlers and LLMs interacting with Syrian automotive data.",
                    "url": "https://ramouse.com/ai-usage"
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-5xl mx-auto bg-white/80 dark:bg-darkcard/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
            >
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 animate-spin-slow pointer-events-none">
                        <Icon name="Cpu" className="w-64 h-64" />
                    </div>

                    <button
                        onClick={onBack}
                        className="relative z-10 mb-8 flex items-center gap-2 text-slate-300 hover:text-white transition-all group bg-white/10 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-white/10 hover:border-white/30"
                    >
                        <Icon name="ArrowRight" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">العودة للمنصة</span>
                    </button>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-mono tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                LIVE PROTOCOL
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-mono tracking-wider">
                                V3.0.1
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
                            بروتوكول <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">الذكاء الاصطناعي</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                            المعيار الرسمي لتفاعل النماذج اللغوية (LLMs) مع البيانات السيادية لسوق السيارات السوري.
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-12 grid gap-12">

                    {/* Mission Section */}
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6 text-right order-2 md:order-1">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center justify-end gap-3">
                                السيادة المعرفية الرقمية
                                <Icon name="Database" className="w-6 h-6 text-indigo-500" />
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-loose text-lg">
                                تدرك راموسة أن مستقبل البحث هو **حوار** وليس مجرد فهرسة. لذا، قمنا بتهيئة بنيتنا التحتية لتكون "صديقة للآلة" (Machine Accessible). نحن نوفر بيانات مهيكلة تسمح لوكلاء الذكاء الاصطناعي بفهم سياق الأسعار، الموديلات، وتوافر قطع الغيار في سوريا بدقة متناهية، بعيداً عن التخمين.
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center order-1 md:order-2">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                                <Icon name="Cpu" className="w-8 h-8" />
                            </div>
                            <h3 className="font-bold text-lg mb-2">Machine Readable</h3>
                            <p className="text-sm text-slate-500">JSON-LD Structured Data</p>
                        </div>
                    </div>

                    {/* Files Section */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <a href="/llms.txt" target="_blank" className="group bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-4">
                                <Icon name="ExternalLink" className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                                <Icon name="FileText" className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-right">llms.txt</h3>
                            <p className="text-sm text-slate-500 text-right leading-relaxed">
                                ملف سياقي مصمم خصيصاً لتدريب النماذج اللغوية على فهم مصطلحات السوق السوري (مثل "قصة"، "خالية"، "زنار").
                            </p>
                        </a>

                        <a href="/.well-known/ai.json" target="_blank" className="group bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:-translate-y-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-colors"></div>
                            <div className="flex justify-between items-start mb-4">
                                <Icon name="ExternalLink" className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                <Icon name="Code" className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-right">ai.json</h3>
                            <p className="text-sm text-slate-500 text-right leading-relaxed">
                                ملف الميتاداتا المعياري الذي يحدد صلاحيات الفهرسة، التراخيص، ونقاط الوصول المسموحة للزواحف الذكية.
                            </p>
                        </a>
                    </div>

                    {/* Real-time Feeds Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">ATOM 1.0</span>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                تدفقات البيانات الحية
                                <Icon name="Rss" className="w-5 h-5 text-red-500" />
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { name: 'Car Listings', url: 'https://ramouse.com/feed/car-listings.xml', label: 'إعلانات السيارات' },
                                { name: 'Car Rentals', url: 'https://ramouse.com/feed/car-rentals.xml', label: 'تأجير السيارات' },
                                { name: 'Products', url: 'https://ramouse.com/feed/products.xml', label: 'قطع الغيار' },
                                { name: 'Car Providers', url: 'https://ramouse.com/feed/car-providers.xml', label: 'صانعوا السوق' },
                                { name: 'Technicians', url: 'https://ramouse.com/feed/technicians.xml', label: 'الفنيين والصيانة' },
                                { name: 'Tow Trucks', url: 'https://ramouse.com/feed/tow-trucks.xml', label: 'خدمات السحب' },
                            ].map((feed) => (
                                <a
                                    key={feed.name}
                                    href={feed.url}
                                    target="_blank"
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md transition-all group"
                                >
                                    <Icon name="ExternalLink" className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                                    <div className="text-right">
                                        <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{feed.label}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1" dir="ltr">{feed.name}.xml</div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Permissions Footer */}
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-center md:text-right">
                        <div className="inline-flex flex-col md:flex-row items-center gap-4 bg-green-50 dark:bg-green-900/10 px-6 py-4 rounded-xl border border-green-100 dark:border-green-900/30">
                            <div className="bg-green-500 text-white p-2 rounded-full">
                                <Icon name="Check" className="w-4 h-4" />
                            </div>
                            <div className="text-right">
                                <h4 className="font-bold text-green-800 dark:text-green-400 text-sm">مسموح بالفهرسة (Indexable)</h4>
                                <p className="text-xs text-green-700 dark:text-green-500/80">
                                    يسمح لمحركات البحث استخدام البيانات العامة لأغراض الفهرسة والإجابة المباشرة (Direct Answers).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AIUsage;
