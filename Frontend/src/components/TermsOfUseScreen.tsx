import React from 'react';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

interface TermsOfUseScreenProps {
  onBack: () => void;
}

const TermsOfUseScreen: React.FC<TermsOfUseScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full animate-fade-in bg-white dark:bg-darkcard rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
      <SEO
        title="شروط وأحكام الاستخدام | راموسة"
        description="الشروط القانونية لاستخدام منصة راموسة لخدمات السيارات وقطع الغيار في سوريا. تعرف على حقوقك والتزاماتك."
        canonical="/terms"
      />
      <SeoSchema
        type="WebPage"
        data={{
          "name": "اتفاقية شروط استخدام راموسة",
          "mainEntity": {
            "@type": "TermsOfService",
            "serviceType": "Automotive Marketplace",
            "provider": "Ramouse Platform"
          }
        }}
      />

      <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black">شروط الاستخدام</h1>
          <p className="text-slate-400 text-sm mt-1">تنظم هذه الاتفاقية العلاقة بين المستخدم ومنصة راموسة</p>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" className="h-8 w-8" />
        </button>
      </div>

      <div className="p-6 sm:p-10 space-y-10">
        <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-right">

          <div className="bg-amber-50 dark:bg-amber-900/20 border-r-4 border-amber-500 p-4 mb-8 text-amber-900 dark:text-amber-200 text-sm">
            <strong>تنبيه هام:</strong> استخدامك للمنصة يعني موافقتك الكاملة على هذه الشروط. راموسة هي "منصة وسيطة" ولا تتحقق من جودة قطع الغيار بشكل فيزيائي؛ المسؤولية تقع على عاتق البائع والمشتري.
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Icon name="UserCheck" className="text-primary h-5 w-5" />
              1. أهلية الحساب والمسؤولية
            </h2>
            <p>يجب أن تكون المعلومات المقدمة عند التسجيل (الاسم، رقم الهاتف) دقيقة. أي نشاط يتم عبر حسابك هو مسؤوليتك الشخصية. يُحظر تماماً إنشاء حسابات وهمية لأغراض التلاعب بالأسعار.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Icon name="Gavel" className="text-primary h-5 w-5" />
              2. الملكية الفكرية وقواعد البيانات
            </h2>
            <p>جميع البيانات المعروضة، بما في ذلك قائمة الأسعار وتحليلات السوق لعام 2026، هي ملكية حصرية لراموسة. يُمنع "كشط البيانات" (Scraping) أو استخدام البوتات لسحب المعلومات دون تصريح كتابي مسبق.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Icon name="AlertTriangle" className="text-primary h-5 w-5" />
              3. حدود المسؤولية (إخلاء مسؤولية)
            </h2>
            <p>راموسة لا تضمن دقة مواعيد التسليم أو تطابق قطع الغيار بنسبة 100% مع طلبك؛ نحن نوفر "جسر اتصال" فقط. النزاعات التجارية تُحل مباشرة بين الطرفين وفق قوانين حماية المستهلك المعمول بها في سوريا.</p>
          </section>

          <section className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
            <h2 className="text-xl font-bold">4. القانون الحاكم</h2>
            <p>تخضع هذه الاتفاقية وتفسر وفقاً للقوانين السورية. في حال وجود نزاع قانوني، تكون المحاكم المختصة في دمشق هي المرجع الوحيد.</p>
          </section>
        </div>

        <div className="text-center pt-10">
          <p className="text-xs text-slate-500 italic">بمجرد الضغط على "قبول" أو الاستمرار في التصفح، فإنك تعلن التزامك بهذه البنود.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUseScreen;