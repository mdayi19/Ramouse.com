import React, { useState, useEffect } from 'react';
import { FaqItem, ApiResponse } from '../types';
import { api } from '../lib/api';
import Icon from './Icon';
import SEO from './SEO';
import SeoSchema from './SeoSchema';

interface FaqScreenProps {
  onBack: () => void;
}

const FaqItemComponent: React.FC<{ item: FaqItem }> = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-right p-5 focus:outline-none"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
      >
        <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{item.question}</h4>
        <Icon name="ChevronDown" className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div
        id={`faq-answer-${item.id}`}
        role="region"
        aria-hidden={!isOpen}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="p-5 pt-0 text-slate-600 dark:text-slate-400">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  );
};


const FaqScreen: React.FC<FaqScreenProps> = ({ onBack }) => {
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<ApiResponse<FaqItem[]>>('/faq');

        if (response.data.success && response.data.data) {
          setFaqItems(response.data.data);
        } else {
          setError('فشل في تحميل الأسئلة الشائعة');
        }
      } catch (err) {
        console.error('Error fetching FAQs:', err);
        setError('حدث خطأ أثناء تحميل الأسئلة الشائعة');
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  useEffect(() => {
    // Schema handled by SeoSchema component
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return (
    <div className="w-full animate-fade-in">
      <SEO
        title="الأسئلة الشائعة | راموسة"
        description="إجابات على الأسئلة الأكثر شيوعاً حول خدمات راموسة، تأجير السيارات، شراء القطع، والتواصل مع الفنيين."
        canonical="/faq"
      />
      {/* Schema Injection */}
      <SeoSchema type="FAQPage" data={faqSchema} />

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-400">الأسئلة الشائعة</h1>
          <p className="text-md text-slate-500 dark:text-slate-400 mt-1">إجابات على أكثر الأسئلة التي قد تخطر ببالك.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <span>العودة</span>
          <Icon name="ArrowLeft" className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <Icon name="AlertCircle" className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      ) : faqItems.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
          <Icon name="Info" className="h-12 w-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">لا توجد أسئلة شائعة حالياً</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-darkcard rounded-xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y">
          {faqItems.map(item => (
            <FaqItemComponent key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FaqScreen;