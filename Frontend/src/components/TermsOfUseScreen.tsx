import React from 'react';
import Icon from './Icon';

interface TermsOfUseScreenProps {
  onBack: () => void;
}

const TermsOfUseScreen: React.FC<TermsOfUseScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full animate-fade-in bg-white dark:bg-darkcard rounded-xl shadow-lg p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-400">شروط الاستخدام</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">آخر تحديث: {new Date().toLocaleDateString('ar-SY')}</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <span>العودة</span>
          <Icon name="ArrowLeft" className="h-4 w-4" />
        </button>
      </div>

      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-right leading-relaxed">
        <p>مرحبًا بك في راموسة لقطع غيار السيارات. من خلال استخدام تطبيقنا، فإنك توافق على الالتزام بشروط الاستخدام التالية. يرجى قراءتها بعناية.</p>

        <h2 className="font-bold">1. الموافقة على الشروط</h2>
        <p>باستخدام خدماتنا، فإنك توافق على هذه الشروط. إذا كنت لا توافق عليها، فلا تستخدم خدماتنا.</p>

        <h2 className="font-bold">2. حسابات المستخدمين</h2>
        <p>أنت مسؤول عن الحفاظ على سرية حسابك وكلمة مرورك وعن جميع الأنشطة التي تحدث تحت حسابك. يجب عليك تزويدنا بمعلومات دقيقة وكاملة عند إنشاء حسابك.</p>

        <h2 className="font-bold">3. سلوك المستخدم</h2>
        <p>أنت توافق على عدم استخدام الخدمة لأي غرض غير قانوني أو محظور. أنت توافق على عدم:</p>
        <ul>
          <li>نشر أي محتوى كاذب أو مضلل.</li>
          <li>مضايقة أو الإساءة إلى مستخدمين آخرين.</li>
          <li>محاولة الوصول غير المصرح به إلى أنظمتنا.</li>
        </ul>

        <h2 className="font-bold">4. الطلبات والمدفوعات</h2>
        <p>يعمل تطبيقنا كمنصة لربطك بمزودي قطع الغيار. نحن لسنا طرفًا في المعاملة بينك وبين المزود. أنت مسؤول عن التحقق من تفاصيل العروض والاتفاق على شروط الدفع والتسليم مع المزود.</p>

        <h2 className="font-bold">5. إخلاء المسؤولية</h2>
        <p>يتم توفير خدماتنا "كما هي". نحن لا نقدم أي ضمانات، صريحة أو ضمنية، بأن الخدمة ستكون خالية من الأخطاء أو أن جميع عروض الأسعار ستكون دقيقة.</p>

        <h2 className="font-bold">6. تحديد المسؤولية</h2>
        <p>لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو خاصة تنشأ عن استخدامك للخدمة.</p>

        <h2 className="font-bold">7. القانون الحاكم</h2>
        <p>تخضع هذه الشروط وتفسر وفقًا للقوانين المعمول بها في الجمهورية العربية السورية.</p>
        
        <h2 className="font-bold">8. اتصل بنا</h2>
        <p>إذا كان لديك أي أسئلة حول شروط الاستخدام هذه، يرجى الاتصال بنا.</p>
      </div>
    </div>
  );
};

export default TermsOfUseScreen;