import React, { Suspense } from 'react';
import { View, OrderFormData, TechnicianSpecialty } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';
import SEO from './SEO';
import Icon from './Icon';
import SeoSchema from './SeoSchema';
import { generateDatasetSchema } from '../utils/structuredData';

// Lazy load the two screen variants
const MobileWelcomeScreen = React.lazy(() =>
  import('./welcome/MobileWelcomeScreen').then(m => ({ default: m.MobileWelcomeScreen }))
);
const DesktopWelcomeScreen = React.lazy(() =>
  import('./welcome/DesktopWelcomeScreen').then(m => ({ default: m.DesktopWelcomeScreen }))
);

// Animated Background Component
const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const isMobile = useMediaQuery('(max-width: 768px)');

  React.useEffect(() => {
    if (!isMobile) {
      const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => setMousePos({ x: e.clientX, y: e.clientY }));
      };
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isMobile]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
      {/* Base background */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900" />

      {/* Primary orb - smaller on mobile */}
      <div
        className="absolute rounded-full opacity-20 dark:opacity-30 will-change-transform
          w-[300px] h-[300px] blur-[60px] md:w-[800px] md:h-[800px] md:blur-[120px]"
        style={{
          background: 'radial-gradient(circle, #1c2e5b 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animation: isMobile ? 'none' : 'float 20s ease-in-out infinite',
          transform: 'translateZ(0)'
        }}
      />

      {/* Secondary orb - hidden on mobile for performance */}
      <div
        className="hidden md:block absolute w-[600px] h-[600px] rounded-full opacity-15 dark:opacity-25 blur-[100px] will-change-transform"
        style={{
          background: 'radial-gradient(circle, #f0b71a 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
          animation: 'float 25s ease-in-out infinite reverse',
          transform: 'translateZ(0)'
        }}
      />

      {/* Accent orb - hidden on mobile */}
      <div
        className="hidden lg:block absolute w-[400px] h-[400px] rounded-full opacity-10 dark:opacity-20 blur-[80px] will-change-transform"
        style={{
          background: 'radial-gradient(circle, #f3efe4 0%, transparent 70%)',
          top: '40%',
          left: '30%',
          animation: 'float 15s ease-in-out infinite',
          transform: 'translateZ(0)'
        }}
      />

      {/* Mouse follower glow - desktop only */}
      {!isMobile && (
        <div
          className="absolute w-64 h-64 rounded-full opacity-5 dark:opacity-10 blur-[60px] transition-all duration-1000 ease-out will-change-transform"
          style={{
            background: 'radial-gradient(circle, #f0b71a 0%, transparent 70%)',
            left: mousePos.x - 128,
            top: mousePos.y - 128,
            transform: 'translateZ(0)'
          }}
        />
      )}

      {/* Grid pattern - lighter on mobile */}
      <div
        className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] dark:opacity-[0.03] dark:md:opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28, 46, 91, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28, 46, 91, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
};

// Loading fallback
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] w-full text-primary animate-in fade-in duration-300">
    <Icon name="Loader" className="w-10 h-10 animate-spin mb-4" />
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">جاري التحميل...</p>
  </div>
);

// Main Component Props
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

/**
 * Welcome Screen - Dual Layout Strategy
 * 
 * Mobile (< 768px): Native app-style home screen with quick action grid
 * Desktop (≥ 768px): Professional landing page with rich content
 */
const WelcomeScreen: React.FC<WelcomeScreenProps> = (props) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Get user name from localstorage for mobile greeting
  const [userName, setUserName] = React.useState<string>('');
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (props.isAuthenticated) {
      try {
        const userStr = localStorage.getItem('currentUser');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || '');
        }
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, [props.isAuthenticated]);

  return (
    <div className="w-full min-h-screen text-slate-900 dark:text-white" dir="rtl">
      {/* SEO Meta Tags */}
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

      {/* Dataset Schema for AI Authority */}
      <SeoSchema type="Dataset" data={generateDatasetSchema()} />

      {/* Animated Background */}
      <AnimatedBackground />

      {/* Conditional Screen Rendering */}
      <Suspense fallback={<PageLoader />}>
        {isMobile ? (
          <MobileWelcomeScreen
            {...props}
            userName={userName}
            unreadCount={unreadCount}
          />
        ) : (
          <DesktopWelcomeScreen {...props} />
        )}
      </Suspense>
    </div>
  );
};

export default WelcomeScreen;
