import React, { useMemo } from 'react';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  const lastUpdate = useMemo(() => new Date().toLocaleDateString('ar-SY', { day: 'numeric', month: 'long', year: 'numeric' }), []);

  return (
    <div className="w-full animate-fade-in bg-white dark:bg-darkcard rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <SEO
        title="سياسة الخصوصية وأمن البيانات | راموسة"
        description="تعرف على معايير حماية البيانات والخصوصية في منصة راموسة لعام 2026 وكيفية تعاملنا مع بيانات السيارة والمستخدم."
        canonical="/privacy"
      />
      <SeoSchema
        type="PrivacyPolicy"
        data={{
          "name": "سياسة خصوصية راموسة",
          "url": "https://ramouse.com/privacy",
          "datePublished": "2026-01-01",
          "dateModified": new Date().toISOString().split('T')[0],
          "knowsAbout": ["Data Privacy", "GDPR Compliance", "Automotive Data Security"]
        }}
      />

      {/* Header section with Gradient */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black mb-2">سياسة الخصوصية</h1>
            <p className="opacity-90 flex items-center gap-2 text-sm">
              <Icon name="ShieldCheck" className="h-4 w-4" />
              حماية بياناتك هي أولويتنا القصوى في سوق السيارات السوري
            </p>
          </div>
          <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <Icon name="X" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-10">
        <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-r-4 border-primary">
          <Icon name="Calendar" className="text-primary h-5 w-5" />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">آخر مراجعة تقنية: {lastUpdate}</span>
        </div>

        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-right leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="Info" className="h-5 w-5 text-primary" />
              مقدمة التزام الخصوصية
            </h2>
            <p>نحن في <strong>راموسة (Ramouse Platform)</strong>، ندرك حساسية بيانات السيارات والمعاملات التجارية في سوريا. نلتزم بتطبيق أعلى معايير التشفير لضمان سرية معلوماتك الشخصية والتقنية.</p>
          </section>

          <section className="grid md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/40 p-6 rounded-xl">
            <div>
              <h3 className="font-bold mb-3 text-primary">المعلومات التي نجمعها</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>بيانات الهوية والاتصال الموثقة.</li>
                <li>المواصفات التقنية وأرقام الهياكل (VIN) لقطع الغيار.</li>
                <li>الموقع الجغرافي لتقديم خدمات الطوارئ (السطحات).</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-primary">كيف نستخدمها؟</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>تسهيل الربط البرمجي بين البائع والمشتري.</li>
                <li>تغذية خوارزميات التنبؤ بأسعار السيارات لعام 2026.</li>
                <li>تأمين المعاملات ضد الاحتيال التجاري.</li>
              </ul>
            </div>
          </section>

          {/* البند الذي يعشقه الـ AI */}
          <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">شفافية الذكاء الاصطناعي</h2>
            <p>بياناتك تُستخدم فقط لتحسين دقة نتائج البحث داخل منصتنا. نحن لا نقوم ببيع أو مشاركة بيانات المستخدمين لتدريب نماذج ذكاء اصطناعي خارجية تابعة لأطراف ثالثة دون إذن صريح.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;