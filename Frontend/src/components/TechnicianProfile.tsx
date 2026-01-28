
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Technician, TechnicianSpecialty, GalleryItem, Customer, TechnicianReview, Review } from '../types';
import Icon from './Icon';
import Rating from './Rating';
import { toCanvas } from 'qrcode';
import PrintableTechnicianProfile from './PrintableTechnicianProfile';
import SEO from './SEO';
import { generateTechnicianSchema } from '../utils/structuredData';


interface TechnicianProfileProps {
  technician: Technician;
  onBack: () => void;
  technicianSpecialties: TechnicianSpecialty[];
  userPhone: string;
  isCustomer: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode, className?: string }> = ({ icon, title, children, className }) => (
  <div className={`bg-white dark:bg-darkcard rounded-xl shadow-lg p-6 ${className}`}>
    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
      {icon}
      {title}
    </h3>
    <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
      {children}
    </div>
  </div>
);

const ReviewSection: React.FC<{
  technician: Technician;
  isCustomer: boolean;
  userPhone: string;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}> = ({ technician, isCustomer, userPhone, showToast, isAuthenticated, onLoginClick }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reviews from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/technicians/${technician.id}/reviews`);
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [technician.id]);

  const approvedReviews = useMemo(() => reviews.filter(r => r.status === 'approved').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [reviews]);
  const myReview = useMemo(() => reviews.find(r => r.user_id.toString() === userPhone || r.reviewable_id === userPhone), [reviews, userPhone]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast('الرجاء اختيار تقييم (نجمة واحدة على الأقل).', 'error');
      return;
    }
    if (!comment.trim()) {
      showToast('الرجاء كتابة تعليق.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reviewable_type: 'technician',
          reviewable_id: technician.id,
          rating,
          comment
        })
      });

      if (response.ok) {
        showToast('تم إرسال تقييمك للمراجعة. شكراً لك!', 'success');
        setRating(0);
        setComment('');
        // Optionally refresh reviews (though new review will be pending)
        const data = await response.json();
        setReviews([...reviews, data.review]);
      } else {
        const error = await response.json();
        showToast(error.message || 'فشل إرسال التقييم. الرجاء المحاولة مرة أخرى.', 'error');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showToast('حدث خطأ أثناء إرسال التقييم.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <InfoCard icon={<Icon name="Star" className="w-6 h-6" />} title="التقييمات والآراء">
      {!isAuthenticated && (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6 border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 shadow-sm">
            <Icon name="LogIn" className="w-6 h-6 text-primary dark:text-primary-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 mb-4 font-medium">يرجى تسجيل الدخول لتتمكن من إضافة تقييمك ومشاركة تجربتك.</p>
          <button onClick={onLoginClick} className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm flex items-center gap-2">
            <span>تسجيل الدخول</span>
            <Icon name="ArrowLeft" className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAuthenticated && isCustomer && !myReview && (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">أضف تقييمك</h4>
          <div className="space-y-3">
            <div>
              <Rating rating={rating} onRating={setRating} />
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="اكتب تعليقك هنا..." className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"></textarea>
            <button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white font-bold px-4 py-2 rounded-lg text-sm disabled:bg-slate-400">
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
            </button>
          </div>
        </div>
      )}
      {isAuthenticated && isCustomer && myReview && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
          <h4 className="font-semibold">تقييمك</h4>
          <Rating rating={myReview.rating} readOnly />
          <p className="text-sm italic mt-1">"{myReview.comment}"</p>
          <p className="text-xs font-bold mt-2">الحالة: {myReview.status === 'pending' ? 'قيد المراجعة' : myReview.status === 'approved' ? 'مقبول' : 'مرفوض'}</p>
          {myReview.provider_response && (
            <div className="mt-3 p-2 bg-white dark:bg-slate-800 rounded">
              <p className="text-xs font-semibold">رد الفني:</p>
              <p className="text-sm mt-1">"{myReview.provider_response}"</p>
            </div>
          )}
        </div>
      )}
      {approvedReviews.length > 0 ? (
        <div className="space-y-4">
          {approvedReviews.map(review => (
            <div key={review.id} className="pb-4 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{review.customer_name}</span>
                <Rating rating={review.rating} readOnly size="sm" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-1 italic">"{review.comment}"</p>
              {review.provider_response && (
                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <p className="text-xs font-semibold text-primary">رد الفني:</p>
                  <p className="text-sm mt-1 text-slate-700 dark:text-slate-300">"{review.provider_response}"</p>
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-left">{new Date(review.created_at).toLocaleDateString('ar-SY')}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">لا توجد تقييمات معتمدة لهذا الفني بعد.</p>
      )}
    </InfoCard>
  );
};


const TechnicianProfile: React.FC<TechnicianProfileProps> = ({ technician, onBack, technicianSpecialties, userPhone, isCustomer, showToast, isAuthenticated, onLoginClick }) => {
  const [viewingItem, setViewingItem] = useState<GalleryItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeStatus, setQrCodeStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | undefined>(technician.profilePhoto);
  const [resolvedGallery, setResolvedGallery] = useState<GalleryItem[]>(technician.gallery || []);

  const deepLink = useMemo(() => {
    return `${window.location.origin}/technicians/${encodeURIComponent(technician.id)}`;
  }, [technician.id]);

  const shareUrl = deepLink;

  useEffect(() => {
    const loadMedia = async () => {
      // Handle Profile Photo
      if (technician.profilePhoto) {
        // If it's a direct URL (from API), use it directly
        if (technician.profilePhoto.startsWith('http')) {
          setProfilePhotoUrl(technician.profilePhoto);
        }
        // If it's an IndexedDB reference, resolve it
        else if (technician.profilePhoto.startsWith('db:profilePhoto')) {
          const db = (window as any).db;
          if (db) {
            try {
              const media = await db.getMedia('profileMedia', technician.id);
              if (media?.profilePhoto) {
                setProfilePhotoUrl(URL.createObjectURL(media.profilePhoto));
              }
            } catch (e) { console.error(e); }
          }
        } else {
          // Fallback: use as-is
          setProfilePhotoUrl(technician.profilePhoto);
        }
      } else {
        setProfilePhotoUrl(undefined);
      }

      // Handle Gallery
      if (technician.gallery && technician.gallery.length > 0) {
        const db = (window as any).db;

        // Map gallery items to resolved format
        const resolved = technician.gallery.map((item: any, index: number) => {
          // API format: {type, url}
          if (item.url) {
            // Check if it's a data URI (base64 encoded image)
            if (item.url.startsWith('data:')) {
              return {
                type: item.type || 'image',
                data: item.url
              };
            }
            // Check if it's a full URL (http/https)
            else if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
              return {
                type: item.type || 'image',
                data: item.url
              };
            }
            // Otherwise it's a relative path, construct full URL
            else {
              const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';
              // Ideally VITE_API_URL should clearly indicate if it's the backend root or /api root.
              // Assuming standard non-suffixed backend root for storage unless it's strictly /api
              const backendRoot = API_BASE_URL.endsWith('/api') ? API_BASE_URL.replace('/api', '') : API_BASE_URL || '';

              // If backendRoot is empty (e.g. relative '/api'), we might need window.location.origin in some contexts, 
              // but here let's assume valid proxy or absolute URL if set. 
              // Making it relative if backendRoot is empty/relative.
              const prefix = backendRoot.startsWith('http') ? backendRoot : '';

              return {
                type: item.type || 'image',
                data: `${prefix}${item.url.startsWith('/') ? '' : '/'}${item.url}`
              };
            }
          }
          // Old format with db reference: {type, data: 'db:gallery:0'}
          else if (item.data && item.data.startsWith('db:gallery:') && db) {
            const dbIndex = parseInt(item.data.split(':')[2]);
            // Try to resolve from IndexedDB (async, but we'll return the item anyway)
            db.getMedia('profileMedia', technician.id).then((media: any) => {
              if (media?.gallery && media.gallery[dbIndex]) {
                // Update the resolved gallery with the blob URL
                setResolvedGallery(prev => {
                  const newGallery = [...prev];
                  newGallery[index] = { ...item, data: URL.createObjectURL(media.gallery[dbIndex]) };
                  return newGallery;
                });
              }
            }).catch((e: any) => console.error(e));
            return item; // Return original for now
          }
          // Old format with direct data URL
          else if (item.data) {
            return item;
          }
          // Fallback
          return {
            type: 'image',
            data: item
          };
        });
        setResolvedGallery(resolved);
      } else {
        setResolvedGallery([]);
      }
    };
    loadMedia();
  }, [technician]);




  useEffect(() => {
    if (showQrCode && qrCanvasRef.current) {
      setQrCodeStatus('loading');

      const generate = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!qrCanvasRef.current) {
          setQrCodeStatus('error');
          return;
        }

        const canvas = qrCanvasRef.current;

        try {
          await toCanvas(
            canvas,
            shareUrl,
            { width: 256, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0284c7', light: '#FFFFFF' } }
          );
          setQrCodeStatus('success');
        } catch (error) {
          console.error("QR Code generation failed:", error);
          setQrCodeStatus('error');
        }
      };

      generate();
    }
  }, [showQrCode, shareUrl]);

  const handleDownloadQr = () => {
    if (qrCanvasRef.current && qrCodeStatus === 'success') {
      const link = document.createElement('a');
      link.download = `qrcode-${technician.uniqueId}.png`;
      link.href = qrCanvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `ملف ${technician.name} الشخصي`,
      text: `اطلع على ملف ${technician.name}، فني متخصص في ${technician.specialty} في ${technician.city}.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error('Error sharing:', error);
          copyToClipboard(shareData.url);
        }
      }
    } else {
      copyToClipboard(shareData.url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('تم نسخ الرابط.', 'success');
    } catch (err) {
      console.error('Failed to copy!', err);
      showToast('فشل نسخ الرابط.', 'error');
    }
  };

  const hasSocials = technician.socials && (technician.socials.facebook || technician.socials.instagram || technician.socials.whatsapp);
  const hasGallery = resolvedGallery && resolvedGallery.length > 0;
  const specialtyInfo = technicianSpecialties.find(s => s.name === technician.specialty);
  const whatsappMessage = encodeURIComponent('مرحباً، لقد وجدت رقمك عبر تطبيق راموسة لقطع غيار السيارات.\nThis message redirect from Ramouse');

  const ActionButton: React.FC<{ onClick?: () => void; href?: string; children: React.ReactNode; className?: string; isPrimary?: boolean }> = ({ onClick, href, children, className, isPrimary }) => {
    const commonClasses = `flex items-center justify-center gap-3 w-full text-center font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 ${className}`;
    const primaryClasses = "bg-primary text-white hover:bg-primary-700";
    const secondaryClasses = "bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500";
    const finalClasses = `${commonClasses} ${isPrimary ? primaryClasses : secondaryClasses}`;

    if (href) {
      return <a href={href} target="_blank" rel="noopener noreferrer" className={finalClasses}>{children}</a>;
    }
    return <button onClick={onClick} className={finalClasses}>{children}</button>;
  };

  const SocialLink: React.FC<{ href?: string; icon: React.ReactNode; name: string }> = ({ href, icon, name }) => {
    if (!href) return null;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary-400 transition-colors p-2 bg-slate-100 dark:bg-slate-700 rounded-full" title={name}>{icon}</a>
  };

  return (
    <div className="p-4 sm:p-0 w-full max-w-5xl mx-auto animate-fade-in">
      <SEO
        title={`${technician.name} | ${technician.specialty} في ${technician.city}`}
        description={technician.description || `فني ${technician.specialty} في ${technician.city}. تواصل معه الآن لخدمات صيانة السيارات.`}
        openGraph={{
          title: `${technician.name} | ${technician.specialty}`,
          description: technician.description,
          image: technician.profilePhoto,
          type: 'profile'
        }}
        schema={{
          type: 'AutomotiveBusiness',
          data: generateTechnicianSchema(technician)
        }}
      />
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary-400 transition-colors">
          <Icon name="ArrowRight" className="h-4 w-4" />
          <span>العودة لدليل الفنيين</span>
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-darkbg rounded-2xl shadow-xl overflow-hidden">
        {/* Hero Section */}
        <div className="h-48 bg-slate-300 dark:bg-slate-800 relative">
          {resolvedGallery && resolvedGallery[0] && resolvedGallery[0].type === 'image' && (
            <img src={resolvedGallery[0].data} alt="Workshop background" className="w-full h-full object-cover blur-sm" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-darkbg dark:via-darkbg/80"></div>
        </div>

        <div className="px-6 pb-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-32 sm:-mt-24 gap-6 relative">
            {profilePhotoUrl ? (
              <img className="w-48 h-48 rounded-full object-cover ring-8 ring-slate-50 dark:ring-darkbg shadow-lg" src={profilePhotoUrl} alt={technician.name} />
            ) : (
              <div className="w-48 h-48 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-8 ring-slate-50 dark:ring-darkbg shadow-lg">
                <Icon name="User" className="w-24 h-24 text-slate-400 dark:text-slate-500" />
              </div>
            )}
            <div className="text-center sm:text-right pb-4 flex-grow">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100">{technician.name}</h1>
                {technician.isVerified && (
                  <span title="فني موثوق" className="text-primary dark:text-primary-400">
                    <Icon name="BadgeCheck" className="w-8 h-8" />
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-center sm:justify-start gap-4 text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 text-md font-semibold text-primary dark:text-primary-400">
                  {specialtyInfo?.icon ? <Icon name={specialtyInfo.icon as any} className="w-5 h-5" /> : <Icon name="Wrench" className="w-5 h-5" />}
                  <span>{technician.specialty}</span>
                </div>
                <div className="flex items-center gap-1.5 text-md font-medium">
                  <Icon name="MapPin" className="w-5 h-5" />
                  <span>{technician.city}</span>
                </div>
              </div>
              {technician.averageRating !== undefined && (
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                  <Rating rating={technician.averageRating} readOnly />
                  <span className="font-bold text-slate-700 dark:text-slate-300">{technician.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-500">({technician.reviews?.filter(r => r.status === 'approved').length || 0} تقييم)</span>
                </div>
              )}
              {hasSocials && (
                <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
                  <SocialLink href={technician.socials?.facebook} icon={<Icon name="Facebook" className="w-5 h-5" />} name="Facebook" />
                  <SocialLink href={`https://instagram.com/${technician.socials?.instagram}`} icon={<Icon name="Instagram" className="w-5 h-5" />} name="Instagram" />
                </div>
              )}
            </div>
            <div className="sm:absolute top-0 right-0 pt-24 sm:pt-0 flex items-center gap-2">
              <button onClick={handleShare} className="p-3 bg-white dark:bg-darkcard rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700">
                {copied ? <Icon name="Check" className="w-5 h-5 text-green-500" /> : <Icon name="Share2" className="w-5 h-5" />}
              </button>
              <button onClick={() => setShowQrCode(true)} className="p-3 bg-white dark:bg-darkcard rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700"><Icon name="QrCode" className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ActionButton href={`tel:${technician.id}`} isPrimary><Icon name="Phone" className="w-5 h-5" /> اتصال مباشر</ActionButton>
            {technician.socials?.whatsapp && <ActionButton href={`https://wa.me/${technician.socials.whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`} className="!bg-green-500 hover:!bg-green-600"><Icon name="MessageCircle" className="w-5 h-5" /> مراسلة واتساب</ActionButton>}
            {technician.location && <ActionButton href={`https://www.google.com/maps/dir/?api=1&destination=${technician.location.latitude},${technician.location.longitude}`}><Icon name="Navigation" className="w-5 h-5" /> الاتجاهات إلى الورشة</ActionButton>}
          </div>

          {/* Main Content */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description Section */}
              {technician.description && (
                <InfoCard icon={<Icon name="FileText" className="w-6 h-6" />} title="عن الفني">
                  <p className="leading-relaxed">{technician.description}</p>
                </InfoCard>
              )}

              {/* Gallery Section */}
              {hasGallery && (
                <InfoCard icon={<Icon name="Camera" className="w-6 h-6" />} title="معرض الأعمال">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {resolvedGallery.map((item, index) => (
                      <button key={index} onClick={() => setViewingItem(item)} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 cursor-pointer shadow-md hover:shadow-xl transition-shadow">
                        {item.type === 'image' ? (
                          <img src={item.data} alt={`Gallery item ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full relative">
                            <video src={item.data} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                              <Icon name="PlayCircle" className="w-12 h-12 text-white/80" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Review Section */}
              <ReviewSection
                technician={technician}
                isCustomer={isCustomer}
                userPhone={userPhone}
                showToast={showToast}
                isAuthenticated={isAuthenticated}
                onLoginClick={onLoginClick}
              />
            </div>

            <div className="lg:col-span-1">
              <InfoCard icon={<Icon name="Map" className="w-6 h-6" />} title="معلومات الورشة">
                <p className="font-semibold text-base">{technician.workshopAddress || 'غير محدد'}</p>
                <p className="text-slate-500">{technician.city}</p>
                {technician.location && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${technician.location.latitude},${technician.location.longitude}`} target="_blank" rel="noopener noreferrer" className="mt-4 block text-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg font-semibold">
                    عرض على الخريطة
                  </a>
                )}
              </InfoCard>
            </div>
          </div>
        </div >
      </div >

      {/* Media Viewer Modal */}
      {
        viewingItem && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in" onClick={() => setViewingItem(null)}>
            <div className="relative w-full h-full max-w-4xl max-h-[90vh] p-4">
              {viewingItem.type === 'image' ? (
                <img src={viewingItem.data} alt="Full screen view" className="w-full h-full object-contain shadow-2xl" />
              ) : (
                <video src={viewingItem.data} controls autoPlay className="w-full h-full object-contain shadow-2xl" />
              )}
            </div>
            <button onClick={() => setViewingItem(null)} className="absolute top-4 right-4 text-white text-4xl hover:opacity-80" aria-label="Close media viewer">&times;</button>
          </div>
        )
      }

      {/* QR Code Modal */}
      {
        showQrCode && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-fade-in" onClick={() => setShowQrCode(false)}>
            <div className="bg-gradient-to-br from-slate-50 to-slate-200 dark:from-darkcard dark:to-darkbg p-6 rounded-2xl shadow-2xl relative animate-modal-in w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <div className="relative text-center bg-white dark:bg-slate-800 p-6 rounded-xl shadow-inner">
                {profilePhotoUrl && <img src={profilePhotoUrl} className="w-20 h-20 rounded-full object-cover mx-auto -mt-16 mb-4 ring-4 ring-white dark:ring-slate-800" alt={technician.name} />}
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{technician.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{technician.specialty}</p>
                <div className="mt-4 p-2 bg-white dark:bg-slate-800 rounded-lg inline-block shadow-sm min-w-[272px] min-h-[272px] flex items-center justify-center">
                  {qrCodeStatus === 'loading' && (
                    <div className="w-[256px] h-[256px] flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  )}
                  {qrCodeStatus === 'error' && (
                    <div className="w-[256px] h-[256px] flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4">
                      <Icon name="AlertTriangle" className="w-8 h-8 mb-2" />
                      <p className="text-sm text-center">فشل تحميل الرمز. الرجاء المحاولة مرة أخرى.</p>
                    </div>
                  )}
                  <canvas ref={qrCanvasRef} className={`w-full max-w-[256px] h-auto ${qrCodeStatus !== 'success' ? 'hidden' : ''}`}></canvas>
                </div>
                <p className="text-xs text-slate-500 mt-4">امسح الرمز لعرض الملف الشخصي مباشرة.</p>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={handleDownloadQr} disabled={qrCodeStatus !== 'success'} className="flex-1 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed">تحميل</button>
                <button onClick={() => setShowQrCode(false)} className="flex-1 bg-slate-200 dark:bg-slate-600 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">إغلاق</button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default TechnicianProfile;
