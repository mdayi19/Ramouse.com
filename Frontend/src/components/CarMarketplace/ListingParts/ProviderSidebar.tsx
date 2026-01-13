import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Phone, MessageCircle, ExternalLink, Shield,
    CheckCircle, MapPin, Calendar
} from 'lucide-react';
import { getImageUrl } from '../../../utils/helpers';

interface ProviderSidebarProps {
    provider: any;
    listing: any;
    t: any;
    onContact: (type: 'phone' | 'email' | 'whatsapp') => void;
    onReport: () => void;
}

const ProviderSidebar: React.FC<ProviderSidebarProps> = ({
    provider,
    listing,
    t,
    onContact,
    onReport
}) => {
    const navigate = useNavigate();

    // Safe render even if no provider
    if (!provider) return null;

    const hasPhone = listing.contact_phone || provider.phone;
    const hasWhatsapp = listing.contact_whatsapp || provider.phone;

    // Get profile photo with fallback priority
    const profilePhoto = provider.logo_url || provider.profile_photo || provider.user?.profile_photo_url;
    const providerName = provider.business_name || provider.name || 'مزود الخدمة';
    const initials = providerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-5 sticky top-24">
            {/* Profile Section */}
            <div className="text-center mb-5">
                <div className="relative inline-block mb-3">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl mx-auto flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-md">
                        {profilePhoto ? (
                            <img
                                src={getImageUrl(profilePhoto)}
                                alt={providerName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = `<span class="text-2xl">${initials}</span>`;
                                }}
                            />
                        ) : (
                            <span>{initials}</span>
                        )}
                    </div>
                    {provider.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-md border-2 border-white dark:border-slate-800 shadow-sm">
                            <CheckCircle className="w-3 h-3" />
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
                    {providerName}
                </h3>

                {provider.city && (
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.city}</span>
                    </div>
                )}

                {(provider.member_since || provider.created_at) && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-xs text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>عضو منذ {new Date(provider.member_since || provider.created_at).getFullYear()}</span>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mb-5">
                {hasPhone && (
                    <button
                        onClick={() => onContact('phone')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold text-sm"
                    >
                        <Phone className="w-4 h-4" />
                        <span>{t.ui.call}</span>
                    </button>
                )}

                {hasWhatsapp && (
                    <button
                        onClick={() => onContact('whatsapp')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-semibold text-sm"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>{t.ui.whatsapp}</span>
                    </button>
                )}

                {listing.seller_type === 'provider' && provider && (
                    <button
                        onClick={() => navigate(`/car-providers/${provider.unique_id || provider.user_id}`)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors font-medium text-sm border border-slate-200 dark:border-slate-600"
                    >
                        <ExternalLink className="w-4 h-4" />
                        <span>{t.ui.view_profile}</span>
                    </button>
                )}
            </div>

            {/* Report Button */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={onReport}
                    className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center gap-1 group"
                >
                    <Shield className="w-3 h-3 group-hover:text-red-500" />
                    <span>{t.ui.report}</span>
                </button>
            </div>
        </div>
    );
};

export default ProviderSidebar;
