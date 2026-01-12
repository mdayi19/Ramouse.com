import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toCanvas } from 'qrcode';
import Icon from '../Icon'; // Assuming Icon is in ../Icon.tsx based on file structure
import { CarProviderService } from '../../services/carprovider.service';
import type { CarListing } from '../../services/carprovider.service';
import { CarListingCard } from './MarketplaceParts/CarListingCard';
import { getStorageUrl } from '../../config/api';
import SEO from '../SEO';

interface ProviderProfile {
    id: string | number;
    user_id: number;
    name?: string;
    business_name: string;
    business_name_ar?: string;
    address?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    description?: string;
    is_verified: boolean;
    is_trusted: boolean;
    trust_score: number;
    total_listings: number;
    active_listings: number;
    total_views: number;
    member_since: string;
    logo_url?: string;
    profile_photo?: string;
    cover_photo?: string;
    working_hours?: string;
    email?: string;
    public_email?: string;
    phone?: string;
    website?: string;
    socials?: {
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
        twitter?: string;
    };
}

const InfoCard: React.FC<{ icon: string; title: string; children: React.ReactNode, className?: string }> = ({ icon, title, children, className }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-3">
            <Icon name={icon} className="w-6 h-6 text-primary dark:text-primary-400" />
            {title}
        </h3>
        <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
            {children}
        </div>
    </div>
);

const ActionButton: React.FC<{ onClick?: () => void; href?: string; children: React.ReactNode; className?: string; isPrimary?: boolean; disabled?: boolean }> = ({ onClick, href, children, className, isPrimary, disabled }) => {
    const commonClasses = `flex items-center justify-center gap-3 w-full text-center font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5 active:scale-95 ${className} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`;
    const primaryClasses = "bg-blue-600 text-white hover:bg-blue-700";
    const secondaryClasses = "bg-slate-700 text-white hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500";
    const finalClasses = `${commonClasses} ${isPrimary ? primaryClasses : secondaryClasses}`;

    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" className={finalClasses}>{children}</a>;
    }
    return <button onClick={onClick} disabled={disabled} className={finalClasses}>{children}</button>;
};

const SocialLink: React.FC<{ href?: string; icon: string; name: string }> = ({ href, icon, name }) => {
    if (!href) return null;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-2 bg-slate-100 dark:bg-slate-700 rounded-full" title={name}><Icon name={icon} className="w-5 h-5" /></a>
};

const CarProviderProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [provider, setProvider] = useState<ProviderProfile | null>(null);
    const [listings, setListings] = useState<CarListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'rent'>('all');

    // QR Code State
    const [showQrCode, setShowQrCode] = useState(false);
    const [qrCodeStatus, setQrCodeStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        loadProviderData();
    }, [id]);

    const loadProviderData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const [providerData, listingsData] = await Promise.all([
                CarProviderService.getPublicProfile(id),
                CarProviderService.getProviderListings(id)
            ]);

            setProvider(providerData);
            setListings(listingsData.data || listingsData);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'فشل تحميل بيانات المعرض');
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = useMemo(() => {
        if (activeTab === 'all') return listings;
        return listings.filter(l => l.listing_type === activeTab);
    }, [listings, activeTab]);

    const logoUrl = useMemo(() => {
        if (!provider) return null;
        return provider.logo_url ? getStorageUrl(provider.logo_url) : (provider.profile_photo ? getStorageUrl(provider.profile_photo) : null);
    }, [provider]);

    const coverUrl = useMemo(() => {
        if (!provider) return null;
        return provider.cover_photo ? getStorageUrl(provider.cover_photo) : null;
    }, [provider]);

    const shareUrl = window.location.href;

    // QR Code Generation
    useEffect(() => {
        if (showQrCode && qrCanvasRef.current) {
            setQrCodeStatus('loading');

            const generate = async () => {
                await new Promise(resolve => setTimeout(resolve, 50));

                if (!qrCanvasRef.current) {
                    setQrCodeStatus('error');
                    return;
                }

                try {
                    await toCanvas(
                        qrCanvasRef.current,
                        shareUrl,
                        { width: 256, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#2563eb', light: '#FFFFFF' } }
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
            link.download = `qrcode-${provider?.business_name || 'provider'}.png`;
            link.href = qrCanvasRef.current.toDataURL('image/png');
            link.click();
        }
    };

    const [showPhone, setShowPhone] = useState(false);

    const handleCall = () => {
        if (!showPhone) {
            setShowPhone(true);
            return;
        }
        if (provider?.phone) {
            window.location.href = `tel:${provider.phone}`;
        }
    };

    const getSocials = (p: any) => {
        if (p.socials && Object.keys(p.socials).length > 0) return p.socials;
        return {
            facebook: p.facebook,
            instagram: p.instagram,
            whatsapp: p.whatsapp,
            twitter: p.twitter,
        };
    };
    const socials = provider ? getSocials(provider) : {};
    const hasSocials = !!(socials.facebook || socials.instagram || socials.whatsapp || socials.twitter || provider?.website);
    const whatsappNumber = socials.whatsapp || provider?.phone;

    const SocialLink: React.FC<{ href?: string; icon: string; name: string; colorClass?: string }> = ({ href, icon, name, colorClass }) => {
        if (!href) return null;
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-full transition-all transform hover:scale-110 shadow-sm ${colorClass || 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
                title={name}
            >
                <Icon name={icon} className="w-5 h-5" />
            </a>
        );
    };

    const handleShare = async () => {
        if (!provider) return;
        const shareData = {
            title: provider.business_name || 'معرض سيارات',
            text: provider.description,
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy!', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">جاري تحميل المعرض...</p>
                </div>
            </div>
        );
    }

    if (error || !provider) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
                <div className="text-center max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                    <Icon name="Shield" className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">المعرض غير موجود</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        {error || 'عذراً، لم نتمكن من العثور على المعرض المطلوب.'}
                    </p>
                    <button
                        onClick={() => navigate('/car-listings')}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg shadow-blue-600/20"
                    >
                        العودة لسوق السيارات
                    </button>
                </div>
            </div>
        );
    }

    const businessName = provider.business_name || provider.name || 'معرض سيارات';
    const whatsappMessage = encodeURIComponent(`مرحباً، رأيت معرضك "${businessName}" عبر تطبيق راموسة.`);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 md:pb-20 animate-fade-in w-full">
            <SEO
                title={`${businessName} | راموسة لتجارة السيارات`}
                description={provider.description || `تصفح أحدث السيارات المعروضة لدى ${businessName} في ${provider.city}.`}
                openGraph={{
                    title: `${businessName} | معرض سيارات`,
                    description: provider.description,
                    image: logoUrl || undefined,
                    type: 'profile'
                }}
            />

            {/* Full Width Hero */}
            <div className="relative h-64 md:h-80 lg:h-96 w-full bg-slate-900 overflow-hidden group">
                {coverUrl ? (
                    <img
                        src={coverUrl}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center opacity-50">
                        <Icon name="Car" className="w-32 h-32 text-white/5" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={() => navigate('/car-listings')}
                        className="bg-white/10 backdrop-blur-md text-white p-2 rounded-full hover:bg-white/20 transition-all border border-white/10"
                    >
                        <Icon name="ArrowRight" className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-32 z-20">
                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Left Sidebar (Desktop) / Top Section (Mobile) */}
                    <div className="w-full lg:w-[350px] flex-shrink-0 space-y-6">

                        {/* Profile Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative backdrop-blur-sm">
                            {/* Logo & Basic Info */}
                            <div className="p-6 text-center">
                                <div className="relative inline-block mx-auto mb-4">
                                    {logoUrl ? (
                                        <img className="w-32 h-32 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-2xl bg-white dark:bg-slate-800" src={logoUrl} alt={businessName} />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-md">
                                            <Icon name="Store" className="w-16 h-16 text-slate-400 dark:text-slate-500" />
                                        </div>
                                    )}
                                    {provider.is_verified && (
                                        <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-sm" title="معرض موثوق">
                                            <Icon name="BadgeCheck" className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">{businessName}</h1>

                                <div className="flex flex-col gap-2 items-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="MapPin" className="w-4 h-4 text-slate-400" />
                                        <span>{provider.city || 'سوريا'} {provider.address && `- ${provider.address}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="Calendar" className="w-4 h-4 text-slate-400" />
                                        <span>عضو منذ {new Date(provider.member_since).getFullYear()}</span>
                                    </div>
                                </div>

                                {/* Main Actions (Desktop) */}
                                <div className="hidden sm:grid grid-cols-2 gap-3 mb-6">
                                    <ActionButton
                                        onClick={handleCall}
                                        className={!showPhone ? "!bg-blue-600 hover:!bg-blue-700 text-white" : "!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700"}
                                        disabled={!provider.phone}
                                    >
                                        <Icon name={showPhone ? "Phone" : "Eye"} className="w-4 h-4" />
                                        {showPhone ? provider.phone : 'إظهار الرقم'}
                                    </ActionButton>

                                    {(whatsappNumber) && (
                                        <ActionButton
                                            href={`https://wa.me/${whatsappNumber.toString().replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                                            className="!bg-green-500 hover:!bg-green-600 text-white"
                                        >
                                            <Icon name="MessageCircle" className="w-4 h-4" /> واتساب
                                        </ActionButton>
                                    )}
                                </div>

                                {/* QR & Share Row */}
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 py-2.5 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                                    >
                                        {copied ? <Icon name="Check" className="w-4 h-4 text-green-500" /> : <Icon name="Share2" className="w-4 h-4" />}
                                        مشاركة
                                    </button>
                                    <button
                                        onClick={() => setShowQrCode(true)}
                                        className="flex-1 py-2.5 px-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-900/30"
                                    >
                                        <Icon name="QrCode" className="w-4 h-4" />
                                        الرمز
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">{provider.active_listings}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">إعلان</div>
                                    </div>
                                    <div className="text-center border-r border-l border-slate-100 dark:border-slate-800">
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{provider.trust_score}%</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">الثقة</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white">{provider.total_views}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">مشاهدة</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Socials Info */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 space-y-6">
                            {(hasSocials) ? (
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Icon name="Globe" className="w-5 h-5 text-slate-400" /> تواصل معنا
                                    </h3>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {socials.facebook && <SocialLink href={socials.facebook} icon="Facebook" name="Facebook" colorClass="bg-[#1877F2] text-white hover:bg-[#1877F2]/90" />}
                                        {socials.instagram && <SocialLink href={socials.instagram} icon="Instagram" name="Instagram" colorClass="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white" />}
                                        {socials.twitter && <SocialLink href={socials.twitter} icon="ExternalLink" name="Twitter" colorClass="bg-black text-white hover:bg-black/90" />}
                                        {socials.whatsapp && <SocialLink href={`https://wa.me/${socials.whatsapp.replace(/[^0-9]/g, '')}`} icon="MessageCircle" name="WhatsApp" colorClass="bg-[#25D366] text-white hover:bg-[#25D366]/90" />}
                                        {provider.website && <SocialLink href={provider.website} icon="Globe" name="Website" colorClass="bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200" />}
                                    </div>
                                </div>
                            ) : null}

                            {/* Working Hours */}
                            <div className={hasSocials ? "pt-6 border-t border-slate-100 dark:border-slate-800" : ""}>
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                    <Icon name="Clock" className="w-5 h-5 text-orange-500" /> ساعات العمل
                                </h3>
                                <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                                    {provider.working_hours || 'غير محدد'}
                                </div>
                            </div>
                        </div>

                        {/* Map Widget */}
                        {(provider.latitude && provider.longitude) && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="250"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://www.google.com/maps?q=${provider.latitude},${provider.longitude}&z=15&output=embed`}
                                    title="Provider Location"
                                ></iframe>
                                <a
                                    href={`https://www.google.com/maps?q=${provider.latitude},${provider.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    فتح في خرائط Google
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full min-w-0 space-y-6">

                        {/* About Section */}
                        {provider.description && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="Info" className="w-5 h-5 text-blue-500" />
                                    عن المعرض
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                    {provider.description}
                                </p>
                            </div>
                        )}

                        {/* Listings Section */}
                        <div>
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 w-full sm:w-auto">
                                        <Icon name="Car" className="w-6 h-6 text-blue-600" />
                                        <span>السيارات المعروضة</span>
                                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs py-1 px-2.5 rounded-full font-bold">
                                            {listings.length}
                                        </span>
                                    </h3>

                                    {/* Tabs */}
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
                                        <button
                                            onClick={() => setActiveTab('all')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                        >
                                            الكل
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('sale')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'sale' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                        >
                                            للبيع
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('rent')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'rent' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                                        >
                                            للإيجار
                                        </button>
                                    </div>
                                </div>

                                {filteredListings.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredListings.map(listing => (
                                            <CarListingCard
                                                key={listing.id}
                                                listing={listing}
                                                viewMode="grid"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Icon name="Car" className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                                            {activeTab === 'all' ? 'لا توجد سيارات معروضة حالياً' :
                                                activeTab === 'sale' ? 'لا توجد سيارات للبيع' : 'لا توجد سيارات للإيجار'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 md:hidden shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
                <div className="grid grid-cols-2 gap-3">
                    <ActionButton
                        onClick={handleCall}
                        className={!showPhone ? "!bg-blue-600 hover:!bg-blue-700 text-white" : "!bg-slate-100 dark:!bg-slate-800 !text-slate-900 dark:!text-white border border-slate-200 dark:border-slate-700"}
                        disabled={!provider.phone}
                    >
                        <Icon name="Phone" className="w-5 h-5" />
                        {showPhone ? provider.phone : 'اتصال'}
                    </ActionButton>

                    {(whatsappNumber) ? (
                        <ActionButton
                            href={`https://wa.me/${whatsappNumber.toString().replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                            className="!bg-green-500 hover:!bg-green-600 text-white"
                        >
                            <Icon name="MessageCircle" className="w-5 h-5" /> واتساب
                        </ActionButton>
                    ) : (
                        <div />
                    )}
                </div>
            </div>

            {/* QR Code Modal */}
            {showQrCode && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] animate-fade-in p-4" onClick={() => setShowQrCode(false)}>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl relative animate-scale-in w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            {logoUrl && (
                                <img src={logoUrl} className="w-20 h-20 rounded-full object-cover mx-auto -mt-16 mb-4 ring-8 ring-white dark:ring-slate-900 shadow-lg bg-white dark:bg-slate-800" alt={businessName} />
                            )}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{businessName}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">امسح الرمز لزيارة المعرض</p>

                            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 dark:border-slate-800 inline-block mb-6">
                                {qrCodeStatus === 'loading' && (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                )}
                                {qrCodeStatus === 'error' && (
                                    <div className="w-[200px] h-[200px] flex items-center justify-center text-red-500">
                                        <Icon name="AlertTriangle" className="w-8 h-8" />
                                    </div>
                                )}
                                <canvas ref={qrCanvasRef} className={`w-[200px] h-[200px] ${qrCodeStatus !== 'success' ? 'hidden' : ''}`}></canvas>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={handleDownloadQr} disabled={qrCodeStatus !== 'success'} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                                    تحميل الصورة
                                </button>
                                <button onClick={() => setShowQrCode(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarProviderProfile;

