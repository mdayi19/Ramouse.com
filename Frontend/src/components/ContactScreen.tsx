import React, { useState } from 'react';
import { Settings } from '../types';
import Icon from './Icon';

interface ContactScreenProps {
  onBack: () => void;
  settings: Settings;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ContactScreen: React.FC<ContactScreenProps> = ({ onBack, settings, showToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate sending a message
    setTimeout(() => {
      setIsSubmitting(false);
      showToast('تم إرسال رسالتك بنجاح. سنتواصل معك قريباً!', 'success');
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };
  
  const inputClasses = "block w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  
  const SocialLink: React.FC<{ href?: string; icon: React.ReactNode }> = ({ href, icon }) => {
    if (!href || href === '#') return null;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary dark:hover:text-primary-400 transition-colors">
            {icon}
        </a>
    );
  };

  return (
    <div className="w-full animate-fade-in bg-white dark:bg-darkcard rounded-xl shadow-lg p-6 sm:p-8">
      <div className="flex justify-between items-center mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary-400">تواصل معنا</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">نحن هنا للمساعدة. أرسل لنا استفسارك أو اقتراحك.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <span>العودة</span>
          <Icon name="ArrowLeft" className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">معلومات الاتصال</h2>
            <div className="flex items-start gap-4">
                <Icon name="MapPin" className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">العنوان</h3>
                    <p>{settings.companyAddress}</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Icon name="Phone" className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">الهاتف</h3>
                    <a href={`tel:${settings.companyPhone}`} className="hover:underline" dir="ltr">{settings.companyPhone}</a>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Icon name="Mail" className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">البريد الإلكتروني</h3>
                    <a href={`mailto:${settings.companyEmail}`} className="hover:underline">{settings.companyEmail}</a>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <Icon name="Users" className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold">تابعنا على الشبكات الاجتماعية</h3>
                    <div className="flex items-center gap-4 mt-2">
                        <SocialLink href={settings.facebookUrl} icon={<Icon name="Facebook" className="w-6 h-6" />} />
                        <SocialLink href={settings.instagramUrl} icon={<Icon name="Instagram" className="w-6 h-6" />} />
                        <SocialLink href={settings.twitterUrl} icon={<Icon name="Twitter" className="w-6 h-6" />} />
                        <SocialLink href={settings.linkedinUrl} icon={<Icon name="Linkedin" className="w-6 h-6" />} />
                        <SocialLink href={settings.youtubeUrl} icon={<Icon name="Youtube" className="w-6 h-6" />} />
                    </div>
                </div>
            </div>
        </div>

        {/* Contact Form */}
        <div>
             <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">أو أرسل لنا رسالة مباشرة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">الاسم</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">رسالتك</label>
                    <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} rows={5} className={inputClasses} required />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary-700 disabled:bg-slate-400">
                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ContactScreen;