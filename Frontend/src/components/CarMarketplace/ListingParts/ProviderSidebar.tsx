import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Phone, MessageCircle, ExternalLink, Shield,
    CheckCircle, MapPin
} from 'lucide-react';

interface ProviderSidebarProps {
    provider: any;
    listing: any;
    t: any;
    onContact: (type: 'phone' | 'email' | 'whatsapp') => void;
}

const ProviderSidebar: React.FC<ProviderSidebarProps> = ({
    provider,
    listing,
    t,
    onContact
}) => {
    const navigate = useNavigate();

    // Safe render even if no provider
    if (!provider) return null;

    const hasPhone = listing.contact_phone || provider.phone;
    const hasWhatsapp = listing.contact_whatsapp || provider.phone;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-4 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-6">
                <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-md ring-4 ring-white dark:ring-gray-800">
                        {provider.logo_url ? (
                            <img
                                src={provider.logo_url}
                                alt="Provider Logo"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            provider.business_name?.charAt(0) || 'P'
                        )}
                    </div>
                    {provider.is_verified && (
                        <div className="absolute bottom-1 right-0 bg-blue-500 text-white p-1.5 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" title={t.ui.verified}>
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-1">
                    {provider.business_name}
                </h3>

                {provider.city && (
                    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{provider.city}</span>
                    </div>
                )}

                {(provider.member_since || provider.created_at) && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 inline-block px-3 py-1 rounded-full">
                        عضو منذ {new Date(provider.member_since || provider.created_at).getFullYear()}
                    </p>
                )}
            </div>

            <div className="space-y-3">
                {hasPhone && (
                    <button
                        onClick={() => onContact('phone')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all font-bold shadow-sm hover:shadow-md"
                    >
                        <Phone className="w-5 h-5" />
                        <span>{t.ui.call}</span>
                    </button>
                )}

                {hasWhatsapp && (
                    <button
                        onClick={() => onContact('whatsapp')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-xl transition-all font-bold shadow-sm hover:shadow-md"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>{t.ui.whatsapp}</span>
                    </button>
                )}

                {listing.seller_type === 'provider' && (
                    <button
                        onClick={() => navigate(`/car-providers/${provider.id}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition-all font-medium border border-gray-200 dark:border-gray-600"
                    >
                        <ExternalLink className="w-5 h-5" />
                        <span>{t.ui.view_profile}</span>
                    </button>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center gap-1.5 group">
                    <Shield className="w-3 h-3 group-hover:text-red-500" />
                    <span>{t.ui.report}</span>
                </button>
            </div>
        </div>
    );
};

export default ProviderSidebar;
