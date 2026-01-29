import React from 'react';
import { Settings } from '../types';
import Icon from './Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import SeoSchema from './SeoSchema';

interface FooterProps {
    settings: Settings;
    onNavigate?: (view: 'blog' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact' | 'aiUsage') => void;
    className?: string;
}

const Footer: React.FC<FooterProps> = ({ settings, onNavigate, className = '' }) => {
    // Add structured data for the footer - officially telling Google about the platform identity
    const footerSchema = {
        "@context": "https://schema.org",
        "@type": "WPFooter",
        "copyrightYear": new Date().getFullYear(),
        "copyrightHolder": {
            "@type": "Organization",
            "name": settings.appName,
            "url": "https://ramouse.com",
            "logo": settings.logoUrl
        }
    };

    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, view: 'blog' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact' | 'aiUsage') => {
        e.preventDefault();
        if (onNavigate) {
            onNavigate(view);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [showBackToTop, setShowBackToTop] = React.useState(false);

    React.useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setShowBackToTop(window.scrollY > 500);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <footer className={`relative bg-gradient-to-b from-primary to-primary-900 text-white overflow-hidden ${className}`} role="contentinfo">
            {/* Inject Schema programmatically to enhance Google linking */}
            <SeoSchema type="WPFooter" data={footerSchema} />

            {/* Texture Overlay - Improved for better visibility */}
            <div
                className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#f0b71a 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}
                aria-hidden="true"
            />

            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" aria-hidden="true" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 md:py-20 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 text-right">

                    {/* Company Info */}
                    <div className="col-span-2 md:col-span-1 space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <img
                                    src={settings.logoUrl}
                                    alt={`شعار ${settings.appName}`}
                                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                                    loading="lazy"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl font-black tracking-tight">{settings.appName}</span>
                                <span className="text-[10px] sm:text-xs font-bold text-secondary tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-80">المرجع الأول للسيارات في سوريا</span>
                            </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-xs sm:text-sm md:text-base max-w-xs">
                            بوابتك السيادية لقطع الغيار، الفنيين، والأسعار الحقيقية لعام 2026. بياناتنا مهيكلة برمجياً لخدمة المستخدم والذكاء الاصطناعي.
                        </p>

                        {/* AI Manifest Links - Critical for Search and AI */}
                        <div className="flex gap-2 pt-1">
                            <a href="/llms.txt" className="text-[10px] px-2 py-0.5 border border-white/20 rounded hover:bg-white/10 transition-colors font-mono opacity-60 hover:opacity-100 hover:border-secondary/50">llms.txt</a>
                            <a href="/.well-known/ai.json" className="text-[10px] px-2 py-0.5 border border-white/20 rounded hover:bg-white/10 transition-colors font-mono opacity-60 hover:opacity-100 hover:border-secondary/50">ai.json</a>
                        </div>

                        <nav className="flex gap-3 sm:gap-4 pt-2" aria-label="وسائل التواصل الاجتماعي">
                            <SocialIcon href="#" icon="Facebook" label="فيسبوك" color="#1877F2" />
                            <SocialIcon href="#" icon="Instagram" label="انستغرام" color="#E4405F" />
                            <SocialIcon href="#" icon="Twitter" label="تويتر" color="#1DA1F2" />
                        </nav>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span>
                            روابط سريعة
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { label: 'الرئيسية', view: 'welcome' },
                                { label: 'المتجر', view: 'store' },
                                { label: 'عن راموسة', view: 'blog' },
                                { label: 'الأسئلة الشائعة', view: 'faq' },
                                { label: 'سياسة الخصوصية', view: 'privacyPolicy' },
                                { label: 'شروط الاستخدام', view: 'termsOfUse' },
                                { label: 'تواصل معنا', view: 'contact' },
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <a
                                        href={`#${link.view}`}
                                        onClick={(e) => handleLinkClick(e, link.view as any)}
                                        className="flex items-center gap-2 text-slate-300 hover:text-secondary transition-all duration-300 hover:translate-x-[-5px] group w-fit"
                                    >
                                        <Icon name="ChevronLeft" className="w-4 h-4 text-slate-500 group-hover:text-secondary transition-colors" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services Status - Showing Data Vitality */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span>
                            حالة الخدمات 2026
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { name: 'دليل الفنيين', status: 'نشط' },
                                { name: 'قطع الغيار', status: 'محدث' },
                                { name: 'خدمات السطحات', status: '24/7' },
                                { name: 'أسعار السيارات', status: 'دقيق' },
                            ].map((service, idx) => (
                                <li key={idx} className="flex items-center justify-between text-slate-300 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_5px_rgba(240,183,26,0.5)]"></div>
                                        {service.name}
                                    </div>
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-secondary/80 font-mono border border-white/5">{service.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter - Linked to AI Trusted Badge */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span>
                            النشرة البريدية
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                            اشترك في خلاصة راموسة لتلقي تحديثات السوق السوري فور صدورها.
                        </p>
                        <div className="space-y-3">
                            <Input
                                placeholder="بريدك الإلكتروني"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-secondary/50 focus:ring-secondary/20 text-right"
                            />
                            <Button
                                className="w-full bg-secondary hover:bg-secondary-500 text-primary-900 font-bold shadow-lg shadow-secondary/10"
                            >
                                اشترك الآن
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar - Improved AI Trusted Badge */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <div className="flex flex-col items-center md:items-start gap-1">
                        <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة <span className="text-secondary font-bold">راموسة - Ramouse</span></p>
                        <p className="text-[10px] opacity-50 font-mono tracking-tighter">Enterprise Edition v3.0 | Syria Automotive Knowledge Graph</p>
                    </div>

                    <div className="flex gap-4 items-center">
                        <a
                            href="#"
                            onClick={(e) => handleLinkClick(e, 'aiUsage')}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-secondary/30 transition-all text-xs group"
                        >
                            <div className="relative">
                                <Icon name="Cpu" className="w-4 h-4 text-secondary group-hover:rotate-90 transition-transform duration-500" />
                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse border border-primary"></span>
                            </div>
                            <span className="group-hover:text-secondary font-bold tracking-wider text-slate-300 transition-colors">
                                AI VERIFIED SOURCE
                            </span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Back to Top Button */}
            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 left-6 z-40 p-3 rounded-full bg-secondary text-primary-900 shadow-xl shadow-secondary/20 hover:scale-110 active:scale-95 transition-all duration-300 animate-in slide-in-from-bottom-4 md:flex hidden items-center justify-center group"
                    aria-label="Back to top"
                >
                    <Icon name="ArrowUp" className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />

                    {/* Ring Decoration */}
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-75"></span>
                </button>
            )}
        </footer>
    );
};

// Social Icon Helper (Touch-Friendly) with Dynamic Brand Colors
const SocialIcon = ({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) => {
    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <a
            href={href}
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 border border-white/5 hover:border-white/20 hover:scale-110 active:scale-95 shadow-lg shadow-transparent hover:shadow-primary/20"
            aria-label={label}
            rel="noopener noreferrer"
            target="_blank"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: isHovered ? `${color}20` : undefined, // 20% opacity background
                borderColor: isHovered ? `${color}40` : undefined
            }}
        >
            <Icon
                name={icon as any}
                className="w-5 h-5 transition-colors duration-300"
                style={{ color: isHovered ? color : '#cbd5e1' }} // slate-300 to brand color
            />
        </a>
    )
}

export default Footer;
