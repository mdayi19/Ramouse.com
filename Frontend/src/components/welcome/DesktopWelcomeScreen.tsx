import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../Icon';
import { View, OrderFormData, TechnicianSpecialty } from '../../types';


interface DesktopWelcomeScreenProps {
    onStart: (prefillData?: Partial<OrderFormData>) => void;
    onViewAnnouncements: () => void;
    isAuthenticated: boolean;
    onNavigate?: (view: View, params?: any) => void;
    onLoginClick: () => void;
    showInstallPrompt?: boolean;
    installApp?: () => Promise<boolean>;
    isInstalled?: boolean;
    technicianSpecialties: TechnicianSpecialty[];
}

/**
 * Desktop Welcome Screen - Premium Design
 * Optimized for LCP (Largest Contentful Paint) and CLS (Cumulative Layout Shift)
 */
export const DesktopWelcomeScreen: React.FC<DesktopWelcomeScreenProps> = ({
    onStart,
    onViewAnnouncements,
    isAuthenticated,
    onNavigate,
}) => {
    const [mounted, setMounted] = useState(false);
    const [userCount] = useState(15247);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const stagger = {
        visible: {
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden bg-slate-50 dark:bg-slate-950 font-sans selection:bg-blue-500/30" dir="rtl">
            {/* Optimized Background - using CSS will-change for performance */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 dark:brightness-50 mix-blend-overlay"></div>

                {/* CSS Animated Blobs */}
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }} />
            </div>



            {/* Hero Section */}
            <motion.section
                initial="hidden"
                animate={mounted ? "visible" : "hidden"}
                variants={stagger}
                className="container mx-auto px-6 lg:px-12 pt-16 pb-24 relative z-10"
            >
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="relative">
                        <motion.div variants={fadeIn}>
                            <div className="inline-flex items-center gap-3 px-4 py-2 mb-8 rounded-full bg-blue-50/80 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 backdrop-blur-sm">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                    {userCount.toLocaleString()}+ عميل يثقون بنا
                                </span>
                            </div>

                            <h1 className="text-8xl font-black mb-6 leading-tight tracking-tight text-slate-900 dark:text-white">
                                <span className="transparent-text bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                                    راموسة
                                </span>
                                <br />
                                <span className="text-4xl lg:text-5xl text-slate-700 dark:text-slate-300 block mt-2">
                                    مستقبل خدمات السيارات
                                </span>
                            </h1>

                            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-lg">
                                منصة واحدة تجمع كل ما تحتاجه سيارتك. من قطع الغيار والصيانة، إلى المزادات والخدمات الطارئة.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <motion.button
                                    onClick={() => onStart()}
                                    whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(59 130 246 / 0.4)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-xl shadow-blue-500/20 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                    <span className="relative flex items-center gap-3">
                                        ابدأ طلبك الآن <Icon name="ArrowLeft" className="w-5 h-5 rotate-180" />
                                    </span>
                                </motion.button>

                                <motion.button
                                    onClick={() => onNavigate?.('store')}
                                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.8)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-8 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-lg hover:shadow-lg transition-all"
                                >
                                    تصفح المتجر
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Trust Badges */}
                        <motion.div variants={fadeIn} className="mt-12 flex items-center gap-8 text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-8">
                            <div className="flex items-center gap-2">
                                <Icon name="Shield" className="w-5 h-5 text-emerald-500" />
                                <span className="font-semibold text-sm">ضمان الجودة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon name="Zap" className="w-5 h-5 text-yellow-500" />
                                <span className="font-semibold text-sm">سرعة الاستجابة</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Icon name="Users" className="w-5 h-5 text-blue-500" />
                                <span className="font-semibold text-sm">مجتمع موثوق</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Visual */}
                    <motion.div
                        variants={fadeIn}
                        className="relative hidden lg:block"
                    >
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Glass Card 1 */}
                            <motion.div
                                animate={{ y: [0, -20, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 right-10 z-10 w-64 p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Icon name="Tool" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">قطع غيار</div>
                                        <div className="text-xs text-slate-500">أصلية ومكفولة</div>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} className="h-full bg-blue-500 rounded-full" />
                                </div>
                            </motion.div>

                            {/* Glass Card 2 */}
                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute bottom-10 left-0 z-20 w-72 p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="font-bold text-slate-900 dark:text-white">طلب سطحة</div>
                                    <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">نشط الآن</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-2 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                        <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-full" />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Central Abstract Element */}
                            <div className="absolute inset-10 rounded-full border border-blue-500/10 dark:border-blue-400/5 animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-20 rounded-full border border-purple-500/10 dark:border-purple-400/5 animate-[spin_20s_linear_infinite_reverse]" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 blur-3xl opacity-20 animate-pulse" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.section>

            {/* Services Grid */}
            <section className="container mx-auto px-6 lg:px-12 py-20">
                {/* Car Marketplace - Big Buttons */}
                <div className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">سوق السيارات</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                            تصفح، اشترِ، أو استأجر سيارتك المثالية من منصة واحدة متكاملة.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {/* Car Listings - Big Button */}
                        <motion.button
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate?.('car-listings')}
                            className="relative overflow-hidden group rounded-3xl p-8 bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 text-right"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                                    <Icon name="Car" className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">سوق السيارات</h3>
                                <p className="text-emerald-50 leading-relaxed mb-4">
                                    تصفح واشترِ سيارات جديدة ومستعملة من موردين موثوقين
                                </p>
                                <div className="flex items-center text-white font-bold">
                                    <span>تصفح الآن</span>
                                    <Icon name="ArrowLeft" className="w-5 h-5 mr-2 rotate-180" />
                                </div>
                            </div>
                        </motion.button>

                        {/* Rent Car - Big Button */}
                        <motion.button
                            whileHover={{ scale: 1.03, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onNavigate?.('rent-car')}
                            className="relative overflow-hidden group rounded-3xl p-8 bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/30 text-right"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                                    <Icon name="Key" className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">تأجير السيارات</h3>
                                <p className="text-purple-50 leading-relaxed mb-4">
                                    استأجر سيارتك المثالية بأسعار تنافسية وخيارات مرنة
                                </p>
                                <div className="flex items-center text-white font-bold">
                                    <span>عرض السيارات</span>
                                    <Icon name="ArrowLeft" className="w-5 h-5 mr-2 rotate-180" />
                                </div>
                            </div>
                        </motion.button>

                        {/* Car Auction - Big Button - Coming Soon */}
                        <motion.div
                            whileHover={{ scale: 1.01, y: -3 }}
                            className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-amber-500 to-orange-500 shadow-2xl shadow-amber-500/20 text-right opacity-75 cursor-not-allowed"
                        >
                            <div className="absolute top-4 left-4 bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 text-sm font-bold px-4 py-2 rounded-full border-2 border-amber-200 dark:border-amber-800 shadow-lg">
                                قريباً
                            </div>
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                                    <Icon name="Gavel" className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">مزاد السيارات</h3>
                                <p className="text-amber-50 leading-relaxed mb-4">
                                    مزادات حية للسيارات بأسعار تنافسية وعروض استثنائية
                                </p>
                                <div className="flex items-center text-white/70 font-bold">
                                    <span>قريباً جداً</span>
                                    <Icon name="ArrowLeft" className="w-5 h-5 mr-2 rotate-180 opacity-50" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">خدماتنا</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        منظومة متكاملة لخدمة سيارتك بأحدث التقنيات وأفضل المعايير.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'المتجر', icon: 'Store', desc: 'تصفح آلاف قطع الغيار', color: 'text-blue-500', bg: 'bg-blue-500/10', nav: 'store' },
                        { title: 'المزاد', icon: 'Gavel', desc: 'مزادات حصرية وتنافسية', color: 'text-orange-500', bg: 'bg-orange-500/10', nav: 'auctions' },
                        { title: 'دليل الفنيين', icon: 'Wrench', desc: 'أفضل الخبراء في منطقتك', color: 'text-purple-500', bg: 'bg-purple-500/10', nav: 'technicianDirectory' },
                        { title: 'السطحات', icon: 'Truck', desc: 'خدمة نقل سريعة وآمنة', color: 'text-pink-500', bg: 'bg-pink-500/10', nav: 'towTruckDirectory' },
                    ].map((service, idx) => (
                        <motion.button
                            key={idx}
                            whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                            onClick={() => onNavigate?.(service.nav as any)}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] text-right group transition-all"
                        >
                            <div className={`w-16 h-16 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <Icon name={service.icon as any} className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">{service.desc}</p>
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* How It Works - Premium Design */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50/50 dark:bg-slate-900/50" />
                <div className="container mx-auto px-6 lg:px-12 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">كيف تعمل المنصة؟</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { num: '01', title: 'سجّل طلبك', desc: 'حدد نوع سيارتك والقطعة المطلوبة بسهولة.' },
                            { num: '02', title: 'قارن العروض', desc: 'احصل على عروض أسعار من عدة مزودين.' },
                            { num: '03', title: 'اختر الأنسب', desc: 'قارن الأسعار والتقييمات واختر ما يناسبك.' },
                            { num: '04', title: 'استلم طلبك', desc: 'توصيل سريع وموثوق إلى باب منزلك.' },
                        ].map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-shadow relative z-10 h-full">
                                    <div className="text-6xl font-black text-slate-100 dark:text-slate-700/50 absolute top-4 left-4 pointer-events-none">
                                        {step.num}
                                    </div>
                                    <div className="relative pt-8">
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{step.title}</h3>
                                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{step.desc}</p>
                                    </div>
                                </div>
                                {idx < 3 && (
                                    <div className="hidden md:block absolute top-1/2 left-0 -translate-x-1/2 w-8 h-8 z-0">
                                        <Icon name="ArrowLeft" className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="container mx-auto px-6 lg:px-12 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">قصص نجاح</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { name: 'أحمد السعدي', role: 'عميل مميز', text: 'تجربة رائعة، وفرت علي الكثير من الوقت والجهد في البحث عن قطع غيار.' },
                        { name: 'ورشة السلام', role: 'شريك فني', text: 'ساعدتني المنصة في الوصول لعدد أكبر من العملاء وتنظيم عملي.' },
                        { name: 'محمد المحمود', role: 'عميل', text: 'المزادات ميزة خرافية! حصلت على قطع نادرة بأسعار ممتازة.' },
                    ].map((review, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative">
                            <div className="absolute -top-4 right-8 text-6xl text-blue-100 dark:text-blue-900/30 font-serif leading-none">"</div>
                            <p className="text-slate-600 dark:text-slate-300 mb-6 relative z-10 leading-relaxed font-medium">
                                {review.text}
                            </p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400">
                                    {review.name[0]}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white text-sm">{review.name}</div>
                                    <div className="text-xs text-blue-500 font-bold">{review.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="container mx-auto px-6 lg:px-12 pb-24">
                <div className="relative rounded-[3rem] overflow-hidden p-12 lg:p-20 text-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                    <div className="relative z-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-6">جاهز لتجربة مختلفة؟</h2>
                        <p className="text-blue-100 text-xl max-w-2xl mx-auto mb-10">
                            انضم اليوم إلى أكبر شبكة لخدمات السيارات في المنطقة.
                        </p>
                        <motion.button
                            onClick={() => onStart()}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-white text-blue-600 font-black text-xl px-10 py-5 rounded-2xl shadow-2xl hover:bg-blue-50 transition-colors"
                        >
                            ابدأ الآن مجاناً
                        </motion.button>
                    </div>
                </div>
            </section>


        </div>
    );
};
