import React from 'react';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full animate-fade-in bg-white dark:bg-darkcard rounded-xl shadow-lg p-6 sm:p-8">
      <SEO
        title="سياسة الخصوصية | راموسة"
        description="تعرف على كيفية جمع واستخدام وحماية بياناتك في منصة راموسة."
        canonical="/privacy"
      />
      <SeoSchema
        type="WebPage"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "سياسة الخصوصية",
          "description": "سياسة الخصوصية لمنصة راموسة",
          "url": "https://ramouse.com/privacy"
        }}
      />
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-400">سياسة الخصوصية</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">آخر تحديث: {new Date().toLocaleDateString('ar-SY')}</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <span>العودة</span>
          <Icon name="ArrowLeft" className="h-4 w-4" />
        </button>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-right leading-relaxed">
        <p>نحن في راموسة لقطع غيار السيارات ("نحن"، "لنا")، نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام والكشف عن معلوماتك الشخصية عند استخدامك لتطبيقنا.</p>

        <h2 className="font-bold">1. المعلومات التي نجمعها</h2>
        <p>قد نجمع الأنواع التالية من المعلومات:</p>
        <ul>
          <li><strong>المعلومات الشخصية:</strong> مثل اسمك ورقم هاتفك وعنوانك عند التسجيل أو إجراء طلب.</li>
          <li><strong>معلومات السيارة:</strong> تفاصيل حول سيارتك (النوع، الموديل، سنة الصنع، رقم الهيكل) التي تقدمها عند طلب قطع الغيار.</li>
          <li><strong>معلومات المعاملات:</strong> تفاصيل حول الطلبات التي تقدمها والعروض التي تقبلها.</li>
          <li><strong>بيانات الاستخدام:</strong> معلومات حول كيفية تفاعلك مع تطبيقنا.</li>
        </ul>

        <h2 className="font-bold">2. كيف نستخدم معلوماتك</h2>
        <p>نستخدم المعلومات التي نجمعها من أجل:</p>
        <ul>
          <li>تقديم وتشغيل وصيانة خدماتنا.</li>
          <li>معالجة طلباتك وربطك بمزودي قطع الغيار.</li>
          <li>تحسين وتخصيص خدماتنا.</li>
          <li>التواصل معك، بما في ذلك إرسال الإشعارات وتحديثات الخدمة.</li>
          <li>منع الاحتيال وضمان أمان منصتنا.</li>
        </ul>

        <h2 className="font-bold">3. مشاركة البيانات</h2>
        <p>قد نشارك معلوماتك مع الأطراف التالية:</p>
        <ul>
          <li><strong>مزودي قطع الغيار:</strong> لمشاركة تفاصيل طلبك (بدون معلومات الاتصال المباشرة في البداية) حتى يتمكنوا من تقديم عروض الأسعار.</li>
          <li><strong>مقدمي الخدمات:</strong> الذين يساعدوننا في تشغيل أعمالنا (مثل خدمات استضافة البيانات).</li>
          <li><strong>الجهات القانونية:</strong> إذا طُلب منا ذلك بموجب القانون.</li>
        </ul>
        <p>لن نبيع معلوماتك الشخصية لأطراف ثالثة أبدًا.</p>

        <h2 className="font-bold">4. أمن البيانات</h2>
        <p>نتخذ تدابير معقولة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الكشف. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت أو تخزين إلكتروني آمنة بنسبة 100%.</p>

        <h2 className="font-bold">5. حقوقك</h2>
        <p>لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها. يمكنك إدارة معظم معلوماتك من خلال لوحة التحكم الخاصة بك.</p>

        <h2 className="font-bold">6. التغييرات على هذه السياسة</h2>
        <p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر السياسة الجديدة على هذه الصفحة.</p>

        <h2 className="font-bold">7. اتصل بنا</h2>
        <p>إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا عبر معلومات الاتصال الموجودة في تذييل الصفحة.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;