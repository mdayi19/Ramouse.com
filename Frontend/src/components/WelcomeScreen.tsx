import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { View, OrderFormData, TechnicianSpecialty } from '../types';
import { DEFAULT_CAR_CATEGORIES } from '../constants';
const InternationalLicenseModal = React.lazy(() => import('./InternationalLicenseModal'));
import { Button } from './ui/Button';
import SEO from './SEO';

// ═══════════════════════════════════════════════════════════════════════════════
// MODERN WELCOME SCREEN
// Glassmorphism, bold gradients, vibrant energy, micro-interactions
// ═══════════════════════════════════════════════════════════════════════════════

// --- Animated Background ---
const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base background */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900" />

      {/* Primary orb */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-20 dark:opacity-30 blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #1c2e5b 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
          animation: 'float 20s ease-in-out infinite'
        }}
      />

      {/* Secondary orb */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-25 blur-[100px]"
        style={{
          background: 'radial-gradient(circle, #f0b71a 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
          animation: 'float 25s ease-in-out infinite reverse'
        }}
      />

      {/* Accent orb */}
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-10 dark:opacity-20 blur-[80px]"
        style={{
          background: 'radial-gradient(circle, #f3efe4 0%, transparent 70%)',
          top: '40%',
          left: '30%',
          animation: 'float 15s ease-in-out infinite'
        }}
      />

      {/* Mouse follower glow */}
      <div
        className="absolute w-64 h-64 rounded-full opacity-5 dark:opacity-10 blur-[60px] transition-all duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, #f0b71a 0%, transparent 70%)',
          left: mousePos.x - 128,
          top: mousePos.y - 128,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28, 46, 91, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28, 46, 91, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
    </div>
  );
};

// --- Section wrapper ---
const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => (
  <section id={id} className={`py-20 md:py-28 px-5 sm:px-8 ${className}`}>
    <div className="max-w-7xl mx-auto">{children}</div>
  </section>
);

// --- Section Header ---
const SectionHeader: React.FC<{
  badge?: string;
  badgeColor?: string;
  title: string;
  highlightedWord?: string;
  highlightGradient?: string;
  description?: string;
}> = ({
  badge,
  badgeColor = 'bg-primary/10 text-primary',
  title,
  highlightedWord,
  highlightGradient = 'from-primary to-primary-600',
  description
}) => (
    <div className="text-center mb-20 animate-fade-in-up">
      {badge && (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-current opacity-90 ${badgeColor}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse mr-2"></span>
          {badge}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
        {highlightedWord ? (
          <>
            {title.split(highlightedWord)[0]}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${highlightGradient} px-1 relative`}>
              {highlightedWord}
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary opacity-40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="5" fill="none" />
              </svg>
            </span>
            {title.split(highlightedWord)[1]}
          </>
        ) : title}
      </h2>
      {description && (
        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">{description}</p>
      )}
    </div>
  );

// --- Service Card with glow effect ---
const ServiceCard: React.FC<{
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void; loading?: boolean };
  secondaryAction: { label: string; onClick: () => void };
}> = ({ icon, gradientFrom, gradientTo, title, description, primaryAction, secondaryAction }) => (
  <div className="group relative p-10 rounded-[2.5rem] bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 hover:border-primary/20 transition-all duration-700 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 hover:-translate-y-2 hover:shadow-primary/10">
    {/* Animated background gradient orbs */}
    <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
    <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br ${gradientTo} ${gradientFrom} rounded-full blur-[80px] opacity-5 group-hover:opacity-15 transition-opacity duration-700`} />

    <div className="relative z-10">
      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-8 shadow-xl shadow-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
        <Icon name={icon as any} className="w-10 h-10 text-white" />
      </div>

      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">{title}</h3>
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">{description}</p>

      <div className="flex flex-col gap-4">
        <Button
          onClick={primaryAction.onClick}
          isLoading={primaryAction.loading}
          icon={!primaryAction.loading ? "MapPin" : undefined}
          className={`h-auto py-4 rounded-2xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-bold text-lg hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-[0.98] border-0`}
        >
          {primaryAction.label}
        </Button>
        <Button
          onClick={secondaryAction.onClick}
          variant="outline"
          className="h-auto py-4 rounded-2xl bg-white/50 dark:bg-slate-700/50 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold hover:bg-white dark:hover:bg-slate-700 transition-all hover:border-primary/30"
        >
          <span>{secondaryAction.label}</span>
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
        </Button>
      </div>
    </div>
  </div>
);

// --- Feature Card with hover animation ---
const FeatureCard: React.FC<{
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  title: string;
  description: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ icon, gradientFrom, gradientTo, title, description, isHovered, onHover, onLeave }) => (
  <div
    className={`group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 ${isHovered ? 'ring-2 ring-secondary/50' : ''}`}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
  >
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-6 shadow-xl shadow-primary/10 transition-all duration-500 ${isHovered ? 'scale-125 rotate-6' : ''}`}>
      <Icon name={icon as any} className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{description}</p>

    {/* Bottom gradient line */}
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} transform origin-left transition-transform duration-500 ${isHovered ? 'scale-x-100' : 'scale-x-0'}`} />
  </div>
);

// --- Floating Elements for Hero ---
const FloatingElements: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* Floating car emojis */}
    {['🚗', '🚙', '🏎️', '🔧', '⚡', '🛞'].map((emoji, i) => (
      <div
        key={i}
        className="absolute text-4xl opacity-20 dark:opacity-10"
        style={{
          left: `${10 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
          animation: `float ${8 + i * 2}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
        }}
      >
        {emoji}
      </div>
    ))}

    {/* Animated circles */}
    <div className="absolute top-10 right-10 w-20 h-20 border-4 border-primary/10 rounded-full animate-spin-slow" />
    <div className="absolute bottom-20 left-10 w-32 h-32 border-2 border-secondary/10 rounded-full animate-ping-slow" />
  </div>
);

// --- Process Step ---
const ProcessStep: React.FC<{
  number: string;
  icon: string;
  title: string;
  description: string;
}> = ({ number, icon, title, description }) => (
  <div className="text-center relative group">
    <div className="relative inline-block mb-6">
      <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-secondary/30 transition-all duration-500">
        <Icon name={icon as any} className="w-10 h-10 text-primary dark:text-secondary" />
      </div>
      <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-orange-400 flex items-center justify-center text-sm font-black text-primary-900 shadow-lg border-2 border-white dark:border-slate-900">
        {number}
      </span>
    </div>
    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary dark:group-hover:text-secondary transition-colors">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
  </div>
);

// --- Quick Link Button ---
const QuickLink: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-center justify-center p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:border-secondary dark:hover:border-secondary hover:shadow-lg hover:shadow-secondary/10 dark:hover:shadow-secondary/20 hover:-translate-y-1 transition-all duration-300"
  >
    <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all ${icon === 'towtruck' ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-700 group-hover:bg-secondary/10'}`}>
      <Icon name={icon as any} className={icon === 'towtruck' ? "w-10 h-10 text-white" : "w-7 h-7 text-primary dark:text-white group-hover:text-secondary"} />
    </div>
    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-white text-center leading-tight">{label}</span>
  </button>
);

// --- Category Chip ---
const CategoryChip: React.FC<{
  flag: string;
  name: string;
  onClick: () => void;
}> = ({ flag, name, onClick }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-95"
  >
    <span className="text-xl group-hover:scale-125 transition-transform">{flag}</span>
    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-white">{name}</span>
  </button>
);

// --- Main Component ---
interface WelcomeScreenProps {
  onStart: (prefillData?: Partial<OrderFormData>) => void;
  onViewOrders: () => void;
  onViewAnnouncements: () => void;
  isAuthenticated: boolean;
  onNavigate?: (view: View, params?: any) => void;
  onLoginClick: () => void;
  showInstallPrompt?: boolean;
  installApp?: () => Promise<boolean>;
  isInstalled?: boolean;
  technicianSpecialties: TechnicianSpecialty[];
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStart,
  onViewOrders,
  onViewAnnouncements,
  isAuthenticated,
  onNavigate,
  onLoginClick,
  showInstallPrompt,
  installApp,
  isInstalled,
  technicianSpecialties
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInternationalLicenseModal, setShowInternationalLicenseModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [specialtySearchText, setSpecialtySearchText] = useState('');

