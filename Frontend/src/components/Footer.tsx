import React from 'react';
import { Settings } from '../types';
import Icon from './Icon';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface FooterProps {
    settings: Settings;
    onNavigate?: (view: 'blog' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact') => void;
    className?: string;
}

const Footer: React.FC<FooterProps> = ({ settings, onNavigate, className = '' }) => {
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, view: 'blog' | 'faq' | 'privacyPolicy' | 'termsOfUse' | 'contact') => {
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
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 500);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <footer className={`relative bg-gradient-to-b from-primary to-primary-900 text-white overflow-hidden ${className}`}>

            {/* Texture Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(#f0b71a 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Decorative Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50"></div>

            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                    {/* Company Info */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shadow-lg backdrop-blur-sm">
                                <img
                                    src={settings.logoUrl}
                                    alt={settings.appName}
                                    className="w-8 h-8 object-contain"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black tracking-tight">{settings.appName}</span>
                                <span className="text-xs font-bold text-secondary tracking-[0.3em] uppercase opacity-80">Auto Parts</span>
                            </div>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-sm md:text-base max-w-xs">
                            المنصة الأولى في سوريا لخدمات السيارات. نصلك بأفضل الفنيين ومزودي قطع الغيار وسطحات النقل بسرعة وموثوقية.
                        </p>

                        {/* Social Icons */}
                        <div className="flex gap-4 pt-2">
                            <SocialIcon href="#" icon="Facebook" label="فيسبوك" color="#1877F2" />
                            <SocialIcon href="#" icon="Instagram" label="انستغرام" color="#E4405F" />
                            <SocialIcon href="#" icon="Twitter" label="تويتر" color="#1DA1F2" />
                            <SocialIcon href="#" icon="Linkedin" label="لينكد إن" color="#0A66C2" />
                        </div>
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
                                        onClick={() => {
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                            if (onNavigate && link.view !== 'welcome' && link.view !== 'store') onNavigate(link.view as any);
                                        }}
                                        className="flex items-center gap-2 text-slate-300 hover:text-secondary transition-all duration-300 hover:translate-x-[-5px] group w-fit"
                                    >
                                        <Icon name="ChevronLeft" className="w-4 h-4 text-slate-500 group-hover:text-secondary transition-colors" />
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span>
                            خدماتنا
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'دليل الفنيين',
                                'قطع الغيار',
                                'خدمات السطحات',
                                'الإعلانات المبوبة',
                                'المزادات',
                            ].map((service, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-1 bg-secondary rounded-full"></span>
                            النشرة البريدية
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                            اشترك ليصلك كل جديد عن العروض والخدمات الجديدة.
                        </p>
                        <div className="space-y-3">
                            <Input
                                placeholder="بريدك الإلكتروني"
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-secondary/50 focus:ring-secondary/20"
                            />
                            <Button
                                className="w-full bg-secondary hover:bg-secondary-500 text-primary-900 font-bold shadow-lg shadow-secondary/10"
                            >
                                اشترك الآن
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                    <p>
                        © {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة <span className="text-secondary font-bold">راموسة</span>
                    </p>
                    <div className="flex gap-6">
                        <a href="#" onClick={(e) => handleLinkClick(e, 'privacyPolicy')} className="hover:text-white transition-colors">سياسة الخصوصية</a>
                        <a href="#" onClick={(e) => handleLinkClick(e, 'termsOfUse')} className="hover:text-white transition-colors">شروط الاستخدام</a>
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

// Social Icon Helper
const SocialIcon = ({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) => {
    return (
        <a
            href={href}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group border border-white/5 hover:border-white/20"
            aria-label={label}
        >
            <Icon name={icon as any} className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" />
        </a>
    )
}

export default Footer;