  const filteredSpecialties = technicianSpecialties.filter(s =>
    s.name.toLowerCase().includes(specialtySearchText.toLowerCase())
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleFindNearest = (type: 'technicians' | 'towTrucks') => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setIsLocating(false);
          console.error("Geolocation error:", error);
          onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory');
        }
      );
    } else {
      setIsLocating(false);
      onNavigate?.(type === 'technicians' ? 'technicianDirectory' : 'towTruckDirectory');
    }
  };

  const carCategories = DEFAULT_CAR_CATEGORIES.slice(0, 5);

  const features = [
    {
      icon: 'Zap',
      gradientFrom: 'from-secondary',
      gradientTo: 'to-orange-500',
      title: 'سريع وبسيط',
      description: 'طلبك يصل للمزودين خلال ثوانٍ. استقبل عروض متعددة واختر الأنسب.'
    },
    {
      icon: 'ShieldCheck',
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-teal-600',
      title: 'مزودون موثوقون',
      description: 'نختار بعناية. كل مزود وفني مُعتمد وموثوق من مجتمع راموسة.'
    },
    {
      icon: 'Gem',
      gradientFrom: 'from-blue-400',
      gradientTo: 'to-primary',
      title: 'أسعار شفافة',
      description: 'قارن الأسعار بوضوح. لا وسطاء، لا مفاجآت. ادفع بطريقتك.'
    },
  ];

  const steps = [
    { num: '01', icon: 'ClipboardList', title: 'سجّل طلبك', desc: 'حدد السيارة والقطعة. أضف صوراً إن أردت.' },
    { num: '02', icon: 'Bell', title: 'استقبل العروض', desc: 'عروض من مزودين متعددين خلال دقائق.' },
    { num: '03', icon: 'Package', title: 'استلم واستمتع', desc: 'اختر العرض الأنسب واستلم طلبك.' },
  ];

  const quickLinks = [
    { icon: 'Star', label: 'التقييمات', onClick: () => { } },
    { icon: 'Megaphone', label: 'الإعلانات', onClick: onViewAnnouncements },
    {
      icon: 'Globe',
      label: 'رخصة دولية',
      onClick: () => {
        if (!isAuthenticated) {
          onLoginClick();
        } else {
          setShowInternationalLicenseModal(true);
        }
      }
    },
    { icon: 'Wrench', label: 'فنيين', onClick: () => onNavigate?.('technicianDirectory') },
    { icon: 'towtruck', label: 'سطحات', onClick: () => onNavigate?.('towTruckDirectory') },
  ];

  return (
    <div className="w-full min-h-screen text-slate-900 dark:text-white" dir="rtl">
      <SEO
        title="راموسة | المنصة الأولى لخدمات السيارات في سوريا"
        description="اربط سيارتك بأفضل الفنيين، سطحات النقل، ومزودي قطع الغيار في سوريا. خدمة سريعة، أسعار شفافة، وموثوقية عالية."
        openGraph={{
          title: "راموسة | ثورة في عالم خدمات السيارات",
          description: "اطلب قطع الغيار، احجز موعد صيانة، أو اطلب سطحة بضغطة زر.",
          image: "https://ramouse.com/og-image-home.jpg"
        }}
        schema={{
          type: "WebSite",
          data: {
            "name": "Ramouse",
            "url": "https://ramouse.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://ramouse.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        }}
      />
      <AnimatedBackground />

      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <section className="min-h-[85vh] flex items-center px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className={`transition-all duration-1000 ${mounted ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 mb-8 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide">المنصة الأولى لخدمات السيارات</span>
              </div>

              {/* Headline */}
              <h1 className="mb-8">
                <span
                  className="block text-6xl sm:text-7xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-4 drop-shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #1c2e5b 0%, #2952ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  راموسة
                </span>
                <span className="block text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mt-4 tracking-tight">
                  ثورة في عالم <span className="text-secondary relative">
                    خدمات السيارات
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-secondary opacity-30" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="5" fill="none" />
                    </svg>
                  </span>
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed mb-12 font-medium">
                قطع غيار أصلية، فنيين معتمدين، وسطحات متاحة على مدار الساعة. نربطك بالمزودين مباشرة.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-5 mb-16">
                <Button
                  onClick={() => onStart()}
                  className="group relative px-10 h-auto py-5 rounded-2xl bg-gradient-to-r from-primary to-primary-600 text-white font-bold text-xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] border-0"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-4">
                    <Icon name="CirclePlus" className="w-6 h-6 animate-pulse" />
                    <span>ابدأ طلبك الآن</span>
                  </span>
                </Button>

                <Button
                  onClick={() => onNavigate?.('store')}
                  variant="outline"
                  className="group px-10 h-auto py-5 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xl hover:bg-white/60 dark:hover:bg-slate-700/60 hover:border-secondary transition-all shadow-lg"
                >
                  <Icon name="ShoppingBag" className="w-6 h-6 text-secondary mr-3 transition-transform group-hover:rotate-12" />
                  <span>تصفح المتجر</span>
                </Button>

                {showInstallPrompt && (
                  <Button
                    onClick={async () => {
                      setIsInstalling(true);
                      await installApp?.();
                      setIsInstalling(false);
                    }}
                    isLoading={isInstalling}
                    variant="outline"
                    className="group px-10 h-auto py-5 rounded-2xl bg-secondary/20 dark:bg-secondary/10 backdrop-blur-xl border-2 border-secondary text-slate-800 dark:text-white font-bold text-xl hover:bg-secondary/30 transition-all shadow-lg animate-bounce-subtle"
                  >
                    <Icon name="Download" className="w-6 h-6 text-secondary mr-3" />
                    <span>تثبيت التطبيق</span>
                  </Button>
                )}

                {isInstalled && (
                  <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Icon name="CheckCircle" className="w-5 h-5" />
                    <span>أنت تستخدم التطبيق المثبت</span>
                  </div>
                )}
              </div>

              {/* Category Chips */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px w-8 bg-secondary"></div>
                  <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">اختر فئة سيارتك</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {carCategories.map((cat) => (
                    <CategoryChip
                      key={cat.id}
                      flag={cat.flag}
                      name={cat.name}
                      onClick={() => onStart({ category: cat.name })}
                    />
                  ))}
                  <CategoryChip
                    flag="🚗"
                    name="فئة أخرى"
                    onClick={() => onStart({ category: 'غير متأكد' })}
                  />
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className={`hidden lg:block transition-all duration-1000 delay-300 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="relative w-full max-w-md mx-auto hover:rotate-1 transition-transform duration-700">
                {/* Background glow cards */}
                <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-primary/20 to-secondary/20 blur-xl transform rotate-6" />
                <div className="absolute inset-2 rounded-[2rem] bg-gradient-to-br from-secondary/20 to-primary/20 blur-lg transform -rotate-3" />

                {/* Main card */}
                <div className="relative rounded-[2.5rem] bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/50 dark:border-slate-600/50 p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-800 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                      <Icon name="ShieldCheck" className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">خدمة موثوقة</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">مزودون معتمدون ومراجعون</p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { value: '+5K', label: 'مستخدم' },
                      { value: '+200', label: 'مزود' },
                      { value: '4.9', label: 'تقييم' },
                    ].map((stat, i) => (
                      <div key={i} className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                        <div className="text-2xl font-black text-primary dark:text-secondary">{stat.value}</div>
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-400 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                      </div>
                      <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">23 طلب نشط الآن</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Icon name="ArrowLeft" className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SERVICES SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          badge="خدماتنا"
          title="خدمات احترافية"
          highlightedWord="احترافية"
          description="فنيون معتمدون وسطحات جاهزة في منطقتك على مدار الساعة"
        />

        <div className="grid md:grid-cols-2 gap-8">
          <ServiceCard
            icon="Wrench"
            gradientFrom="from-primary"
            gradientTo="to-blue-600"
            title="دليل الفنيين"
            description="ورشات ميكانيك موثوقة، تقييمات حقيقية، وتواصل مباشر مع أفضل الفنيين في منطقتك."
            primaryAction={{
              label: 'الأقرب مني',
              onClick: () => handleFindNearest('technicians'),
              loading: isLocating
            }}
            secondaryAction={{
              label: 'تصفح الكل',
              onClick: () => onNavigate?.('technicianDirectory')
            }}
          />

          <ServiceCard
            icon="towtruck"
            gradientFrom="from-secondary"
            gradientTo="to-orange-500"
            title="خدمات السطحات"
            description="تعطلت سيارتك؟ اعثر على أقرب سطحة إليك. خدمة سريعة وموثوقة على مدار الساعة."
            primaryAction={{
              label: 'الأقرب مني',
              onClick: () => handleFindNearest('towTrucks'),
              loading: isLocating
            }}
            secondaryAction={{
              label: 'تصفح الكل',
              onClick: () => onNavigate?.('towTruckDirectory')
            }}
          />
        </div>
      </Section>

      {/* Specialty Directory Section */}
      <Section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] -z-10" />

        <SectionHeader
          badge="دليل التخصصات"
          title="ابحث عن التخصص"
          highlightedWord="التخصص"
          description="اختر التخصص المطلوب للوصول المباشر إلى الفنيين المحترفين"
        />

        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl group-focus-within:bg-primary/10 transition-all duration-500" />
            <div className="relative flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-2 border-slate-200 dark:border-slate-700/50 rounded-3xl p-2 focus-within:border-primary transition-all duration-300">
              <Icon name="Search" className="w-6 h-6 mr-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن تخصص (ميكانيكي، كهربجي، دوزان...)"
                value={specialtySearchText}
                onChange={(e) => setSpecialtySearchText(e.target.value)}
                className="flex-1 bg-transparent py-4 text-lg font-medium outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {specialtySearchText && (
                <button
                  onClick={() => setSpecialtySearchText('')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors mr-2"
                >
                  <Icon name="X" className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSpecialties.map((spec) => (
            <button
              key={spec.id}
              onClick={() => onNavigate?.('technicianDirectory', { specialty: spec.name })}
              className="flex flex-col items-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-100 dark:border-slate-700/50 rounded-3xl hover:border-primary hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Icon name={spec.icon as any} className="w-8 h-8 text-primary group-hover:text-white" />
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 text-center line-clamp-2 group-hover:text-primary dark:group-hover:text-white transition-colors">
                {spec.name}
              </span>
            </button>
          ))}

          {filteredSpecialties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              لم يتم العثور على تخصصات تطابق بحثك...
            </div>
          )}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Section className="bg-slate-50/50 dark:bg-slate-800/30 rounded-[3rem] my-10">
        <SectionHeader
          badge="لماذا راموسة"
          badgeColor="bg-secondary/10 text-secondary-600"
          title="تجربة مختلفة"
          highlightedWord="مختلفة"
          highlightGradient="from-secondary to-orange-500"
        />

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              icon={feature.icon}
              gradientFrom={feature.gradientFrom}
              gradientTo={feature.gradientTo}
              title={feature.title}
              description={feature.description}
              isHovered={hoveredFeature === i}
              onHover={() => setHoveredFeature(i)}
              onLeave={() => setHoveredFeature(null)}
            />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Section>
        <SectionHeader
          badge="كيف تعمل"
          badgeColor="bg-primary/10 text-primary"
          title="ثلاث خطوات فقط"
          highlightedWord="فقط"
          highlightGradient="from-primary to-blue-500"
        />

        <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent dashed" />

          {steps.map((step, i) => (
            <ProcessStep
              key={i}
              number={step.num}
              icon={step.icon}
              title={step.title}
              description={step.desc}
            />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          QUICK LINKS SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Section className="bg-slate-50/50 dark:bg-slate-800/30">
        <SectionHeader
          badge="اكتشف المزيد"
          title="خدمات إضافية"
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {quickLinks.map((link, i) => (
            <QuickLink
              key={i}
              icon={link.icon}
              label={link.label}
              onClick={link.onClick}
            />
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA SECTION
      ═══════════════════════════════════════════════════════════════ */}
      <Section>
        <div className="relative p-12 md:p-24 rounded-[3rem] bg-gradient-to-br from-primary via-primary-800 to-primary-900 overflow-hidden shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-[80px]" />

          <div className="relative z-10 text-center">
            <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter">
              جاهز تبدأ؟
            </h2>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
              انضم لآلاف المستخدمين. سجل طلبك الأول الآن — <span className="text-secondary font-bold">مجاناً</span>.
            </p>
            <Button
              onClick={() => onStart()}
              className="px-12 h-auto py-6 bg-secondary text-primary-900 rounded-3xl font-black text-xl hover:bg-secondary-300 hover:shadow-2xl hover:shadow-secondary/20 transition-all hover:scale-105 active:scale-95 border-0"
            >
              🚀 ابدأ الآن
            </Button>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════
          MOBILE STICKY CTA
      ═══════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden animate-slide-up-fade">
        <Button
          onClick={() => onStart()}
          className="w-full bg-gradient-to-r from-primary to-primary-700 text-white font-bold h-auto py-5 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform border-0"
        >
          <Icon name="CirclePlus" className="w-5 h-5" />
          <span>ابدأ طلبك الآن</span>
        </Button>
      </div>

      {/* Bottom spacing for mobile sticky */}
      <div className="h-24 md:hidden" />

      {/* International License Modal */}
      <React.Suspense fallback={null}>
        {showInternationalLicenseModal && (
          <InternationalLicenseModal
            onClose={() => setShowInternationalLicenseModal(false)}
            onSuccess={(orderNumber) => {
              console.log('Order created:', orderNumber);
              setShowInternationalLicenseModal(false);
            }}
          />
        )}
      </React.Suspense>
    </div>
  );
};

export default WelcomeScreen;
